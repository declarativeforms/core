import { serialize, type IDeclarativeForm } from '@declarativeforms/engine';
import { randomBytes } from 'node:crypto';
import type { OpenAiGateway } from '../gateways';
import type { FormMessageRepository } from '../repositories';
import type {
  IFormMessage,
  IFormMessagePage,
  IInternalForm,
  IValidationIssue,
} from '../types';
import type { InternalFormService } from './internal-form.service';

const MESSAGE_PAGE_DEFAULT = 50;
const MESSAGE_PAGE_MAX = 100;
const MAX_PROMPT_CHARS = 4000;
const HISTORY_MESSAGES = 10;
const MAX_CONTEXT_DEFINITION_BYTES = 65536;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const GENERATION_FAILURE_MESSAGE =
  'Form generation failed. Nothing was changed.';

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
    cursor: string | null,
    limit: number | null,
  ): Promise<IFormMessagePage | null> {
    const form = await this.internalFormService.findByBranch(
      organizationId,
      id,
      branch,
    );

    if (!form) {
      return null;
    }

    const before = this.decodeCursor(cursor);
    const size = this.clampLimit(limit);
    const messages =
      await this.formMessageRepository.findAllByOrganizationIdAndFormIdAndBranch(
        organizationId,
        id,
        branch,
        before,
        size + 1,
      );

    const page = messages.slice(0, size);

    return {
      messages: page,
      next_cursor:
        messages.length > size && page.length > 0
          ? this.encodeCursor(page[page.length - 1].sequence)
          : null,
    };
  }

  public async generate(
    organizationId: string,
    emailAddress: string,
    prompt: string,
  ): Promise<Array<IFormMessage>> {
    if (!this.isValidPrompt(prompt)) {
      throw new Error('Prompt is invalid');
    }

    const generationId = this.buildId();
    const generated = await this.generateResponse(prompt, null, []);

    const form = await this.internalFormService.create(
      organizationId,
      emailAddress,
      generated.definition,
      this.readName(generated.name, null),
    );

    const previewUrl = this.buildPreviewUrl(form);
    const message = `${generated.message}\n\n${previewUrl ? `Preview your form: ${previewUrl}` : 'Your form was created, but its preview link is currently unavailable.'}`;

    const first = await this.formMessageRepository.allocateSequences(
      form.form_id,
      form.branch,
      2,
    );

    const userMessage = this.buildMessage(
      organizationId,
      form,
      first,
      'user',
      prompt,
      'complete',
      emailAddress,
      generationId,
      null,
    );
    const assistantMessage = this.buildMessage(
      organizationId,
      form,
      first + 1,
      'assistant',
      message,
      'complete',
      emailAddress,
      generationId,
      form.revision,
    );

    await this.formMessageRepository.insertMany([
      userMessage,
      assistantMessage,
    ]);

    return [userMessage, assistantMessage];
  }

  public async send(
    organizationId: string,
    emailAddress: string,
    id: string,
    branch: string,
    content: string,
    idempotencyKey: string | null,
  ): Promise<Array<IFormMessage> | null> {
    const form = await this.internalFormService.findByBranch(
      organizationId,
      id,
      branch,
    );

    if (!form) {
      return null;
    }

    if (
      !this.isValidPrompt(content) ||
      (idempotencyKey && !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey))
    ) {
      throw new Error('Message request is invalid');
    }

    const generationId = idempotencyKey ?? this.buildId();

    if (idempotencyKey) {
      const replay = await this.findIdempotentMessages(form, generationId);

      if (replay) {
        return replay;
      }
    }

    const history = await this.readHistory(organizationId, id, branch);
    const first = await this.formMessageRepository.allocateSequences(
      id,
      branch,
      2,
    );
    const userMessage = this.buildMessage(
      organizationId,
      form,
      first,
      'user',
      content,
      'complete',
      emailAddress,
      generationId,
      null,
    );
    const assistantMessage = this.buildMessage(
      organizationId,
      form,
      first + 1,
      'assistant',
      '',
      'pending',
      emailAddress,
      generationId,
      null,
    );

    try {
      await this.formMessageRepository.insert(userMessage);
      await this.formMessageRepository.insert(assistantMessage);
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }

      throw new Error('Message generation already exists');
    }

    const generated = await this.generateResponse(content, form, history).catch(
      async (error: unknown) => {
        await this.recordGenerationFailure(assistantMessage.id);

        throw error;
      },
    );

    let revision: number | null = null;

    if (generated.definition !== null) {
      const applied = await this.internalFormService.applyGeneratedDefinition(
        organizationId,
        emailAddress,
        id,
        branch,
        generated.definition,
        null,
      );

      if (!applied) {
        await this.recordGenerationFailure(assistantMessage.id);

        throw new Error('Generated form could not be applied');
      }

      revision = applied.revision;
    }

    await this.formMessageRepository.setStatus(
      assistantMessage.id,
      'complete',
      generated.message,
      revision,
    );

    return [
      userMessage,
      {
        ...assistantMessage,
        content: generated.message,
        schema_revision: revision,
        status: 'complete',
      },
    ];
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
    const contextDefinition = form ? this.readContextDefinition(form) : null;

    const candidate = await this.requestGeneration(
      prompt,
      form,
      history,
      null,
      contextDefinition,
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
      form,
      history,
      candidate.definition,
      definition,
      contextDefinition,
    );
  }

  private async repairGeneratedDefinition(
    prompt: string,
    form: IInternalForm | null,
    history: Array<IFormMessage>,
    invalidDefinition: string,
    issues: Array<IValidationIssue>,
    contextDefinition: string | null,
  ): Promise<{
    definition: IDeclarativeForm;
    message: string;
    name: string | null;
  }> {
    const repaired = await this.requestGeneration(
      prompt,
      form,
      history,
      {
        definition: invalidDefinition,
        errors: Object.fromEntries(
          issues.map((issue) => [issue.path, issue.message]),
        ),
      },
      contextDefinition,
    );

    const definition = this.internalFormService.validateDefinition(
      repaired.definition,
    );

    if (!Array.isArray(definition)) {
      return {
        definition,
        message: repaired.message,
        name: repaired.name,
      };
    }

    throw new Error('Generated form is invalid');
  }

  private requestGeneration(
    prompt: string,
    form: IInternalForm | null,
    history: Array<IFormMessage>,
    repair: { definition: string; errors: Record<string, string> } | null,
    contextDefinition: string | null,
  ): Promise<{
    definition: string | null;
    message: string;
    name: string | null;
  }> {
    return this.openAiGateway.generate(
      prompt,
      contextDefinition,
      history,
      repair,
      form?.branch ?? 'main',
      form ? this.buildPreviewUrl(form) : null,
    );
  }

  private async recordGenerationFailure(
    messageId: string | null,
  ): Promise<void> {
    if (messageId) {
      await this.formMessageRepository.setStatus(
        messageId,
        'failed',
        GENERATION_FAILURE_MESSAGE,
        null,
      );
    }
  }

  private async findIdempotentMessages(
    form: IInternalForm,
    generationId: string,
  ): Promise<Array<IFormMessage> | null> {
    const existing =
      await this.formMessageRepository.findAllByFormIdAndBranchAndGenerationId(
        form.form_id,
        form.branch,
        generationId,
      );

    if (existing.length === 0) {
      return null;
    }

    const userMessage = existing.find((message) => message.role === 'user');
    const assistantMessage = existing.find(
      (message) => message.role === 'assistant',
    );

    if (!userMessage || !assistantMessage) {
      return null;
    }

    if (assistantMessage.status !== 'complete') {
      throw new Error('Message generation is not complete');
    }

    return [userMessage, assistantMessage];
  }

  private async readHistory(
    organizationId: string,
    id: string,
    branch: string,
  ): Promise<Array<IFormMessage>> {
    const recent =
      await this.formMessageRepository.findAllByOrganizationIdAndFormIdAndBranch(
        organizationId,
        id,
        branch,
        null,
        HISTORY_MESSAGES,
      );

    return recent.filter((message) => message.status === 'complete').reverse();
  }

  private readContextDefinition(form: IInternalForm): string {
    const yaml = serialize(this.internalFormService.toDefinition(form));

    if (Buffer.byteLength(yaml, 'utf8') > MAX_CONTEXT_DEFINITION_BYTES) {
      throw new Error('Form definition is too large for generation');
    }

    return yaml;
  }

  private buildPreviewUrl(form: IInternalForm): string | null {
    const base = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');

    if (!base) {
      return null;
    }

    try {
      const url = new URL(`${base}/${encodeURIComponent(form.form_id)}`);

      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return null;
      }

      if (form.branch !== 'main') {
        url.searchParams.set('branch', form.branch);
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  private buildMessage(
    organizationId: string,
    form: IInternalForm,
    sequence: number,
    role: 'assistant' | 'user',
    content: string,
    status: 'complete' | 'pending',
    emailAddress: string,
    generationId: string,
    schemaRevision: number | null,
  ): IFormMessage {
    return {
      branch: form.branch,
      content,
      created_at: new Date(),
      created_by: emailAddress,
      form_id: form.form_id,
      generation_id: generationId,
      id: this.buildId(),
      organization_id: organizationId,
      origin_branch: null,
      origin_message_id: null,
      role,
      schema_revision: schemaRevision,
      sequence,
      status,
    };
  }

  private readName(
    name: string | null,
    fallback: string | null,
  ): string | null {
    if (!name) {
      return fallback;
    }

    return name.slice(0, 120);
  }

  private isValidPrompt(prompt: string): boolean {
    return !!prompt.trim() && prompt.length <= MAX_PROMPT_CHARS;
  }

  private buildId(): string {
    return randomBytes(16).toString('hex');
  }

  private clampLimit(limit: number | null): number {
    if (limit === null || !Number.isInteger(limit) || limit < 1) {
      return MESSAGE_PAGE_DEFAULT;
    }

    return Math.min(limit, MESSAGE_PAGE_MAX);
  }

  private encodeCursor(sequence: number): string {
    return Buffer.from(String(sequence), 'utf8').toString('base64url');
  }

  private decodeCursor(cursor: string | null): number | null {
    if (cursor === null) {
      return null;
    }

    const decoded = Number.parseInt(
      Buffer.from(cursor, 'base64url').toString('utf8'),
      10,
    );

    if (!Number.isInteger(decoded) || decoded < 1) {
      throw new Error('Message cursor is invalid');
    }

    return decoded;
  }
}
