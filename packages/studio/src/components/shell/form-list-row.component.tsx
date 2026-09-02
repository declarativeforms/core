import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { ApiFormSummary } from '@/lib/api.types';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { formatAbsolute } from '@/lib/time';

export function FormListRow(props: {
  form: ApiFormSummary;
  isActive: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-1 rounded-md pr-1 ${
        props.isActive ? 'bg-muted' : 'hover:bg-muted/60'
      }`}
    >
      <button
        aria-current={props.isActive ? 'page' : undefined}
        className="min-w-0 flex-1 px-2 py-2 text-left text-sm"
        onClick={props.onSelect}
        title={`Updated ${formatAbsolute(props.form.updated_at)}`}
        type="button"
      >
        <span className="block truncate">{props.form.name}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Actions for ${props.form.name}`}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={props.onRename}>
            <Pencil className="size-4" />
            Rename
          </DropdownMenuItem>
          {props.isAdmin ? (
            <DropdownMenuItem onSelect={props.onDelete} variant="destructive">
              <Trash2 className="size-4" />
              Delete form
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
