import { Input } from "@/components/ui";
import type { DeclarativeFieldComponentProps } from "../renderer/field-contract";

export function HiddenField({
  controllerField,
}: DeclarativeFieldComponentProps) {
  return <Input {...controllerField} type="hidden" />;
}
