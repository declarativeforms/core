import {
  parse,
  resolveLocalizedText,
  serialize,
  type IDeclarativeForm,
} from '@declarativeforms/engine';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { randomBytes } from 'node:crypto';
import type { FormRepository } from '../repositories';
import {
  INTERNAL_FORM_METADATA_KEYS,
  type IInternalForm,
  type IValidationIssue,
} from '../types';

const INTERNAL_FORM_PREFIX = process.env.INTERNAL_FORM_PREFIX || 'i';
const DEFAULT_BRANCH = 'main';
const BRANCH_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/;
const DEFAULT_MAX_DEFINITION_BYTES = 262144;
const UNTITLED_FORM_NAME = 'Untitled form';

export class InternalFormService {
  constructor(
    private formRepository: FormRepository,
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
    definition: IDeclarativeForm,
    name: string | null,
  ): Promise<IInternalForm> {
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

  public async delete(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.formRepository.findById(id);

    if (!existing || existing.organization_id !== organizationId) {
      return false;
    }

    await this.formRepository.setDeletedAt(id);

    return true;
  }

  public async rename(
    organizationId: string,
    emailAddress: string,
    id: string,
    name: string,
  ): Promise<boolean> {
    const existing = await this.formRepository.findById(id);

    if (!existing || existing.organization_id !== organizationId) {
      return false;
    }

    await this.formRepository.setName(id, name, emailAddress);

    return true;
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
  ): Promise<boolean> {
    if (!BRANCH_PATTERN.test(name) || !BRANCH_PATTERN.test(from)) {
      return false;
    }

    if (name === DEFAULT_BRANCH) {
      return false;
    }

    const source = await this.findOwnedBranch(organizationId, id, from);

    if (!source) {
      return false;
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
        return false;
      }

      throw error;
    }

    return true;
  }

  public async deleteBranch(
    organizationId: string,
    id: string,
    name: string,
  ): Promise<boolean> {
    if (name === DEFAULT_BRANCH) {
      throw new Error('The main branch cannot be deleted');
    }

    const existing = await this.findOwnedBranch(organizationId, id, name);

    if (!existing) {
      return false;
    }

    await this.formRepository.deleteByIdAndBranch(id, name);

    return true;
  }

  public async publish(
    organizationId: string,
    emailAddress: string,
    id: string,
    source: string,
  ): Promise<boolean> {
    if (source === DEFAULT_BRANCH) {
      throw new Error('Source and target branches must differ');
    }

    const from = await this.findOwnedBranch(organizationId, id, source);
    const to = await this.findOwnedBranch(organizationId, id, DEFAULT_BRANCH);

    if (!from || !to) {
      return false;
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

    return true;
  }

  public async applyGeneratedDefinition(
    organizationId: string,
    emailAddress: string,
    id: string,
    branch: string,
    definition: IDeclarativeForm,
    name: string | null,
  ): Promise<boolean> {
    const fresh = await this.findOwnedBranch(organizationId, id, branch);

    if (!fresh) {
      return false;
    }

    const form = this.carryMetadata(
      fresh,
      definition,
      emailAddress,
      name ?? fresh.name,
    );
    const replaced = await this.formRepository.replace(form, null);

    if (!replaced) {
      return false;
    }

    return true;
  }

  public toDefinition(form: IInternalForm): IDeclarativeForm {
    const copy: Record<string, unknown> = { ...form };

    for (const key of INTERNAL_FORM_METADATA_KEYS) {
      delete copy[key];
    }

    return copy as IDeclarativeForm;
  }

  public toYamlDefinition(form: IInternalForm): string {
    return serialize(this.toDefinition(form));
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
