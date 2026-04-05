import { Layers, Plus } from "lucide-react";

import type { IDeclarativeFormSection } from "@/lib/declarative-form-types";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

import { BuilderPane, BuilderPaneEmptyState } from "./panel-shell";
import { getSectionDisplayTitle } from "./shared";

type SectionListProps = {
  sections: IDeclarativeFormSection[];
  activeSectionIndex: number | null;
  onSelectSection: (index: number) => void;
  onAddSection: () => void;
};

export function SectionList({
  sections,
  activeSectionIndex,
  onSelectSection,
  onAddSection,
}: SectionListProps) {
  return (
    <BuilderPane
      title="Sections"
      footer={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onAddSection}
        >
          <Plus />
          Add Section
        </Button>
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
                "h-auto w-full justify-start gap-2 rounded-none border-l-2 border-l-transparent px-3 py-2",
                activeSectionIndex === index
                  ? "border-l-foreground bg-accent/40 text-foreground"
                  : "hover:bg-accent/30",
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
