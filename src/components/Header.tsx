import { useAuth } from "@/hooks/useAuth";
import { MobileButton } from "@/components/ui/mobile-button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <header className="flex items-center justify-between p-md border-b border-border bg-background-card">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Your Lists</h1>
        <p className="text-sm text-foreground-muted">{user.email}</p>
      </div>
      
      <MobileButton
        variant="outline"
        onClick={handleSignOut}
        className="flex items-center gap-sm"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </MobileButton>
    </header>
  );
};