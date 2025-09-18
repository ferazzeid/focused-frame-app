import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const OPENAI_API_KEY = "openai_api_key";

export const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem(OPENAI_API_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(OPENAI_API_KEY, apiKey);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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

  return (
    <div className="flex flex-col gap-lg p-lg">
      <div className="space-y-md">
        <h2 className="text-lg font-medium text-foreground">Settings</h2>
      </div>

      <div className="space-y-md border border-border-subtle rounded-lg p-md bg-background-subtle">
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
          <p className="text-xs text-accent-green">API key saved successfully!</p>
        )}
      </div>
    </div>
  );
};