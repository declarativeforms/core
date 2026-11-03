import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { toRenderableForm } from '@declarativeforms/engine';
import type { Db } from 'mongodb';
import { GitHubGateway } from '../gateways';
import { FormRepository, GitHubFileRepository } from '../repositories';
import type { IGitHubFile } from '../types';
import { FormService } from './form.service';

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
  const service = new FormService(
    repository,
    gateway,
    new FormRepository({} as Db),
  );
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

test('retries short-ID collisions without hiding storage failures', async () => {
  const repository = new FormRepository({} as Db);
  const service = new FormService(
    new GitHubFileRepository({} as Db),
    new GitHubGateway(),
    repository,
  );
  const insert = jest
    .spyOn(repository, 'insert')
    .mockResolvedValueOnce(null)
    .mockImplementationOnce(async (form) => form);
  const definition = { sections: [] };
  const created = await service.create('alice', definition);

  expect(created.id).toMatch(/^b[a-f0-9]{8}$/);
  expect(insert).toHaveBeenCalledTimes(2);
  expect(insert.mock.calls[0][0].id).not.toBe(created.id);
  insert.mockRejectedValueOnce(new Error('Database unavailable'));
  await expect(service.create('alice', definition)).rejects.toThrow(
    'Database unavailable',
  );
  insert.mockClear().mockResolvedValue(null);
  await expect(service.create('alice', definition)).rejects.toThrow(
    'Unable to allocate a unique form ID',
  );
  expect(insert).toHaveBeenCalledTimes(5);
});
