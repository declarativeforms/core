import {
  Code2,
  ExternalLink,
  GitBranchPlus,
  Menu,
  MoreHorizontal,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { ApiFormSummary } from '@/lib/api.types';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { BranchSelector } from '@/components/shell/branch-selector.component';
import { ShareAction } from '@/components/forms/share-action.component';
import { isDraftBranch } from '@/lib/preview-url';

export function FormHeader(props: {
  form: ApiFormSummary;
  branch: string;
  isAdmin: boolean;
  formUrl: string | null;
  isSchemaOpen: boolean;
  onSelectBranch: (branch: string) => void;
  onRename: () => void;
  onNewBranch: () => void;
  onPublish: () => void;
  onDeleteBranch: () => void;
  onDeleteForm: () => void;
  onToggleSchema: () => void;
  onOpenSidebar: () => void;
}) {
  const handlePreview = (): void => {
    if (!props.formUrl) {
      return;
    }

    window.open(props.formUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
      <Button
        aria-label="Open menu"
        className="md:hidden"
        onClick={props.onOpenSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <Menu className="size-4" />
      </Button>
      <button
        className="min-w-0 truncate rounded px-1 py-0.5 text-sm font-medium hover:bg-muted"
        onClick={props.onRename}
        title="Rename this form in Studio"
        type="button"
      >
        {props.form.name}
      </button>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        Revision {props.form.revision}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <BranchSelector
          branch={props.branch}
          branches={props.form.branches}
          onSelect={props.onSelectBranch}
        />
        {isDraftBranch(props.branch) ? (
          <Badge variant="secondary">Draft branch</Badge>
        ) : null}
        <div className="hidden items-center gap-2 lg:flex">
          <Button onClick={props.onNewBranch} size="sm" variant="outline">
            <GitBranchPlus className="size-4" />
            New branch
          </Button>
          {isDraftBranch(props.branch) ? (
            <Button onClick={props.onPublish} size="sm">
              <UploadCloud className="size-4" />
              Publish
            </Button>
          ) : null}
          <Button
            disabled={props.formUrl === null}
            onClick={handlePreview}
            size="sm"
            variant="outline"
          >
            <ExternalLink className="size-4" />
            Preview
          </Button>
          <ShareAction branch={props.branch} formUrl={props.formUrl} />
          <Button
            onClick={props.onToggleSchema}
            size="sm"
            variant={props.isSchemaOpen ? 'secondary' : 'outline'}
          >
            <Code2 className="size-4" />
            Schema
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="More actions" size="icon-sm" variant="ghost">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="lg:hidden"
              onSelect={props.onNewBranch}
            >
              <GitBranchPlus className="size-4" />
              New branch
            </DropdownMenuItem>
            {isDraftBranch(props.branch) ? (
              <DropdownMenuItem
                className="lg:hidden"
                onSelect={props.onPublish}
              >
                <UploadCloud className="size-4" />
                Publish to main
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="lg:hidden"
              disabled={props.formUrl === null}
              onSelect={handlePreview}
            >
              <ExternalLink className="size-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              className="lg:hidden"
              onSelect={props.onToggleSchema}
            >
              <Code2 className="size-4" />
              Schema
            </DropdownMenuItem>
            <DropdownMenuSeparator className="lg:hidden" />
            {isDraftBranch(props.branch) ? (
              <DropdownMenuItem
                onSelect={props.onDeleteBranch}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete branch
              </DropdownMenuItem>
            ) : null}
            {props.isAdmin ? (
              <DropdownMenuItem
                onSelect={props.onDeleteForm}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete form
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
