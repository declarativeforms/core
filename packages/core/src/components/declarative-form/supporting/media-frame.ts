import { cva } from 'class-variance-authority';

export const mediaFrame = cva('rounded-lg border transition-colors', {
  variants: {
    tone: {
      default: 'border-border bg-background',
      active: 'border-ring bg-accent',
      error: 'border-destructive/60 bg-destructive/10',
    },
    height: {
      sm: 'min-h-[120px]',
      md: 'min-h-[160px]',
      auto: '',
    },
    layout: {
      stack: 'flex flex-col items-center justify-center gap-2 p-6',
      clip: 'overflow-hidden',
      plain: '',
    },
    interactive: {
      true: 'cursor-pointer hover:border-ring hover:bg-muted',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'default',
    height: 'auto',
    layout: 'stack',
    interactive: false,
  },
});
