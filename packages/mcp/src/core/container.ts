import { GitHubOAuthGateway } from './gateways';
import { AuthenticationService } from './services';

export type Container = {
  authenticationService: AuthenticationService;
};

let container: Container | null = null;

export function getContainer(): Container {
  if (container) {
    return container;
  }

  const baseUrl =
    process.env.MCP_BASE_URL ||
    (process.env.MCP_DOMAIN
      ? `https://${process.env.MCP_DOMAIN}`
      : 'http://localhost:8081');
  const clientId = getEnvironmentVariable('GITHUB_CLIENT_ID');
  const clientSecret = getEnvironmentVariable('GITHUB_CLIENT_SECRET');
  const callbackUrl = new URL('/oauth/callback', baseUrl).toString();
  const gitHubOAuthGateway = new GitHubOAuthGateway(
    clientId,
    clientSecret,
    callbackUrl,
  );

  container = {
    authenticationService: new AuthenticationService(
      gitHubOAuthGateway,
      clientSecret,
      baseUrl,
    ),
  };

  return container;
}

function getEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}
