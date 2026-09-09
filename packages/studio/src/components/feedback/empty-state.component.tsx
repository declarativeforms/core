export function EmptyState(props: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-6 text-center">
      <p className="text-sm font-medium text-foreground">{props.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{props.description}</p>
    </div>
  );
}
