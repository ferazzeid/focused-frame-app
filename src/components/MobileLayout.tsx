import { useState } from "react";
import { FreeList } from "@/pages/FreeList";
import { PremiumList } from "@/pages/PremiumList";
import { Archive } from "@/pages/Archive";
import { Settings } from "@/pages/Settings";

export type TabType = "free" | "premium" | "archive" | "settings";

export const MobileLayout = () => {
  const [activeTab, setActiveTab] = useState<TabType>("free");
  const [isPremium] = useState(false); // TODO: Implement premium check

  const renderContent = () => {
    switch (activeTab) {
      case "free":
        return <FreeList />;
      case "premium":
        return <PremiumList isLocked={!isPremium} />;
      case "archive":
        return <Archive isPremium={isPremium} />;
      case "settings":
        return <Settings />;
      default:
        return <FreeList />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex-shrink-0 px-md py-lg border-b border-border">
        <h1 className="text-xl font-medium text-foreground">Notes</h1>
        <p className="text-sm text-foreground-muted mt-xs">
          Minimal. Structured. Intentional.
        </p>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 border-t border-border bg-background-subtle">
        <div className="flex">
          <button
            onClick={() => setActiveTab("free")}
            className={`flex-1 py-md px-sm text-sm font-medium transition-colors duration-normal ${
              activeTab === "free"
                ? "text-foreground border-t-2 border-accent-green"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Free List
          </button>
          <button
            onClick={() => setActiveTab("premium")}
            className={`flex-1 py-md px-sm text-sm font-medium transition-colors duration-normal relative ${
              activeTab === "premium"
                ? "text-foreground border-t-2 border-accent-green"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Premium
            {!isPremium && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-green rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className={`flex-1 py-md px-sm text-sm font-medium transition-colors duration-normal ${
              activeTab === "archive"
                ? "text-foreground border-t-2 border-accent-green"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Archive
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-md px-sm text-sm font-medium transition-colors duration-normal ${
              activeTab === "settings"
                ? "text-foreground border-t-2 border-accent-green"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            ⚙️
          </button>
        </div>
      </nav>
    </div>
  );
};