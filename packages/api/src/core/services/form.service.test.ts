import type {
  FormRepository,
  GitHubFileRepository,
} from '../repositories';
import type { IGitHubFile } from '../types';
import type { GitHubGateway } from '../gateways';
import { FormService } from './form.service';

const yaml = `
title: Contact us
sections:
  - id: contact
    fields:
      - id: email
        type: email
`;

describe('FormService GitHub sources', () => {
  const originalToken = process.env.GITHUB_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
  });

  test('loads a direct public source without the server token', async () => {
    const calls: Array<Array<string | undefined>> = [];
    let saved: IGitHubFile | null = null;
    const gitHubGateway = {
      retrieveYamlFile: async (...args: Array<string | undefined>) => {
        calls.push(args);
        return yaml;
      },
    } as unknown as GitHubGateway;
    const gitHubFiles = {
      upsert: async (source: IGitHubFile) => {
        saved = source;
      },
    } as unknown as GitHubFileRepository;
    const service = new FormService(
      gitHubFiles,
      {} as FormRepository,
      gitHubGateway,
    );

    const form = await service.findBySlug(
      'forms/example/forms/contact.yaml',
    );

    expect(form?.id).toMatch(/^a[0-9a-f]{8}$/);
    expect(calls[0]).toEqual(['example', 'forms', 'contact']);
    expect(saved).not.toHaveProperty('private');
  });

  test('registers a private source without persisting its token', async () => {
    process.env.GITHUB_TOKEN = 'server-token';
    let saved: IGitHubFile | null = null;
    const gitHubGateway = {
      retrieveYamlFile: async () => yaml,
    } as unknown as GitHubGateway;
    const gitHubFiles = {
      upsert: async (source: IGitHubFile) => {
        saved = source;
      },
    } as unknown as GitHubFileRepository;
    const service = new FormService(
      gitHubFiles,
      {} as FormRepository,
      gitHubGateway,
    );

    const source = await service.registerGitHubSource({
      owner: 'example',
      repository: 'private-forms',
      path: 'contact.yaml',
    });

    expect(source).toMatchObject({
      owner: 'example',
      path: 'contact',
      ref: 'main',
      repository: 'private-forms',
    });
    expect(saved).toMatchObject({
      file: 'contact',
      private: true,
      ref: 'main',
    });
    expect(saved).not.toHaveProperty('access_token');
  });

  test('uses the server token as a fallback for legacy private sources', async () => {
    process.env.GITHUB_TOKEN = 'server-token';
    const calls: Array<Array<string | undefined>> = [];
    const gitHubGateway = {
      retrieveYamlFile: async (...args: Array<string | undefined>) => {
        calls.push(args);
        return calls.length === 1 ? null : yaml;
      },
    } as unknown as GitHubGateway;
    const gitHubFiles = {
      find: async () => ({
        file: 'contact',
        id: 'a12345678',
        owner: 'example',
        repository: 'legacy-private-forms',
      }),
    } as unknown as GitHubFileRepository;
    const service = new FormService(
      gitHubFiles,
      {} as FormRepository,
      gitHubGateway,
    );

    const form = await service.findById('a12345678');

    expect(form?.id).toBe('a12345678');
    expect(calls).toEqual([
      ['example', 'legacy-private-forms', 'contact', undefined],
      [
        'example',
        'legacy-private-forms',
        'contact',
        undefined,
        'server-token',
      ],
    ]);
  });
});
