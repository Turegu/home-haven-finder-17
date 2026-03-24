import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import AuthPromptDialog from "@/components/AuthPromptDialog";

interface AuthPromptContextType {
  /** Returns true if user IS authenticated (action can proceed). Shows dialog if not. */
  requireAuth: () => Promise<boolean>;
}

const AuthPromptContext = createContext<AuthPromptContextType | null>(null);

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const requireAuth = useCallback(async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return true;
    setOpen(true);
    return false;
  }, []);

  return (
    <AuthPromptContext.Provider value={{ requireAuth }}>
      {children}
      <AuthPromptDialog open={open} onOpenChange={setOpen} />
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) throw new Error("useAuthPrompt must be used within AuthPromptProvider");
  return ctx;
}
