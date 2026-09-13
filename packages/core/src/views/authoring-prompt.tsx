'use client';
import { useState } from 'react';

export function AuthoringPrompt(): React.JSX.Element {
  const [status, setStatus] = useState('');
  const prompt =
    'Read https://frms.dev/docs and https://frms.dev/schema.json. Create an RSVP form for a team lunch in this repository at forms/lunch-rsvp.yaml. Collect name, email, attendance, and optional dietary requirements, and include a completion message. If you cannot edit files, return the complete YAML. Validate the YAML against the JSON Schema using available tooling, check navigation and expressions, and report what you verified or could not verify. Do not commit or push. Report the file path and the expected Declarative Forms URL if the GitHub repository is known.';

  async function copyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus('Prompt copied.');
    } catch {
      setStatus('Could not copy. Select the prompt text and copy it manually.');
    }
  }

  return (
    <div className="space-y-3">
      <p className="select-text rounded-xl border border-neutral-200 bg-white p-5 text-sm leading-relaxed">
        {prompt}
      </p>
      <button
        type="button"
        onClick={copyPrompt}
        className="rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-purple"
      >
        Copy prompt
      </button>
      <p role="status" className="text-sm text-neutral-600">
        {status}
      </p>
    </div>
  );
}
