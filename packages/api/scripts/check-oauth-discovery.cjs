const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('node:crypto');
const fastify = require('fastify');
const middie = require('@fastify/middie');
const { registerOAuth } = require('../dist/oauth/provider.js');

(async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  Object.assign(process.env, {
    PUBLIC_BASE_URL: 'https://forms.example',
    OAUTH_JWKS: JSON.stringify({ keys: [{
      ...privateKey.export({ format: 'jwk' }), kid: 'test', alg: 'RS256', use: 'sig',
    }] }),
    OAUTH_COOKIE_KEYS: 'test-cookie-key-with-at-least-32-bytes',
    OAUTH_STATE_SECRET: 'test-state-key-with-at-least-32-bytes',
  });
  const server = fastify();
  await server.register(middie);
  await registerOAuth(server, {
    db: { collection: () => ({ createIndex: async () => 'index' }) },
  });
  try {
    for (const path of [
      '/.well-known/oauth-authorization-server/api/v1/oauth',
      '/.well-known/openid-configuration/api/v1/oauth',
      '/api/v1/oauth/.well-known/openid-configuration',
    ]) {
      const response = await server.inject({ url: path, headers: {
        host: 'forms.example', 'x-forwarded-proto': 'https',
      } });
      assert.equal(response.statusCode, 200);
      const metadata = response.json();
      assert.equal(metadata.issuer, 'https://forms.example/api/v1/oauth');
      assert.deepEqual(metadata.code_challenge_methods_supported, ['S256']);
      for (const [name, endpoint] of Object.entries(metadata)) {
        if (name.endsWith('_endpoint') || name === 'jwks_uri') {
          assert.equal(new URL(endpoint).origin, 'https://forms.example');
          assert(new URL(endpoint).pathname.startsWith('/api/v1/oauth/'), `${name} lost its mount path`);
        }
      }
    }
    const jwks = await server.inject('/api/v1/oauth/jwks');
    assert.equal(jwks.statusCode, 200);
    assert(jwks.json().keys.every(key => !key.d));
    console.log('OAuth discovery mount paths and public JWKS passed.');
  } finally {
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
