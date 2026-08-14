import {
  bearerAuthChallengeResponse,
  createMcpHandler,
  verifyBearerToken,
} from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { FormService, getContainer, GitHubGateway } from '../core';
import { createDeclarativeFormsServer } from '../mcp';

export const MCP_POST: RouteOptions = {
  handler: async () => {},
  method: 'POST',
  onRequest: async (request: FastifyRequest, reply: FastifyReply) => {
    const { authenticationService } = getContainer();
    const authenticationOptions = {
      requiredScopes: ['mcp'],
      resourceMetadataUrl: authenticationService.getResourceMetadataUrl(),
      verifier: authenticationService,
    };
    let authentication;

    try {
      authentication = await verifyBearerToken(
        request.headers.authorization,
        authenticationOptions,
      );
    } catch (error) {
      const response = bearerAuthChallengeResponse(
        error,
        authenticationOptions,
      );

      response.headers.forEach((value, name) => reply.header(name, value));
      await reply.status(response.status).send(await response.text());
      return;
    }

    const githubToken = authentication.extra?.githubToken;

    if (typeof githubToken !== 'string') {
      await reply.status(401).send();
      return;
    }

    const formService = new FormService(new GitHubGateway(githubToken));
    const handler = toNodeHandler(
      createMcpHandler(() => createDeclarativeFormsServer(formService)),
    );

    reply.hijack();
    await handler(request.raw, reply.raw);
  },
  url: '/mcp',
};
