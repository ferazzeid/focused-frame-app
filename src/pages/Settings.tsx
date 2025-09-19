import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileButton } from "@/components/ui/mobile-button";
import { Switch } from "@/components/ui/switch";
import { Archive, ChevronRight, Key, User, LogOut, X, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Archive as ArchivePage } from "@/pages/Archive";
import { PermissionStatus } from "@/components/PermissionStatus";

export const Settings = () => {
  const [personalApiKey, setPersonalApiKey] = useState("");
  const [showArchive, setShowArchive] = useState(false);
  const [showSecondList, setShowSecondList] = useState(true);
  const { toast } = useToast();
  const { user, signOut, isAuthenticated } = useAuth();

  useEffect(() => {
    const savedPersonalKey = localStorage.getItem("personal_openai_api_key");
    if (savedPersonalKey) {
      setPersonalApiKey(savedPersonalKey);
    }
    
    // Load second list setting
    const savedSecondListSetting = localStorage.getItem("show_second_list");
    if (savedSecondListSetting !== null) {
      setShowSecondList(JSON.parse(savedSecondListSetting));
    }
  }, []);

  const handleSavePersonalApiKey = () => {
    if (personalApiKey.trim()) {
      localStorage.setItem("personal_openai_api_key", personalApiKey.trim());
      toast({
        title: "Personal API Key Saved",
        description: "Your personal OpenAI API key has been saved securely.",
      });
    } else {
      localStorage.removeItem("personal_openai_api_key");
      toast({
        title: "Personal API Key Removed",
        description: "Your personal OpenAI API key has been removed.",
      });
    }
  };

  const handleToggleSecondList = (enabled: boolean) => {
    setShowSecondList(enabled);
    localStorage.setItem("show_second_list", JSON.stringify(enabled));
    toast({
      title: enabled ? "2nd List Enabled" : "2nd List Disabled",
      description: enabled ? "The 2nd list is now available" : "The 2nd list has been hidden",
    });
  };

  const handleClearCacheAndReset = () => {
    // Clear all localStorage
    localStorage.clear();
    
    toast({
      title: "Cache Cleared",
      description: "All data cleared. Refreshing page...",
    });
    
    // Force refresh after a short delay to show the toast
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
    }
  };

  if (showArchive) {
    return (
      <div className="flex flex-col h-full">
        {/* Close button */}
        <div className="flex justify-end px-md py-sm border-b border-border">
          <button
            onClick={() => setShowArchive(false)}
            className="p-xs text-foreground-muted hover:text-foreground transition-colors duration-fast rounded-md hover:bg-background-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Archive content */}
        <div className="flex-1">
          <ArchivePage />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-md py-md space-y-lg">
        {/* Microphone Permission Status */}
        <PermissionStatus />
        
        {/* Personal OpenAI API Key */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Key className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Personal OpenAI API Key (BYOK)</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md space-y-md">
            <div className="space-y-sm">
              <Label htmlFor="personal-openai-key" className="text-sm font-medium text-foreground">
                Your Personal API Key
              </Label>
              <Input
                id="personal-openai-key"
                type="password"
                value={personalApiKey}
                onChange={(e) => setPersonalApiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-input border border-input-border"
              />
              <p className="text-xs text-foreground-subtle">
                Bring Your Own Key: Use your personal OpenAI API key. This will override the shared key for your account and give you full control over your AI usage and costs.
              </p>
            </div>
            <MobileButton
              onClick={handleSavePersonalApiKey}
              variant="primary"
              className="w-full"
            >
              {personalApiKey ? "Update Personal API Key" : "Save Personal API Key"}
            </MobileButton>
          </div>
        </div>
        
        {/* 2nd List Toggle */}
        <div className="space-y-md">
          <div className="bg-background-card border border-border rounded-md p-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <List className="w-5 h-5 text-foreground-muted" />
                <span className="text-sm font-medium text-foreground">2nd List</span>
              </div>
              <Switch
                checked={showSecondList}
                onCheckedChange={handleToggleSecondList}
              />
            </div>
          </div>
        </div>

        {/* Development Tools */}
        <div className="space-y-md">
          <h2 className="text-lg font-semibold text-foreground">Development</h2>
          <div className="bg-background-card border border-border rounded-md p-md">
            <p className="text-sm text-foreground-muted mb-md">
              Clear all cached data and refresh to see latest changes
            </p>
            <MobileButton
              onClick={handleClearCacheAndReset}
              variant="outline"
              className="w-full text-accent-red border-accent-red hover:bg-accent-red hover:text-white"
            >
              Clear Cache & Reset
            </MobileButton>
          </div>
        </div>

        {/* Archive Section */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Archive className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Archive</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md">
            <p className="text-sm text-foreground-muted mb-md">
              View and manage your archived items
            </p>
            <button 
              onClick={() => setShowArchive(true)}
              className="w-full text-left p-sm rounded-md bg-background-subtle hover:bg-background-hover transition-colors duration-fast border border-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">View Archive</span>
                <ChevronRight className="w-4 h-4 text-foreground-muted" />
              </div>
            </button>
          </div>
        </div>

        {/* Account Section */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <User className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md">
            {isAuthenticated && user ? (
              <>
                <div className="space-y-sm text-sm text-foreground-muted mb-md">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="text-foreground">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Member Since:</span>
                    <span className="text-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-accent-green">Active</span>
                  </div>
                </div>
                <div className="mt-md space-y-sm">
                  <MobileButton
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full flex items-center gap-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </MobileButton>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground-muted mb-md">
                  Sign in to access account features
                </p>
                <div className="space-y-sm">
                  <MobileButton
                    onClick={() => window.location.href = '/auth'}
                    variant="primary"
                    className="w-full"
                  >
                    Sign In
                  </MobileButton>
                </div>
              </>
            )}
          </div>
        </div>

        {/* OpenAI API Configuration - Removed from regular settings, moved to admin */}

        {/* About */}
        <div className="space-y-md">
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          <div className="bg-background-card border border-border rounded-md p-md">
            <p className="text-sm text-foreground-muted mb-sm">
              Second List - Minimal. Structured. Intentional.
            </p>
            <p className="text-xs text-foreground-subtle">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};