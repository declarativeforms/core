import {
  parse,
  resolveLocalizedText,
  type IDeclarativeForm,
} from '@declarativeforms/engine';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { randomBytes } from 'node:crypto';
import { HttpError } from '../errors';
import type { FormMessageRepository, FormRepository } from '../repositories';
import {
  INTERNAL_FORM_METADATA_KEYS,
  type IFormMessage,
  type IInternalForm,
} from '../types';

const INTERNAL_FORM_PREFIX = process.env.INTERNAL_FORM_PREFIX || 'i';
const DEFAULT_BRANCH = 'main';
const BRANCH_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/;
const DEFAULT_MAX_DEFINITION_BYTES = 262144;
const UNTITLED_FORM_NAME = 'Untitled form';
const FORK_COPY_LIMIT = 2000;

export class InternalFormService {
  constructor(
    private formRepository: FormRepository,
    private formMessageRepository: FormMessageRepository,
    private validator: ValidateFunction,
  ) {}

  public async ensureIndexes(): Promise<void> {
    await this.formRepository.ensureIndexes();
  }

  public isInternalId(id: string): boolean {
    return id.startsWith(INTERNAL_FORM_PREFIX);
  }

  public async findDefinition(
    id: string,
    branch?: string,
  ): Promise<IDeclarativeForm | null> {
    const name = branch || DEFAULT_BRANCH;

    if (!BRANCH_PATTERN.test(name)) {
      return null;
    }

    return this.formRepository.findDefinition(id, name);
  }

  public async list(
    organizationId: string,
  ): Promise<
    Array<
      Pick<
        IInternalForm,
        'form_id' | 'name' | 'organization_id' | 'revision' | 'updated_at'
      >
    >
  > {
    const forms = await this.formRepository.listByOrganization(
      organizationId,
      DEFAULT_BRANCH,
    );

    return forms.map((form) => this.toListing(form));
  }

  public async create(
    organizationId: string,
    email: string,
    body: unknown,
    name: string | null,
  ): Promise<IInternalForm> {
    const definition = this.readDefinition(body);
    const now = new Date();

    const form: IInternalForm = {
      ...definition,
      branch: DEFAULT_BRANCH,
      created_at: now,
      created_by: email,
      deleted_at: null,
      form_id: `${INTERNAL_FORM_PREFIX}${randomBytes(6).toString('hex')}`,
      name,
      organization_id: organizationId,
      revision: 1,
      updated_at: now,
      updated_by: email,
    };

    await this.formRepository.insert(form);

    return form;
  }

  public async update(
    organizationId: string,
    email: string,
    id: string,
    branch: string | undefined,
    expectedRevision: number | null,
    body: unknown,
  ): Promise<IInternalForm | null> {
    const existing = await this.findOwnedBranch(organizationId, id, branch);

    if (!existing) {
      return null;
    }

    const definition = this.readDefinition(body);

    if (expectedRevision !== null && expectedRevision !== existing.revision) {
      throw this.revisionConflict(existing.revision);
    }

    const form = this.carryMetadata(existing, definition, email, existing.name);
    const replaced = await this.formRepository.replace(form, existing.revision);

    if (!replaced) {
      const current = await this.formRepository.findBranch(id, form.branch);

      throw this.revisionConflict(current?.revision ?? existing.revision);
    }

    return form;
  }

  public async remove(
    organizationId: string,
    id: string,
  ): Promise<IInternalForm | null> {
    const existing = await this.formRepository.findAnyBranch(id);

    if (!existing || existing.organization_id !== organizationId) {
      return null;
    }

    await this.formRepository.softDelete(id);

    return existing;
  }

  public async rename(
    organizationId: string,
    email: string,
    id: string,
    name: string,
  ): Promise<Pick<
    IInternalForm,
    'form_id' | 'name' | 'organization_id' | 'revision' | 'updated_at'
  > | null> {
    const existing = await this.formRepository.findAnyBranch(id);

    if (!existing || existing.organization_id !== organizationId) {
      return null;
    }

    await this.formRepository.rename(id, name, email);

    const renamed = await this.formRepository.findBranch(id, DEFAULT_BRANCH);

    if (!renamed) {
      return null;
    }

    return this.toListing(renamed);
  }

  public async findBranchNames(
    organizationId: string,
    id: string,
  ): Promise<Array<string> | null> {
    const existing = await this.formRepository.findAnyBranch(id);

    if (!existing || existing.organization_id !== organizationId) {
      return null;
    }

    return this.formRepository.findBranchNames(id);
  }

  public async findBranch(
    organizationId: string,
    id: string,
    branch: string,
  ): Promise<IInternalForm | null> {
    return this.findOwnedBranch(organizationId, id, branch);
  }

  public async createBranch(
    organizationId: string,
    email: string,
    id: string,
    name: string,
    from: string,
  ): Promise<IInternalForm | null> {
    if (!BRANCH_PATTERN.test(name) || !BRANCH_PATTERN.test(from)) {
      return null;
    }

    if (name === DEFAULT_BRANCH) {
      throw HttpError.conflict('branch_protected');
    }

    const source = await this.findOwnedBranch(organizationId, id, from);

    if (!source) {
      return null;
    }

    const now = new Date();
    const form: IInternalForm = {
      ...this.toDefinition(source),
      branch: name,
      created_at: now,
      created_by: email,
      deleted_at: null,
      form_id: source.form_id,
      name: source.name,
      organization_id: source.organization_id,
      revision: 1,
      updated_at: now,
      updated_by: email,
    };

    try {
      await this.formRepository.insert(form);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw HttpError.conflict('branch_exists');
      }

      throw error;
    }

    await this.copyConversation(organizationId, id, from, name);

    return form;
  }

  public async deleteBranch(
    organizationId: string,
    id: string,
    name: string,
  ): Promise<IInternalForm | null> {
    if (name === DEFAULT_BRANCH) {
      throw HttpError.conflict('branch_protected');
    }

    const existing = await this.findOwnedBranch(organizationId, id, name);

    if (!existing) {
      return null;
    }

    await this.formRepository.delete(id, name);
    await this.formMessageRepository.delete(id, name);

    return existing;
  }

  public async publish(
    organizationId: string,
    email: string,
    id: string,
    source: string,
    target: string,
    deleteSource: boolean,
  ): Promise<IInternalForm | null> {
    if (source === target) {
      throw HttpError.conflict('branch_protected');
    }

    const from = await this.findOwnedBranch(organizationId, id, source);
    const to = await this.findOwnedBranch(organizationId, id, target);

    if (!from || !to) {
      return null;
    }

    const form = this.carryMetadata(
      to,
      this.toDefinition(from),
      email,
      to.name,
    );
    const replaced = await this.formRepository.replace(form, to.revision);

    if (!replaced) {
      throw this.revisionConflict(to.revision);
    }

    await this.importConversation(
      organizationId,
      id,
      source,
      target,
      email,
      form.revision,
    );

    if (deleteSource) {
      await this.formRepository.delete(id, source);
      await this.formMessageRepository.delete(id, source);
    }

    return form;
  }

  public async applyGenerated(
    organizationId: string,
    email: string,
    id: string,
    branch: string,
    definition: IDeclarativeForm,
    name: string | null,
  ): Promise<IInternalForm | null> {
    const fresh = await this.findOwnedBranch(organizationId, id, branch);

    if (!fresh) {
      return null;
    }

    const form = this.carryMetadata(
      fresh,
      definition,
      email,
      name ?? fresh.name,
    );
    const replaced = await this.formRepository.replace(form, null);

    if (!replaced) {
      return null;
    }

    return form;
  }

  public toDefinition(form: IInternalForm): IDeclarativeForm {
    const copy: Record<string, unknown> = { ...form };

    for (const key of INTERNAL_FORM_METADATA_KEYS) {
      delete copy[key];
    }

    return copy as IDeclarativeForm;
  }

  public readDefinition(body: unknown): IDeclarativeForm {
    const definition = this.validate(this.parseBody(body));

    this.assertConnectionPolicy(definition);

    return definition;
  }

  private async copyConversation(
    organizationId: string,
    id: string,
    from: string,
    to: string,
  ): Promise<void> {
    await this.formMessageRepository.delete(id, to);

    const source = await this.formMessageRepository.listByBranch(
      id,
      organizationId,
      from,
      null,
      FORK_COPY_LIMIT,
    );

    if (source.length === 0) {
      return;
    }

    source.reverse();

    const first = await this.formMessageRepository.allocateSequences(
      id,
      to,
      source.length,
    );

    await this.formMessageRepository.insertMany(
      source.map((message, index) => ({
        ...message,
        branch: to,
        id: this.buildMessageId(),
        origin_branch: from,
        origin_message_id: message.id,
        sequence: first + index,
      })),
    );
  }

  private async importConversation(
    organizationId: string,
    id: string,
    source: string,
    target: string,
    email: string,
    revision: number,
  ): Promise<void> {
    const imported = await this.formMessageRepository.findOriginIds(id, target);
    const candidates = await this.formMessageRepository.listAuthoredByBranch(
      id,
      source,
      FORK_COPY_LIMIT,
    );
    const pending = candidates.filter(
      (message) => !imported.includes(message.id),
    );

    const first = await this.formMessageRepository.allocateSequences(
      id,
      target,
      1 + pending.length,
    );
    const now = new Date();
    const marker: IFormMessage = {
      branch: target,
      content: `Published ${source} into ${target}`,
      created_at: now,
      created_by: email,
      form_id: id,
      generation_id: null,
      id: this.buildMessageId(),
      organization_id: organizationId,
      origin_branch: source,
      origin_message_id: null,
      role: 'system',
      schema_revision: revision,
      sequence: first,
      status: 'complete',
    };

    await this.formMessageRepository.insertMany([
      marker,
      ...pending.map((message, index) => ({
        ...message,
        branch: target,
        id: this.buildMessageId(),
        origin_branch: source,
        origin_message_id: message.id,
        sequence: first + 1 + index,
      })),
    ]);
  }

  private buildMessageId(): string {
    return randomBytes(16).toString('hex');
  }

  private async findOwnedBranch(
    organizationId: string,
    id: string,
    branch: string | undefined,
  ): Promise<IInternalForm | null> {
    const name = branch || DEFAULT_BRANCH;

    if (!BRANCH_PATTERN.test(name)) {
      return null;
    }

    const existing = await this.formRepository.findBranch(id, name);

    return existing && existing.organization_id === organizationId
      ? existing
      : null;
  }

  private toListing(
    form: IInternalForm,
  ): Pick<
    IInternalForm,
    'form_id' | 'name' | 'organization_id' | 'revision' | 'updated_at'
  > {
    return {
      form_id: form.form_id,
      name: this.resolveName(form),
      organization_id: form.organization_id,
      revision: form.revision,
      updated_at: form.updated_at,
    };
  }

  private resolveName(form: IInternalForm): string {
    return form.name || resolveLocalizedText(form.title) || UNTITLED_FORM_NAME;
  }

  private revisionConflict(revision: number): HttpError {
    return new HttpError(409, 'revision_conflict', {
      error: 'revision_conflict',
      revision,
    });
  }

  private carryMetadata(
    existing: IInternalForm,
    definition: IDeclarativeForm,
    email: string,
    name: string | null,
  ): IInternalForm {
    return {
      ...definition,
      branch: existing.branch,
      created_at: existing.created_at,
      created_by: existing.created_by,
      deleted_at: null,
      form_id: existing.form_id,
      name,
      organization_id: existing.organization_id,
      revision: existing.revision + 1,
      updated_at: new Date(),
      updated_by: email,
    };
  }

  private parseBody(body: unknown): Record<string, unknown> {
    if (typeof body === 'string') {
      return this.parseYaml(Buffer.from(body, 'utf8'));
    }

    if (Buffer.isBuffer(body)) {
      return this.parseYaml(body);
    }

    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }

    throw HttpError.invalid({
      '/': 'must be a form definition object or YAML document',
    });
  }

  private parseYaml(buffer: Buffer): Record<string, unknown> {
    const maxBytes = Number.parseInt(
      process.env.FORMS_MAX_DEFINITION_BYTES ||
        String(DEFAULT_MAX_DEFINITION_BYTES),
      10,
    );

    if (buffer.byteLength > maxBytes) {
      throw HttpError.invalid({ '/': `must not exceed ${maxBytes} bytes` });
    }

    let parsed: unknown;

    try {
      parsed = parse(buffer.toString('utf8'));
    } catch (error: any) {
      throw HttpError.invalid({
        '/': String(error?.message || 'is not valid YAML'),
      });
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw HttpError.invalid({ '/': 'must be a YAML mapping' });
    }

    return parsed as Record<string, unknown>;
  }

  private validate(value: Record<string, unknown>): IDeclarativeForm {
    const { id: _id, ...definition } = value;

    if (!this.validator(definition)) {
      throw HttpError.invalid(this.toErrors(this.validator.errors));
    }

    return definition as IDeclarativeForm;
  }

  private toErrors(
    errors: Array<ErrorObject> | null | undefined,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const error of errors ?? []) {
      result[error.instancePath || '/'] = error.message || 'is invalid';
    }

    if (Object.keys(result).length === 0) {
      result['/'] = 'is invalid';
    }

    return result;
  }

  private assertConnectionPolicy(definition: IDeclarativeForm): void {
    const errors: Record<string, string> = {};

    (definition.connections ?? []).forEach((connection, index) => {
      if (connection.type === 'webhook') {
        const message = this.checkWebhookUrl((connection as any).url);

        if (message) {
          errors[`/connections/${index}/url`] = message;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      throw HttpError.invalid(errors);
    }
  }

  private checkWebhookUrl(value: unknown): string | null {
    if (typeof value !== 'string' || !value) {
      return 'must be an https URL';
    }

    let url: URL;

    try {
      url = new URL(value);
    } catch {
      return 'must be an https URL';
    }

    if (url.protocol !== 'https:') {
      return 'must use https';
    }

    if (url.username || url.password) {
      return 'must not contain credentials';
    }

    if (this.isIpLiteral(url.hostname)) {
      return 'must not be an IP address';
    }

    if (!url.hostname.includes('.')) {
      return 'must be a public hostname';
    }

    return null;
  }

  private isIpLiteral(hostname: string): boolean {
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      return true;
    }

    return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  }
}
