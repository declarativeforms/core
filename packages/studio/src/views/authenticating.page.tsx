import { Loader2 } from 'lucide-react';

export function Authenticating(props: { label: string }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{props.label}</p>
    </main>
  );
}
