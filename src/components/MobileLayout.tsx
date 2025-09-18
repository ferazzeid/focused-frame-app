import { useState } from "react";
import { FreeList } from "@/pages/FreeList";
import { SecondList } from "@/pages/SecondList";
import { Archive } from "@/pages/Archive";
import { Settings } from "@/pages/Settings";
import { Mic, Square, X } from "lucide-react";
import { useRecording } from "@/hooks/useRecording";

export type TabType = "free" | "second" | "settings";

export const MobileLayout = () => {
  const [activeTab, setActiveTab] = useState<TabType>("free");
  const [isPremium] = useState(false); // TODO: Implement premium check
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleItemAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const { isRecording, isProcessing, toggleRecording, pendingRecordings, recordingTimeLeft, cancelRecording } = useRecording(handleItemAdded);

  const renderContent = () => {
    switch (activeTab) {
      case "free":
        return <FreeList key={refreshTrigger} />;
      case "second":
        return <SecondList key={refreshTrigger} />;
      case "settings":
        return <Settings />;
      default:
        return <FreeList key={refreshTrigger} />;
    }
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
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
        {/* Navigation Tabs */}
        <div className="flex flex-1 justify-center">
          <div className="flex bg-background-card rounded-md p-xs border border-border">
            <button
              onClick={() => setActiveTab("free")}
              className={`px-md py-sm text-sm font-medium transition-colors duration-fast rounded-sm ${
                activeTab === "free"
                  ? "bg-accent-green text-background"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setActiveTab("second")}
              className={`px-md py-sm text-sm font-medium transition-colors duration-fast rounded-sm ${
                activeTab === "second"
                  ? "bg-accent-green text-background"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              2ND List
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-md py-sm text-sm font-medium transition-colors duration-fast rounded-sm ${
                activeTab === "settings"
                  ? "bg-accent-green text-background"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Recording Button */}
        <div className="relative">
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
            <div className="flex flex-col items-center gap-0.5">
              {isRecording ? (
                <Square className="w-4 h-4" />
              ) : (
                <Mic className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
              )}
              {isRecording && (
                <span className="text-xs font-mono">
                  {formatTime(recordingTimeLeft)}
                </span>
              )}
            </div>
            {pendingRecordings.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-red rounded-full text-xs text-white flex items-center justify-center">
                {pendingRecordings.length}
              </span>
            )}
            {/* Cancel Recording Button */}
            {isRecording && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelRecording();
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red rounded-full flex items-center justify-center hover:bg-accent-red/90 transition-colors duration-fast z-10"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};