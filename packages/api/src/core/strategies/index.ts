import type { IDeclarativeForm, ISubmission } from '@declarativeforms/engine';
import type { IOAuthTokens } from '../types';

export interface IConnectionStrategy {
  readonly type: string;
  handle(
    connection: any,
    submission: ISubmission,
    form: IDeclarativeForm,
  ): Promise<void>;
}

export interface IOAuthProviderStrategy {
  readonly type: string;
  readonly usesPkce: boolean;
  isConfigured(): boolean;
  buildAuthorizationUrl(
    redirectUri: string,
    state: string,
    codeChallenge: string | null,
  ): string;
  exchangeAuthorizationCode(
    redirectUri: string,
    code: string,
    codeVerifier: string | null,
  ): Promise<IOAuthTokens | null>;
  retrieveEmail(accessToken: string): Promise<string | null>;
}

export { EmailConnectionStrategy } from './email-connection.strategy';
export { GitHubOAuthStrategy } from './github-oauth.strategy';
export { WebhookConnectionStrategy } from './webhook-connection.strategy';
