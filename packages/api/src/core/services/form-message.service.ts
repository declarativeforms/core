import type { IDeclarativeForm } from '@declarativeforms/engine';
import { randomBytes } from 'node:crypto';
import type { OpenAiGateway } from '../gateways';
import type { FormMessageRepository } from '../repositories';
import type { IFormMessage, IInternalForm, IValidationIssue } from '../types';
import type { InternalFormService } from './internal-form.service';

const MAX_PROMPT_CHARS = 4000;
const HISTORY_MESSAGES = 10;

export class FormMessageService {
  constructor(
    private formMessageRepository: FormMessageRepository,
    private internalFormService: InternalFormService,
    private openAiGateway: OpenAiGateway,
  ) {}

  public async listByFormAndBranch(
    organizationId: string,
    id: string,
    branch: string,
  ): Promise<Array<IFormMessage> | null> {
    const form = await this.internalFormService.findByBranch(
      organizationId,
      id,
      branch,
    );

    if (!form) {
      return null;
    }

    return this.formMessageRepository.findAllByOrganizationIdAndFormIdAndBranch(
      organizationId,
      id,
      branch,
    );
  }

  public async generate(
    organizationId: string,
    emailAddress: string,
    id: string | null,
    branch: string,
    prompt: string,
  ): Promise<Array<IFormMessage> | null> {
    if (!prompt.trim() || prompt.length > MAX_PROMPT_CHARS) {
      throw new Error('Prompt is invalid');
    }

    const existing = id
      ? await this.internalFormService.findByBranch(organizationId, id, branch)
      : null;

    if (id && !existing) {
      return null;
    }

    const history = existing
      ? await this.formMessageRepository.findAllByOrganizationIdAndFormIdAndBranch(
          organizationId,
          existing.form_id,
          existing.branch,
        )
      : [];
    const generated = await this.generateResponse(
      prompt,
      existing,
      history.slice(-HISTORY_MESSAGES),
    );

    let form = existing;

    if (!form) {
      if (!generated.definition) {
        throw new Error('Form generation returned no definition');
      }

      form = await this.internalFormService.create(
        organizationId,
        emailAddress,
        generated.definition,
        this.readName(generated.name),
      );
    } else if (generated.definition) {
      const applied = await this.internalFormService.applyGeneratedDefinition(
        organizationId,
        emailAddress,
        form.form_id,
        form.branch,
        generated.definition,
        null,
      );

      if (!applied) {
        throw new Error('Generated form could not be applied');
      }
    }

    const first = await this.formMessageRepository.allocateSequences(
      form.form_id,
      form.branch,
      2,
    );
    const messages = [
      this.buildMessage(organizationId, form, first, 'user', prompt),
      this.buildMessage(
        organizationId,
        form,
        first + 1,
        'assistant',
        generated.message,
      ),
    ];

    await this.formMessageRepository.insertMany(messages);

    return messages;
  }

  public deleteBranchHistory(formId: string, branch: string): Promise<void> {
    return this.formMessageRepository.deleteAllByFormIdAndBranch(
      formId,
      branch,
    );
  }

  private async generateResponse(
    prompt: string,
    form: IInternalForm | null,
    history: Array<IFormMessage>,
  ): Promise<{
    definition: IDeclarativeForm | null;
    message: string;
    name: string | null;
  }> {
    const currentDefinition = form
      ? this.internalFormService.toYamlDefinition(form)
      : null;
    const candidate = await this.openAiGateway.generate(
      prompt,
      currentDefinition,
      history,
      null,
    );

    if (candidate.definition === null) {
      return { definition: null, message: candidate.message, name: null };
    }

    const definition = this.internalFormService.validateDefinition(
      candidate.definition,
    );

    if (!Array.isArray(definition)) {
      return {
        definition,
        message: candidate.message,
        name: candidate.name,
      };
    }

    return this.repairGeneratedDefinition(
      prompt,
      currentDefinition,
      history,
      candidate.definition,
      definition,
    );
  }

  private async repairGeneratedDefinition(
    prompt: string,
    currentDefinition: string | null,
    history: Array<IFormMessage>,
    invalidDefinition: string,
    issues: Array<IValidationIssue>,
  ): Promise<{
    definition: IDeclarativeForm;
    message: string;
    name: string | null;
  }> {
    const repaired = await this.openAiGateway.generate(
      prompt,
      currentDefinition,
      history,
      {
        definition: invalidDefinition,
        errors: Object.fromEntries(
          issues.map((issue) => [issue.path, issue.message]),
        ),
      },
    );
    const definition = this.internalFormService.validateDefinition(
      repaired.definition,
    );

    if (Array.isArray(definition)) {
      throw new Error('Generated form is invalid');
    }

    return {
      definition,
      message: repaired.message,
      name: repaired.name,
    };
  }

  private buildMessage(
    organizationId: string,
    form: IInternalForm,
    sequence: number,
    role: 'assistant' | 'user',
    content: string,
  ): IFormMessage {
    return {
      branch: form.branch,
      content,
      created_at: new Date(),
      form_id: form.form_id,
      id: randomBytes(16).toString('hex'),
      organization_id: organizationId,
      role,
      sequence,
    };
  }

  private readName(name: string | null): string | null {
    return name ? name.slice(0, 120) : null;
  }
}
