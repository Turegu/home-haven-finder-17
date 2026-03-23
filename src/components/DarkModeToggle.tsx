import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className={`flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-1 rounded ${compact ? '' : 'p-2 rounded-full hover:bg-secondary'}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <Sun className={compact ? "h-3.5 w-3.5" : "h-5 w-5 text-foreground/70"} />
      ) : (
        <Moon className={compact ? "h-3.5 w-3.5" : "h-5 w-5 text-foreground/70"} />
      )}
      {compact && <span className="text-xs">{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
};

export default DarkModeToggle;
