'use client';
import { useState } from 'react';

export function McpEndpoint(): React.JSX.Element {
  const [message, setMessage] = useState('');

  async function copyEndpoint(): Promise<void> {
    try {
      await navigator.clipboard.writeText('https://frms.dev/mcp');
      setMessage('Copied server URL');
    } catch {
      setMessage('Select and copy the URL above.');
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold" htmlFor="mcp-endpoint">
        MCP server URL
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id="mcp-endpoint"
          className="min-w-0 flex-1 rounded-md border-2 border-ink bg-white p-3 font-mono text-sm"
          readOnly
          value="https://frms.dev/mcp"
        />
        <button
          className="rounded-md border-2 border-ink bg-brand-yellow px-4 py-2 font-semibold shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2"
          type="button"
          onClick={copyEndpoint}
        >
          Copy URL
        </button>
      </div>
      <p className="min-h-5 text-sm" role="status">
        {message}
      </p>
    </div>
  );
}
