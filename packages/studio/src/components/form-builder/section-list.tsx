import { CheckCircle2, Layers, Plus } from "lucide-react";

import type { IDeclarativeFormSection } from "@/lib/declarative-form-types";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

import { BuilderPane, BuilderPaneEmptyState } from "./panel-shell";
import { getSectionDisplayTitle } from "./shared";

type SectionListProps = {
  sections: IDeclarativeFormSection[];
  activeSectionIndex: number | null;
  isCompletionSelected: boolean;
  onSelectSection: (index: number) => void;
  onAddSection: () => void;
  onSelectCompletion: () => void;
};

export function SectionList({
  sections,
  activeSectionIndex,
  isCompletionSelected,
  onSelectSection,
  onAddSection,
  onSelectCompletion,
}: SectionListProps) {
  return (
    <BuilderPane
      title="Sections"
      footer={
        <div className="space-y-1">
          <Button
            type="button"
            variant={isCompletionSelected ? "secondary" : "ghost"}
            className={cn(
              "h-auto w-full justify-start gap-2 px-3 py-2",
              isCompletionSelected && "bg-accent text-accent-foreground",
            )}
            onClick={onSelectCompletion}
          >
            <CheckCircle2 className="size-4 text-muted-foreground" />
            Completion
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={onAddSection}
          >
            <Plus />
            Add Section
          </Button>
        </div>
      }
      bodyClassName="space-y-1"
    >
        {sections.length === 0 ? (
          <BuilderPaneEmptyState>
            No sections yet.
          </BuilderPaneEmptyState>
        ) : (
          sections.map((section, index) => (
            <Button
              type="button"
              variant="ghost"
              key={section.id ?? `section-${index}`}
              className={cn(
                "h-auto w-full justify-start gap-2 px-3 py-2",
                activeSectionIndex === index &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={() => onSelectSection(index)}
              aria-label={`Select section: ${getSectionDisplayTitle(section.title)}`}
            >
              <Layers className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {getSectionDisplayTitle(section.title)}
              </span>
            </Button>
          ))
        )}
    </BuilderPane>
  );
}
