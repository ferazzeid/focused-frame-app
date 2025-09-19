import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileButton } from "@/components/ui/mobile-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Key, MessageSquare, ArrowLeft, Zap, Brain, Mic2, Settings2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedModel, setSelectedModel] = useState("");
  const [useLocalSpeech, setUseLocalSpeech] = useState(false);
  const [notificationMode, setNotificationMode] = useState("");
  const [quickMode, setQuickMode] = useState(false);
  const [buttonPosition, setButtonPosition] = useState("");
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
    
    // Load AI model settings
    const savedModel = localStorage.getItem("openai_model");
    setSelectedModel(savedModel || "gpt-5-nano-2025-08-07");
    
    const savedLocalSpeech = localStorage.getItem("use_local_speech");
    setUseLocalSpeech(savedLocalSpeech === "true");
    
    const savedNotificationMode = localStorage.getItem("notification_mode");
    setNotificationMode(savedNotificationMode || "minimal");
    
    const savedQuickMode = localStorage.getItem("quick_mode");
    setQuickMode(savedQuickMode === "true");
    
    const savedButtonPosition = localStorage.getItem("button_position");
    setButtonPosition(savedButtonPosition || "bottom");
    
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

  const handleSaveAISettings = () => {
    localStorage.setItem("openai_model", selectedModel);
    localStorage.setItem("use_local_speech", useLocalSpeech.toString());
    localStorage.setItem("quick_mode", quickMode.toString());
    toast({
      title: "AI Settings Saved",
      description: "Your AI processing settings have been updated.",
    });
  };

  const handleSaveInterfaceSettings = () => {
    localStorage.setItem("button_position", buttonPosition);
    localStorage.setItem("notification_mode", notificationMode);
    toast({
      title: "Interface Settings Saved",
      description: "Your interface preferences have been updated.",
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

        {/* AI Processing Settings */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Brain className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">AI Processing Settings</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md space-y-md">
            <div className="space-y-sm">
              <Label className="text-sm font-medium text-foreground">OpenAI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-input border border-input-border">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-5-nano-2025-08-07">GPT-5 Nano (Fastest, Default)</SelectItem>
                  <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 Mini (Balanced)</SelectItem>
                  <SelectItem value="gpt-5-2025-08-07">GPT-5 (Most Capable)</SelectItem>
                  <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Reliable)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Legacy)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Legacy)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-foreground-subtle">
                GPT-5 Nano is optimized for speed and efficiency while maintaining quality.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-xs">
                <Label className="text-sm font-medium text-foreground">Speech-to-Text Method</Label>
                <p className="text-xs text-foreground-subtle">
                  {useLocalSpeech ? "Using browser's built-in speech recognition (instant)" : "Using OpenAI Whisper (higher accuracy)"}
                </p>
              </div>
              <Switch
                checked={useLocalSpeech}
                onCheckedChange={setUseLocalSpeech}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-xs">
                <Label className="text-sm font-medium text-foreground">Quick Mode</Label>
                <p className="text-xs text-foreground-subtle">
                  Skip AI summarization, use first few words as title for faster processing
                </p>
              </div>
              <Switch
                checked={quickMode}
                onCheckedChange={setQuickMode}
              />
            </div>

            <MobileButton
              onClick={handleSaveAISettings}
              variant="primary"
              className="w-full"
            >
              Save AI Settings
            </MobileButton>
          </div>
        </div>

        {/* Interface Settings */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Settings2 className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Interface Settings</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md space-y-md">
            <div className="space-y-sm">
              <Label className="text-sm font-medium text-foreground">Action Button Position</Label>
              <Select value={buttonPosition} onValueChange={setButtonPosition}>
                <SelectTrigger className="bg-input border border-input-border">
                  <SelectValue placeholder="Select button position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">Bottom (Current Position)</SelectItem>
                  <SelectItem value="header">Header (Near Settings)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-foreground-subtle">
                {buttonPosition === "bottom" && "Plus and divider buttons will stay in the bottom toolbar"}
                {buttonPosition === "header" && "Plus and divider buttons will move to the header area"}
              </p>
            </div>

            <div className="space-y-sm">
              <Label className="text-sm font-medium text-foreground">Notification Mode</Label>
              <Select value={notificationMode} onValueChange={setNotificationMode}>
                <SelectTrigger className="bg-input border border-input-border">
                  <SelectValue placeholder="Select notification style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal (Visual feedback only)</SelectItem>
                  <SelectItem value="reduced">Reduced (Critical errors only)</SelectItem>
                  <SelectItem value="verbose">Verbose (All notifications)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-foreground-subtle">
                {notificationMode === "minimal" && "Only visual indicators like checkmarks and spinners"}
                {notificationMode === "reduced" && "Small toast notifications for errors only"}
                {notificationMode === "verbose" && "Full toast notifications for all events"}
              </p>
            </div>

            <MobileButton
              onClick={handleSaveInterfaceSettings}
              variant="primary"
              className="w-full"
            >
              Save Interface Settings
            </MobileButton>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Settings2 className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Notification Settings</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md space-y-md">
            <div className="space-y-sm">
              <Label className="text-sm font-medium text-foreground">Notification Mode</Label>
              <Select value={notificationMode} onValueChange={setNotificationMode}>
                <SelectTrigger className="bg-input border border-input-border">
                  <SelectValue placeholder="Select notification style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal (Visual feedback only)</SelectItem>
                  <SelectItem value="reduced">Reduced (Critical errors only)</SelectItem>
                  <SelectItem value="verbose">Verbose (All notifications)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-foreground-subtle">
                {notificationMode === "minimal" && "Only visual indicators like checkmarks and spinners"}
                {notificationMode === "reduced" && "Small toast notifications for errors only"}
                {notificationMode === "verbose" && "Full toast notifications for all events"}
              </p>
            </div>
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