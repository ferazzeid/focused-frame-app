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
import { useVisualFeedback } from "@/hooks/useVisualFeedback";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [sharedApiKey, setSharedApiKey] = useState("");
  const [sharedKeyStatus, setSharedKeyStatus] = useState<{ hasKey: boolean; keyPreview: string | null }>({ hasKey: false, keyPreview: null });
  const [multiItemEnabled, setMultiItemEnabled] = useState(false);
  const [multiItemPrompt, setMultiItemPrompt] = useState("");
  const [multiItemDestination, setMultiItemDestination] = useState("free");
  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [useLocalSpeech, setUseLocalSpeech] = useState(false);
  const [notificationMode, setNotificationMode] = useState("");
  const [quickMode, setQuickMode] = useState(false);
  const [buttonPosition, setButtonPosition] = useState("");
  const { toast } = useToast();
  const { isAdmin, isLoading } = useUserRole();
  const { feedbackState: aiFeedback, showSuccess: showAISuccess, showError: showAIError, showProcessing: showAIProcessing } = useVisualFeedback();
  const { feedbackState: interfaceFeedback, showSuccess: showInterfaceSuccess, showError: showInterfaceError, showProcessing: showInterfaceProcessing } = useVisualFeedback();

  useEffect(() => {    
    const savedMultiItem = localStorage.getItem("multi_item_enabled");
    setMultiItemEnabled(savedMultiItem === "true");
    
    const savedPrompt = localStorage.getItem("multi_item_prompt");
    if (savedPrompt) {
      setMultiItemPrompt(savedPrompt);
    } else {
      setMultiItemPrompt('You are an expert at analyzing voice recordings and splitting them into distinct, actionable items. \n\nSPLIT CRITERIA - Only split when the transcript contains:\n- Multiple distinct tasks or action items\n- Different meeting topics or agenda items\n- Separate ideas that can stand alone\n- List-like content with clear separators\n\nDO NOT SPLIT if:\n- Content is under 50 words\n- It\'s a single cohesive thought or story\n- Items are closely related parts of one topic\n\nFor each item, create a meaningful 3-word title (no punctuation) that captures the essence. The title should help identify the content at a glance.\n\nExamples of good splitting:\n- "Buy groceries, call mom, finish project report" → 3 items\n- "Meeting discussed budget, then reviewed marketing plans, finally addressed hiring" → 3 items\n- "Remember to schedule dentist appointment and pick up dry cleaning" → 2 items\n\nExamples of NO splitting:\n- "Just had a great conversation with Sarah about the new product ideas" → 1 item\n- "Quick reminder to myself about tomorrow\'s presentation" → 1 item\n\nRespond in JSON format: {"items": [{"title": "Three Word Title", "content": "detailed content"}], "is_single_item": false}');
    }
    
    const savedDestination = localStorage.getItem("multi_item_destination");
    setMultiItemDestination(savedDestination || "free");
    
    const savedSummaryPrompt = localStorage.getItem("summary_prompt");
    if (savedSummaryPrompt) {
      setSummaryPrompt(savedSummaryPrompt);
    } else {
      setSummaryPrompt('You are a helpful assistant that creates concise 3-word summaries. Respond with exactly 3 words, no punctuation, no extra text.');
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
    localStorage.setItem("multi_item_destination", multiItemDestination);
    toast({
      title: "Multi-Item Settings Saved",
      description: "Your multi-item recording settings have been updated.",
    });
  };

  const handleSaveSummaryPrompt = () => {
    localStorage.setItem("summary_prompt", summaryPrompt);
    toast({
      title: "Summary Prompt Saved", 
      description: "Your summary prompt has been updated.",
    });
  };

  const handleSaveAISettings = () => {
    showAIProcessing();
    try {
      localStorage.setItem("openai_model", selectedModel);
      localStorage.setItem("use_local_speech", useLocalSpeech.toString());
      localStorage.setItem("quick_mode", quickMode.toString());
      showAISuccess();
      toast({
        title: "AI Settings Saved",
        description: "Your AI processing settings have been updated.",
      });
    } catch (error) {
      showAIError();
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive",
      });
    }
  };

  const handleSaveInterfaceSettings = () => {
    showInterfaceProcessing();
    try {
      localStorage.setItem("button_position", buttonPosition);
      localStorage.setItem("notification_mode", notificationMode);
      showInterfaceSuccess();
      toast({
        title: "Interface Settings Saved",
        description: "Your interface preferences have been updated.",
      });
    } catch (error) {
      showInterfaceError();
      toast({
        title: "Error",
        description: "Failed to save interface settings",
        variant: "destructive",
      });
    }
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
                <div className="flex items-center gap-xs">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <p className="text-sm font-medium text-foreground">Active: {sharedKeyStatus.keyPreview}</p>
                </div>
              </div>
            )}
            
            {!sharedKeyStatus.hasKey && (
              <div className="p-sm bg-warning/10 border border-warning/20 rounded-md">
                <div className="flex items-center gap-xs">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <p className="text-sm font-medium text-foreground">No Shared API Key</p>
                </div>
              </div>
            )}

            {(!sharedKeyStatus.hasKey || sharedApiKey.trim()) && (
              <div className="space-y-sm">
                <Label htmlFor="shared-openai-key" className="text-sm font-medium text-foreground">
                  {sharedKeyStatus.hasKey ? "Update API Key" : "Shared OpenAI API Key"}
                </Label>
                <Input
                  id="shared-openai-key"
                  type="password"
                  value={sharedApiKey}
                  onChange={(e) => setSharedApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="bg-input border border-input-border"
                />
              </div>
            )}

            <div className="flex gap-sm">
              {sharedKeyStatus.hasKey && !sharedApiKey.trim() && (
                <MobileButton
                  onClick={() => setSharedApiKey("dummy")}
                  variant="outline"
                  className="flex-1"
                >
                  Update Key
                </MobileButton>
              )}
              
              <MobileButton
                onClick={handleSaveSharedApiKey}
                variant="primary"
                className={sharedKeyStatus.hasKey && !sharedApiKey.trim() ? "flex-1" : "w-full"}
              >
                {sharedApiKey.trim() ? 
                  (sharedKeyStatus.hasKey ? "Update" : "Save") : 
                  "Remove"}
              </MobileButton>
            </div>
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
              <Label className="text-sm font-medium text-foreground">Enable Multi-Item Creation</Label>
              <Switch
                checked={multiItemEnabled}
                onCheckedChange={setMultiItemEnabled}
              />
            </div>
            
            <div className="space-y-sm">
              <Label className="text-sm font-medium text-foreground">Destination List</Label>
              <Select value={multiItemDestination} onValueChange={setMultiItemDestination}>
                <SelectTrigger className="bg-background-card border border-border text-foreground">
                  <SelectValue placeholder="Select destination list" />
                </SelectTrigger>
                <SelectContent className="bg-background-card border border-border shadow-lg z-50">
                  <SelectItem value="free" className="text-foreground hover:bg-background-subtle">Free List (Flat Items)</SelectItem>
                  <SelectItem value="second" className="text-foreground hover:bg-background-subtle">Second List (Structured)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-sm">
              <Label htmlFor="multi-item-prompt" className="text-sm font-medium text-foreground">
                Analysis Prompt
              </Label>
              <Textarea
                id="multi-item-prompt"
                value={multiItemPrompt}
                onChange={(e) => setMultiItemPrompt(e.target.value)}
                placeholder="Enter the prompt for analyzing recordings..."
                className="bg-input border border-input-border min-h-[120px] font-mono text-xs"
              />
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
                <SelectTrigger className="bg-background-card border border-border text-foreground">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent className="bg-background-card border border-border shadow-lg z-50">
                  <SelectItem value="gpt-5-nano-2025-08-07" className="text-foreground hover:bg-background-subtle">GPT-5 Nano (Default)</SelectItem>
                  <SelectItem value="gpt-5-mini-2025-08-07" className="text-foreground hover:bg-background-subtle">GPT-5 Mini</SelectItem>
                  <SelectItem value="gpt-5-2025-08-07" className="text-foreground hover:bg-background-subtle">GPT-5</SelectItem>
                  <SelectItem value="gpt-4.1-2025-04-14" className="text-foreground hover:bg-background-subtle">GPT-4.1</SelectItem>
                  <SelectItem value="gpt-4o-mini" className="text-foreground hover:bg-background-subtle">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o" className="text-foreground hover:bg-background-subtle">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Use Browser Speech Recognition</Label>
              <Switch
                checked={useLocalSpeech}
                onCheckedChange={setUseLocalSpeech}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Quick Mode</Label>
              <Switch
                checked={quickMode}
                onCheckedChange={setQuickMode}
              />
            </div>

            <div className="relative">
              <MobileButton
                onClick={handleSaveAISettings}
                variant="primary"
                className="w-full"
                disabled={aiFeedback === 'processing'}
              >
                {aiFeedback === 'processing' && (
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-sm" />
                )}
                {aiFeedback === 'success' && (
                  <div className="w-4 h-4 mr-sm text-green-400">✓</div>
                )}
                {aiFeedback === 'error' && (
                  <div className="w-4 h-4 mr-sm text-red-400">✗</div>
                )}
                Save AI Settings
              </MobileButton>
            </div>
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
                <SelectTrigger className="bg-background-card border border-border text-foreground">
                  <SelectValue placeholder="Select button position" />
                </SelectTrigger>
                <SelectContent className="bg-background-card border border-border shadow-lg z-50">
                  <SelectItem value="bottom" className="text-foreground hover:bg-background-subtle">Bottom</SelectItem>
                  <SelectItem value="header" className="text-foreground hover:bg-background-subtle">Header</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-sm">
              <Label className="text-sm font-medium text-foreground">Notification Mode</Label>
              <Select value={notificationMode} onValueChange={setNotificationMode}>
                <SelectTrigger className="bg-background-card border border-border text-foreground">
                  <SelectValue placeholder="Select notification style" />
                </SelectTrigger>
                <SelectContent className="bg-background-card border border-border shadow-lg z-50">
                  <SelectItem value="minimal" className="text-foreground hover:bg-background-subtle">Minimal</SelectItem>
                  <SelectItem value="reduced" className="text-foreground hover:bg-background-subtle">Reduced</SelectItem>
                  <SelectItem value="verbose" className="text-foreground hover:bg-background-subtle">Verbose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <MobileButton
                onClick={handleSaveInterfaceSettings}
                variant="primary"
                className="w-full"
                disabled={interfaceFeedback === 'processing'}
              >
                {interfaceFeedback === 'processing' && (
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-sm" />
                )}
                {interfaceFeedback === 'success' && (
                  <div className="w-4 h-4 mr-sm text-green-400">✓</div>
                )}
                {interfaceFeedback === 'error' && (
                  <div className="w-4 h-4 mr-sm text-red-400">✗</div>
                )}
                Save Interface Settings
              </MobileButton>
            </div>
          </div>
        </div>

        {/* Summary Prompt */}
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <MessageSquare className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground">Summary Prompt</h2>
          </div>
          <div className="bg-background-card border border-border rounded-md p-md space-y-md">
            <div className="space-y-sm">
              <Label htmlFor="summary-prompt" className="text-sm font-medium text-foreground">
                Summary Prompt
              </Label>
              <Textarea
                id="summary-prompt"
                value={summaryPrompt}
                onChange={(e) => setSummaryPrompt(e.target.value)}
                placeholder="Enter the system prompt for summaries..."
                className="bg-input border border-input-border min-h-[80px] font-mono text-xs"
              />
            </div>
            
            <MobileButton
              onClick={handleSaveSummaryPrompt}
              variant="primary"
              className="w-full"
            >
              Save Summary Prompt
            </MobileButton>
          </div>
        </div>
      </div>
    </div>
  );
};