import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ListItemData } from "./ListItem";

interface CollapsibleGroupProps {
  parentItem: ListItemData;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const CollapsibleGroup = ({
  parentItem,
  children,
  isCollapsed,
  onToggleCollapse
}: CollapsibleGroupProps) => {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleCollapse();
  };

  return (
    <div className="relative">
      {/* Parent item content goes here */}
      {children}
      
      {/* Collapse/Expand button - positioned at bottom center of bold item */}
      {parentItem.isBold && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={handleToggleClick}
            className="w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:bg-background-subtle"
            aria-label={isCollapsed ? "Expand children" : "Collapse children"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3 h-3 text-foreground-subtle" />
            ) : (
              <ChevronUp className="w-3 h-3 text-foreground-subtle" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};