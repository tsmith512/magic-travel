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
import { IttyRouter, json, error } from 'itty-router';

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

router.get('/api/directions/:from/:to/', ({ params }) => {
  return new Response(`Directions from ${params.from} to ${params.to}`);
});

export default {
  fetch: (req:Request, env:Env) => router.fetch(req, env).then(json).catch(error)
} satisfies ExportedHandler<Env>;
