import { useState } from "react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Trash2, Bold, MoreVertical, Info, ArrowRight } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

interface ActionMenuProps {
  id: string;
  isBold: boolean;
  hasContent: boolean;
  onToggleBold: () => void;
  onViewContent?: () => void;
  onSendToSecondList?: () => void;
  onDeleteConfirm: () => void;
  sendToSecondListLabel?: string;
}

export const ActionMenu = ({
  id,
  isBold,
  hasContent,
  onToggleBold,
  onViewContent,
  onSendToSecondList,
  onDeleteConfirm,
  sendToSecondListLabel = "Send to 2nd List"
}: ActionMenuProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const { isMobile, isTouch } = useDeviceDetection();

  const handleMenuToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action: () => void) => {
    setShowMenu(false);
    action();
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={handleMenuToggle}
        onTouchEnd={handleMenuToggle}
        className={`p-sm rounded-full transition-all duration-fast touch-manipulation ${
          showMenu
            ? "bg-accent-red/20 text-accent-red scale-105"
            : "text-foreground-subtle hover:text-foreground hover:bg-background-subtle/50"
        } ${isTouch || isMobile ? 'w-10 h-10' : 'w-8 h-8'}`}
        type="button"
        aria-label="Item actions"
      >
        <MoreVertical className={`${isTouch || isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
      </button>

      {/* Enhanced Menu Dropdown */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            onTouchEnd={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-xs z-20 bg-background-card border border-border rounded-md shadow-lg min-w-[12rem] animate-in fade-in-0 zoom-in-95 duration-200">
            {/* View Content */}
            {onViewContent && (
              <MobileButton
                onClick={() => handleAction(onViewContent)}
                className="w-full justify-start gap-sm text-left"
                variant="ghost"
              >
                <Info className="w-4 h-4 text-accent-blue" />
                <span>View Content</span>
                {hasContent && (
                  <span className="ml-auto w-2 h-2 bg-accent-blue rounded-full" />
                )}
              </MobileButton>
            )}

            {/* Toggle Bold */}
            <MobileButton
              onClick={() => handleAction(onToggleBold)}
              className="w-full justify-start gap-sm text-left"
              variant="ghost"
            >
              <Bold className={`w-4 h-4 ${isBold ? 'text-accent-yellow' : 'text-foreground-subtle'}`} />
              <span>{isBold ? 'Remove Bold' : 'Make Bold'}</span>
            </MobileButton>

            {/* Send to Second List */}
            {onSendToSecondList && (
              <MobileButton
                onClick={() => handleAction(onSendToSecondList)}
                className="w-full justify-start gap-sm text-left"
                variant="ghost"
              >
                <ArrowRight className="w-4 h-4 text-accent-green" />
                <span>{sendToSecondListLabel}</span>
              </MobileButton>
            )}

            <div className="border-t border-border my-xs" />

            {/* Delete */}
            <MobileButton
              onClick={() => handleAction(onDeleteConfirm)}
              className="w-full justify-start gap-sm text-left text-accent-red hover:text-accent-red hover:bg-accent-red/10"
              variant="ghost"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </MobileButton>
          </div>
        </>
      )}
    </div>
  );
};