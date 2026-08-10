import type { IRenderableSection } from '@declarativeforms/engine';

export type FormEffect =
  | { type: 'submit'; data: Record<string, unknown>; isPartial: boolean }
  | { type: 'complete'; data: Record<string, unknown> }
  | { type: 'redirect'; url: string };

export type SubmitResult = FormEffect & {
  activeSectionId: string;
  data: Record<string, unknown>;
};

export type UseDeclarativeForm = {
  section: IRenderableSection | undefined;
  data: Record<string, unknown>;
  activeSectionId: string;
  submitSection: (sectionData: Record<string, unknown>) => SubmitResult;
  goBack: () => void;
};
