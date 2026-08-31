'use client';

import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

/** The "discard what I captured" button shared by signature and geolocation. */
export function ClearButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
        'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted',
        'transition-colors',
      )}
    >
      <X className="h-4 w-4" aria-hidden="true" />
      {props.label}
    </button>
  );
}
