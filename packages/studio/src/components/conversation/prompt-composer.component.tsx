import { Loader2, SendHorizontal } from 'lucide-react';
import { useRef } from 'react';
import { Button, Textarea } from '@/components/ui';

const MAX_PROMPT_CHARS = 4000;

export function PromptComposer(props: {
  value: string;
  placeholder: string;
  submitLabel: string;
  isBusy: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (props.isBusy || !props.value.trim()) {
      return;
    }

    props.onSubmit();
  };

  return (
    <div className="relative rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
      <Textarea
        aria-busy={props.isBusy}
        aria-disabled={props.isBusy}
        className="max-h-56 min-h-[4.5rem] resize-none border-0 pb-11 focus-visible:ring-0 dark:bg-transparent"
        maxLength={MAX_PROMPT_CHARS}
        onChange={(event) => {
          props.onValueChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder}
        readOnly={props.isBusy}
        ref={areaRef}
        value={props.value}
      />
      <Button
        aria-label={props.submitLabel}
        className="absolute right-2 bottom-2"
        disabled={props.isBusy || !props.value.trim()}
        onClick={props.onSubmit}
        size="icon"
      >
        {props.isBusy ? (
          <Loader2 className="animate-spin" />
        ) : (
          <SendHorizontal />
        )}
      </Button>
    </div>
  );
}
