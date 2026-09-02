import { Check, Copy } from 'lucide-react';
import { Button, Collapsible, CollapsibleContent } from '@/components/ui';
import { ErrorState, SkeletonRows } from '@/components/feedback';
import { useBranchYaml } from '@/hooks/use-branch-yaml';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { describeError } from '@/lib/error-messages';

export function SchemaPanel(props: {
  organizationId: string;
  formId: string;
  branch: string;
  revision: number;
  isOpen: boolean;
}) {
  const yamlQuery = useBranchYaml(
    props.organizationId,
    props.formId,
    props.branch,
    props.revision,
    props.isOpen,
  );
  const clipboard = useCopyToClipboard();

  return (
    <Collapsible className="border-t border-border" open={props.isOpen}>
      <CollapsibleContent>
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Current schema on {props.branch} · Revision {props.revision} ·
            read-only
          </p>
          <Button
            disabled={!yamlQuery.data}
            onClick={() => {
              if (yamlQuery.data) {
                clipboard.copy(yamlQuery.data.yaml);
              }
            }}
            size="sm"
            variant="ghost"
          >
            {clipboard.isCopied ? <Check /> : <Copy />}
            {clipboard.isCopied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <div className="max-h-72 overflow-auto px-4 py-3">
          {yamlQuery.isPending ? <SkeletonRows count={5} /> : null}
          {yamlQuery.isError ? (
            <ErrorState
              message={describeError(yamlQuery.error)}
              onRetry={() => {
                void yamlQuery.refetch();
              }}
            />
          ) : null}
          {yamlQuery.data ? (
            <pre className="overflow-x-auto font-mono text-xs whitespace-pre text-foreground">
              {yamlQuery.data.yaml}
            </pre>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
