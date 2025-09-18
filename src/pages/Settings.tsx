import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileButton } from "@/components/ui/mobile-button";
import { Archive, ChevronRight, Key, User } from "lucide-react";

export const Settings = () => {
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setOpenaiApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (openaiApiKey.trim()) {
      localStorage.setItem("openai_api_key", openaiApiKey.trim());
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved securely.",
      });
    } else {
      localStorage.removeItem("openai_api_key");
      toast({
        title: "API Key Removed",
        description: "Your OpenAI API key has been removed.",
      });
    }
  };

  const handleArchiveClick = () => {
    // Create a temporary archive page view
    const archiveWindow = window.open('', '_blank');
    if (archiveWindow) {
      archiveWindow.document.write(`
        <html>
          <head><title>Archive</title></head>
          <body style="font-family: system-ui; padding: 20px; background: #1a1a1a; color: #fff;">
            <h1>Archive</h1>
            <p>Archive functionality will be available once authentication is set up.</p>
            <button onclick="window.close()">Close</button>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-md py-md space-y-lg">
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
              onClick={handleArchiveClick}
              className="w-full text-left p-sm rounded-md bg-background-subtle hover:bg-background-hover transition-colors duration-fast border border-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">View Archive</span>
                <ChevronRight className="w-4 h-4 text-foreground-muted" />
              </div>
            </button>
          </div>
        </div>

        {/* Account Section - Placeholder for after Supabase integration */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <User className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md">
            <p className="text-sm text-foreground-muted mb-md">
              Account management will be available after connecting to Supabase
            </p>
            <div className="space-y-sm text-xs text-foreground-subtle">
              <div className="flex justify-between">
                <span>Email:</span>
                <span>Connect Supabase to see</span>
              </div>
              <div className="flex justify-between">
                <span>Member Since:</span>
                <span>Connect Supabase to see</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span>Connect Supabase to see</span>
              </div>
            </div>
            <div className="mt-md space-y-sm">
              <button 
                disabled
                className="w-full p-sm rounded-md bg-background-subtle text-foreground-muted border border-border opacity-50 cursor-not-allowed"
              >
                Manage Account (Requires Supabase)
              </button>
              <button 
                disabled
                className="w-full p-sm rounded-md bg-background-subtle text-foreground-muted border border-border opacity-50 cursor-not-allowed"
              >
                Sign Out (Requires Supabase)
              </button>
            </div>
          </div>
        </div>

        {/* OpenAI API Configuration */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Key className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">OpenAI Configuration</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md space-y-md">
            <div className="space-y-sm">
              <Label htmlFor="openai-key" className="text-sm font-medium text-foreground">
                OpenAI API Key
              </Label>
              <Input
                id="openai-key"
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-input border border-input-border"
              />
              <p className="text-xs text-foreground-subtle">
                Required for voice transcription and AI features. Your key is stored locally and never shared.
              </p>
            </div>
            <MobileButton
              onClick={handleSaveApiKey}
              variant="primary"
              className="w-full"
            >
              {openaiApiKey ? "Update API Key" : "Save API Key"}
            </MobileButton>
          </div>
        </div>

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