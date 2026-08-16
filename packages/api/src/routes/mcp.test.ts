import fastify from 'fastify';
import { getContainer } from '../core';
import { MCP, MCP_ROUTES } from './mcp';

jest.mock('../core', () => ({
  getContainer: jest.fn(),
}));

describe('MCP', () => {
  const getBearerChallenge = jest.fn(
    () =>
      'Bearer resource_metadata="https://frms.dev/.well-known/oauth-protected-resource/mcp", scope="forms:write"',
  );
  const verifyAccessToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getContainer).mockResolvedValue({
      mcpAuthentication: {
        getBearerChallenge,
        verifyAccessToken,
      },
      formService: {},
    } as never);
  });

  it('returns the protected-resource challenge before processing MCP data', async () => {
    verifyAccessToken.mockReturnValue(null);
    const server = fastify();
    server.route(MCP);

    const response = await server.inject({
      headers: { authorization: 'Bearer invalid-token' },
      method: 'POST',
      payload: {
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/list',
      },
      url: '/mcp',
    });

    expect(response.statusCode).toBe(401);
    expect(response.headers['www-authenticate']).toContain(
      '/.well-known/oauth-protected-resource/mcp',
    );

    await server.close();
  });

  it('serves MCP requests for a resource-bound access token', async () => {
    verifyAccessToken.mockReturnValue({
      githubToken: 'github-access-token',
    });
    const server = fastify();
    server.route(MCP);

    const response = await server.inject({
      headers: {
        accept: 'application/json, text/event-stream',
        authorization: 'Bearer mcp-access-token',
        'content-type': 'application/json',
      },
      method: 'POST',
      payload: {
        id: 1,
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
          protocolVersion: '2025-06-18',
        },
      },
      url: '/mcp',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('declarative-forms');

    await server.close();
  });

  it('does not expose the removed device or REST publishing endpoints', async () => {
    const server = fastify();
    MCP_ROUTES.forEach((route) => server.route(route));

    const device = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/github/device',
    });
    const publish = await server.inject({
      method: 'PUT',
      payload: { yaml: 'version: 1' },
      url: '/api/v1/forms/acme/forms/contact',
    });

    expect(device.statusCode).toBe(404);
    expect(publish.statusCode).toBe(404);

    await server.close();
  });
});
