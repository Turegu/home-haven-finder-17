import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export function useLocalizedLanguages(languages: string[] | null | undefined): string[] {
  const { t, i18n } = useTranslation();

  return useMemo(
    () => (languages ?? []).map((lang) => t(`languageNames.${lang}`, lang)),
    [languages, t, i18n.language]
  );
}

export function useLocalizedServiceAreas(serviceAreas: string[] | null | undefined): string[] {
  const { i18n } = useTranslation();
  const [localizedAreas, setLocalizedAreas] = useState<string[]>(serviceAreas ?? []);

  useEffect(() => {
    const areas = serviceAreas ?? [];

    if (!i18n.language.startsWith("ar") || areas.length === 0) {
      setLocalizedAreas(areas);
      return;
    }

    const parts = Array.from(
      new Set(
        areas
          .flatMap((area) => area.split(" - "))
          .map((part) => part.trim())
          .filter(Boolean)
      )
    );

    if (parts.length === 0) {
      setLocalizedAreas(areas);
      return;
    }

    let cancelled = false;

    const localize = async () => {
      const [provincesRes, districtsRes, neighborhoodsRes] = await Promise.all([
        supabase
          .from("locations")
          .select("province, province_ar")
          .eq("status", "active")
          .in("province", parts),
        supabase
          .from("locations")
          .select("district, district_ar")
          .eq("status", "active")
          .in("district", parts),
        supabase
          .from("locations")
          .select("neighborhood, neighborhood_ar")
          .eq("status", "active")
          .in("neighborhood", parts),
      ]);

      const translationMap = new Map<string, string>();

      (provincesRes.data ?? []).forEach((row) => {
        if (row.province && row.province_ar) translationMap.set(row.province, row.province_ar);
      });

      (districtsRes.data ?? []).forEach((row) => {
        if (row.district && row.district_ar) translationMap.set(row.district, row.district_ar);
      });

      (neighborhoodsRes.data ?? []).forEach((row) => {
        if (row.neighborhood && row.neighborhood_ar) translationMap.set(row.neighborhood, row.neighborhood_ar);
      });

      const next = areas.map((area) =>
        area
          .split(" - ")
          .map((part) => {
            const trimmed = part.trim();
            return translationMap.get(trimmed) || trimmed;
          })
          .join(" - ")
      );

      if (!cancelled) setLocalizedAreas(next);
    };

    localize();

    return () => {
      cancelled = true;
    };
  }, [serviceAreas, i18n.language]);

  return localizedAreas;
}