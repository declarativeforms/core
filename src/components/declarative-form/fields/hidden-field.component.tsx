import { Input } from "@/components/ui";
import type { DeclarativeFieldComponentProps } from "../field-contract";

export function HiddenField({
  controllerField,
}: DeclarativeFieldComponentProps) {
  return <Input {...controllerField} type="hidden" />;
}
