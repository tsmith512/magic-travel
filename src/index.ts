/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { IttyRouter, json, error, createResponse } from 'itty-router';

const router = IttyRouter();

router.get('/', () => {
  return new Response('Hello World');
});

router.all('/api/*', ({ query }, env) => {
  const isAuth = query.key === env.PUBLIC_API_KEY;

  if (!isAuth) {
    return new Response('Unauthorized', { status: 403})
  }
});

router.get('/api/directions/:from/:to/', async ({ params }, env) => {
  // @TODO: Would it be better to load the GMaps API library here?
  const directions = await
    fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${params.from}&destination=${params.to}&key=${env.GMAPS_API_KEY}&region=us&mode=driving`)
    .then(res => res.json()) as google.maps.DirectionsResult;

  if (directions.routes.length < 1) {
    return new Response('Failed to find a driving route', {status: 500});
  }

  const route = directions?.routes[0];
  const output = {
    start: route.legs[0].start_address ?? null,
    end: route.legs[0].end_address ?? null,
    duration: route.legs[0].duration?.value ?? null,
    distance: route.legs[0].distance?.value ?? null,
    description: route.summary ?? null,
  };

  return output;
});

const xml = createResponse('text/xml', (input) => {
  return [
    '<root>',
    ...Object.entries(input).map(([k, v]) => `<${k}>${v}</${k}>`),
    '</root>',
  ].join('\n');
});

export default {
  fetch: (req:Request, env:Env) => router.fetch(req, env).then(xml).catch(error)
} satisfies ExportedHandler<Env>;
