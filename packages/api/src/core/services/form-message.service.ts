import { serialize, type IDeclarativeForm } from '@declarativeforms/engine';
import { randomBytes } from 'node:crypto';
import { HttpError } from '../errors';
import type { OpenAiGateway } from '../gateways';
import type { FormMessageRepository } from '../repositories';
import type {
  IFormGenerationRequest,
  IFormGenerationResult,
  IFormGenerationTurn,
  IFormMessage,
  IFormMessagePage,
  IFormMessageTurn,
  IInternalForm,
  IOrganization,
} from '../types';
import type { InternalFormService } from './internal-form.service';

const MESSAGE_PAGE_DEFAULT = 50;
const MESSAGE_PAGE_MAX = 100;
const MAX_PROMPT_CHARS = 4000;
const HISTORY_MESSAGES = 10;
const HISTORY_CONTENT_CHARS = 2000;
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
    organization: IOrganization,
    id: string,
    branch: string,
    limit: number | null,
    cursor: string | null,
  ): Promise<IFormMessagePage | null> {
    const form = await this.internalFormService.findBranch(
      organization,
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
      organization.id,
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
    organization: IOrganization,
    email: string,
    prompt: string,
  ): Promise<IFormMessageTurn> {
    this.assertPrompt(prompt);

    if (!this.openAiGateway.isConfigured()) {
      throw this.turnFailure('ai_unconfigured', 503, null, null);
    }

    const generationId = this.buildId();
    const result = await this.produce(
      organization,
      {
        definition: null,
        email_connections_enabled: organization.can_use_email_connection,
        history: [],
        invalid_definition: null,
        prompt,
        validation_errors: null,
      },
      generationId,
      null,
    );

    const form = await this.internalFormService.create(
      organization,
      email,
      result.definition,
      this.readName(result, null),
    );

    const first = await this.formMessageRepository.allocateSequences(
      form.form_id,
      form.branch,
      2,
    );

    const userMessage = this.buildMessage(
      organization,
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
      organization,
      form,
      first + 1,
      'assistant',
      result.message,
      'complete',
      email,
      generationId,
      form.revision,
    );

    await this.formMessageRepository.insertMany([
      userMessage,
      assistantMessage,
    ]);

    return {
      assistant_message: assistantMessage,
      branch: form.branch,
      definition: this.internalFormService.toDefinition(form),
      revision: form.revision,
      summary: await this.internalFormService.toSummary(form),
      user_message: userMessage,
    };
  }

  public async send(
    organization: IOrganization,
    email: string,
    id: string,
    branch: string,
    content: string,
    idempotencyKey: string | null,
  ): Promise<IFormMessageTurn | null> {
    const form = await this.internalFormService.findBranch(
      organization,
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
      const replay = await this.replay(organization, form, generationId);

      if (replay) {
        return replay;
      }
    }

    const history = await this.readHistory(organization, id, branch);
    const first = await this.formMessageRepository.allocateSequences(
      id,
      branch,
      2,
    );
    const userMessage = this.buildMessage(
      organization,
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
      organization,
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

    const result = await this.produce(
      organization,
      {
        definition: this.readContextDefinition(form),
        email_connections_enabled: organization.can_use_email_connection,
        history,
        invalid_definition: null,
        prompt: content,
        validation_errors: null,
      },
      generationId,
      assistantMessage.id,
    );

    const applied = await this.internalFormService.applyGenerated(
      organization,
      email,
      id,
      branch,
      result.definition,
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
      result.message,
      applied.revision,
    );

    return {
      assistant_message: {
        ...assistantMessage,
        content: result.message,
        schema_revision: applied.revision,
        status: 'complete',
      },
      branch: applied.branch,
      definition: this.internalFormService.toDefinition(applied),
      revision: applied.revision,
      summary: await this.internalFormService.toSummary(applied),
      user_message: userMessage,
    };
  }

  private async produce(
    organization: IOrganization,
    request: IFormGenerationRequest,
    generationId: string,
    messageId: string | null,
  ): Promise<{
    definition: IDeclarativeForm;
    message: string;
    name: string | null;
  }> {
    let candidate: IFormGenerationResult;

    try {
      candidate = await this.openAiGateway.generate(request);
    } catch (error: unknown) {
      throw await this.recordFailure(error, generationId, messageId);
    }

    const first = this.tryReadDefinition(organization, candidate.definition);

    if (first.definition) {
      return {
        definition: first.definition,
        message: candidate.message,
        name: candidate.name,
      };
    }

    let repaired: IFormGenerationResult;

    try {
      repaired = await this.openAiGateway.generate({
        ...request,
        invalid_definition: candidate.definition,
        validation_errors: first.errors,
      });
    } catch (error: unknown) {
      throw await this.recordFailure(error, generationId, messageId);
    }

    const second = this.tryReadDefinition(organization, repaired.definition);

    if (!second.definition) {
      throw await this.recordFailure(
        new HttpError(422, 'generation_invalid', {
          error: 'generation_invalid',
          errors: second.errors,
        }),
        generationId,
        messageId,
      );
    }

    return {
      definition: second.definition,
      message: repaired.message,
      name: repaired.name,
    };
  }

  private tryReadDefinition(
    organization: IOrganization,
    candidate: string,
  ): { definition: IDeclarativeForm | null; errors: Record<string, string> } {
    try {
      return {
        definition: this.internalFormService.readDefinition(
          candidate,
          organization,
        ),
        errors: {},
      };
    } catch (error: unknown) {
      if (!(error instanceof HttpError) || error.statusCode !== 422) {
        throw error;
      }

      const payload = error.payload as {
        errors?: Record<string, string>;
      } | null;

      return { definition: null, errors: payload?.errors ?? {} };
    }
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
    organization: IOrganization,
    form: IInternalForm,
    generationId: string,
  ): Promise<IFormMessageTurn | null> {
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

    return {
      assistant_message: assistantMessage,
      branch: form.branch,
      definition: this.internalFormService.toDefinition(form),
      revision: form.revision,
      summary: await this.internalFormService.toSummary(form),
      user_message: userMessage,
    };
  }

  private async readHistory(
    organization: IOrganization,
    id: string,
    branch: string,
  ): Promise<Array<IFormGenerationTurn>> {
    const recent = await this.formMessageRepository.listByBranch(
      id,
      organization.id,
      branch,
      null,
      HISTORY_MESSAGES,
    );

    const turns: Array<IFormGenerationTurn> = [];

    for (const message of recent) {
      if (message.status !== 'complete' || message.role === 'system') {
        continue;
      }

      turns.push({
        content: message.content.slice(0, HISTORY_CONTENT_CHARS),
        role: message.role,
      });
    }

    turns.reverse();

    return turns;
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
    organization: IOrganization,
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
      organization_id: organization.id,
      origin_branch: null,
      origin_message_id: null,
      role,
      schema_revision: schemaRevision,
      sequence,
      status,
    };
  }

  private readName(
    result: { name: string | null },
    fallback: string | null,
  ): string | null {
    if (!result.name) {
      return fallback;
    }

    return result.name.slice(0, 120);
  }

  private assertPrompt(prompt: string): void {
    if (!prompt.trim() || prompt.length > MAX_PROMPT_CHARS) {
      throw new HttpError(400, 'invalid_prompt');
    }
  }

  private buildId(): string {
    return randomBytes(16).toString('hex');
  }

  private turnFailure(
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
