import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface ProjectFilters {
  status: string;
  minPrice: string;
  maxPrice: string;
}

const INITIAL: ProjectFilters = { status: "all", minPrice: "", maxPrice: "" };

const ProfileProjectFilters = ({ onFiltersChange }: { onFiltersChange: (f: ProjectFilters) => void }) => {
  const [filters, setFilters] = useState<ProjectFilters>(INITIAL);

  const update = (key: keyof ProjectFilters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFiltersChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Select value={filters.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Under Construction">Under Construction</SelectItem>
          <SelectItem value="Ready">Ready</SelectItem>
          <SelectItem value="Off Plan">Off Plan</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => update("minPrice", e.target.value)}
          className="w-[100px] h-9 text-xs"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => update("maxPrice", e.target.value)}
          className="w-[100px] h-9 text-xs"
        />
      </div>

      <Search className="h-4 w-4 text-muted-foreground ml-1" />
    </div>
  );
};

export default ProfileProjectFilters;
