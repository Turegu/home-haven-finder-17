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
      const { data: rows } = await supabase.rpc("get_service_area_translations", {
        p_areas: parts,
      });

      const translationMap = new Map<string, string>();
      (rows ?? []).forEach((row: any) => {
        if (row.original && row.translated) {
          translationMap.set(row.original, row.translated);
        }
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