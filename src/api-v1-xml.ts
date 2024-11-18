import { IttyRouter, createResponse } from 'itty-router';
import { locationStringProcessor } from './util';
import { routeCacheKeygen } from './cache';
import { authCheck } from './auth';

interface DrivingRouteInfo {
  normalized?: any,
  start: string | null,
  end: string | null,
  duration: number | null,
  distance: number | null,
  description: string | null,
}

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
router.all('/*', async ({ query }, env) => {
  let authenticated = false;

  if (typeof query.key === 'string') {
    authenticated = await authCheck(query.key, env);
  }

  if (!authenticated) {
    return new Response('Unauthorized', { status: 403})
  }
});

// Simple Directions Gathering
router.get('/directions/:from/:to/', async ({ params }, env) => {
  // @TODO: Would it be better to load the GMaps API library here?
  const from = locationStringProcessor(params.from);
  const to = locationStringProcessor(params.to);

  // @TODO: Streamline this, and maybe abstract it out
  const key = routeCacheKeygen(from, to);
  const result = await env.ROUTES_CACHE.get(key) as string | null;

  if (result) {
    return JSON.parse(result) as DrivingRouteInfo;
  }

  const directions = await
    fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&key=${env.GMAPS_API_KEY}&region=us&mode=driving`)
    .then(res => res.json()) as google.maps.DirectionsResult;

  if (directions.routes.length < 1) {
    return new Response('Failed to find a driving route', {status: 500});
  }

  const route = directions?.routes[0];
  const output: DrivingRouteInfo = {
    // @TODO: Remove this, just for debugging.
    normalized: JSON.stringify({
      from,
      to,
    }),
    start: route.legs[0].start_address ?? null,
    end: route.legs[0].end_address ?? null,
    duration: route.legs[0].duration?.value ?? null,
    distance: route.legs[0].distance?.value ?? null,
    description: route.summary ?? null,
  };

  // @TODO: Hold routes for a day. Will want to extend after testing.
  await env.ROUTES_CACHE.put(key, JSON.stringify(output), { expirationTtl: (60 * 60 * 24 )});

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
