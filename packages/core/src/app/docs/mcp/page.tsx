import type { Metadata } from 'next';
import { McpDocumentationPage } from '@/views/mcp-documentation.page';

const DESCRIPTION =
  'Connect ChatGPT web, Codex CLI, Claude web, or Claude Code to Declarative Forms. Learn how to authenticate, create forms, preview edits, and keep YAML in GitHub.';

export const metadata: Metadata = {
  alternates: { canonical: '/docs/mcp' },
  title: 'MCP connection guide',
  description: DESCRIPTION,
  openGraph: {
    title: 'MCP connection guide — Declarative Forms',
    description: DESCRIPTION,
    url: '/docs/mcp',
  },
  twitter: {
    title: 'MCP connection guide — Declarative Forms',
    description: DESCRIPTION,
  },
};

export default function Page(): React.JSX.Element {
  return <McpDocumentationPage />;
}
