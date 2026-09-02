import { Check, Share2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { isDraftBranch } from '@/lib/preview-url';

export function ShareAction(props: { branch: string; formUrl: string | null }) {
  const clipboard = useCopyToClipboard();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        disabled={props.formUrl === null}
        onClick={() => {
          if (props.formUrl) {
            clipboard.copy(props.formUrl);
          }
        }}
        size="sm"
        variant="outline"
      >
        {clipboard.isCopied ? <Check /> : <Share2 />}
        {clipboard.isCopied ? 'Link copied' : 'Share'}
      </Button>
      <span aria-live="polite" className="sr-only">
        {clipboard.isCopied
          ? isDraftBranch(props.branch)
            ? `Draft branch link copied. It points at the ${props.branch} branch, not main.`
            : 'Link copied. Anyone with this link can fill in the form.'
          : ''}
      </span>
      {clipboard.hasFailed && props.formUrl ? (
        <Input
          className="w-72"
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          readOnly
          value={props.formUrl}
        />
      ) : null}
    </div>
  );
}
