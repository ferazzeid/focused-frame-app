import { useState, createContext, useContext } from "react";
import { FreeList } from "@/pages/FreeList";
import { SecondList } from "@/pages/SecondList";
import { Archive } from "@/pages/Archive";
import { Settings } from "@/pages/Settings";
import { Mic, Square, X, Settings as SettingsIcon, Plus, Minus } from "lucide-react";
import { useRecording } from "@/hooks/useRecording";

export type TabType = "free" | "second" | "settings";

// Context for add functions
interface AddFunctionsContextType {
  addTextItem: (() => void) | null;
  addEmptyLine: (() => void) | null;
  setAddTextItem: (fn: (() => void) | null) => void;
  setAddEmptyLine: (fn: (() => void) | null) => void;
}

const AddFunctionsContext = createContext<AddFunctionsContextType>({
  addTextItem: null,
  addEmptyLine: null,
  setAddTextItem: () => {},
  setAddEmptyLine: () => {},
});

export const useAddFunctions = () => useContext(AddFunctionsContext);

export const MobileLayout = () => {
  const [activeTab, setActiveTab] = useState<TabType>("free");
  const [isPremium] = useState(false); // TODO: Implement premium check
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addTextItem, setAddTextItem] = useState<(() => void) | null>(null);
  const [addEmptyLine, setAddEmptyLine] = useState<(() => void) | null>(null);
  
  const handleItemAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const { isRecording, isProcessing, toggleRecording, pendingRecordings, recordingTimeLeft, cancelRecording } = useRecording(handleItemAdded);

  const contextValue = {
    addTextItem,
    addEmptyLine,
    setAddTextItem,
    setAddEmptyLine,
  };

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

  const handleAddItem = () => {
    if (activeTab === "settings") return; // Don't add items in settings
    if (addTextItem) {
      addTextItem();
    }
  };

  const handleAddSpace = () => {
    if (activeTab === "settings") return; // Don't add items in settings
    if (addEmptyLine) {
      addEmptyLine();
    }
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <AddFunctionsContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background flex flex-col max-w-sm mx-auto">
        {/* Fixed Header */}
        <header className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-background border-b border-border z-10 px-md py-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-medium text-foreground">Second List</h1>
            </div>
            <button
              onClick={() => {
                if (activeTab === "settings") {
                  setActiveTab("free"); // Go back to list view
                } else {
                  setActiveTab("settings"); // Go to settings
                }
              }}
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
        <div className="h-20"></div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Spacer for fixed footer */}
        <div className="h-20"></div>

        {/* Fixed Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-background-subtle border-t border-border z-10 p-md">
          <div className="grid grid-cols-5 gap-xs">
            {/* List Tab */}
            <button
              onClick={() => setActiveTab("free")}
              className={`flex flex-col items-center justify-center h-12 text-xs font-medium transition-colors duration-fast rounded-md border border-border ${
                activeTab === "free"
                  ? "bg-accent-green text-background border-accent-green"
                  : "text-foreground-muted hover:text-foreground bg-background-card"
              }`}
            >
              List
            </button>

            {/* Second List Tab */}
            <button
              onClick={() => setActiveTab("second")}
              className={`flex flex-col items-center justify-center h-12 text-xs font-medium transition-colors duration-fast rounded-md border border-border whitespace-nowrap ${
                activeTab === "second"
                  ? "bg-accent-green text-background border-accent-green"
                  : "text-foreground-muted hover:text-foreground bg-background-card"
              }`}
            >
              2nd
            </button>

            {/* Add Item Button */}
            <button
              onClick={handleAddItem}
              disabled={activeTab === "settings"}
              className={`flex flex-col items-center justify-center h-12 text-xs font-medium transition-colors duration-fast rounded-md border border-border ${
                activeTab === "settings"
                  ? "text-foreground-subtle bg-background-card border-border opacity-50 cursor-not-allowed"
                  : "text-foreground-muted hover:text-foreground bg-background-card hover:bg-background-hover"
              }`}
            >
              <Plus className="w-4 h-4 mb-0.5" />
              Add
            </button>

            {/* Space Button */}
            <button
              onClick={handleAddSpace}
              disabled={activeTab === "settings"}
              className={`flex flex-col items-center justify-center h-12 text-xs font-medium transition-colors duration-fast rounded-md border border-border ${
                activeTab === "settings"
                  ? "text-foreground-subtle bg-background-card border-border opacity-50 cursor-not-allowed"
                  : "text-foreground-muted hover:text-foreground bg-background-card hover:bg-background-hover"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-4 h-4 mb-0.5">
                <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Space
            </button>

            {/* Recording Button */}
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`flex flex-col items-center justify-center h-12 text-xs font-medium transition-all duration-300 rounded-md border relative ${
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
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mb-0.5" />
                  <span className="text-xs font-mono leading-none">
                    {formatTime(recordingTimeLeft)}
                  </span>
                </>
              ) : (
                <>
                  <Mic className={`w-4 h-4 mb-0.5 ${isProcessing ? 'animate-pulse' : ''}`} />
                  <span className="leading-none">Rec</span>
                </>
              )}
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
    </AddFunctionsContext.Provider>
  );
};