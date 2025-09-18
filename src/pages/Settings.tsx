import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecording } from "@/hooks/useRecording";
import { RefreshCw } from "lucide-react";

const OPENAI_API_KEY = "openai_api_key";
const OPENAI_MODEL = "openai_model";

export const OPENAI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", description: "Most advanced multimodal model" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast, affordable intelligent model" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Latest GPT-4 model with improved performance" },
  { id: "gpt-4", name: "GPT-4", description: "Large multimodal model" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast, cost-effective model" },
  { id: "gpt-3.5-turbo-16k", name: "GPT-3.5 Turbo 16K", description: "Extended context version" },
] as const;

export const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { pendingRecordings, retryPendingRecording, retryAllPending } = useRecording();

  useEffect(() => {
    const savedKey = localStorage.getItem(OPENAI_API_KEY);
    const savedModel = localStorage.getItem(OPENAI_MODEL);
    if (savedKey) {
      setApiKey(savedKey);
    }
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(OPENAI_API_KEY, apiKey);
    localStorage.setItem(OPENAI_MODEL, selectedModel);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem(OPENAI_MODEL, model);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsSaved(false);
  };

  const handleCancel = () => {
    const savedKey = localStorage.getItem(OPENAI_API_KEY) || "";
    setApiKey(savedKey);
    setIsEditing(false);
  };

  const maskedKey = apiKey ? `sk-...${apiKey.slice(-8)}` : "";

  const selectedModelInfo = OPENAI_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="flex flex-col gap-lg p-lg">
      <div className="space-y-md">
        <h2 className="text-lg font-medium text-foreground">Settings</h2>
      </div>

      {/* API Key Section */}
      <div className="space-y-md border border-border-subtle rounded-lg p-md bg-background-subtle">
        <h3 className="text-sm font-medium text-foreground">OpenAI API Key</h3>
        {!isEditing ? (
          <div className="flex items-center gap-sm">
            <div className="flex-1 px-sm py-xs bg-background border border-border-subtle rounded text-sm text-foreground-muted">
              {apiKey ? maskedKey : "No API key set"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="text-xs"
            >
              {apiKey ? "Edit" : "Add"}
            </Button>
          </div>
        ) : (
          <div className="space-y-sm">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="text-sm"
            />
            <div className="flex gap-sm">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="text-xs"
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isSaved && (
          <p className="text-xs text-accent-green">Settings saved successfully!</p>
        )}
      </div>

      {/* Model Selection Section */}
      <div className="space-y-md border border-border-subtle rounded-lg p-md bg-background-subtle">
        <h3 className="text-sm font-medium text-foreground">AI Model</h3>
        <div className="space-y-sm">
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border-subtle z-50">
              {OPENAI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id} className="hover:bg-background-subtle">
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-foreground-muted">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModelInfo && (
            <p className="text-xs text-foreground-muted">
              Currently using: <span className="font-medium">{selectedModelInfo.name}</span> - {selectedModelInfo.description}
            </p>
          )}
        </div>
      </div>

      {/* Pending Recordings Section */}
      {pendingRecordings.length > 0 && (
        <div className="space-y-md border border-border-subtle rounded-lg p-md bg-background-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Failed Voice Recordings ({pendingRecordings.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={retryAllPending}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry All
            </Button>
          </div>
          <div className="space-y-xs">
            <p className="text-xs text-foreground-muted">
              These recordings failed to process. They'll be retried when you have a stable connection.
            </p>
            {pendingRecordings.map((recording) => (
              <div key={recording.id} className="flex items-center justify-between p-xs bg-background border border-border-subtle rounded text-xs">
                <span className="text-foreground-muted">
                  Recording from {new Date(recording.timestamp).toLocaleTimeString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => retryPendingRecording(recording)}
                  className="text-xs h-6 px-2"
                >
                  Retry
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};