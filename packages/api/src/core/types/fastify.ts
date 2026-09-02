import type { IAccessTokenClaims } from './access-token-claims';
import type { IOrganization } from './organization';

declare module 'fastify' {
  interface FastifyRequest {
    email: string | null;
    organization: IOrganization | null;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: IAccessTokenClaims;
    user: IAccessTokenClaims;
  }
}

export type {};
