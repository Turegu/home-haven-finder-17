import { useEffect, useMemo, useRef, useState } from "react";
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

  const cacheRef = useRef<Map<string, string>>(new Map());

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

    // Check if all parts are already cached
    const allCached = parts.every((p) => cacheRef.current.has(p));
    if (allCached) {
      setLocalizedAreas(
        areas.map((area) =>
          area
            .split(" - ")
            .map((p) => cacheRef.current.get(p.trim()) || p.trim())
            .join(" - ")
        )
      );
      return;
    }

    let cancelled = false;

    const localize = async () => {
      // Use unaccent matching to handle Turkish characters (İstanbul vs Istanbul)
      const conditions = parts.map((p) => `public.unaccent(lower('${p.replace(/'/g, "''")}'))`);
      const matchList = conditions.join(", ");

      const [provincesRes, districtsRes, neighborhoodsRes] = await Promise.all([
        supabase
          .from("locations")
          .select("province, province_ar")
          .eq("status", "active")
          .not("province_ar", "is", null),
        supabase
          .from("locations")
          .select("district, district_ar")
          .eq("status", "active")
          .not("district_ar", "is", null),
        supabase
          .from("locations")
          .select("neighborhood, neighborhood_ar")
          .eq("status", "active")
          .not("neighborhood_ar", "is", null),
      ]);

      const translationMap = new Map<string, string>();

      const normalize = (s: string) =>
        s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

      const partsNormalized = new Map(parts.map((p) => [normalize(p), p]));

      (provincesRes.data ?? []).forEach((row) => {
        if (row.province && row.province_ar) {
          const n = normalize(row.province);
          if (partsNormalized.has(n)) {
            translationMap.set(partsNormalized.get(n)!, row.province_ar);
          }
        }
      });

      (districtsRes.data ?? []).forEach((row) => {
        if (row.district && row.district_ar) {
          const n = normalize(row.district);
          if (partsNormalized.has(n)) {
            translationMap.set(partsNormalized.get(n)!, row.district_ar);
          }
        }
      });

      (neighborhoodsRes.data ?? []).forEach((row) => {
        if (row.neighborhood && row.neighborhood_ar) {
          const n = normalize(row.neighborhood);
          if (partsNormalized.has(n)) {
            translationMap.set(partsNormalized.get(n)!, row.neighborhood_ar);
          }
        }
      });

      // Update cache
      parts.forEach((p) => {
        cacheRef.current.set(p, translationMap.get(p) || p);
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