import { useState } from "react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Trash2, GripVertical, Bold, X, Mic, MoreVertical, Info, ArrowRight } from "lucide-react";
import { useVoiceEdit } from "@/hooks/useVoiceEdit";
import { useToast } from "@/hooks/use-toast";

export interface ListItemData {
  id: string;
  title: string;
  content: string;
  isBold: boolean;
  isEmpty: boolean;
  createdAt: Date;
  isChild?: boolean;
}

interface ListItemProps {
  item: ListItemData;
  onUpdate: (id: string, title: string, content: string, fromVoice?: boolean) => void;
  onDelete: (id: string) => void;
  onToggleBold: (id: string) => void;
  onSendToSecondList?: (id: string) => void;
  sendToSecondListLabel?: string;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetId: string) => void;
  isEditing?: boolean;
  isSelected?: boolean;
  onEdit?: (id: string) => void;
  onSave?: (id: string, fromVoice?: boolean) => void;
  onSelect?: (id: string) => void;
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
  onDragEnd,
  onDrop,
  isEditing = false,
  isSelected = false,
  onEdit,
  onSave,
  onSelect,
  onViewContent,
  onDeleteConfirm,
  isDragOver = false,
  isChild = false,
}: ListItemProps) => {
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localContent, setLocalContent] = useState(item.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isRecording, isProcessing, toggleVoiceEdit, cancelVoiceEdit } = useVoiceEdit();
  const { toast } = useToast();

  const handleVoiceTranscription = async (transcribedText: string) => {
    console.log("Voice transcription received:", transcribedText);
    
    if (transcribedText.trim() === "") {
      console.log("Empty transcription received, removing item");
      // If no transcription, delete the empty item
      onDelete(item.id);
      return;
    }

    let processedText = transcribedText.trim();
    
    try {
      // Check if transcribed text has more than 3 words and needs AI summarization
      const wordCount = processedText.split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount > 3) {
        try {
          console.log("Generating AI summary for:", processedText);
          // Import SpeechService dynamically 
          const { SpeechService } = await import("@/lib/speechService");
          const speechService = new SpeechService();
          
          // Use AI to create a 3-word summary
          processedText = await speechService.generateSummary(processedText);
          console.log("AI summary generated:", processedText);
        } catch (error) {
          console.error("Error generating summary for voice:", error);
          // If AI summarization fails, truncate to first 3 words
          const words = processedText.split(/\s+/).filter(word => word.length > 0);
          processedText = words.slice(0, 3).join(" ");
          console.log("Using truncated text:", processedText);
        }
      }
      
      // Only update the title (not content), and stay in editing mode
      setLocalTitle(processedText);
      
      // Update the parent state but DON'T exit editing mode
      onUpdate(item.id, processedText, localContent, true); // Pass fromVoice=true
      
      // Don't call onSave here - let user manually save when they're done editing
      
    } catch (error) {
      console.error("Voice transcription processing failed:", error);
      // On any error, remove the empty item
      onDelete(item.id);
    }
  };

  const handleSave = () => {
    // Don't save if item content is empty
    if (localTitle.trim() === "") {
      // Delete the item instead of saving empty
      onDelete(item.id);
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

  const handleImmediateDelete = () => {
    setShowMenu(false);
    setIsDeleting(true);
    
    // Show toast notification
    toast({
      title: "Item deleted",
      description: item.title || "Item removed from list",
    });
    
    // Start slide-out animation, then delete after animation completes
    setTimeout(() => {
      onDelete(item.id);
    }, 300); // Match the animation duration
  };

  if (item.isEmpty) {
    return (
      <div className="relative">
        {isDragOver && (
          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-accent-green animate-pulse"></div>
        )}
        <div 
          className="group min-h-[3rem] flex items-center justify-center relative px-sm py-md border border-border/50 rounded-md bg-background-subtle/30 hover:bg-background-subtle/50 transition-colors duration-fast"
          draggable
          onDragStart={(e) => onDragStart?.(e, item.id)}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDrop={(e) => onDrop?.(e, item.id)}
          data-item-id={item.id}
        >
          {/* Drag Handle for divider - always visible on mobile */}
          <div className="absolute left-0 flex items-center justify-center w-10 h-10 opacity-50 group-hover:opacity-100 transition-opacity duration-fast">
            <GripVertical 
              className="w-6 h-6 text-foreground-subtle cursor-grab active:cursor-grabbing touch-manipulation" 
              onMouseDown={(e) => {
                e.currentTarget.style.cursor = 'grabbing';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.cursor = 'grab';
              }}
            />
          </div>
          
          {/* Divider line - centered and more prominent */}
          <div className="flex-1 flex items-center justify-center px-lg">
            <div className="w-full h-px bg-border opacity-50"></div>
            <span className="px-md text-xs text-foreground-muted font-medium bg-background-card rounded-full border border-border/30 mx-md opacity-70 group-hover:opacity-100 transition-opacity duration-fast">
              DIVIDER
            </span>
            <div className="w-full h-px bg-border opacity-50"></div>
          </div>
          
          {/* Delete button for divider - larger and more accessible */}
          <div className="absolute right-0 flex items-center justify-center w-10 h-10 opacity-50 group-hover:opacity-100 transition-opacity duration-fast">
            <button
              onClick={handleImmediateDelete}
              className="w-8 h-8 rounded-full bg-accent-red/20 hover:bg-accent-red/40 transition-all duration-fast flex items-center justify-center touch-manipulation"
            >
              <X className="w-4 h-4 text-accent-red" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isDragOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-accent-green animate-pulse"></div>
      )}
      
      {/* Divider line above bold items */}
      {item.isBold && (
        <div className="mb-sm">
          <div className="w-full h-px bg-border opacity-30"></div>
        </div>
      )}
      
      <div
        className={`group flex items-center gap-sm p-sm rounded-md transition-colors duration-fast min-h-[3rem] ${
          isSelected
            ? "border-2 border-accent-red bg-accent-red/5"
            : "border border-border"
        } ${isChild ? "ml-lg" : ""} ${
          isDeleting ? "animate-slide-out-left" : ""
        }`}
        draggable
        onDragStart={(e) => onDragStart?.(e, item.id)}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop?.(e, item.id)}
        onClick={(e) => {
          // Don't trigger selection if clicking on interactive elements
          if (isEditing || e.target !== e.currentTarget && 
              !(e.target as HTMLElement).closest('.content-area')) {
            return;
          }
          onSelect?.(item.id);
        }}
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
        <div className="flex-1 min-w-0 ml-xs flex items-center content-area">
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
                placeholder="Item..."
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
                <span className="text-foreground-subtle italic">Click to add item...</span>
              )}
            </div>
          )}
        </div>

        {/* Voice Edit Button - only show when editing */}
        {isEditing && (
          <div className="flex-shrink-0 ml-xs relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleVoiceEdit(handleVoiceTranscription);
              }}
              disabled={isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-fast touch-manipulation min-w-12 min-h-12 ${
                isRecording 
                  ? "bg-accent-red text-white animate-pulse" 
                  : "text-foreground-muted hover:text-foreground hover:bg-background-subtle border-2 border-border bg-background-card"
              } ${isProcessing ? "opacity-50" : ""}`}
              type="button"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            {/* Cancel Voice Edit Button */}
            {isRecording && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cancelVoiceEdit();
                }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-accent-red rounded-full flex items-center justify-center hover:bg-accent-red/90 transition-colors duration-fast touch-manipulation z-10"
                type="button"
              >
                <X className="w-4 h-4 text-white" />
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
                 className="fixed inset-0 z-[9998]" 
                 onClick={() => setShowMenu(false)}
               />
              
               {/* Menu */}
               <div className="absolute right-0 top-8 z-[9999] w-48 bg-background-card border border-border rounded-md shadow-lg animate-scale-in">
                <div className="py-sm">
                  {/* View Content */}
                  {item.content && (
                    <button
                      onClick={() => {
                        onViewContent?.(item.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-lg py-md text-left text-sm text-foreground hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm touch-manipulation"
                    >
                      <Info className="w-4 h-4" />
                      View
                    </button>
                  )}
                  
                  {/* Toggle Bold */}
                  <button
                    onClick={() => {
                      onToggleBold(item.id);
                      setShowMenu(false);
                    }}
                    className={`w-full px-lg py-md text-left text-sm hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm touch-manipulation ${
                      item.isBold ? "text-accent-green" : "text-foreground"
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-lg font-bold">T</span>
                    Bold
                  </button>
                  
                  {/* Send to Second List */}
                  {onSendToSecondList && (
                    <button
                      onClick={() => {
                        onSendToSecondList(item.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-lg py-md text-left text-sm text-foreground hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm touch-manipulation"
                    >
                      <ArrowRight className="w-4 h-4" />
                      2nd List
                    </button>
                  )}
                  
                   {/* Delete */}
                   <button
                     onClick={handleImmediateDelete}
                     className="w-full px-lg py-md text-left text-sm text-foreground hover:bg-background-subtle hover:text-accent-red transition-colors duration-fast flex items-center gap-sm touch-manipulation"
                   >
                     <Trash2 className="w-4 h-4" />
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