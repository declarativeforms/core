import { GitBranch } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

export function BranchSelector(props: {
  branches: Array<string>;
  branch: string;
  onSelect: (branch: string) => void;
}) {
  return (
    <Select onValueChange={props.onSelect} value={props.branch}>
      <SelectTrigger
        aria-label="Branch"
        className="w-[11rem] shrink-0"
        size="sm"
      >
        <GitBranch className="size-4 shrink-0 opacity-70" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" position="popper">
        {props.branches.map((branch) => (
          <SelectItem key={branch} value={branch}>
            {branch}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
