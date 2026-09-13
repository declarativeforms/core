import type {
  Adapter,
  AdapterConstructor,
  AdapterPayload,
} from 'oidc-provider';
import type { Db } from 'mongodb';

type IOAuthArtifact = {
  expires_at: Date | null;
  grant_id: string | null;
  id: string;
  model: string;
  payload: AdapterPayload;
  uid: string | null;
  user_code: string | null;
};

export async function ensureOAuthArtifactIndexes(db: Db): Promise<void> {
  await db
    .collection<IOAuthArtifact>('oauth_artifacts')
    .createIndex({ model: 1, id: 1 }, { unique: true });
  await db
    .collection<IOAuthArtifact>('oauth_artifacts')
    .createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection<IOAuthArtifact>('oauth_artifacts')
    .createIndex({ model: 1, uid: 1 });
  await db
    .collection<IOAuthArtifact>('oauth_artifacts')
    .createIndex({ model: 1, user_code: 1 });
  await db
    .collection<IOAuthArtifact>('oauth_artifacts')
    .createIndex({ grant_id: 1 });
}

export function createMongoOAuthAdapter(db: Db): AdapterConstructor {
  return class MongoOAuthAdapter implements Adapter {
    constructor(private model: string) {}

    public async upsert(
      id: string,
      payload: AdapterPayload,
      expiresIn?: number,
    ): Promise<void> {
      await db.collection<IOAuthArtifact>('oauth_artifacts').updateOne(
        { id, model: this.model },
        {
          $set: {
            expires_at:
              expiresIn === undefined
                ? null
                : new Date(Date.now() + expiresIn * 1000),
            grant_id: payload.grantId ?? null,
            payload,
            uid: payload.uid ?? null,
            user_code: payload.userCode ?? null,
          },
          $setOnInsert: { id, model: this.model },
        },
        { upsert: true },
      );
    }

    public async find(id: string): Promise<AdapterPayload | undefined> {
      const artifact = await db
        .collection<IOAuthArtifact>('oauth_artifacts')
        .findOne({
          id,
          model: this.model,
          $or: [
            { expires_at: null },
            { expires_at: { $exists: false } },
            { expires_at: { $gt: new Date() } },
          ],
        });

      return artifact?.payload;
    }

    public async findByUserCode(
      userCode: string,
    ): Promise<AdapterPayload | undefined> {
      const artifact = await db
        .collection<IOAuthArtifact>('oauth_artifacts')
        .findOne({
          model: this.model,
          user_code: userCode,
          $or: [
            { expires_at: null },
            { expires_at: { $exists: false } },
            { expires_at: { $gt: new Date() } },
          ],
        });

      return artifact?.payload;
    }

    public async findByUid(uid: string): Promise<AdapterPayload | undefined> {
      const artifact = await db
        .collection<IOAuthArtifact>('oauth_artifacts')
        .findOne({
          model: this.model,
          uid,
          $or: [
            { expires_at: null },
            { expires_at: { $exists: false } },
            { expires_at: { $gt: new Date() } },
          ],
        });

      return artifact?.payload;
    }

    public async consume(id: string): Promise<void> {
      await db
        .collection<IOAuthArtifact>('oauth_artifacts')
        .updateOne(
          { id, model: this.model },
          { $set: { 'payload.consumed': Math.floor(Date.now() / 1000) } },
        );
    }

    public async destroy(id: string): Promise<void> {
      await db
        .collection<IOAuthArtifact>('oauth_artifacts')
        .deleteOne({ id, model: this.model });
    }

    public async revokeByGrantId(grantId: string): Promise<void> {
      await db
        .collection<IOAuthArtifact>('oauth_artifacts')
        .deleteMany({ grant_id: grantId });
    }
  };
}
