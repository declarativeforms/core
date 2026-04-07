import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components";
import type { IDeclarativeFormField } from "@declarativeforms/types";

export function SectionField({
  field,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  field: IDeclarativeFormField;
  onChange: (field: IDeclarativeFormField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Item
      variant="outline"
      className={isExpanded ? "border-foreground/15 bg-muted/5" : ""}
    >
      <ItemHeader>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none transition-colors hover:bg-accent/30 focus-visible:bg-accent/30"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
        >
          <ItemContent>
            <ItemTitle>{field.label as any}</ItemTitle>
            <ItemDescription>
              {field.type as any}
              {field.id ? ` • ${field.id}` : ""}
            </ItemDescription>
          </ItemContent>
        </button>

        <ItemActions>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded((current) => !current)}
          >
            <ChevronDown
              className={
                isExpanded
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </Button>
        </ItemActions>
      </ItemHeader>

      {isExpanded ? (
        <div className="basis-full border-t border-border pt-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Field ID</FieldLabel>
              <Input
                value={field.id ?? ""}
                onChange={(event) =>
                  onChange({
                    ...field,
                    id: event.target.value || undefined,
                  })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Field Type</FieldLabel>
              <Input value={field.type} disabled />
            </Field>

            <Field>
              <FieldLabel>Label</FieldLabel>
              <Input
                value={field.label as any}
                onChange={(event) =>
                  onChange({
                    ...field,
                    label: event.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Placeholder</FieldLabel>
              <Input
                value={field.placeholder as any}
                onChange={(event) =>
                  onChange({
                    ...field,
                    placeholder: event.target.value,
                  })
                }
              />
            </Field>
          </FieldGroup>
        </div>
      ) : null}
    </Item>
  );
}
