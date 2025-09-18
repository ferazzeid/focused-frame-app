import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileButton } from "@/components/ui/mobile-button";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users
  if (isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your signup.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
        
        // Redirect to home
        window.location.href = "/";
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center max-w-sm mx-auto px-md">
      <div className="w-full space-y-lg">
        {/* Header */}
        <div className="text-center space-y-sm">
          <h1 className="text-xl font-medium text-foreground">Second List</h1>
          <p className="text-sm text-foreground-muted">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-md">
          <div className="space-y-sm">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="bg-input border border-input-border"
            />
          </div>

          <div className="space-y-sm">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              className="bg-input border border-input-border"
            />
          </div>

          <MobileButton
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </MobileButton>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-fast"
          >
            {isSignUp 
              ? "Already have an account? Sign in" 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => window.location.href = "/"}
            className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-fast"
          >
            ← Back to app
          </button>
        </div>
      </div>
    </div>
  );
};