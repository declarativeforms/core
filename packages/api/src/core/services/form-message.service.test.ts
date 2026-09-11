import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { OpenAiGateway } from '../gateways';
import type { FormMessageRepository } from '../repositories';
import type { IFormMessage, IInternalForm } from '../types';
import { FormMessageService } from './form-message.service';
import type { InternalFormService } from './internal-form.service';

describe('FormMessageService', () => {
  it('creates, repairs, updates, and records replies without a definition', async () => {
    const definition = { sections: [] } as unknown as IDeclarativeForm;
    const form = {
      branch: 'main',
      form_id: 'i1',
    } as IInternalForm;
    const stored: Array<IFormMessage> = [];
    let existing: IInternalForm | null = null;
    const formMessageRepository = {
      allocateSequences: jest.fn(() => Promise.resolve(stored.length + 1)),
      findAllByOrganizationIdAndFormIdAndBranch: jest.fn(() =>
        Promise.resolve(stored),
      ),
      insertMany: jest.fn((messages: Array<IFormMessage>) => {
        stored.push(...messages);

        return Promise.resolve();
      }),
    } as unknown as FormMessageRepository;
    const internalFormService = {
      applyGeneratedDefinition: jest.fn(() => Promise.resolve(true)),
      create: jest.fn(() => {
        existing = form;

        return Promise.resolve(form);
      }),
      findByBranch: jest.fn(() => Promise.resolve(existing)),
      toYamlDefinition: jest.fn(() => 'current'),
      validateDefinition: jest
        .fn()
        .mockReturnValueOnce([
          {
            message: 'Unsupported field property',
            path: '/sections/0/fields/0/property',
          },
        ])
        .mockReturnValue(definition),
    } as unknown as InternalFormService;
    const openAiGateway = {
      generate: jest
        .fn()
        .mockResolvedValueOnce({
          definition: 'created',
          message: 'Created',
          name: 'Test',
        })
        .mockResolvedValueOnce({
          definition: 'repaired',
          message:
            'Removed the unsupported field property so the form validates.',
          name: null,
        })
        .mockResolvedValueOnce({
          definition: 'updated',
          message: 'Updated',
          name: null,
        })
        .mockResolvedValueOnce({
          definition: null,
          message: 'Answered',
          name: null,
        }),
    } as unknown as OpenAiGateway;
    const service = new FormMessageService(
      formMessageRepository,
      internalFormService,
      openAiGateway,
    );

    const created = await service.generate(
      'o1',
      'owner@example.com',
      null,
      'main',
      'Create a form',
    );
    const updated = await service.generate(
      'o1',
      'owner@example.com',
      'i1',
      'main',
      'Update it',
    );
    const answered = await service.generate(
      'o1',
      'owner@example.com',
      'i1',
      'main',
      'Explain it',
    );

    expect(created?.map((message) => message.role)).toEqual([
      'user',
      'assistant',
    ]);
    expect(created?.[1]?.content).toBe('Created');
    expect(internalFormService.create).toHaveBeenCalledWith(
      'o1',
      'owner@example.com',
      definition,
      'Test',
    );
    expect(updated?.[1]?.content).toBe('Updated');
    expect(answered?.[1]?.content).toBe('Answered');
    expect(internalFormService.create).toHaveBeenCalledTimes(1);
    expect(internalFormService.applyGeneratedDefinition).toHaveBeenCalledTimes(
      1,
    );
    expect(openAiGateway.generate).toHaveBeenCalledTimes(4);
    expect(stored).toHaveLength(6);
  });
});
