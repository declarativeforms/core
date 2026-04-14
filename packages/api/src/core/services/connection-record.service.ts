import { faker } from '@faker-js/faker';
import type { ConnectionRecordRepository } from '../repositories';
import type { GitHubGateway } from '../gateways';
import type { IConnectionRecord } from '../types';

export class ConnectionRecordService {
  constructor(
    private gitHubGateway: GitHubGateway,
    private connectionRecordRepository: ConnectionRecordRepository,
  ) {}

  private async createConnectionRecord(
    accessToken: string,
  ): Promise<IConnectionRecord> {
    const now = new Date().toISOString();

    const connection: IConnectionRecord = {
      access_token: accessToken,
      created_at: now,
      id: faker.string.alphanumeric({ casing: 'lower', length: 24 }),
      updated_at: now,
    };

    await this.connectionRecordRepository.insert(connection);

    return connection;
  }

  async createGitHubConnection(
    code: string,
  ): Promise<{ accessToken: string; id: string }> {
    const accessToken = await this.gitHubGateway.findAccessToken(
      code,
      process.env.GITHUB_CLIENT_ID as string,
      process.env.GITHUB_CLIENT_SECRET as string,
    );

    const connection = await this.createConnectionRecord(accessToken || '');

    return { accessToken: accessToken || '', id: connection.id };
  }
}
