import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import Fastify from 'fastify';
import formBody from '@fastify/formbody';
import type { Db } from 'mongodb';
import { OAuthStore, createToken, hashToken } from './oauth-store';
import { registerOAuth } from './oauth';

for (const outcome of ['success', 'denied']) {
  test(`browser completes the ${outcome} GitHub callback to ChatGPT`, async () => {
    const server = Fastify();
    const store = new OAuthStore({} as Db);
    const grants = new Map<
      string,
      NonNullable<Awaited<ReturnType<OAuthStore['deleteGrant']>>>
    >();
    store.insertGrant = async (
      kind,
      authorization,
      ownerId = '',
      verifier = '',
    ) => {
      const token = createToken();
      grants.set(token, {
        key: hashToken(token),
        kind,
        authorization,
        ownerId,
        verifier,
        expiresAt: new Date(Date.now() + 300000),
      });

      return token;
    };
    store.deleteGrant = async (token, kind, browserHash) => {
      const grant = grants.get(token);
      if (
        !grant ||
        grant.kind !== kind ||
        grant.authorization.browserHash !== browserHash
      ) {
        return null;
      }
      grants.delete(token);

      return grant;
    };
    await server.register(formBody);
    registerOAuth(server, store, {
      origin: 'https://forms.test',
      githubClientId: 'test-client',
      githubClientSecret: 'unused',
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (String(url) === 'https://github.com/login/oauth/access_token') {
        return new Response(
          JSON.stringify({ access_token: 'mock-github-token' }),
        );
      }
      if (String(url) === 'https://api.github.com/user') {
        return new Response(JSON.stringify({ id: 123 }));
      }
      return new Response(
        JSON.stringify({
          client_id: 'https://chatgpt.com/oauth/client.json',
          redirect_uris: [
            'https://chatgpt.com/connector_platform_oauth_redirect',
          ],
        }),
      );
    };
    const query = new URLSearchParams({
      client_id: 'https://chatgpt.com/oauth/client.json',
      redirect_uri: 'https://chatgpt.com/connector_platform_oauth_redirect',
      resource: 'https://forms.test/mcp',
      response_type: 'code',
      code_challenge: hashToken(createToken()),
      code_challenge_method: 'S256',
      state: 'browser-test',
    });
    const browser = await chromium.launch({
      executablePath: process.env.MCP_TEST_BROWSER_PATH,
    });
    try {
      const page = await browser.newPage();
      let postedOrigin: string | undefined;
      let postStatus: number | undefined;
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Fetch.enable', {
        patterns: [{ urlPattern: '*', requestStage: 'Request' }],
      });
      cdp.on('Fetch.requestPaused', async (event) => {
        const url = new URL(event.request.url);
        if (url.hostname === 'github.com') {
          const callback = new URL('https://forms.test/oauth/github/callback');
          callback.searchParams.set('state', url.searchParams.get('state')!);
          callback.searchParams.set(
            outcome === 'success' ? 'code' : 'error',
            outcome === 'success' ? 'mock-code' : 'access_denied',
          );
          await cdp.send('Fetch.fulfillRequest', {
            requestId: event.requestId,
            responseCode: 302,
            responseHeaders: [{ name: 'Location', value: callback.toString() }],
          });

          return;
        }
        if (url.hostname === 'chatgpt.com') {
          await cdp.send('Fetch.fulfillRequest', {
            requestId: event.requestId,
            responseCode: 200,
            responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
            body: Buffer.from('<h1>Returned to ChatGPT</h1>').toString(
              'base64',
            ),
          });

          return;
        }
        const method = event.request.method === 'POST' ? 'POST' : 'GET';
        const response = await server.inject({
          method,
          url: url.pathname + url.search,
          headers: event.request.headers,
          ...(method === 'POST'
            ? { payload: event.request.postData ?? '' }
            : {}),
        });
        if (method === 'POST') {
          postedOrigin =
            event.request.headers.Origin ?? event.request.headers.origin;
          postStatus = response.statusCode;
        }
        await cdp.send('Fetch.fulfillRequest', {
          requestId: event.requestId,
          responseCode: response.statusCode,
          responseHeaders: Object.entries(response.headers)
            .filter(
              ([name]) =>
                !['content-length', 'connection', 'transfer-encoding'].includes(
                  name,
                ),
            )
            .flatMap(([name, value]) =>
              (Array.isArray(value) ? value : [String(value)]).map((entry) => ({
                name,
                value: entry,
              })),
            ),
          body: Buffer.from(response.body).toString('base64'),
        });
      });
      await page.goto('https://forms.test/oauth/authorize?' + query);
      await page.getByRole('button', { name: 'Continue with GitHub' }).click();
      await page.waitForURL('https://chatgpt.com/**', {
        timeout: 3000,
        waitUntil: 'commit',
      });
      assert.equal(postedOrigin, 'https://forms.test');
      assert.equal(postStatus, 302);
      const callback = new URL(page.url());
      assert.equal(callback.pathname, '/connector_platform_oauth_redirect');
      assert.equal(callback.searchParams.get('state'), 'browser-test');
      assert.equal(callback.searchParams.get('iss'), 'https://forms.test');
      if (outcome === 'success') {
        assert.ok(callback.searchParams.get('code'));
        assert.equal(callback.searchParams.has('error'), false);
      } else {
        assert.equal(callback.searchParams.get('error'), 'access_denied');
      }
    } finally {
      globalThis.fetch = originalFetch;
      await browser.close();
      await server.close();
    }
  });
}
