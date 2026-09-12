import { Check, Copy } from 'lucide-react';
import { Button, Collapsible, CollapsibleContent } from '@/components/ui';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import type { ApiBranchYaml } from '@/lib/api.types';

export function SchemaPanel(props: {
  branch: string;
  isOpen: boolean;
  yaml: ApiBranchYaml | null;
}) {
  const clipboard = useCopyToClipboard();

  return (
    <Collapsible className="border-t border-border" open={props.isOpen}>
      <CollapsibleContent>
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            YAML on {props.branch}
            {props.yaml ? ` · Revision ${props.yaml.revision}` : ''} · read-only
          </p>
          <Button
            disabled={!props.yaml}
            onClick={() => {
              if (props.yaml) {
                clipboard.copy(props.yaml.yaml);
              }
            }}
            size="sm"
            variant="ghost"
          >
            {clipboard.isCopied ? <Check /> : <Copy />}
            {clipboard.isCopied ? 'Copied' : 'Copy YAML'}
          </Button>
        </div>
        <p className="px-4 pt-3 text-xs leading-relaxed text-muted-foreground">
          Copy this YAML into a .yaml file in a public GitHub repository, then
          open its frms.dev URL. The repository-backed form has a separate URL;
          changes do not sync with Studio.{' '}
          <a
            className="font-medium text-foreground underline underline-offset-4"
            href="https://github.com/declarativeforms/core#create-your-first-form"
            target="_blank"
            rel="noreferrer"
          >
            Follow the Git quick start
          </a>
          .
        </p>
        <div className="max-h-72 overflow-auto px-4 py-3">
          {props.yaml ? (
            <pre className="overflow-x-auto font-mono text-xs whitespace-pre text-foreground">
              {props.yaml.yaml}
            </pre>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
