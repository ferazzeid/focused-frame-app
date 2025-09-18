import { useState } from "react";
import { FreeList } from "@/pages/FreeList";
import { Archive } from "@/pages/Archive";
import { Settings } from "@/pages/Settings";
import { Mic, Square } from "lucide-react";
import { useRecording } from "@/hooks/useRecording";

export type TabType = "free" | "archive" | "settings";

export const MobileLayout = () => {
  const [activeTab, setActiveTab] = useState<TabType>("free");
  const [isPremium] = useState(false); // TODO: Implement premium check
  const { isRecording, isProcessing, toggleRecording, pendingRecordings } = useRecording();

  const renderContent = () => {
    switch (activeTab) {
      case "free":
        return <FreeList />;
      case "archive":
        return <Archive isPremium={isPremium} />;
      case "settings":
        return <Settings />;
      default:
        return <FreeList />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <header className="flex-shrink-0 px-md py-lg">
        <h1 className="text-xl font-medium text-foreground">Second List</h1>
        <p className="text-sm text-foreground-muted mt-xs">
          Minimal. Structured. Intentional.
        </p>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 bg-background-subtle">
        <div className="flex">
          <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`flex-1 py-md px-sm text-sm font-medium transition-all duration-300 rounded-md mx-xs my-xs border relative ${
              isRecording
                ? "text-white border-red-500 bg-red-500 animate-pulse"
                : isProcessing
                  ? "text-foreground-muted border-border/30 opacity-50"
                  : "text-foreground-muted hover:text-foreground border-border/30 hover:border-border"
            }`}
            style={{
              animationDuration: isRecording ? "2s" : undefined,
            }}
          >
            {isRecording ? (
              <Square className="w-4 h-4 mx-auto" />
            ) : (
              <Mic className={`w-4 h-4 mx-auto ${isProcessing ? 'animate-pulse' : ''}`} />
            )}
            {pendingRecordings.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-red rounded-full text-xs text-white flex items-center justify-center">
                {pendingRecordings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("free")}
            className={`flex-1 py-md px-sm text-sm font-medium transition-colors duration-normal rounded-md mx-xs my-xs border ${
              activeTab === "free"
                ? "text-foreground border-border bg-background"
                : "text-foreground-muted hover:text-foreground border-border/30 hover:border-border"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className={`flex-1 py-md px-sm text-sm font-medium transition-colors duration-normal rounded-md mx-xs my-xs border ${
              activeTab === "archive"
                ? "text-foreground border-border bg-background"
                : "text-foreground-muted hover:text-foreground border-border/30 hover:border-border"
            }`}
          >
            Archive
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-md px-sm text-sm font-medium transition-colors duration-normal rounded-md mx-xs my-xs border ${
              activeTab === "settings"
                ? "text-foreground border-border bg-background"
                : "text-foreground-muted hover:text-foreground border-border/30 hover:border-border"
            }`}
          >
            ⚙️
          </button>
        </div>
      </nav>
    </div>
  );
};