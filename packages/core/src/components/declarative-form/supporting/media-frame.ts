import { cva } from 'class-variance-authority';

/**
 * The dashed capture frame shared by the media fields (file upload, camera,
 * signature, geolocation). Every one of them renders the same panel in several
 * states, so the class list lives here once.
 *
 * A variant builder rather than a component: the fields wrap it around
 * genuinely different elements — a `button`, a `div role="button"`, a plain
 * `div` — and their focus treatment differs, so only the surface is shared.
 */
export const mediaFrame = cva('rounded-md border border-dashed transition-colors', {
  variants: {
    tone: {
      default: 'border-border bg-muted/40',
      active: 'border-ring bg-muted/60',
      error: 'border-destructive/60 bg-destructive/10',
    },
    height: {
      sm: 'min-h-[120px]',
      md: 'min-h-[160px]',
      auto: '',
    },
    layout: {
      /** Centred column, for a call to action or a status message. */
      stack: 'flex flex-col items-center justify-center gap-2 p-6',
      /** Holds media that should be clipped to the frame. */
      clip: 'overflow-hidden',
      /** Surface only; the field lays out its own contents. */
      plain: '',
    },
    interactive: {
      true: 'cursor-pointer hover:border-ring/60 hover:bg-muted/50',
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
