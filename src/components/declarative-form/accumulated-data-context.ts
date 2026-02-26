import { createContext } from "react";
import type { FieldValues } from "react-hook-form";

export const AccumulatedDataContext = createContext<FieldValues>({});
