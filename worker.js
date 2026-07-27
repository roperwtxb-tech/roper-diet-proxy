// Roper Diet Guide — Anthropic API proxy
// Connected to GitHub for automatic deploys.
//
// This Worker holds your Anthropic API key as a private secret and forwards
// requests from the Roper Diet Guide page to Anthropic's API. This keeps the
// key out of the public GitHub Pages HTML, where anyone could otherwise view
// it and use it at your expense.
//
// Setup:
//   1. Deploy this Worker (see the accompanying instructions).
//   2. In the Worker's Settings -> Variables and Secrets, add a secret named
//      ANTHROPIC_API_KEY with your real Anthropic API key as the value.
//   3. Update ALLOWED_ORIGIN below if your GitHub Pages URL is different.
//   4. Copy this Worker's URL into API_PROXY_URL near the top of
//      roper-diet-guide's index.html.

const ALLOWED_ORIGIN = 'https://roperwtxb-tech.github.io';

function corsHeaders(origin) {
    return {
          'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : 'null',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export default {
    async fetch(request, env) {
          const origin = request.headers.get('Origin') || '';
          const headers = corsHeaders(origin);

      if (request.method === 'OPTIONS') {
              return new Response(null, { status: 204, headers });
      }

      if (request.method !== 'POST') {
              return new Response(JSON.stringify({ error: { message: 'Only POST requests are supported.' } }), {
                        status: 405,
                        headers: { ...headers, 'Content-Type': 'application/json' },
              });
      }

      if (!env.ANTHROPIC_API_KEY) {
              return new Response(JSON.stringify({ error: { message: 'Server is missing the ANTHROPIC_API_KEY secret. Add it in Worker Settings -> Variables and Secrets.' } }), {
                        status: 500,
                        headers: { ...headers, 'Content-Type': 'application/json' },
              });
      }

      try {
              const body = await request.text();
              const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                                    'Content-Type': 'application/json',
                                    'x-api-key': env.ANTHROPIC_API_KEY,
                                    'anthropic-version': '2023-06-01',
                        },
                        body,
              });
              const text = await anthropicResp.text();
              return new Response(text, {
                        status: anthropicResp.status,
                        headers: { ...headers, 'Content-Type': 'application/json' },
              });
      } catch (err) {
              return new Response(JSON.stringify({ error: { message: 'Proxy error: ' + err.message } }), {
                        status: 500,
                        headers: { ...headers, 'Content-Type': 'application/json' },
              });
      }
    },
};
