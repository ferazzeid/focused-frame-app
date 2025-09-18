import { useState, useEffect, createContext, useContext } from "react";
import { FreeList } from "@/pages/FreeList";
import { SecondList } from "@/pages/SecondList";
import { Archive } from "@/pages/Archive";
import { Settings } from "@/pages/Settings";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { Mic, Square, X, Settings as SettingsIcon, Plus, Minus, Key } from "lucide-react";
import { useRecording } from "@/hooks/useRecording";
import { useUserRole } from "@/hooks/useUserRole";

export type TabType = "free" | "second" | "settings" | "admin";

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
  const [showSecondList, setShowSecondList] = useState(true);
  const { isAdmin, isLoading } = useUserRole();
  
  useEffect(() => {
    // Load second list setting on mount
    const savedSecondListSetting = localStorage.getItem("show_second_list");
    if (savedSecondListSetting !== null) {
      setShowSecondList(JSON.parse(savedSecondListSetting));
    }
  }, []);
  
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
      case "admin":
        return <AdminDashboard onBack={() => setActiveTab("settings")} />;
      default:
        return <FreeList key={refreshTrigger} />;
    }
  };

  const handleAddItem = () => {
    if (activeTab === "settings" || activeTab === "admin") return; // Don't add items in settings or admin
    if (addTextItem) {
      addTextItem();
    }
  };

  const handleAddSpace = () => {
    if (activeTab === "settings" || activeTab === "admin") return; // Don't add items in settings or admin
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
            <div className="flex items-center gap-sm">
              {/* Admin Dashboard Button - Only visible to admins */}
              {!isLoading && isAdmin && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`p-sm transition-colors duration-fast rounded-md ${
                    activeTab === "admin"
                      ? "bg-accent-red text-background"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                  title="Admin Dashboard"
                >
                  <Key className="w-5 h-5" />
                </button>
              )}
              
              {/* Settings Button */}
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
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm border-t border-border z-10 p-md">
          <div className={`grid gap-xs ${showSecondList ? 'grid-cols-5' : 'grid-cols-4'}`}>
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

            {/* Second List Tab - Only show if enabled */}
            {showSecondList && (
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
            )}

            {/* Add Item Button */}
            <button
              onClick={handleAddItem}
              disabled={activeTab === "settings" || activeTab === "admin"}
              className={`flex flex-col items-center justify-center h-12 text-xs font-medium transition-colors duration-fast rounded-md border border-border ${
                activeTab === "settings" || activeTab === "admin"
                  ? "text-foreground-subtle bg-background-card border-border opacity-50 cursor-not-allowed"
                  : "text-foreground hover:text-foreground bg-background-card hover:bg-background-hover border-border"
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Space Button */}
            <button
              onClick={handleAddSpace}
              disabled={activeTab === "settings" || activeTab === "admin"}
              className={`flex flex-col items-center justify-center h-12 text-xs font-medium transition-colors duration-fast rounded-md border border-border ${
                activeTab === "settings" || activeTab === "admin"
                  ? "text-foreground-subtle bg-background-card border-border opacity-50 cursor-not-allowed"
                  : "text-foreground hover:text-foreground bg-background-card hover:bg-background-hover border-border"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Recording Button */}
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`flex flex-col items-center justify-center h-12 text-xs font-medium transition-all duration-300 rounded-md border relative ${
                isRecording
                  ? "text-white border-red-500 bg-red-500 animate-pulse"
                  : isProcessing
                    ? "text-white border-border/30 bg-accent-red/50 opacity-50"
                    : "text-white border-accent-red bg-accent-red hover:bg-accent-red/90"
              }`}
              style={{
                animationDuration: isRecording ? "2s" : undefined,
              }}
            >
              {isRecording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className={`w-5 h-5 ${isProcessing ? 'animate-pulse' : ''}`} />
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
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-700 rounded-full flex items-center justify-center hover:bg-red-800 transition-colors duration-fast z-10"
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