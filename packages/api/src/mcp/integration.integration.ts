import { serialize, toRenderableForm } from '@declarativeforms/engine';
import {
  describe,
  test,
  before as beforeAll,
  after as afterAll,
} from 'node:test';
import { expect } from 'expect';
import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { MongoClient, type Db } from 'mongodb';
import Fastify from 'fastify';
import formBody from '@fastify/formbody';
import { createFormServer, registerMcp } from './server';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { FormRepository } from '../core/repositories';
import { OAuthStore, createToken, hashToken } from './oauth-store';
import { registerOAuth } from './oauth';
import { FormService } from '../core/services/form.service';
import { GitHubGateway } from '../core/gateways';
import { GitHubFileRepository } from '../core/repositories';

const integration = process.env.MCP_TEST_MONGODB_URI ? describe : describe.skip;

integration('MCP with MongoDB', () => {
  let mongo: MongoClient;
  let db: Db;
  let repository: FormRepository;
  let store: OAuthStore;
  let forms: FormService;
  const origin = 'https://forms.example.com';
  const clientId = 'https://chatgpt.com/oauth/client.json';
  const redirectUri = 'https://chatgpt.com/connector_platform_oauth_redirect';

  beforeAll(async () => {
    mongo = await MongoClient.connect(process.env.MCP_TEST_MONGODB_URI!, {
      serverSelectionTimeoutMS: 2000,
    });
    db = mongo.db(`mcp_test_${randomUUID().replaceAll('-', '')}`);
    repository = new FormRepository(db);
    forms = new FormService(
      new GitHubFileRepository(db),
      new GitHubGateway(),
      repository,
    );
    store = new OAuthStore(db);
    await db
      .collection('forms')
      .insertMany([{ legacy: true }, { legacy: true }]);
    await repository.ensureIndexes();
    await store.ensureIndexes();
  });
  afterAll(async () => {
    if (db) {
      await db.dropDatabase();
    }
    if (mongo) {
      await mongo.close();
    }
  });

  test('authors short-ID forms, lists all owned forms, and replaces definitions', async () => {
    const transports = InMemoryTransport.createLinkedPair();
    const server = createFormServer(forms, 'alice', origin);
    const client = new Client({ name: 'test', version: '1' });
    await server.connect(transports[0]);
    await client.connect(transports[1]);
    try {
      const tools = (await client.listTools()).tools;
      expect(tools).toHaveLength(6);
      expect(
        tools.find((tool) => tool.name === 'create_form')?.annotations
          ?.idempotentHint,
      ).toBe(false);
      const invalid = await client.callTool({
        name: 'create_form',
        arguments: { definition: { sections: 'invalid' } },
      });
      expect(invalid.isError).toBe(true);
      expect(await forms.listByOwner('alice')).toEqual([]);
      const definition = {
        title: 'Contact',
        sections: [
          {
            id: 'contact',
            fields: [{ id: 'name', type: 'short_text', label: 'Name' }],
          },
        ],
      };
      const created = await client.callTool({
        name: 'create_form',
        arguments: { definition },
      });
      expect(created.isError).toBe(false);
      const [form] = await forms.listByOwner('alice');
      expect(form.id).toMatch(/^b[a-f0-9]{8}$/);
      expect(Object.keys(form).sort()).toEqual(['definition', 'id', 'ownerId']);
      expect(await forms.findByOwnerAndId('bob', form.id)).toBeNull();
      expect(await forms.update('bob', form.id, definition)).toBeNull();
      expect(await forms.listByOwner('bob')).toEqual([]);
      const read = await client.callTool({
        name: 'get_form',
        arguments: { id: form.id },
      });
      expect(read.isError).toBe(false);
      const repeated = await client.callTool({
        name: 'create_form',
        arguments: { definition },
      });
      expect(repeated.isError).toBe(false);
      expect(await forms.listByOwner('alice')).toHaveLength(2);
      for (const title of ['Updated', 'Latest']) {
        const updated = await client.callTool({
          name: 'update_form',
          arguments: { id: form.id, definition: { ...definition, title } },
        });
        expect(updated.isError).toBe(false);
      }
      expect(await forms.findById(form.id)).toEqual({
        ...definition,
        id: form.id,
        title: 'Latest',
      });
      const collision = await repository.insert({
        id: form.id,
        ownerId: 'bob',
        definition,
      });
      expect(collision).toBeNull();
      expect(
        (await forms.findByOwnerAndId('alice', form.id))?.definition.title,
      ).toBe('Latest');
      await Promise.all(
        Array.from({ length: 23 }, () => forms.create('alice', definition)),
      );
      const listed = await client.callTool({
        name: 'list_forms',
        arguments: {},
      });
      const content = listed.content as Array<{ type: string; text: string }>;
      expect(JSON.parse(content[0].text)).toHaveLength(25);
      expect(await forms.findById('m_legacy')).toBeNull();
      const publicForm = await forms.findById(form.id);
      expect(
        toRenderableForm(serialize(publicForm!), { locale: 'en' }).section
          .fields[0].id,
      ).toBe('name');
      const collisions = await Promise.all(
        ['alice', 'bob'].map((ownerId) =>
          repository.insert({ id: 'b00000000', ownerId, definition }),
        ),
      );
      expect(collisions.filter(Boolean)).toHaveLength(1);
    } finally {
      await client.close();
      await server.close();
    }
  });

  test('serves authenticated Streamable HTTP and discovery', async () => {
    const previous = { ...process.env };
    process.env.MCP_PUBLIC_ORIGIN = origin;
    process.env.GITHUB_OAUTH_CLIENT_ID = 'client';
    process.env.GITHUB_OAUTH_CLIENT_SECRET = 'secret';
    const http = Fastify();
    await http.register(async (instance) => registerMcp(instance, db, forms));
    await http.listen({ port: 0, host: '127.0.0.1' });
    const address = http.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Missing HTTP address');
    }
    const endpoint = `http://127.0.0.1:${address.port}/mcp`;
    const client = new Client({ name: 'http-test', version: '1' });
    try {
      expect(
        (
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          })
        ).status,
      ).toBe(401);
      const tokens = await store.createSession(
        'http-owner',
        clientId,
        `${origin}/mcp`,
      );
      const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
        requestInit: {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        },
      });
      await client.connect(transport);
      expect((await client.listTools()).tools).toHaveLength(6);
      const result = await client.callTool({
        name: 'get_form_schema',
        arguments: {},
      });
      expect(result.isError).toBe(false);
      expect(
        (await http.inject('/.well-known/oauth-protected-resource')).json()
          .resource,
      ).toBe(`${origin}/mcp`);
    } finally {
      await client.close();
      await http.close();
      process.env = previous;
    }
  });

  test('binds codes, rotates credentials, detects refresh replay, expiry and revocation', async () => {
    const verifier = createToken();
    const authorization = {
      clientId,
      redirectUri,
      resource: `${origin}/mcp`,
      challenge: hashToken(verifier),
      state: 'state',
      browserHash: hashToken('browser'),
    };
    const code = await store.insertGrant('code', authorization, 'alice');
    expect(
      await store.deleteCode(
        code,
        clientId,
        redirectUri,
        authorization.resource,
        'wrong',
      ),
    ).toBeNull();
    expect(
      await store.deleteCode(
        code,
        clientId,
        redirectUri,
        'https://other/mcp',
        verifier,
      ),
    ).toBeNull();
    expect(
      await store.deleteCode(
        code,
        clientId,
        redirectUri,
        authorization.resource,
        verifier,
      ),
    ).not.toBeNull();
    expect(
      await store.deleteCode(
        code,
        clientId,
        redirectUri,
        authorization.resource,
        verifier,
      ),
    ).toBeNull();
    const tokens = await store.createSession(
      'alice',
      clientId,
      authorization.resource,
    );
    expect(
      await store.findOwner(tokens.access_token, authorization.resource),
    ).toBe('alice');
    expect(await store.findOwner(tokens.access_token, 'other')).toBeNull();
    const rotated = await store.rotateSession(
      tokens.refresh_token,
      clientId,
      authorization.resource,
    );
    expect(rotated).not.toBeNull();
    expect(
      await store.findOwner(tokens.access_token, authorization.resource),
    ).toBeNull();
    expect(
      await store.rotateSession(
        tokens.refresh_token,
        clientId,
        authorization.resource,
      ),
    ).toBeNull();
    expect(
      await store.findOwner(rotated!.access_token, authorization.resource),
    ).toBeNull();
    const revoked = await store.createSession(
      'alice',
      clientId,
      authorization.resource,
    );
    await store.revoke(revoked.refresh_token, clientId);
    expect(
      await store.findOwner(revoked.access_token, authorization.resource),
    ).toBeNull();
    const expired = await store.createSession(
      'alice',
      clientId,
      authorization.resource,
    );
    await db
      .collection('oauth_sessions')
      .updateOne(
        { accessHash: hashToken(expired.access_token) },
        { $set: { accessExpiresAt: new Date(0) } },
      );
    expect(
      await store.findOwner(expired.access_token, authorization.resource),
    ).toBeNull();
  });

  test('completes browser-bound GitHub login and rejects callback and redirect tampering', async () => {
    const server = Fastify();
    await server.register(formBody);
    await registerOAuth(server, store, {
      origin,
      githubClientId: 'github-client',
      githubClientSecret: 'github-secret',
    });
    const originalFetch = globalThis.fetch;
    const responses = [
      new Response(
        JSON.stringify({ client_id: clientId, redirect_uris: [redirectUri] }),
      ),
    ];
    globalThis.fetch = async () => {
      const response = responses.shift();
      if (!response) {
        throw new Error('Unexpected fetch');
      }
      return response;
    };
    try {
      const verifier = createToken();
      const query = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        resource: `${origin}/mcp`,
        response_type: 'code',
        code_challenge: hashToken(verifier),
        code_challenge_method: 'S256',
        state: 'chatgpt-state',
      });
      const consent = await server.inject(`/oauth/authorize?${query}`);
      expect(consent.statusCode).toBe(303);
      const cookie = String(consent.headers['set-cookie']).split(';')[0];
      const consentToken = new URL(consent.headers.location!).searchParams.get(
        'consent',
      )!;
      const denied = await server.inject({
        method: 'POST',
        url: '/oauth/authorize',
        headers: { origin: 'https://evil.test', cookie },
        payload: { consent: consentToken },
      });
      expect(denied.statusCode).toBe(403);
      const login = await server.inject({
        method: 'POST',
        url: '/oauth/authorize',
        headers: { origin, cookie },
        payload: { consent: consentToken },
      });
      const state = new URL(login.headers.location!).searchParams.get('state');
      expect(
        (
          await server.inject(
            `/oauth/github/callback?state=${state}&code=github-code`,
          )
        ).statusCode,
      ).toBe(400);
      responses.push(
        new Response(JSON.stringify({ access_token: 'github-token' })),
        new Response(JSON.stringify({ id: 123 })),
      );
      const callback = await server.inject({
        url: `/oauth/github/callback?state=${state}&code=github-code`,
        headers: { cookie },
      });
      expect(callback.statusCode).toBe(302);
      const redirect = new URL(callback.headers.location!);
      expect(redirect.searchParams.get('iss')).toBe(origin);
      expect(redirect.searchParams.get('state')).toBe('chatgpt-state');
      const tokens = await server.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'authorization_code',
          client_id: clientId,
          resource: `${origin}/mcp`,
          code: redirect.searchParams.get('code'),
          code_verifier: verifier,
          redirect_uri: redirectUri,
        },
      });
      expect(tokens.statusCode).toBe(200);
      expect(
        await store.findOwner(tokens.json().access_token, `${origin}/mcp`),
      ).toBe('123');
      query.set('redirect_uri', 'https://evil.test');
      expect(
        (await server.inject(`/oauth/authorize?${query}`)).statusCode,
      ).toBe(400);
    } finally {
      globalThis.fetch = originalFetch;
      await server.close();
    }
  });
});
