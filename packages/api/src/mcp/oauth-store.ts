import { createHash, randomBytes } from 'node:crypto';
import type { Db } from 'mongodb';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

export function createToken(): string {
  return randomBytes(32).toString('base64url');
}

export type Authorization = {
  clientId: string;
  redirectUri: string;
  resource: string;
  challenge: string;
  state: string;
  browserHash: string;
};

type Grant = {
  key: string;
  kind: string;
  expiresAt: Date;
  authorization: Authorization;
  ownerId: string;
  verifier: string;
};

type Session = {
  key: string;
  clientId: string;
  resource: string;
  ownerId: string;
  accessHash: string;
  accessExpiresAt: Date;
  refreshHash: string;
  usedRefreshHashes: Array<string>;
  expiresAt: Date;
};

export type OAuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
};

export class OAuthStore {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    for (const name of ['oauth_grants', 'oauth_sessions']) {
      await this.db.collection(name).createIndex({ key: 1 }, { unique: true });
      await this.db
        .collection(name)
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }
    await this.db
      .collection('oauth_sessions')
      .createIndex({ accessHash: 1 }, { unique: true });
    await this.db
      .collection('oauth_sessions')
      .createIndex({ refreshHash: 1 }, { unique: true });
  }

  public async insertGrant(
    kind: string,
    authorization: Authorization,
    ownerId = '',
    verifier = '',
  ): Promise<string> {
    const token = createToken();
    await this.db.collection<Grant>('oauth_grants').insertOne({
      key: hashToken(token),
      kind,
      authorization,
      ownerId,
      verifier,
      expiresAt: new Date(Date.now() + 300_000),
    });

    return token;
  }

  public deleteGrant(
    token: string,
    kind: string,
    browserHash: string,
  ): Promise<Grant | null> {
    return this.db.collection<Grant>('oauth_grants').findOneAndDelete({
      key: hashToken(token),
      kind,
      'authorization.browserHash': browserHash,
      expiresAt: { $gt: new Date() },
    });
  }

  public deleteCode(
    token: string,
    clientId: string,
    redirectUri: string,
    resource: string,
    verifier: string,
  ): Promise<Grant | null> {
    return this.db.collection<Grant>('oauth_grants').findOneAndDelete({
      key: hashToken(token),
      kind: 'code',
      'authorization.clientId': clientId,
      'authorization.redirectUri': redirectUri,
      'authorization.resource': resource,
      'authorization.challenge': hashToken(verifier),
      expiresAt: { $gt: new Date() },
    });
  }

  public async createSession(
    ownerId: string,
    clientId: string,
    resource: string,
  ): Promise<OAuthTokens> {
    const access = createToken();
    const refresh = createToken();
    await this.db.collection<Session>('oauth_sessions').insertOne({
      key: createToken(),
      clientId,
      resource,
      ownerId,
      accessHash: hashToken(access),
      accessExpiresAt: new Date(Date.now() + 3600_000),
      refreshHash: hashToken(refresh),
      usedRefreshHashes: [],
      expiresAt: new Date(Date.now() + 30 * 86400_000),
    });

    return {
      access_token: access,
      refresh_token: refresh,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'forms:read forms:write',
    };
  }

  public async rotateSession(
    token: string,
    clientId: string,
    resource: string,
  ): Promise<OAuthTokens | null> {
    const access = createToken();
    const refresh = createToken();
    const session = await this.db
      .collection<Session>('oauth_sessions')
      .findOneAndUpdate(
        {
          refreshHash: hashToken(token),
          clientId,
          resource,
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            accessHash: hashToken(access),
            accessExpiresAt: new Date(Date.now() + 3600_000),
            refreshHash: hashToken(refresh),
          },
          $push: { usedRefreshHashes: hashToken(token) },
        },
      );

    if (!session) {
      await this.db
        .collection<Session>('oauth_sessions')
        .deleteMany({ clientId, usedRefreshHashes: hashToken(token) });

      return null;
    }

    return {
      access_token: access,
      refresh_token: refresh,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'forms:read forms:write',
    };
  }

  public async findOwner(
    token: string,
    resource: string,
  ): Promise<string | null> {
    const session = await this.db
      .collection<Session>('oauth_sessions')
      .findOne({
        accessHash: hashToken(token),
        resource,
        accessExpiresAt: { $gt: new Date() },
        expiresAt: { $gt: new Date() },
      });

    return session?.ownerId ?? null;
  }

  public async revoke(token: string, clientId: string): Promise<void> {
    await this.db.collection<Session>('oauth_sessions').deleteMany({
      clientId,
      $or: [
        { accessHash: hashToken(token) },
        { refreshHash: hashToken(token) },
        { usedRefreshHashes: hashToken(token) },
      ],
    });
  }
}
