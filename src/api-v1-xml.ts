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
router.get('/status', ({ query }, env) => {
  const isAuth = query.key === env.PUBLIC_API_KEY;

  return {
    ready: env.MAGIC_TRAVEL_READY.toString(),
    message: env.MAGIC_TRAVEL_STATUS,
    auth: isAuth.toString(),
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
    return new Response('Unauthorized', { status: 403})
  }
});

// Simple Directions Gathering
router.get('/directions/:from/:to/', async (request: AuthenticatedRequest, env) => {
  // @TODO: Would it be better to load the GMaps API library here?
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

  const directions = await
    fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&key=${env.GMAPS_API_KEY}&region=us&mode=driving`)
    .then(res => res.json()) as google.maps.DirectionsResult;

  if (directions.routes.length < 1) {
    // @TODO: Cache errors somehow.
    console.log('Failed to find a driving route: ' + JSON.stringify(directions));
    return new Response('Failed to find a driving route', {status: 500});
  }

  const route = directions?.routes[0];
  const output: DrivingRouteInfo = {
    // @TODO: Return (and cache) with our normalized place names instead of the
    // addresses from the Directions API.
    // start: route.legs[0].start_address ?? from,
    // end: route.legs[0].end_address ?? to,
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

  // @TODO: Hold routes for a day. Will want to extend after testing.
  await env.ROUTES_CACHE.put(kvCacheKey, JSON.stringify(output), { expirationTtl: (60 * 60 * 24 )});

  // @TODO: Generate response object and save into CDN cache. How to set an expiration time??
  await cdnCache.put(cdnCacheKey, xml(output));

  writeAnalyticsEvent(output, request, 'API', env);
  return output;
});

/**
 * Response formatter to take an object's key:value entries as a simple XML
 * document for Google Sheet's IMPORTXML() function. There is no GSheets native
 * support for JSON.
 */
export const xml = createResponse('text/xml', (input) => {
  return [
    '<root>',
    ...Object.entries(input).map(([k, v]) => `<${k}>${v}</${k}>`),
    '</root>',
  ].join('\n');
});
