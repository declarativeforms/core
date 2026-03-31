import { faker } from '@faker-js/faker';
import { insertConnection } from '../repositories';
import type { IConnectionRecord } from '../types';

async function createConnectionRecord(
  accessToken: string,
): Promise<IConnectionRecord> {
  const now = new Date().toISOString();

  const connection: IConnectionRecord = {
    access_token: accessToken,
    created_at: now,
    id: faker.string.alphanumeric({ casing: 'lower', length: 24 }),
    updated_at: now,
  };

  await insertConnection(connection);

  return connection;
}

export async function createAirtableConnection(input: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{ id: string }> {
  const response = await fetch('https://airtable.com/oauth2/v1/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.AIRTABLE_CLIENT_ID || ''}:${process.env.AIRTABLE_CLIENT_SECRET || ''}`,
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: input.code,
      code_verifier: input.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: input.redirectUri,
    }).toString(),
  });

  const data: any = await response.json();

  const accessToken = data.access_token || '';

  const connection = await createConnectionRecord(accessToken);

  return { id: connection.id };
}
