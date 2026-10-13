'use client';
import type { IResolvedFormField } from '@declarativeforms/engine';
import { buildApiUrl } from '@/lib/api';

export async function assessAdaptiveSection(
  formId: string,
  sectionId: string,
  conversation: {
    locale: string;
    data: Record<string, unknown>;
    history: Array<{
      fields: Array<IResolvedFormField>;
      answers: Record<string, unknown>;
    }>;
  },
  signal: AbortSignal,
): Promise<{
  fields: Array<IResolvedFormField>;
  outputs?: Record<string, unknown>;
}> {
  const response = await fetch(
    buildApiUrl(
      `forms/${encodeURIComponent(formId)}/sections/${encodeURIComponent(sectionId)}/adaptive`,
    ),
    {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversation),
    },
  );

  if (!response.ok) {
    throw new Error(`Adaptive assessment failed: ${response.status}`);
  }

  return response.json();
}
