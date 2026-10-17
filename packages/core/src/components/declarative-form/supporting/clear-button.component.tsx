'use client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';

export function ClearButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <X className="h-4 w-4" aria-hidden="true" />
      {props.label}
    </Button>
  );
}
