import {
  parse,
  resolveLocalizedText,
  type IDeclarativeForm,
} from '@declarativeforms/engine';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { randomBytes } from 'node:crypto';
import type { FormMessageRepository, FormRepository } from '../repositories';
import {
  INTERNAL_FORM_METADATA_KEYS,
  type IFormMessage,
  type IInternalForm,
  type IValidationIssue,
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

  public isInternalId(id: string): boolean {
    return id.startsWith(INTERNAL_FORM_PREFIX);
  }

  public async find(
    id: string,
    branch?: string,
  ): Promise<IDeclarativeForm | null> {
    const name = branch || DEFAULT_BRANCH;

    if (!BRANCH_PATTERN.test(name)) {
      return null;
    }

    const form = await this.formRepository.findByIdAndBranch(id, name);

    return form ? { ...this.toDefinition(form), id } : null;
  }

  public async listByOrganization(
    organizationId: string,
  ): Promise<
    Array<
      Pick<
        IInternalForm,
        'form_id' | 'name' | 'organization_id' | 'revision' | 'updated_at'
      >
    >
  > {
    const forms = await this.formRepository.findAllByOrganizationIdAndBranch(
      organizationId,
      DEFAULT_BRANCH,
    );

    return forms.map((form) => this.toFormListing(form));
  }

  public async create(
    organizationId: string,
    emailAddress: string,
    definitionInput: unknown,
    name: string | null,
  ): Promise<IInternalForm> {
    const definition = this.requireValidDefinition(definitionInput);

    const now = new Date();

    const form: IInternalForm = {
      ...definition,
      branch: DEFAULT_BRANCH,
      created_at: now,
      created_by: emailAddress,
      deleted_at: null,
      form_id: `${INTERNAL_FORM_PREFIX}${randomBytes(6).toString('hex')}`,
      name,
      organization_id: organizationId,
      revision: 1,
      updated_at: now,
      updated_by: emailAddress,
    };

    await this.formRepository.insert(form);

    return form;
  }

  public async update(
    organizationId: string,
    emailAddress: string,
    id: string,
    branch: string | undefined,
    definitionInput: unknown,
    expectedRevision: number | null,
  ): Promise<IInternalForm | null> {
    const existing = await this.findOwnedBranch(organizationId, id, branch);

    if (!existing) {
      return null;
    }

    const definition = this.requireValidDefinition(definitionInput);

    if (expectedRevision !== null && expectedRevision !== existing.revision) {
      throw new Error('Form revision does not match');
    }

    const form = this.carryMetadata(
      existing,
      definition,
      emailAddress,
      existing.name,
    );
    const replaced = await this.formRepository.replace(form, existing.revision);

    if (!replaced) {
      throw new Error('Form revision changed during update');
    }

    return form;
  }

  public async delete(
    organizationId: string,
    id: string,
  ): Promise<IInternalForm | null> {
    const existing = await this.formRepository.findById(id);

    if (!existing || existing.organization_id !== organizationId) {
      return null;
    }

    await this.formRepository.setDeletedAt(id);

    return existing;
  }

  public async rename(
    organizationId: string,
    emailAddress: string,
    id: string,
    name: string,
  ): Promise<Pick<
    IInternalForm,
    'form_id' | 'name' | 'organization_id' | 'revision' | 'updated_at'
  > | null> {
    const existing = await this.formRepository.findById(id);

    if (!existing || existing.organization_id !== organizationId) {
      return null;
    }

    await this.formRepository.setName(id, name, emailAddress);

    const renamed = await this.formRepository.findByIdAndBranch(
      id,
      DEFAULT_BRANCH,
    );

    if (!renamed) {
      return null;
    }

    return this.toFormListing(renamed);
  }

  public async listBranchNamesById(
    organizationId: string,
    id: string,
  ): Promise<Array<string> | null> {
    const existing = await this.formRepository.findById(id);

    if (!existing || existing.organization_id !== organizationId) {
      return null;
    }

    return this.formRepository.findAllBranchNamesById(id);
  }

  public findByBranch(
    organizationId: string,
    id: string,
    branch: string,
  ): Promise<IInternalForm | null> {
    return this.findOwnedBranch(organizationId, id, branch);
  }

  public async createBranch(
    organizationId: string,
    emailAddress: string,
    id: string,
    name: string,
    from: string,
  ): Promise<IInternalForm | null> {
    if (!BRANCH_PATTERN.test(name) || !BRANCH_PATTERN.test(from)) {
      return null;
    }

    if (name === DEFAULT_BRANCH) {
      return null;
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
      created_by: emailAddress,
      deleted_at: null,
      form_id: source.form_id,
      name: source.name,
      organization_id: source.organization_id,
      revision: 1,
      updated_at: now,
      updated_by: emailAddress,
    };

    try {
      await this.formRepository.insert(form);
    } catch (error: any) {
      if (error?.code === 11000) {
        return null;
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
      throw new Error('The main branch cannot be deleted');
    }

    const existing = await this.findOwnedBranch(organizationId, id, name);

    if (!existing) {
      return null;
    }

    await this.formRepository.deleteByIdAndBranch(id, name);
    await this.formMessageRepository.deleteAllByFormIdAndBranch(id, name);

    return existing;
  }

  public async publish(
    organizationId: string,
    emailAddress: string,
    id: string,
    source: string,
    target: string,
    deleteSource: boolean,
  ): Promise<IInternalForm | null> {
    if (source === target) {
      throw new Error('Source and target branches must differ');
    }

    const from = await this.findOwnedBranch(organizationId, id, source);
    const to = await this.findOwnedBranch(organizationId, id, target);

    if (!from || !to) {
      return null;
    }

    const form = this.carryMetadata(
      to,
      this.toDefinition(from),
      emailAddress,
      to.name,
    );
    const replaced = await this.formRepository.replace(form, to.revision);

    if (!replaced) {
      throw new Error('Target branch changed during publish');
    }

    await this.importConversation(
      organizationId,
      id,
      source,
      target,
      emailAddress,
      form.revision,
    );

    if (deleteSource) {
      await this.formRepository.deleteByIdAndBranch(id, source);
      await this.formMessageRepository.deleteAllByFormIdAndBranch(id, source);
    }

    return form;
  }

  public async applyGeneratedDefinition(
    organizationId: string,
    emailAddress: string,
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
      emailAddress,
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

  public validateDefinition(
    definitionInput: unknown,
  ): IDeclarativeForm | Array<IValidationIssue> {
    const parsed = this.parseDefinitionInput(definitionInput);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    const definition = this.validateDefinitionSchema(parsed);

    if (Array.isArray(definition)) {
      return definition;
    }

    const issues = this.validateConnectionPolicy(definition);

    return issues.length > 0 ? issues : definition;
  }

  private async copyConversation(
    organizationId: string,
    id: string,
    from: string,
    to: string,
  ): Promise<void> {
    await this.formMessageRepository.deleteAllByFormIdAndBranch(id, to);

    const source =
      await this.formMessageRepository.findAllByOrganizationIdAndFormIdAndBranch(
        organizationId,
        id,
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
    emailAddress: string,
    revision: number,
  ): Promise<void> {
    const imported =
      await this.formMessageRepository.findAllOriginMessageIdsByFormIdAndBranch(
        id,
        target,
      );
    const candidates =
      await this.formMessageRepository.findAllByFormIdAndBranchWithoutOriginMessageId(
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
      created_by: emailAddress,
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

    const existing = await this.formRepository.findByIdAndBranch(id, name);

    return existing && existing.organization_id === organizationId
      ? existing
      : null;
  }

  private toFormListing(
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

  private carryMetadata(
    existing: IInternalForm,
    definition: IDeclarativeForm,
    emailAddress: string,
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
      updated_by: emailAddress,
    };
  }

  private requireValidDefinition(definitionInput: unknown): IDeclarativeForm {
    const definition = this.validateDefinition(definitionInput);

    if (Array.isArray(definition)) {
      throw new Error('Form definition is invalid');
    }

    return definition;
  }

  private parseDefinitionInput(
    definitionInput: unknown,
  ): Record<string, unknown> | Array<IValidationIssue> {
    if (typeof definitionInput === 'string') {
      return this.parseYaml(Buffer.from(definitionInput, 'utf8'));
    }

    if (Buffer.isBuffer(definitionInput)) {
      return this.parseYaml(definitionInput);
    }

    if (
      definitionInput &&
      typeof definitionInput === 'object' &&
      !Array.isArray(definitionInput)
    ) {
      return definitionInput as Record<string, unknown>;
    }

    return [
      {
        message: 'must be a form definition object or YAML document',
        path: '/',
      },
    ];
  }

  private parseYaml(
    buffer: Buffer,
  ): Record<string, unknown> | Array<IValidationIssue> {
    const maxBytes = Number.parseInt(
      process.env.FORMS_MAX_DEFINITION_BYTES ||
        String(DEFAULT_MAX_DEFINITION_BYTES),
      10,
    );

    if (buffer.byteLength > maxBytes) {
      return [{ message: `must not exceed ${maxBytes} bytes`, path: '/' }];
    }

    let parsed: unknown;

    try {
      parsed = parse(buffer.toString('utf8'));
    } catch (error: any) {
      return [
        {
          message: String(error?.message || 'is not valid YAML'),
          path: '/',
        },
      ];
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [{ message: 'must be a YAML mapping', path: '/' }];
    }

    return parsed as Record<string, unknown>;
  }

  private validateDefinitionSchema(
    value: Record<string, unknown>,
  ): IDeclarativeForm | Array<IValidationIssue> {
    const { id: _id, ...definition } = value;

    if (!this.validator(definition)) {
      return this.toValidationIssues(this.validator.errors);
    }

    return definition as IDeclarativeForm;
  }

  private toValidationIssues(
    errors: Array<ErrorObject> | null | undefined,
  ): Array<IValidationIssue> {
    const issues = (errors ?? []).map((error) => ({
      message: error.message || 'is invalid',
      path: error.instancePath || '/',
    }));

    return issues.length > 0 ? issues : [{ message: 'is invalid', path: '/' }];
  }

  private validateConnectionPolicy(
    definition: IDeclarativeForm,
  ): Array<IValidationIssue> {
    const issues: Array<IValidationIssue> = [];

    (definition.connections ?? []).forEach((connection, index) => {
      if (connection.type === 'webhook') {
        const message = this.findWebhookUrlError((connection as any).url);

        if (message) {
          issues.push({ message, path: `/connections/${index}/url` });
        }
      }
    });

    return issues;
  }

  private findWebhookUrlError(value: unknown): string | null {
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
