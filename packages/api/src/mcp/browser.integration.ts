import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import Fastify from 'fastify';
import formBody from '@fastify/formbody';
import type { Db } from 'mongodb';
import { OAuthStore, createToken, hashToken } from './oauth-store';
import { registerOAuth } from './oauth';

test('browser consent preserves its origin and follows the GitHub redirect', async () => {
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
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        client_id: 'https://chatgpt.com/oauth/client.json',
        redirect_uris: [
          'https://chatgpt.com/connector_platform_oauth_redirect',
        ],
      }),
    );
  const query = new URLSearchParams({
    client_id: 'https://chatgpt.com/oauth/client.json',
    redirect_uri: 'https://chatgpt.com/connector_platform_oauth_redirect',
    resource: 'https://forms.test/mcp',
    response_type: 'code',
    code_challenge: hashToken(createToken()),
    code_challenge_method: 'S256',
    state: 'browser-test',
  });
  let consent;
  try {
    consent = await server.inject('/oauth/authorize?' + query);
  } finally {
    globalThis.fetch = originalFetch;
  }
  const browser = await chromium.launch({
    executablePath: process.env.MCP_TEST_BROWSER_PATH,
  });
  try {
    const page = await browser.newPage();
    let postedOrigin: string | undefined;
    let postStatus: number | undefined;
    await page.route('https://forms.test/**', async (route) => {
      const request = route.request();
      if (request.method() === 'GET') {
        await route.fulfill({
          status: consent.statusCode,
          headers: {
            'content-type': 'text/html',
            'set-cookie': String(consent.headers['set-cookie']),
            'referrer-policy': String(consent.headers['referrer-policy']),
            'content-security-policy': String(
              consent.headers['content-security-policy'],
            ),
          },
          body: consent.body,
        });

        return;
      }
      postedOrigin = request.headers().origin;
      const response = await server.inject({
        method: 'POST',
        url: '/oauth/authorize',
        headers: await request.allHeaders(),
        payload: request.postData() ?? '',
      });
      postStatus = response.statusCode;
      await route.fulfill({
        status: response.statusCode,
        headers: { location: String(response.headers.location ?? '') },
        body: response.body,
      });
    });
    await page.route('https://github.com/**', async (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<h1>GitHub sign-in</h1>',
      }),
    );
    await page.goto('https://forms.test/oauth/authorize?' + query);
    await page.getByRole('button', { name: 'Continue with GitHub' }).click();
    await page.waitForURL('https://github.com/**', {
      timeout: 10000,
      waitUntil: 'commit',
    });
    assert.equal(postedOrigin, 'https://forms.test');
    assert.equal(postStatus, 302);
    assert.equal(new URL(page.url()).hostname, 'github.com');
  } finally {
    await browser.close();
    await server.close();
  }
});
