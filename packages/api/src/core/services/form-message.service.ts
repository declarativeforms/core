import { serialize, type IDeclarativeForm } from '@declarativeforms/engine';
import { randomBytes } from 'node:crypto';
import { HttpError } from '../errors';
import type { OpenAiGateway } from '../gateways';
import type { FormMessageRepository } from '../repositories';
import type { IFormMessage, IFormMessagePage, IInternalForm } from '../types';
import type { InternalFormService } from './internal-form.service';

const MESSAGE_PAGE_DEFAULT = 50;
const MESSAGE_PAGE_MAX = 100;
const MAX_PROMPT_CHARS = 4000;
const HISTORY_MESSAGES = 10;
const MAX_CONTEXT_DEFINITION_BYTES = 65536;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const FAILURE_MESSAGES: Record<string, string> = {
  ai_unconfigured:
    'Form generation is not configured on this deployment. Nothing was changed.',
  definition_too_large:
    'This form is too large to change automatically. Nothing was changed.',
  generation_invalid:
    'The generated form did not pass validation, so the form was left unchanged.',
  generation_rate_limited:
    'The generation service is rate limited right now. Nothing was changed.',
  generation_refused:
    'The request was refused, so the form was left unchanged.',
  generation_unavailable:
    'The generation service did not respond in time. Nothing was changed.',
};

export class FormMessageService {
  constructor(
    private formMessageRepository: FormMessageRepository,
    private internalFormService: InternalFormService,
    private openAiGateway: OpenAiGateway,
  ) {}

  public async ensureIndexes(): Promise<void> {
    await this.formMessageRepository.ensureIndexes();
  }

  public async list(
    organizationId: string,
    id: string,
    branch: string,
    limit: number | null,
    cursor: string | null,
  ): Promise<IFormMessagePage | null> {
    const form = await this.internalFormService.findBranch(
      organizationId,
      id,
      branch,
    );

    if (!form) {
      return null;
    }

    const before = this.decodeCursor(cursor);
    const size = this.clampLimit(limit);
    const messages = await this.formMessageRepository.listByBranch(
      id,
      organizationId,
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
    email: string,
    prompt: string,
  ): Promise<Array<IFormMessage>> {
    this.assertPrompt(prompt);

    if (!this.openAiGateway.isConfigured()) {
      throw this.generationFailure('ai_unconfigured', 503, null, null);
    }

    const generationId = this.buildId();
    const generated = await this.produce(prompt, null, [], generationId, null);

    const form = await this.internalFormService.create(
      organizationId,
      email,
      generated.definition,
      this.readName(generated.name, null),
    );

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
      email,
      generationId,
      null,
    );
    const assistantMessage = this.buildMessage(
      organizationId,
      form,
      first + 1,
      'assistant',
      generated.message,
      'complete',
      email,
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
    email: string,
    id: string,
    branch: string,
    content: string,
    idempotencyKey: string | null,
  ): Promise<Array<IFormMessage> | null> {
    const form = await this.internalFormService.findBranch(
      organizationId,
      id,
      branch,
    );

    if (!form) {
      return null;
    }

    this.assertPrompt(content);

    if (idempotencyKey && !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      throw new HttpError(400, 'invalid_idempotency_key');
    }

    const generationId = idempotencyKey ?? this.buildId();

    if (idempotencyKey) {
      const replay = await this.replay(form, generationId);

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
      email,
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
      email,
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

      throw new HttpError(409, 'generation_in_progress', {
        error: 'generation_in_progress',
        generation_id: generationId,
      });
    }

    const generated = await this.produce(
      content,
      this.readContextDefinition(form),
      history,
      generationId,
      assistantMessage.id,
    );

    const applied = await this.internalFormService.applyGenerated(
      organizationId,
      email,
      id,
      branch,
      generated.definition,
      null,
    );

    if (!applied) {
      await this.formMessageRepository.fail(
        assistantMessage.id,
        FAILURE_MESSAGES.generation_unavailable,
      );

      return null;
    }

    await this.formMessageRepository.complete(
      assistantMessage.id,
      generated.message,
      applied.revision,
    );

    return [
      userMessage,
      {
        ...assistantMessage,
        content: generated.message,
        schema_revision: applied.revision,
        status: 'complete',
      },
    ];
  }

  private async produce(
    prompt: string,
    definition: string | null,
    history: Array<IFormMessage>,
    generationId: string,
    messageId: string | null,
  ): Promise<{
    definition: IDeclarativeForm;
    message: string;
    name: string | null;
  }> {
    const candidate = await this.callGateway(
      prompt,
      definition,
      history,
      null,
      generationId,
      messageId,
    );

    try {
      return {
        definition: this.internalFormService.readDefinition(
          candidate.definition,
        ),
        message: candidate.message,
        name: candidate.name,
      };
    } catch (error: unknown) {
      return this.repair(
        prompt,
        definition,
        history,
        candidate.definition,
        this.readValidationErrors(error),
        generationId,
        messageId,
      );
    }
  }

  private async repair(
    prompt: string,
    definition: string | null,
    history: Array<IFormMessage>,
    invalid: string,
    errors: Record<string, string>,
    generationId: string,
    messageId: string | null,
  ): Promise<{
    definition: IDeclarativeForm;
    message: string;
    name: string | null;
  }> {
    const repaired = await this.callGateway(
      prompt,
      definition,
      history,
      { definition: invalid, errors },
      generationId,
      messageId,
    );

    try {
      return {
        definition: this.internalFormService.readDefinition(
          repaired.definition,
        ),
        message: repaired.message,
        name: repaired.name,
      };
    } catch (error: unknown) {
      throw await this.recordFailure(
        new HttpError(422, 'generation_invalid', {
          error: 'generation_invalid',
          errors: this.readValidationErrors(error),
        }),
        generationId,
        messageId,
      );
    }
  }

  private async callGateway(
    prompt: string,
    definition: string | null,
    history: Array<IFormMessage>,
    repair: { definition: string; errors: Record<string, string> } | null,
    generationId: string,
    messageId: string | null,
  ): Promise<{ definition: string; message: string; name: string | null }> {
    try {
      return await this.openAiGateway.generate(
        prompt,
        definition,
        history,
        repair,
      );
    } catch (error: unknown) {
      throw await this.recordFailure(error, generationId, messageId);
    }
  }

  private readValidationErrors(error: unknown): Record<string, string> {
    if (!(error instanceof HttpError) || error.statusCode !== 422) {
      throw error;
    }

    const payload = error.payload as {
      errors?: Record<string, string>;
    } | null;

    return payload?.errors ?? {};
  }

  private async recordFailure(
    error: unknown,
    generationId: string,
    messageId: string | null,
  ): Promise<unknown> {
    if (!(error instanceof HttpError)) {
      return error;
    }

    const slug = error.message;

    if (messageId) {
      await this.formMessageRepository.fail(
        messageId,
        FAILURE_MESSAGES[slug] ?? FAILURE_MESSAGES.generation_unavailable,
      );
    }

    const payload = error.payload as { errors?: Record<string, string> } | null;

    return new HttpError(error.statusCode, slug, {
      error: slug,
      generation_id: generationId,
      message_id: messageId,
      ...(payload?.errors ? { errors: payload.errors } : {}),
    });
  }

  private async replay(
    form: IInternalForm,
    generationId: string,
  ): Promise<Array<IFormMessage> | null> {
    const existing = await this.formMessageRepository.listByGeneration(
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

    if (assistantMessage.status === 'pending') {
      throw new HttpError(409, 'generation_in_progress', {
        error: 'generation_in_progress',
        generation_id: generationId,
        message_id: assistantMessage.id,
      });
    }

    if (assistantMessage.status === 'failed') {
      throw new HttpError(409, 'generation_already_failed', {
        error: 'generation_already_failed',
        generation_id: generationId,
        message_id: assistantMessage.id,
      });
    }

    return [userMessage, assistantMessage];
  }

  private async readHistory(
    organizationId: string,
    id: string,
    branch: string,
  ): Promise<Array<IFormMessage>> {
    const recent = await this.formMessageRepository.listByBranch(
      id,
      organizationId,
      branch,
      null,
      HISTORY_MESSAGES,
    );

    return recent.filter((message) => message.status === 'complete').reverse();
  }

  private readContextDefinition(form: IInternalForm): string {
    const yaml = serialize(this.internalFormService.toDefinition(form));

    if (Buffer.byteLength(yaml, 'utf8') > MAX_CONTEXT_DEFINITION_BYTES) {
      throw new HttpError(422, 'definition_too_large', {
        error: 'definition_too_large',
      });
    }

    return yaml;
  }

  private buildMessage(
    organizationId: string,
    form: IInternalForm,
    sequence: number,
    role: 'assistant' | 'user',
    content: string,
    status: 'complete' | 'pending',
    email: string,
    generationId: string,
    schemaRevision: number | null,
  ): IFormMessage {
    return {
      branch: form.branch,
      content,
      created_at: new Date(),
      created_by: email,
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

  private assertPrompt(prompt: string): void {
    if (!prompt.trim() || prompt.length > MAX_PROMPT_CHARS) {
      throw new HttpError(400, 'invalid_prompt');
    }
  }

  private buildId(): string {
    return randomBytes(16).toString('hex');
  }

  private generationFailure(
    slug: string,
    status: number,
    generationId: string | null,
    messageId: string | null,
  ): HttpError {
    return new HttpError(status, slug, {
      error: slug,
      generation_id: generationId,
      message_id: messageId,
    });
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
      throw new HttpError(400, 'invalid_cursor');
    }

    return decoded;
  }
}
