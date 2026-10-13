import type { IDeclarativeForm, ISubmission } from '@declarativeforms/engine';
import type { Db } from 'mongodb';
import { OpenAiGateway } from '../gateways/openai';
import { GitHubGateway } from '../gateways';
import {
  GitHubFileRepository,
  SubmissionRepository,
  JobRepository,
} from '../repositories';
import { AdaptiveService } from './adaptive.service';
import { FormService } from './form.service';
import { JobService } from './job.service';
import { SubmissionService } from './submission.service';
import { TokenService } from './token.service';
import {
  parseAdaptiveFields,
  assertAdaptiveConfiguration,
  areAdaptiveOutputsValid,
} from './adaptive-validation';

const form: IDeclarativeForm = {
  id: 'a12345678',
  sections: [
    {
      id: 'intro',
      fields: [{ id: 'name', type: 'short_text' }],
      next: 'adaptive',
    },
    {
      id: 'adaptive',
      adaptive: {
        objectives: ['Understand the request', 'Establish budget'],
        properties: {
          summary: { type: 'string', minLength: 3 },
          budget: { type: 'number', minimum: 1 },
          optional: { type: 'string' },
        },
        required: ['summary', 'budget'],
      },
      next: [{ when: 'data.budget > 100', go: 'details' }, { else: 'done' }],
    },
    {
      id: 'details',
      fields: [{ id: 'email', type: 'email', validators: ['required'] }],
      next: 'done',
    },
  ],
  connections: [
    { type: 'webhook', url: 'https://example.com/hook', trigger_on: 'any' },
  ],
};
const metadata = { ipAddress: '127.0.0.1', userAgent: 'test' };

function createHarness(): {
  service: AdaptiveService;
  submissions: SubmissionService;
  gateway: OpenAiGateway;
  repository: SubmissionRepository;
  forms: FormService;
  jobs: JobService;
  stored: Map<string, ISubmission>;
} {
  const db = {} as Db;
  const forms = new FormService(
    new GitHubFileRepository(db),
    new GitHubGateway(),
  );
  jest.spyOn(forms, 'findById').mockResolvedValue(form);
  const repository = new SubmissionRepository(db);
  const stored = new Map<string, ISubmission>();
  jest.spyOn(repository, 'insert').mockImplementation(async (submission) => {
    stored.set(submission.id, structuredClone(submission));
  });
  jest
    .spyOn(repository, 'findByFormIdAndSubmissionId')
    .mockImplementation(async (_formId, id) =>
      structuredClone(stored.get(id) ?? null),
    );
  jest.spyOn(repository, 'replace').mockImplementation(async (submission) => {
    stored.set(submission.id, structuredClone(submission));
  });
  const gateway = new OpenAiGateway();
  const jobs = new JobService(new JobRepository(db), {});
  jest.spyOn(jobs, 'schedule').mockResolvedValue(undefined);

  return {
    service: new AdaptiveService(forms, gateway),
    submissions: new SubmissionService(
      forms,
      repository,
      jobs,
      new TokenService('', 'test'),
    ),
    gateway,
    repository,
    forms,
    jobs,
    stored,
  };
}

test('assesses multiple questions and objectives without saving submissions or scheduling connections', async () => {
  const h = createHarness();
  const fields = [
    {
      id: 'request',
      type: 'long_text',
      label: 'What do you need?',
      validators: ['required'],
    },
    { id: 'cost', type: 'number', label: 'Budget?', validators: ['required'] },
  ];
  const assess = jest
    .spyOn(h.gateway, 'assess')
    .mockResolvedValueOnce({
      objectives: [false, false],
      outputs_json: '{}',
      fields_json: JSON.stringify(fields),
    })
    .mockResolvedValue({
      objectives: [true, true],
      outputs_json: '{"summary":"New website","budget":200}',
      fields_json: '[]',
    });
  const data = { name: 'Ada', otherOutput: 'Earlier context' };
  const first = await h.service.assess(form.id!, 'adaptive', {
    locale: 'en',
    data,
    history: [],
  });
  expect(first).toEqual({ fields });
  const history = [
    { fields: first!.fields, answers: { request: 'New website', cost: 200 } },
  ];
  const second = await h.service.assess(form.id!, 'adaptive', {
    locale: 'en',
    data,
    history,
  });
  expect(second).toEqual({
    fields: [],
    outputs: { summary: 'New website', budget: 200 },
  });
  expect(assess.mock.calls[1].slice(2)).toEqual([data, 'en', history]);
  expect(h.repository.insert).not.toHaveBeenCalled();
  expect(h.repository.replace).not.toHaveBeenCalled();
  expect(h.jobs.schedule).not.toHaveBeenCalled();
  await h.submissions.submit(
    form.id!,
    'adaptive',
    { ...data, ...second!.outputs },
    true,
    metadata,
  );
  expect(h.stored.size).toBe(1);
  expect(h.jobs.schedule).toHaveBeenCalledTimes(1);
  expect([...h.stored.values()][0]).not.toHaveProperty('adaptive');
});

test('validates untrusted history before compilation or calling the provider', async () => {
  const h = createHarness();
  const assess = jest.spyOn(h.gateway, 'assess');
  for (const history of [
    [
      {
        fields: [
          {
            id: 'q',
            type: 'short_text' as const,
            validators: ['required' as const],
          },
        ],
        answers: {},
      },
    ],
    [
      {
        fields: [{ id: 'q', type: 'short_text' as const }],
        answers: { injected: 'value' },
      },
    ],
    [
      {
        fields: [
          {
            id: 'q',
            type: 'short_text' as const,
            visible_when: 'process.exit()',
          },
        ],
        answers: {},
      },
    ],
  ]) {
    await expect(
      h.service.assess(form.id!, 'adaptive', {
        locale: 'en',
        data: {},
        history,
      }),
    ).rejects.toThrow();
  }
  expect(assess).not.toHaveBeenCalled();
});

test('requires every objective, valid outputs, or follow-up questions', async () => {
  const h = createHarness();
  const assess = jest.spyOn(h.gateway, 'assess');
  for (const assessment of [
    {
      objectives: [true, false],
      outputs_json: '{"summary":"Website","budget":20}',
      fields_json: '[]',
    },
    {
      objectives: [true, true],
      outputs_json: '{"summary":"Website","budget":0}',
      fields_json: '[]',
    },
    { objectives: [true], outputs_json: '{}', fields_json: '[]' },
    {
      objectives: [true, true],
      outputs_json: '{"injected":true}',
      fields_json: '[]',
    },
    { objectives: [true, true], outputs_json: 'null', fields_json: '[]' },
  ]) {
    assess.mockResolvedValue(assessment);
    await expect(
      h.service.assess(form.id!, 'adaptive', {
        locale: 'en',
        data: {},
        history: [],
      }),
    ).rejects.toThrow();
  }
  assess.mockResolvedValue({
    objectives: [true, false],
    outputs_json: '{"budget":0}',
    fields_json: '[{"id":"q","type":"number"}]',
  });
  expect(
    await h.service.assess(form.id!, 'adaptive', {
      locale: 'en',
      data: {},
      history: [],
    }),
  ).toEqual({ fields: [{ id: 'q', type: 'number' }] });
});

test('accepts ordinary output values without conversation proof and clears omitted optional values', async () => {
  const h = createHarness();
  const first = await h.submissions.submit(
    form.id!,
    'adaptive',
    { name: 'Ada', summary: 'Website', budget: 20, optional: 'remove' },
    true,
    metadata,
  );
  const updated = await h.submissions.submit(
    form.id!,
    'adaptive',
    { summary: 'New website', budget: 30 },
    true,
    metadata,
    first!.id,
  );
  expect(updated!.data).toEqual({
    name: 'Ada',
    summary: 'New website',
    budget: 30,
  });
  const completed = await h.submissions.submit(
    form.id!,
    'adaptive',
    updated!.data,
    false,
    metadata,
    first!.id,
  );
  expect(completed!.status).toBe('completed');
  expect(h.jobs.schedule).toHaveBeenCalledTimes(3);
});

test('validates adaptive output constraints on partial saves and the routed path on final saves', async () => {
  const h = createHarness();
  await expect(
    h.submissions.submit(
      form.id!,
      'adaptive',
      { summary: 'Website', budget: '20' },
      true,
      metadata,
    ),
  ).rejects.toThrow('invalid');
  await expect(
    h.submissions.submit(
      form.id!,
      'details',
      { email: 'ada@example.com' },
      false,
      metadata,
    ),
  ).rejects.toThrow('invalid');
  await expect(
    h.submissions.submit(
      form.id!,
      'details',
      { summary: 'Website', budget: 200 },
      false,
      metadata,
    ),
  ).rejects.toThrow('invalid');
  expect(
    (await h.submissions.submit(
      form.id!,
      'details',
      { summary: 'Website', budget: 200, email: 'ada@example.com' },
      false,
      metadata,
    ))!.status,
  ).toBe('completed');
});

test('ordinary submissions preserve their existing merge and validation behavior', async () => {
  const h = createHarness();
  jest.spyOn(h.forms, 'findById').mockResolvedValue({
    id: form.id,
    sections: [
      {
        id: 'regular',
        fields: [{ id: 'name', type: 'short_text', validators: ['required'] }],
      },
    ],
  });
  const first = await h.submissions.submit(
    form.id!,
    'regular',
    { name: 'Ada', extra: 'keep' },
    true,
    metadata,
  );
  const updated = await h.submissions.submit(
    form.id!,
    'regular',
    { name: 'Grace' },
    false,
    metadata,
    first!.id,
  );
  expect(updated!.data).toEqual({ name: 'Grace', extra: 'keep' });
  await expect(
    h.submissions.submit(form.id!, 'regular', {}, false, metadata),
  ).rejects.toThrow('invalid');
});
test('rejects unsafe generated content and enforces declared output constraints', () => {
  for (const field of [
    { id: 'a', type: 'short_text', label: '{{calculate "process.exit()"}}' },
    { id: 'a', type: 'short_text', label: '<img src=x onerror=alert(1)>' },
    { id: 'a', type: 'short_text', visible_when: 'true' },
    {
      id: 'a',
      type: 'short_text',
      validators: [{ type: 'expression', expression: 'true' }],
    },
    { id: 'a', type: 'hidden' },
    { id: 'a', type: 'email', otp: true },
    { id: '__proto__', type: 'short_text' },
    { id: 'a_token', type: 'short_text' },
  ]) {
    expect(() => parseAdaptiveFields(JSON.stringify([field]))).toThrow();
  }
  const adaptive = {
    objectives: ['Budget'],
    properties: { budget: { type: 'number' as const, minimum: 1 } },
  };
  assertAdaptiveConfiguration(adaptive);
  expect(areAdaptiveOutputsValid(adaptive, { budget: 2 })).toBe(true);
  expect(areAdaptiveOutputsValid(adaptive, { budget: '2' })).toBe(false);
  expect(areAdaptiveOutputsValid(adaptive, { budget: 0 })).toBe(false);
  expect(areAdaptiveOutputsValid(adaptive, { budget: 2, injected: true })).toBe(
    false,
  );
});
