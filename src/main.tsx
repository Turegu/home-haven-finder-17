import { initSentry } from "@/lib/sentry";

const hasSupabaseUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
const hasSupabaseKey = Boolean(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!hasSupabaseUrl || !hasSupabaseKey) {
  const missing = [
    !hasSupabaseUrl ? 'VITE_SUPABASE_URL' : null,
    !hasSupabaseKey ? 'VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)' : null,
  ].filter(Boolean);

  console.error(
    `Configuration warning: missing environment variable(s): ${missing.join(', ')}. App will still render, but backend features may fail.`
  );
}

initSentry();

// PWA: unregister service workers in preview/iframe contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  const unregisterSW = () =>
    navigator.serviceWorker?.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
  if (document.readyState === 'complete') {
    unregisterSW();
  } else {
    window.addEventListener('load', unregisterSW, { once: true });
  }
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

createRoot(document.getElementById("root")!).render(<App />);
