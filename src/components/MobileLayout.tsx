import { useState } from "react";
import { FreeList } from "@/pages/FreeList";
import { SecondList } from "@/pages/SecondList";
import { Archive } from "@/pages/Archive";
import { Settings } from "@/pages/Settings";
import { Mic, Square, X, Settings as SettingsIcon } from "lucide-react";
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
      {/* Fixed Header */}
      <header className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-background border-b border-border z-10 px-md py-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-medium text-foreground">Second List</h1>
            <p className="text-sm text-foreground-muted mt-xs">
              Minimal. Structured. Intentional.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("settings")}
            className={`p-sm transition-colors duration-fast rounded-md ${
              activeTab === "settings"
                ? "bg-accent-green text-background"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24"></div>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Spacer for fixed footer */}
      <div className="h-20"></div>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-background-subtle border-t border-border z-10 p-md">
        <div className="flex items-center justify-between">
          {/* Navigation Tabs */}
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
              2<span className="text-xs">nd</span> List
            </button>
          </div>

          {/* Recording Button */}
          <div className="relative">
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`px-md py-sm transition-all duration-300 rounded-md border relative ${
                isRecording
                  ? "text-white border-red-500 bg-red-500 animate-pulse"
                  : isProcessing
                    ? "text-background border-border/30 bg-accent-green/50 opacity-50"
                    : "text-background border-accent-green bg-accent-green hover:bg-accent-green/90"
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
        </div>
      </nav>
    </div>
  );
};