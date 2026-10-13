import {
  compile,
  resolve,
  validateField,
  type IResolvedFormField,
} from '@declarativeforms/engine';
import type { OpenAiGateway } from '../gateways/openai';
import type { IAdaptiveTurn } from '../types/adaptive';
import type { FormService } from './form.service';
import {
  isAdaptiveAssessmentComplete,
  assertAdaptiveConfiguration,
  parseAdaptiveFields,
} from './adaptive-validation';

export class AdaptiveService {
  constructor(
    private formService: FormService,
    private openAiGateway: OpenAiGateway,
  ) {}

  public async assess(
    formId: string,
    sectionId: string,
    conversation: {
      locale: string;
      data: Record<string, unknown>;
      history: Array<IAdaptiveTurn>;
    },
  ): Promise<{
    fields: Array<IResolvedFormField>;
    outputs?: Record<string, unknown>;
  } | null> {
    const form = await this.formService.findById(formId);

    if (!form) {
      return null;
    }

    const resolved = resolve(form, conversation.locale);
    const section = resolved.sections?.find(
      (candidate) => candidate.id === sectionId,
    );

    if (!section?.adaptive) {
      return null;
    }

    assertAdaptiveConfiguration(section.adaptive);

    if (
      (form.start_date && new Date(form.start_date) > new Date()) ||
      (form.end_date && new Date(form.end_date) < new Date())
    ) {
      throw new Error('Form is not accepting responses');
    }

    for (const turn of conversation.history) {
      const fields = parseAdaptiveFields(JSON.stringify(turn.fields));
      const fieldIds = new Set(fields.map((field) => field.id));
      const compiled = compile(
        { sections: [{ id: sectionId, fields }] },
        turn.answers,
      );

      if (
        Object.keys(turn.answers).some((key) => !fieldIds.has(key)) ||
        compiled.sections[0].fields.some((field) =>
          validateField(field, turn.answers[field.id], turn.answers),
        )
      ) {
        throw new Error('Invalid adaptive answers');
      }
    }

    const assessment = await this.openAiGateway.assess(
      resolved,
      section.adaptive,
      conversation.data,
      conversation.locale,
      conversation.history,
    );
    const outputs: unknown = JSON.parse(assessment.outputs_json);
    const fields = parseAdaptiveFields(assessment.fields_json);

    if (
      !outputs ||
      typeof outputs !== 'object' ||
      Array.isArray(outputs) ||
      assessment.objectives.length !== section.adaptive.objectives.length
    ) {
      throw new Error('Invalid adaptive assessment');
    }

    const candidateOutputs = outputs as Record<string, unknown>;

    if (
      Object.keys(candidateOutputs).some(
        (key) => !Object.hasOwn(section.adaptive!.properties, key),
      )
    ) {
      throw new Error('Adaptive assessment contains undeclared outputs');
    }

    if (
      isAdaptiveAssessmentComplete(section.adaptive, {
        objectives: assessment.objectives,
        outputs: candidateOutputs,
      })
    ) {
      return { fields: [], outputs: candidateOutputs };
    }

    if (!fields.some((field) => field.type !== 'text_block')) {
      throw new Error(
        'Adaptive assessment needs valid outputs or follow-up questions',
      );
    }

    return { fields };
  }
}
