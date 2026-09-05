import type {
  IRenderableSection,
  IRenderableStart,
} from '@declarativeforms/engine';

export type FormEffect =
  | { type: 'submit'; data: Record<string, unknown>; isPartial: boolean }
  | { type: 'complete'; data: Record<string, unknown> }
  | { type: 'redirect'; url: string };

export type SubmitResult = FormEffect & {
  activeSectionId: string;
  data: Record<string, unknown>;
};

export type UseDeclarativeForm = {
  start: IRenderableStart | undefined;
  section: IRenderableSection | undefined;
  data: Record<string, unknown>;
  submitSection: (sectionData: Record<string, unknown>) => SubmitResult;
  goBack: () => string;
};
