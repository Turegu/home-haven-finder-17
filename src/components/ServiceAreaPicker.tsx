import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SearchableSelect from "@/components/ui/searchable-select";
import { Plus, X, MapPin } from "lucide-react";

interface NamePair { name: string; ar: string }

let provincesCache: NamePair[] | null = null;

interface ServiceAreaPickerProps {
  selected: string[];
  onChange: (areas: string[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
  onClearError?: () => void;
}

const ServiceAreaPicker = ({
  selected,
  onChange,
  label,
  required = false,
  error,
  onClearError,
}: ServiceAreaPickerProps) => {
  const { t, i18n } = useTranslation();
  const [provinces, setProvinces] = useState<NamePair[]>([]);
  const [districts, setDistricts] = useState<NamePair[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Load provinces once
  useEffect(() => {
    const load = async () => {
      if (provincesCache) { setProvinces(provincesCache); return; }
      const { data } = await supabase.rpc("get_distinct_provinces");
      if (data) { provincesCache = data as NamePair[]; setProvinces(data as NamePair[]); }
    };
    load();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvince) { setDistricts([]); return; }
    const load = async () => {
      const { data } = await supabase.rpc("get_distinct_districts", { p_province: selectedProvince });
      if (data) setDistricts(data as NamePair[]);
    };
    load();
    setSelectedDistrict("");
  }, [selectedProvince]);

  const getLocalizedName = useCallback((pair: NamePair) => {
    return i18n.language === "ar" && pair.ar ? pair.ar : pair.name;
  }, [i18n.language]);

  const provinceOptions = provinces.map(p => ({
    value: p.name,
    label: getLocalizedName(p),
  }));

  const districtOptions = districts.map(d => ({
    value: d.name,
    label: getLocalizedName(d),
  }));

  const handleAdd = () => {
    if (!selectedProvince) return;
    const area = selectedDistrict
      ? `${selectedProvince} - ${selectedDistrict}`
      : selectedProvince;
    if (!selected.includes(area)) {
      onChange([...selected, area]);
      onClearError?.();
    }
    setSelectedProvince("");
    setSelectedDistrict("");
  };

  const handleRemove = (area: string) => {
    onChange(selected.filter(a => a !== area));
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-foreground font-medium flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {label}{required ? " *" : ""}
        </Label>
      )}

      {/* Dropdowns row */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[160px] space-y-1">
          <span className="text-xs text-muted-foreground">{t("filters.province")}</span>
          <SearchableSelect
            value={selectedProvince}
            onValueChange={setSelectedProvince}
            options={provinceOptions}
            placeholder={t("filters.province")}
          />
        </div>
        <div className="flex-1 min-w-[160px] space-y-1">
          <span className="text-xs text-muted-foreground">{t("filters.district")}</span>
          <SearchableSelect
            value={selectedDistrict}
            onValueChange={setSelectedDistrict}
            options={districtOptions}
            placeholder={t("filters.district")}
            disabled={!selectedProvince}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={!selectedProvince}
          className="gap-1.5 h-9 border-primary/40 text-primary hover:bg-primary/10"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("common.add")}
        </Button>
      </div>

      {/* Selected areas as pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(area => (
            <Badge
              key={area}
              variant="secondary"
              className="gap-1.5 py-1 px-2.5 text-sm bg-primary/10 text-primary border-primary/20"
            >
              {area}
              <button
                type="button"
                onClick={() => handleRemove(area)}
                className="ml-0.5 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          {t("companyDashboard.noServiceAreas", "No service areas selected. Select a province and optionally a district, then click Add.")}
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default ServiceAreaPicker;
