import { randomBytes } from 'node:crypto';
import type { FormRepository } from '../repositories';
import type { ManagedForm } from '../types';
import { sanitizeFormDefinition } from '../utils';

const MANAGED_FORM_PREFIX = 'f';

export class ManagedFormService {
  constructor(private formRepository: FormRepository) {}

  public async create(definition: unknown): Promise<ManagedForm> {
    const now = new Date().toISOString();
    const id = `${MANAGED_FORM_PREFIX}${randomBytes(6).toString('hex')}`;

    return this.formRepository.insert({
      ...sanitizeFormDefinition(definition),
      id,
      created_at: now,
      updated_at: now,
    });
  }

  public async delete(id: string): Promise<boolean> {
    if (!id.startsWith(MANAGED_FORM_PREFIX)) {
      return false;
    }

    return this.formRepository.delete(id);
  }

  public async find(id: string): Promise<ManagedForm | null> {
    if (!id.startsWith(MANAGED_FORM_PREFIX)) {
      return null;
    }

    return this.formRepository.find(id);
  }

  public async list(): Promise<Array<ManagedForm>> {
    return this.formRepository.findAll();
  }

  public async update(
    id: string,
    definition: unknown,
  ): Promise<ManagedForm | null> {
    if (!id.startsWith(MANAGED_FORM_PREFIX)) {
      return null;
    }

    const existing = await this.formRepository.find(id);

    if (!existing) {
      return null;
    }

    const updated: ManagedForm = {
      ...sanitizeFormDefinition(definition),
      id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };

    return this.formRepository.update(id, updated);
  }
}
