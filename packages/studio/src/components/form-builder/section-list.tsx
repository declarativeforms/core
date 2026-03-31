import { CheckCircle2, Plus } from "lucide-react";

import type { IDeclarativeFormSection } from "@/lib/declarative-form-types";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

import { BuilderPane, BuilderPaneEmptyState } from "./panel-shell";
import { getSectionDisplayTitle } from "./shared";

type SectionListProps = {
  sections: IDeclarativeFormSection[];
  activeSectionIndex: number | null;
  isCompletionSelected: boolean;
  onSelectSection: (index: number) => void;
  onUpdateSectionTitle: (index: number, title: string) => void;
  onAddSection: () => void;
  onSelectCompletion: () => void;
};

export function SectionList({
  sections,
  activeSectionIndex,
  isCompletionSelected,
  onSelectSection,
  onUpdateSectionTitle,
  onAddSection,
  onSelectCompletion,
}: SectionListProps) {
  return (
    <BuilderPane
      title="Sections"
      footer={
        <div className="space-y-2">
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              isCompletionSelected && "bg-accent text-accent-foreground",
            )}
            onClick={onSelectCompletion}
          >
            <CheckCircle2 className="size-4 text-muted-foreground" />
            Completion
          </button>
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
            <div
              key={section.id ?? `section-${index}`}
              className={cn(
                "rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground",
                activeSectionIndex === index &&
                  "bg-accent text-accent-foreground",
              )}
            >
              <Input
                value={typeof section.title === "string" ? section.title : ""}
                placeholder="Untitled Section"
                onFocus={() => onSelectSection(index)}
                onClick={() => onSelectSection(index)}
                onChange={(event) =>
                  onUpdateSectionTitle(index, event.target.value)
                }
                className="h-auto border-transparent bg-transparent px-0 py-0 text-sm font-medium shadow-none focus-visible:border-transparent focus-visible:ring-0"
                aria-label={`Section ${index + 1} title`}
              />
              {!(typeof section.title === "string" && section.title.trim()) && (
                <p className="pointer-events-none mt-1 text-xs text-muted-foreground">
                  {getSectionDisplayTitle(section.title)}
                </p>
              )}
            </div>
          ))
        )}
    </BuilderPane>
  );
}
