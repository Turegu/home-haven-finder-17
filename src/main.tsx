import { initSentry } from "@/lib/sentry";

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!import.meta.env[key]) {
    document.body.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;"><div style="text-align:center;padding:2rem;"><h1 style="color:#ef4444;font-size:1.5rem;margin-bottom:1rem;">Configuration Error</h1><p style="color:#6b7280;">Missing required environment variable: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${key}</code></p><p style="color:#6b7280;margin-top:0.5rem;">Please check your environment configuration.</p></div></div>`;
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

initSentry();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

createRoot(document.getElementById("root")!).render(<App />);
