import { faker } from '@faker-js/faker';
import type { IStudioForm } from '@declarativeforms/types';
import type { StudioFormRepository } from '../repositories';

const STUDIO_FORM_PREFIX = 'b';

export class StudioFormService {
  constructor(
    private studioFormRepository: StudioFormRepository,
  ) {}

  public async create(
    form: IStudioForm,
    creatorEmail: string,
  ): Promise<IStudioForm> {
    const now = new Date().toISOString();

    const id = `${STUDIO_FORM_PREFIX}${faker.string.alphanumeric({
      casing: 'lower',
      length: 8,
    })}`;

    const nextForm: IStudioForm = {
      ...form,
      id,
      created_at: now,
      updated_at: now,
      collaborators: [creatorEmail],
    };

    await this.studioFormRepository.insert(nextForm);

    return nextForm;
  }

  public async delete(id: string): Promise<boolean> {
    if (!id.startsWith(STUDIO_FORM_PREFIX)) {
      return false;
    }

    return this.studioFormRepository.delete(id);
  }

  public async list(email: string): Promise<Array<IStudioForm>> {
    return this.studioFormRepository.findAllByCollaborator(email);
  }

  public async update(
    id: string,
    form: IStudioForm,
  ): Promise<IStudioForm | null> {
    if (!id.startsWith(STUDIO_FORM_PREFIX)) {
      return null;
    }

    const existing = await this.studioFormRepository.find(id);

    if (!existing) {
      return null;
    }

    const nextForm: IStudioForm = {
      ...form,
      id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
      collaborators: existing.collaborators,
    };

    await this.studioFormRepository.update(id, nextForm);

    return nextForm;
  }
}
