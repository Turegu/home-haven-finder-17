import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff } from "lucide-react";

const AgentLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    const remembered = localStorage.getItem("turegu_agent_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("id, status")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (agentError) throw agentError;

      if (!agent) {
        await supabase.auth.signOut();
        toast.error("No agent account found for this email.");
        return;
      }

      if (agent.status !== "active") {
        await supabase.auth.signOut();
        toast.error("Your agent account is not active yet. Contact your company admin.");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("turegu_agent_email", email);
      } else {
        localStorage.removeItem("turegu_agent_email");
      }

      toast.success("Welcome to your Agent Dashboard!");
      navigate("/agent");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/company/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
      setShowForgot(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4" dir="ltr">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <Link to="/" className="text-2xl font-bold text-primary">turegu</Link>
            <h1 className="text-xl font-bold text-foreground mt-4">
              {showForgot ? "Reset Password" : "Agent Login"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {showForgot
                ? "Enter your email to receive a reset link"
                : "Sign in to your agent dashboard"}
            </p>
          </div>

          {showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-foreground">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="agent@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="bg-secondary/50"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="text-sm text-primary hover:underline w-full text-center block mt-3"
              >
                ← Back to login
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-secondary/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {loading ? "Signing in..." : "Log in"}
                </Button>
              </form>

              <div className="flex items-center justify-between mt-6">
                <Link to="/company/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Company Login →
                </Link>
                <Link to="/" className="text-sm text-primary hover:underline">
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentLoginPage;
