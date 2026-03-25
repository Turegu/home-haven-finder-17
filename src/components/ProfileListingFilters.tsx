import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useFilterOptions } from "@/hooks/useFilterOptions";

interface ProfileListingFiltersProps {
  onFiltersChange: (filters: ProfileFilters) => void;
}

export interface ProfileFilters {
  purpose: string;
  propertyType: string;
  rooms: string;
  minPrice: string;
  maxPrice: string;
}

const INITIAL_FILTERS: ProfileFilters = {
  purpose: "all",
  propertyType: "all",
  rooms: "all",
  minPrice: "",
  maxPrice: "",
};

const ProfileListingFilters = ({ onFiltersChange }: ProfileListingFiltersProps) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ProfileFilters>(INITIAL_FILTERS);
  const { options } = useFilterOptions("property");

  const propertyTypes = options["property_type"] || [];
  const roomOptions = options["rooms"] || [];

  const update = (key: keyof ProfileFilters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFiltersChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Purpose */}
      <Select value={filters.purpose} onValueChange={(v) => update("purpose", v)}>
        <SelectTrigger className="w-[130px] h-9 text-xs">
          <SelectValue placeholder={t("filters.purpose")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allListings")}</SelectItem>
          <SelectItem value="buy">{t("property.forSale")}</SelectItem>
          <SelectItem value="rent">{t("property.forRent")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Property Type */}
      <Select value={filters.propertyType} onValueChange={(v) => update("propertyType", v)}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {propertyTypes.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Rooms */}
      <Select value={filters.rooms} onValueChange={(v) => update("rooms", v)}>
        <SelectTrigger className="w-[120px] h-9 text-xs">
          <SelectValue placeholder="Rooms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Rooms</SelectItem>
          {roomOptions.slice(0, 12).map((r) => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Price range */}
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

      {/* Search icon hint */}
      <Search className="h-4 w-4 text-muted-foreground ml-1" />
    </div>
  );
};

export default ProfileListingFilters;
