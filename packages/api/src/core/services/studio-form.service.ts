import type { IStudioForm } from '@declarativeforms/types';
import { faker } from '@faker-js/faker';
import type { StudioFormRepository } from '../repositories';

const STUDIO_FORM_PREFIX = 'b';

export class StudioFormService {
  constructor(private studioFormRepository: StudioFormRepository) {}

  public async create(
    studioForm: IStudioForm,
    collaborator: string,
  ): Promise<IStudioForm> {
    const now = new Date().toISOString();

    const id = `${STUDIO_FORM_PREFIX}${faker.string.alphanumeric({
      casing: 'lower',
      length: 8,
    })}`;

    return await this.studioFormRepository.insert({
      ...studioForm,
      id,
      collaborators: [collaborator],
      created_at: now,
      updated_at: now,
    });
  }

  public async delete(id: string): Promise<void> {
    if (!id.startsWith(STUDIO_FORM_PREFIX)) {
      return;
    }

    await this.studioFormRepository.delete(id);
  }

  public async list(collaborator: string): Promise<Array<IStudioForm>> {
    return this.studioFormRepository.findAllByCollaborator(collaborator);
  }

  public async update(
    id: string,
    studioForm: IStudioForm,
  ): Promise<IStudioForm | null> {
    if (!id.startsWith(STUDIO_FORM_PREFIX)) {
      return null;
    }

    const existing = await this.studioFormRepository.find(id);

    if (!existing) {
      return null;
    }

    return await this.studioFormRepository.update(id, {
      ...studioForm,
      id,
      collaborators: existing.collaborators,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    });
  }
}
