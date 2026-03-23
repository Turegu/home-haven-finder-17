import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Syncs the document dir and lang attributes with the current i18n language.
 */
export function useDirection() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return i18n.language === 'ar' ? 'rtl' : 'ltr';
}
