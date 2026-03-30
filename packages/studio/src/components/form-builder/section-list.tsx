import { Plus } from "lucide-react";

import type { IDeclarativeFormSection } from "@/lib/declarative-form-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { getSectionDisplayTitle } from "./shared";

type SectionListProps = {
  sections: IDeclarativeFormSection[];
  activeSectionIndex: number | null;
  onSelectSection: (index: number) => void;
  onUpdateSectionTitle: (index: number, title: string) => void;
  onAddSection: () => void;
};

export function SectionList({
  sections,
  activeSectionIndex,
  onSelectSection,
  onUpdateSectionTitle,
  onAddSection,
}: SectionListProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sections
        </h2>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground">
            No sections yet.
          </div>
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
      </div>

      <div className="border-t border-border p-3">
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
    </div>
  );
}
