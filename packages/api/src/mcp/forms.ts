import { createHash } from 'node:crypto';
import {
  FORM_JSON_SCHEMA,
  type IDeclarativeForm,
} from '@declarativeforms/engine';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { type Db } from 'mongodb';

export type OwnedForm = {
  id: string;
  ownerId: string;
  creationKey: string;
  definition: IDeclarativeForm;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
};

const ajv = new Ajv({ strict: false, allErrors: true, ownProperties: true });
addFormats(ajv);
const validate = ajv.compile(FORM_JSON_SCHEMA);

export function validateDefinition(definition: unknown): Array<ErrorObject> {
  validate(definition);

  if (validate.errors) {
    return validate.errors;
  }

  const form = definition as IDeclarativeForm;

  return (form.connections ?? []).flatMap((connection, index) =>
    connection.type === 'webhook' && !isWebhookAllowed(connection.url ?? '')
      ? [
          {
            keyword: 'configuration',
            instancePath: `/connections/${index}/url`,
            schemaPath: '',
            params: {},
            message:
              'Webhook URL must be approved in MCP_WEBHOOK_URLS by the deployment operator.',
          },
        ]
      : [],
  );
}

export class OwnedFormRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection('owned_forms')
      .createIndex({ id: 1 }, { unique: true });
    await this.db
      .collection('owned_forms')
      .createIndex({ ownerId: 1, creationKey: 1 }, { unique: true });
  }

  public findById(id: string): Promise<OwnedForm | null> {
    return this.db
      .collection<OwnedForm>('owned_forms')
      .findOne({ id }, { projection: { _id: 0 } });
  }

  public findByOwnerAndId(
    ownerId: string,
    id: string,
  ): Promise<OwnedForm | null> {
    return this.db
      .collection<OwnedForm>('owned_forms')
      .findOne({ ownerId, id }, { projection: { _id: 0 } });
  }

  public findAllByOwnerAfterId(
    ownerId: string,
    afterId: string,
    limit: number,
  ): Promise<Array<OwnedForm>> {
    return this.db
      .collection<OwnedForm>('owned_forms')
      .find({ ownerId, id: { $gt: afterId } }, { projection: { _id: 0 } })
      .sort({ id: 1 })
      .limit(limit)
      .toArray();
  }

  public async insertOnce(
    ownerId: string,
    definition: IDeclarativeForm,
    creationKey: string,
  ): Promise<OwnedForm> {
    const id = `m_${createHash('sha256')
      .update(JSON.stringify([ownerId, creationKey]))
      .digest('hex')
      .slice(0, 32)}`;
    const form = await this.db
      .collection<OwnedForm>('owned_forms')
      .findOneAndUpdate(
        { ownerId, creationKey },
        {
          $setOnInsert: {
            id,
            ownerId,
            creationKey,
            definition,
            revision: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after', projection: { _id: 0 } },
      );

    if (!form) {
      throw new Error('Unable to create form');
    }

    return form;
  }

  public setDefinition(
    ownerId: string,
    id: string,
    definition: IDeclarativeForm,
    revision: number,
  ): Promise<OwnedForm | null> {
    return this.db
      .collection<OwnedForm>('owned_forms')
      .findOneAndUpdate(
        { ownerId, id, revision },
        { $set: { definition, updatedAt: new Date() }, $inc: { revision: 1 } },
        { returnDocument: 'after', projection: { _id: 0 } },
      );
  }
}

export function isWebhookAllowed(url: string): boolean {
  return (
    url.startsWith('https://') &&
    (process.env.MCP_WEBHOOK_URLS ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .includes(url)
  );
}
