import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          <SelectValue placeholder={t("filters.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
          <SelectItem value="Under Construction">{t("filters.underConstruction")}</SelectItem>
          <SelectItem value="Ready">{t("filters.ready")}</SelectItem>
          <SelectItem value="Off Plan">{t("filters.offPlan")}</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          placeholder={t("filters.minPrice")}
          value={filters.minPrice}
          onChange={(e) => update("minPrice", e.target.value)}
          className="w-[100px] h-9 text-xs"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="number"
          placeholder={t("filters.maxPrice")}
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
