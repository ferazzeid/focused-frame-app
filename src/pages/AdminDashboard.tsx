import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileButton } from "@/components/ui/mobile-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Key, MessageSquare, ArrowLeft, Zap } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [sharedApiKey, setSharedApiKey] = useState("");
  const [sharedKeyStatus, setSharedKeyStatus] = useState<{ hasKey: boolean; keyPreview: string | null }>({ hasKey: false, keyPreview: null });
  const [multiItemEnabled, setMultiItemEnabled] = useState(false);
  const [multiItemPrompt, setMultiItemPrompt] = useState("");
  const { toast } = useToast();
  const { isAdmin, isLoading } = useUserRole();

  useEffect(() => {    
    const savedMultiItem = localStorage.getItem("multi_item_enabled");
    setMultiItemEnabled(savedMultiItem === "true");
    
    const savedPrompt = localStorage.getItem("multi_item_prompt");
    if (savedPrompt) {
      setMultiItemPrompt(savedPrompt);
    } else {
      setMultiItemPrompt('Analyze this transcript and break it down into distinct, actionable items. Each item should be a separate task, idea, or note. If the content naturally contains multiple distinct items, return them as separate entries. If it\'s really just one cohesive item, return only one. For each item, provide a 3-word title (no punctuation) and the relevant content. Respond in JSON format: {"items": [{"title": "Three Word Title", "content": "detailed content"}], "is_single_item": false}');
    }
    
    // Load shared OpenAI key status
    loadSharedKeyStatus();
  }, []);

  const loadSharedKeyStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-shared-openai-key', {
        method: 'GET'
      });
      
      if (error) throw error;
      setSharedKeyStatus(data);
    } catch (error) {
      console.error('Error loading shared key status:', error);
      toast({
        title: "Error",
        description: "Failed to load shared API key status",
        variant: "destructive",
      });
    }
  };

  const handleSaveSharedApiKey = async () => {
    if (sharedApiKey.trim()) {
      try {
        const { data, error } = await supabase.functions.invoke('manage-shared-openai-key', {
          method: 'POST',
          body: { apiKey: sharedApiKey.trim() }
        });
        
        if (error) throw error;
        
        setSharedApiKey("");
        loadSharedKeyStatus();
      } catch (error) {
        console.error('Error saving shared key:', error);
        toast({
          title: "Error",
          description: "Failed to save shared API key",
          variant: "destructive",
        });
      }
    } else {
      try {
        const { data, error } = await supabase.functions.invoke('manage-shared-openai-key', {
          method: 'DELETE'
        });
        
        if (error) throw error;
        
        loadSharedKeyStatus();
      } catch (error) {
        console.error('Error removing shared key:', error);
        toast({
          title: "Error", 
          description: "Failed to remove shared API key",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveMultiItemSettings = () => {
    localStorage.setItem("multi_item_enabled", multiItemEnabled.toString());
    localStorage.setItem("multi_item_prompt", multiItemPrompt);
    toast({
      title: "Multi-Item Settings Saved",
      description: "Your multi-item recording settings have been updated.",
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-md">
          <div className="text-center text-foreground-muted">
            <p className="text-sm">Access denied</p>
            <p className="text-xs mt-xs">Admin privileges required</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-md border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-sm text-foreground-muted hover:text-foreground transition-colors duration-fast"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
        <div className="w-16"></div> {/* Spacer for center alignment */}
      </div>

      <div className="flex-1 overflow-y-auto px-md py-md space-y-lg">
        {/* Shared OpenAI API Configuration */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Key className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Shared OpenAI Configuration</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md space-y-md">
            {sharedKeyStatus.hasKey && (
              <div className="p-sm bg-success/10 border border-success/20 rounded-md">
                <div className="flex items-center gap-xs mb-xs">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <p className="text-sm font-medium text-foreground">Shared API Key Active</p>
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Key Preview:</span> {sharedKeyStatus.keyPreview}
                </p>
                <p className="text-xs text-foreground-subtle mt-xs">
                  This key is available to all premium users for AI features
                </p>
              </div>
            )}
            
            {!sharedKeyStatus.hasKey && (
              <div className="p-sm bg-warning/10 border border-warning/20 rounded-md">
                <div className="flex items-center gap-xs mb-xs">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <p className="text-sm font-medium text-foreground">No Shared API Key</p>
                </div>
                <p className="text-xs text-foreground-subtle">
                  Premium users will need to use their own API keys until a shared key is configured
                </p>
              </div>
            )}
            <div className="space-y-sm">
              <Label htmlFor="shared-openai-key" className="text-sm font-medium text-foreground">
                Shared OpenAI API Key
              </Label>
              <Input
                id="shared-openai-key"
                type="password"
                value={sharedApiKey}
                onChange={(e) => setSharedApiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-input border border-input-border"
              />
              <p className="text-xs text-foreground-subtle">
                This shared key will be used by all premium users for AI transcription and processing features. Users can still override this with their personal "Bring Your Own Key" option.
              </p>
            </div>
            <MobileButton
              onClick={handleSaveSharedApiKey}
              variant="primary"
              className="w-full"
            >
              {sharedApiKey.trim() ? 
                (sharedKeyStatus.hasKey ? "Update Shared API Key" : "Save Shared API Key") : 
                "Remove Shared API Key"}
            </MobileButton>
          </div>
        </div>

        {/* Multi-Item Recording */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Zap className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Multi-Item Recording</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md space-y-md">
            <div className="flex items-center justify-between">
              <div className="space-y-xs">
                <Label className="text-sm font-medium text-foreground">Enable Multi-Item Creation</Label>
                <p className="text-xs text-foreground-subtle">
                  When enabled, recordings can be split into multiple list items automatically
                </p>
              </div>
              <Switch
                checked={multiItemEnabled}
                onCheckedChange={setMultiItemEnabled}
              />
            </div>
            
            <div className="space-y-sm">
              <Label htmlFor="multi-item-prompt" className="text-sm font-medium text-foreground">
                Multi-Item Analysis Prompt
              </Label>
              <Textarea
                id="multi-item-prompt"
                value={multiItemPrompt}
                onChange={(e) => setMultiItemPrompt(e.target.value)}
                placeholder="Enter the prompt for analyzing recordings..."
                className="bg-input border border-input-border min-h-[120px] font-mono text-xs"
              />
              <p className="text-xs text-foreground-subtle">
                This prompt instructs the AI how to analyze recordings and split them into multiple items.
              </p>
            </div>
            
            <MobileButton
              onClick={handleSaveMultiItemSettings}
              variant="primary"
              className="w-full"
            >
              Save Multi-Item Settings
            </MobileButton>
          </div>
        </div>

        {/* Summary Prompt */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <MessageSquare className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Summary Prompt</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md">
            <div className="bg-background-subtle border border-border rounded-sm p-sm font-mono text-xs text-foreground space-y-sm">
              <div>
                <span className="text-foreground-subtle">System:</span>
                <div className="mt-xs text-foreground">
                  "You are a helpful assistant that creates concise 3-word summaries. Respond with exactly 3 words, no punctuation, no extra text."
                </div>
              </div>
              <div>
                <span className="text-foreground-subtle">User:</span>
                <div className="mt-xs text-foreground">
                  "Summarize this text in exactly 3 words: [your text]"
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};