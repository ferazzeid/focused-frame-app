import { useState } from "react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Trash2, GripVertical, Bold, X, Mic, MoreVertical, Info, ArrowRight } from "lucide-react";
import { useVoiceEdit } from "@/hooks/useVoiceEdit";

export interface ListItemData {
  id: string;
  title: string;
  content: string;
  isBold: boolean;
  isEmpty: boolean;
  createdAt: Date;
}

interface ListItemProps {
  item: ListItemData;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggleBold: (id: string) => void;
  onSendToSecondList?: (id: string) => void;
  sendToSecondListLabel?: string;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetId: string) => void;
  isEditing?: boolean;
  onEdit?: (id: string) => void;
  onSave?: (id: string) => void;
  onViewContent?: (id: string) => void;
  onDeleteConfirm?: (id: string) => void;
  isDragOver?: boolean;
  isChild?: boolean;
}

export const ListItem = ({
  item,
  onUpdate,
  onDelete,
  onToggleBold,
  onSendToSecondList,
  sendToSecondListLabel = "Send to 2nd List",
  onDragStart,
  onDragOver,
  onDrop,
  isEditing = false,
  onEdit,
  onSave,
  onViewContent,
  onDeleteConfirm,
  isDragOver = false,
  isChild = false,
}: ListItemProps) => {
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localContent, setLocalContent] = useState(item.content);
  const [showMenu, setShowMenu] = useState(false);
  const { isRecording, isProcessing, toggleVoiceEdit, cancelVoiceEdit } = useVoiceEdit();

  const handleVoiceTranscription = (transcribedText: string) => {
    setLocalTitle(transcribedText);
    // Auto-save after voice transcription completes
    setTimeout(() => {
      if (transcribedText.trim() !== "") {
        onUpdate(item.id, transcribedText, localContent);
        onSave?.(item.id);
      }
    }, 100); // Small delay to ensure state is updated
  };

  const handleSave = () => {
    // Don't save if title is empty
    if (localTitle.trim() === "") {
      return;
    }
    onUpdate(item.id, localTitle, localContent);
    onSave?.(item.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && e.target === e.currentTarget) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setLocalTitle(item.title);
      setLocalContent(item.content);
      onSave?.(item.id);
    }
  };

  if (item.isEmpty) {
    return (
      <div className="relative">
        {isDragOver && (
          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-accent-green animate-pulse"></div>
        )}
        <div 
          className="group h-4 flex items-center justify-center relative"
          draggable
          onDragStart={(e) => onDragStart?.(e, item.id)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop?.(e, item.id)}
          data-item-id={item.id}
        >
          {/* Drag Handle for divider */}
          <div className="absolute left-0 flex items-center justify-center w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
            <GripVertical 
              className="w-4 h-4 text-foreground-subtle cursor-grab active:cursor-grabbing" 
              onMouseDown={(e) => {
                e.currentTarget.style.cursor = 'grabbing';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.cursor = 'grab';
              }}
            />
          </div>
          
          {/* Divider line */}
          <div className="w-full h-px bg-border opacity-30"></div>
          
          {/* Delete button for divider */}
          <button
            onClick={() => onDeleteConfirm?.(item.id)}
            className="absolute right-0 w-4 h-4 rounded-full bg-accent-red/20 hover:bg-accent-red/40 opacity-0 group-hover:opacity-100 transition-all duration-fast flex items-center justify-center"
          >
            <X className="w-2.5 h-2.5 text-accent-red" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isDragOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-accent-green animate-pulse"></div>
      )}
      <div
        className={`group flex items-center gap-sm p-sm rounded-md border border-border transition-colors duration-fast min-h-[3rem] ${
          item.isBold ? "mt-md" : ""
        } ${isChild ? "ml-lg" : ""}`}
        draggable
        onDragStart={(e) => onDragStart?.(e, item.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, item.id)}
        data-item-id={item.id}
      >
        {/* Drag Handle */}
        <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
          <GripVertical 
            className="w-5 h-5 text-foreground-subtle transition-opacity duration-fast cursor-grab active:cursor-grabbing" 
            onMouseDown={(e) => {
              e.currentTarget.style.cursor = 'grabbing';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.cursor = 'grab';
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 ml-xs flex items-center">
          {isEditing ? (
            <div className="relative w-full">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => {
                  const value = e.target.value;
                  // Auto-capitalize first letter
                  const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
                  setLocalTitle(capitalizedValue);
                }}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                placeholder="Title..."
                className={`w-full bg-input border border-input-border rounded-sm px-sm py-sm text-sm transition-colors duration-fast focus:border-input-border focus:ring-0 focus:ring-offset-0 focus:outline-none ${
                  item.isBold ? "font-bold text-base" : "font-normal"
                }`}
                autoFocus
              />
              {/* Voice Edit Button - positioned as sibling */}
            </div>
          ) : (
            <div
              onClick={() => onEdit?.(item.id)}
              className={`flex-1 cursor-text py-sm rounded transition-colors duration-fast hover:bg-background-subtle flex items-center ${
                item.isBold
                  ? "font-bold text-base text-foreground"
                  : "font-light text-sm text-foreground leading-tight"
              }`}
            >
              {item.title ? (
                <span>
                  {item.title}
                  {item.content && item.content.trim() && (
                    <span className="text-foreground-subtle ml-xs">*</span>
                  )}
                </span>
              ) : (
                <span className="text-foreground-subtle italic">Click to add title...</span>
              )}
            </div>
          )}
        </div>

        {/* Voice Edit Button - only show when editing */}
        {isEditing && (
          <div className="flex-shrink-0 ml-xs">
            <button
              onClick={() => toggleVoiceEdit(handleVoiceTranscription)}
              disabled={isProcessing}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-fast touch-manipulation ${
                isRecording 
                  ? "bg-accent-red text-white animate-pulse" 
                  : "text-foreground-muted hover:text-foreground hover:bg-background-subtle border border-border"
              } ${isProcessing ? "opacity-50" : ""}`}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            {/* Cancel Voice Edit Button */}
            {isRecording && (
              <button
                onClick={cancelVoiceEdit}
                className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red rounded-full flex items-center justify-center hover:bg-accent-red/90 transition-colors duration-fast touch-manipulation z-10"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        )}

        {/* Actions - Three Dots Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-md border border-transparent hover:border-border text-foreground-subtle hover:text-foreground transition-colors duration-fast flex items-center justify-center touch-manipulation"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Overlay to close menu when clicking outside */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 top-8 z-20 w-36 bg-background-card border border-border rounded-md shadow-lg animate-scale-in">
                <div className="py-xs">
                  {/* View Content */}
                  {item.content && (
                    <button
                      onClick={() => {
                        onViewContent?.(item.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-sm py-xs text-left text-sm text-foreground hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm"
                    >
                      <Info className="w-3 h-3" />
                      View
                    </button>
                  )}
                  
                  {/* Toggle Bold */}
                  <button
                    onClick={() => {
                      onToggleBold(item.id);
                      setShowMenu(false);
                    }}
                    className={`w-full px-sm py-xs text-left text-sm hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm ${
                      item.isBold ? "text-accent-green" : "text-foreground"
                    }`}
                  >
                    <Bold className="w-3 h-3" />
                    Bold
                  </button>
                  
                  {/* Send to Second List */}
                  {onSendToSecondList && (
                    <button
                      onClick={() => {
                        onSendToSecondList(item.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-sm py-xs text-left text-sm text-foreground hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm"
                    >
                      <ArrowRight className="w-3 h-3" />
                      2nd List
                    </button>
                  )}
                  
                  {/* Delete */}
                  <button
                    onClick={() => {
                      onDeleteConfirm?.(item.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-sm py-xs text-left text-sm text-foreground hover:bg-background-subtle hover:text-accent-red transition-colors duration-fast flex items-center gap-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};