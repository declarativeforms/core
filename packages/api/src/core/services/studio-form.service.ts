import { faker } from '@faker-js/faker';
import type { IDeclarativeForm } from '@declarativeforms/types';
import type { StudioFormRepository } from '../repositories';
import type { FormService } from './form.service';

const STUDIO_FORM_PREFIX = 'b';

export class StudioFormService {
  constructor(
    private studioFormRepository: StudioFormRepository,
    private formService: FormService,
  ) {}

  public async create(form: IDeclarativeForm): Promise<IDeclarativeForm> {
    const now = new Date().toISOString();

    const id = `${STUDIO_FORM_PREFIX}${faker.string.alphanumeric({
      casing: 'lower',
      length: 8,
    })}`;

    const nextForm: IDeclarativeForm = {
      ...form,
      id,
      created_at: now,
      updated_at: now,
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

  public async list(): Promise<Array<IDeclarativeForm>> {
    return this.studioFormRepository.findAll();
  }

  public async update(
    id: string,
    form: IDeclarativeForm,
  ): Promise<IDeclarativeForm | null> {
    if (!id.startsWith(STUDIO_FORM_PREFIX)) {
      return null;
    }

    const existing = await this.formService.findById(id);

    if (!existing) {
      return null;
    }

    const nextForm: IDeclarativeForm = {
      ...form,
      id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };

    await this.studioFormRepository.update(id, nextForm);

    return nextForm;
  }
}
