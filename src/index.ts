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
import { IttyRouter } from 'itty-router';

import { router as v1API, xml as v1XML } from './api-v1-xml';

const router = IttyRouter();

router.all('/api/v1/*', (req, env) => v1API.fetch(req, env).then(v1XML));

router.get('/', () => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': 'https://tsmith.com/blog/2025/magic-travel-rebuild/?utm_source=travel-spreadsheet-template&utm_medium=website&utm_campaign=travel-spreadsheet-template',
    }
  });
});

router.get('/privacy', () => {
  return new Response(null, {
    status: 301,
    headers: {
      'Location': 'https://tsmith.com/privacy',
    }
  })
});

router.get('*', () => {
  return new Response(null, {
    status: 404,
  });
});

export default {
  fetch: (req:Request, env:Env) => router.fetch(req, env),
} satisfies ExportedHandler<Env>;
