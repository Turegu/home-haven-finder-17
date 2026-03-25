import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from "react-i18next";

const BackToTop = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all active:scale-95"
      aria-label={t("common.backToTop")}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default BackToTop;
