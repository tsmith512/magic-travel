import { IRequest, IRequestStrict, IttyRouter, createResponse } from 'itty-router';
import { locationStringProcessor } from './util';
import { routeCacheKeygen } from './cache';
import { authCheck } from './auth';
import { writeAnalyticsEvent } from './analytics';

export interface DrivingRouteInfo {
  start: string,
  end: string,
  duration: number,
  distance: number,
  description: string,
  debug?: any,
}

export type AuthenticatedRequest = {
  verifiedKey: string,
  sheetVersion: string,
} & IRequestStrict;

export const router = IttyRouter({ base: '/api/v1'});

// Hello World
router.get('/', () => {
  return new Response('Magic Travel API for Google Sheets XML v1');
});

// Pre-Auth Status Header
router.get('/status', async (request, env) => {
  let authenticated = false;

  // @TODO: This is straight up repeated in the /* handler, abstract out.
  if (typeof request.query.key === 'string') {
    authenticated = await authCheck(request.query.key, env);

    if (authenticated) {
      request.verifiedKey = request.query.key;
    }
  }


  return {
    ready: env.MAGIC_TRAVEL_READY.toString(),
    message: env.MAGIC_TRAVEL_STATUS,
    auth: authenticated.toString(),
    version: env.DEPLOYMENT_META.id,
  };
});

// Authentication middleware for all other API routes
router.all('/*', async (request: AuthenticatedRequest, env) => {
  let authenticated = false;

  // @TODO: This belongs elsewhere but this function runs at the right time.
  if (typeof request.query.sheet_version === 'string') {
    request.sheetVersion = request.query.sheet_version;
  } else {
    request.sheetVersion = 'not reported';
  }

  if (typeof request.query.key === 'string') {
    authenticated = await authCheck(request.query.key, env);

    if (authenticated) {
      request.verifiedKey = request.query.key;
    }
  }

  if (!authenticated) {
    return new Response('Unauthorized', { status: 403});
  }
});

// Simple Directions Gathering
router.get('/directions/:from/:to/', async (request: AuthenticatedRequest, env) => {
  const from = locationStringProcessor(request.params.from);
  const to = locationStringProcessor(request.params.to);

  const requestUrl = new URL(request.url);
  const cdnCache = caches.default;
  const cdnCacheKey = `${requestUrl.origin}/directions/${from}/${to}/`;
  const cdnCacheResult = await cdnCache.match(cdnCacheKey);
  if (cdnCacheResult) {
    writeAnalyticsEvent({
      // CDN will return a complete response, not a result object. Rather than
      // pick it apart, just skip it.
      start: from,
      end: to,
      duration: 0,
      distance: 0,
      description: '',
    }, request, 'CDN', env);
    return cdnCacheResult;
  }

  // @TODO: Streamline this, and maybe abstract it out
  const kvCacheKey = await routeCacheKeygen(from, to);
  const result = JSON.parse(await env.ROUTES_CACHE.get(kvCacheKey)) as DrivingRouteInfo | null;

  if (result) {
    writeAnalyticsEvent(result, request, 'KV', env);
    return result;
  }

  // Rather than load the whole Google Maps API, use the same HTTP endpoint that
  // v1 of the Spreadsheet used.
  const directions = await
    fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&key=${env.GMAPS_API_KEY}&region=us&mode=driving`)
    .then(res => res.json()) as google.maps.DirectionsResult;

  if (directions.routes.length < 1) {
    console.log('Failed to find a driving route: ' + JSON.stringify(directions));

    // Cache this error at the CDN level for 2 days.
    // @TODO: This would be colo-specific and would fend off requests from the
    // same person but may need to be more global.
    // @TODO: Would it be useful to report this error to WAE?
    const cdnCacheErrResponse = new Response('Failed to find a driving route', {status: 500});;
    cdnCacheErrResponse.headers.set('Cache-Control', `max-age=${60*60*48}`)
    await cdnCache.put(cdnCacheKey, cdnCacheErrResponse);
    return cdnCacheErrResponse;
  }

  const route = directions?.routes[0];
  const output: DrivingRouteInfo = {
    // WARNING: Spreadsheet cares about the order here, don't re-order anything.
    // @TODO: Uhhh, then don't do it this way.
    start: from,
    end: to,
    duration: route.legs[0].duration?.value ?? 0,
    distance: route.legs[0].distance?.value ?? 0,
    description: route.summary ?? '',
    debug: JSON.stringify({
      addresses: [
        route.legs[0].start_address ?? null,
        route.legs[0].end_address ?? null,
      ]
    }),
  };

  // Hold routes for a week. May want to extend after testing.
  await env.ROUTES_CACHE.put(kvCacheKey, JSON.stringify(output), {
    expirationTtl: (60 * 60 * 24 * 7 ),
  });

  // Generate response object and save into CDN cache for a day.
  const cdnCacheResponse = xml(output);
  cdnCacheResponse.headers.set('Cache-Control', `max-age=${60*60*24}`)
  await cdnCache.put(cdnCacheKey, cdnCacheResponse);

  writeAnalyticsEvent(output, request, 'API', env);
  return output;
});

/**
 * Response formatter to take an object's key:value entries as a simple XML
 * document for Google Sheet's IMPORTXML() function. There is no GSheets native
 * support for JSON.
 *
 * @TODO: WARNING: The XPath interpreter that reads these will return them into
 * the spreadsheet in order... pulling this apart would probably be better.
 */
export const xml = createResponse('text/xml', (input) => {
  return [
    '<root>',
    ...Object.entries(input).map(([k, v]) => `<${k}>${v}</${k}>`),
    '</root>',
  ].join('\n');
});
