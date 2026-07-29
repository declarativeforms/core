import type { GitHubGateway } from '../gateways';
import {
  decodeGitHubFormId,
  encodeGitHubFormId,
  FormService,
} from './form.service';

const yaml = `
title: Contact us
measurements:
  mixpanel: public-project-token
sections:
  - id: contact
    fields:
      - id: email
        type: email
connections:
  - type: webhook
    url: https://example.com/hook
`;

describe('FormService GitHub sources', () => {
  test('loads an untrusted public source without the server token', async () => {
    const calls: unknown[][] = [];
    const gitHubGateway = {
      retrieveYamlFile: async (...args: unknown[]) => {
        calls.push(args);
        return { ok: true as const, text: yaml };
      },
    } as unknown as GitHubGateway;
    const service = new FormService(gitHubGateway, {
      token: 'server-token',
      trustedRepositories: new Set(),
    });

    const form = await service.findBySource({
      owner: 'example',
      repository: 'forms',
      path: 'contact',
    });

    expect(form.id).toMatch(/^g\./);
    expect(form).not.toHaveProperty('connections');
    expect(form).not.toHaveProperty('measurements');
    expect(calls[0]).toEqual([
      'example',
      'forms',
      'contact.yaml',
      undefined,
      undefined,
    ]);
  });

  test('uses the token and enables connections only for an allowlisted source', async () => {
    const calls: unknown[][] = [];
    const gitHubGateway = {
      retrieveYamlFile: async (...args: unknown[]) => {
        calls.push(args);
        return { ok: true as const, text: yaml };
      },
    } as unknown as GitHubGateway;
    const service = new FormService(gitHubGateway, {
      token: 'server-token',
      trustedRepositories: new Set(['example/private-forms']),
    });
    const id = encodeGitHubFormId({
      owner: 'Example',
      repository: 'private-forms',
      path: 'forms/contact.yml',
      ref: 'release/v1',
    });

    const resolved = await service.resolveById(id);
    const rendered = await service.findForRenderingById(id);

    expect(resolved?.trusted).toBe(true);
    expect(resolved?.definition.connections).toHaveLength(1);
    expect(rendered).not.toHaveProperty('connections');
    expect(rendered?.measurements).toEqual({
      mixpanel: 'public-project-token',
    });
    expect(calls[0]).toEqual([
      'Example',
      'private-forms',
      'forms/contact.yml',
      'release/v1',
      'server-token',
    ]);
  });

  test('round-trips a normalized stateless source id', () => {
    const id = encodeGitHubFormId({
      owner: 'example',
      repository: 'forms',
      path: '/nested/contact',
    });

    expect(decodeGitHubFormId(id)).toEqual({
      owner: 'example',
      repository: 'forms',
      path: 'nested/contact.yaml',
    });
    expect(decodeGitHubFormId('a12345678')).toBeNull();
    expect(decodeGitHubFormId('g.not-json')).toBeNull();
  });

  test('preserves actionable GitHub failures', async () => {
    const service = new FormService(
      {
        retrieveYamlFile: async () => ({
          ok: false as const,
          reason: 'rate_limited' as const,
          retryAfter: '30',
        }),
      } as unknown as GitHubGateway,
      { trustedRepositories: new Set() },
    );

    await expect(
      service.findBySource({
        owner: 'example',
        repository: 'forms',
        path: 'contact.yaml',
      }),
    ).rejects.toMatchObject({
      code: 'GITHUB_RATE_LIMITED',
      retryAfter: '30',
    });
  });
});
