import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { toRenderableForm } from '@declarativeforms/engine';
import type { Db } from 'mongodb';
import { GitHubGateway } from '../gateways';
import { GitHubFileRepository } from '../repositories';
import type { IGitHubFile } from '../types';
import { FormService } from './form.service';

const AUTHENTICATION_MESSAGE = 'frms.dev authentication';

function toVerifier(accessKey: string): string {
  return createHmac('sha256', accessKey)
    .update(AUTHENTICATION_MESSAGE)
    .digest('hex');
}

function withAuthentication(yaml: string, verifier: string | null): string {
  return verifier
    ? `${yaml}\nauthentication:\n  verifier: "${verifier}"\n`
    : yaml;
}

test('resolves GitHub YAML and preserves branch identity through ID lookup', async () => {
  const yaml = readFileSync(
    resolvePath(__dirname, '../../../../../examples/lunch-rsvp.yaml'),
    'utf8',
  );
  const files = new Map<string, IGitHubFile>();
  const repository = new GitHubFileRepository({} as Db);
  const gateway = new GitHubGateway();
  const upsert = jest
    .spyOn(repository, 'upsert')
    .mockImplementation(async (file) => {
      files.set(file.id, file);
    });
  const findById = jest
    .spyOn(repository, 'findById')
    .mockImplementation(async (id) => files.get(id) ?? null);
  const findYamlFile = jest
    .spyOn(gateway, 'findYamlFile')
    .mockResolvedValue(yaml);
  const service = new FormService(repository, gateway);
  const slug = 'forms/team/project/forms/events/lunch-rsvp';

  const main = await service.findBySlug(slug);
  expect(main?.title).toBe('Team lunch RSVP');
  expect(findYamlFile).toHaveBeenLastCalledWith(
    'team',
    'project',
    'forms/events/lunch-rsvp',
    'main',
  );
  expect(upsert).toHaveBeenLastCalledWith(
    expect.objectContaining({ id: main?.id, branch: 'main' }),
  );

  const draft = await service.findBySlug(slug, 'feature/lunch');
  expect(draft?.id).not.toBe(main?.id);
  expect(findYamlFile).toHaveBeenLastCalledWith(
    'team',
    'project',
    'forms/events/lunch-rsvp',
    'feature/lunch',
  );
  expect(await service.findById(draft!.id!)).toEqual(draft);
  expect(findYamlFile).toHaveBeenLastCalledWith(
    'team',
    'project',
    'forms/events/lunch-rsvp',
    'feature/lunch',
  );
  expect(await service.findById(main!.id!)).toEqual(main);
  expect(findYamlFile).toHaveBeenLastCalledWith(
    'team',
    'project',
    'forms/events/lunch-rsvp',
    'main',
  );

  findById.mockClear();
  findYamlFile.mockClear();
  expect(await service.findById('i123456')).toBeNull();
  expect(findById).not.toHaveBeenCalled();
  expect(await service.findById('amissing')).toBeNull();
  expect(await service.findBySlug('forms/team')).toBeNull();
  expect(findYamlFile).not.toHaveBeenCalled();

  findYamlFile.mockResolvedValueOnce(null);
  expect(await service.findBySlug(slug, 'missing')).toBeNull();
  expect(files.size).toBe(2);
  findYamlFile.mockResolvedValueOnce(null);
  expect(await service.findById(main!.id!)).toBeNull();
  findYamlFile.mockRejectedValueOnce(new Error('GitHub unavailable'));
  await expect(service.findBySlug(slug)).rejects.toThrow('GitHub unavailable');

  const attending = toRenderableForm(yaml, {
    locale: 'en',
    data: { attendance: 'yes' },
  });
  const absent = toRenderableForm(yaml, {
    locale: 'en',
    data: { attendance: 'no' },
  });
  expect(attending.section.fields.map((field) => field.id)).toEqual([
    'full_name',
    'email',
    'attendance',
    'dietary_requirements',
  ]);
  expect(
    absent.section.fields
      .filter((field) => field.visible)
      .map((field) => field.id),
  ).toEqual(['full_name', 'email', 'attendance']);
});

test('authenticates an access key against the current form definition', async () => {
  const yaml = readFileSync(
    resolvePath(__dirname, '../../../../../examples/lunch-rsvp.yaml'),
    'utf8',
  );
  const repository = new GitHubFileRepository({} as Db);
  const gateway = new GitHubGateway();
  jest.spyOn(repository, 'findById').mockResolvedValue({
    branch: 'main',
    file: 'forms/events/lunch-rsvp',
    id: 'a12345678',
    owner: 'team',
    repository: 'project',
  });

  const accessKey = Buffer.alloc(32, 1).toString('base64');
  const replacementKey = Buffer.alloc(32, 2).toString('base64');
  let verifier: string | null = toVerifier(accessKey);

  jest
    .spyOn(gateway, 'findYamlFile')
    .mockImplementation(async () => withAuthentication(yaml, verifier));

  const service = new FormService(repository, gateway);

  expect(await service.isAuthenticated('a12345678', accessKey)).toBe(true);
  expect(await service.isAuthenticated('a12345678', replacementKey)).toBe(
    false,
  );
  expect(await service.isAuthenticated('a12345678', 'human-password')).toBe(
    false,
  );

  verifier = toVerifier(replacementKey);
  expect(await service.isAuthenticated('a12345678', accessKey)).toBe(false);
  expect(await service.isAuthenticated('a12345678', replacementKey)).toBe(true);

  verifier = null;
  expect(await service.isAuthenticated('a12345678', replacementKey)).toBe(
    false,
  );
});
