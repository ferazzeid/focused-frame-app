import { useState } from "react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Trash2, GripVertical, Bold, X, Mic, MoreVertical, Info, ArrowRight } from "lucide-react";
import { useVoiceEdit } from "@/hooks/useVoiceEdit";
import { useToast } from "@/hooks/use-toast";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

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
  onTouchStart?: (e: React.TouchEvent, id: string) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  isEditing?: boolean;
  isSelected?: boolean;
  onEdit?: (id: string) => void;
  onSave?: (id: string, fromVoice?: boolean) => void;
  onSelect?: (id: string) => void;
  onViewContent?: (id: string) => void;
  onDeleteConfirm?: (id: string) => void;
  isDragOver?: boolean;
  isDragging?: boolean;
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
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isEditing = false,
  isSelected = false,
  onEdit,
  onSave,
  onSelect,
  onViewContent,
  onDeleteConfirm,
  isDragOver = false,
  isDragging = false,
  isChild = false,
}: ListItemProps) => {
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localContent, setLocalContent] = useState(item.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isRecording, isProcessing, toggleVoiceEdit, cancelVoiceEdit } = useVoiceEdit();
  const { toast } = useToast();
  const { isMobile, isTouch } = useDeviceDetection();

  const handleVoiceTranscription = async (transcribedText: string) => {
    console.log("Voice transcription received:", transcribedText);
    
    if (transcribedText.trim() === "") {
      console.log("Empty transcription received, removing item");
      onDelete(item.id);
      return;
    }

    let processedText = transcribedText.trim();
    
    try {
      const wordCount = processedText.split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount > 3) {
        try {
          console.log("Generating AI summary for:", processedText);
          const { SpeechService } = await import("@/lib/speechService");
          const speechService = new SpeechService();
          
          processedText = await speechService.generateSummary(processedText);
          console.log("AI summary generated:", processedText);
        } catch (error) {
          console.error("Error generating summary for voice:", error);
          const words = processedText.split(/\s+/).filter(word => word.length > 0);
          processedText = words.slice(0, 3).join(" ");
          console.log("Using truncated text:", processedText);
        }
      }
      
      setLocalTitle(processedText);
      onUpdate(item.id, processedText, localContent, true);
    } catch (error) {
      console.error("Voice transcription processing failed:", error);
      onDelete(item.id);
    }
  };

  // Simple click handler - always enters edit mode
  const handleItemClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Don't trigger if already editing
    if (isEditing) {
      return;
    }
    
    // Don't trigger if clicking on interactive elements (buttons, inputs, drag handle)
    if (target.closest('button') || 
        target.closest('input') || 
        target.closest('.grip-vertical') ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT') {
      return;
    }
    
    e.stopPropagation();
    console.log('Item clicked, entering edit mode:', item.id);
    onEdit?.(item.id);
  };

  const handleMicrophoneClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Microphone activated');
    toggleVoiceEdit(handleVoiceTranscription);
  };

  const handleMenuToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleTouchEvents = (e: React.TouchEvent, eventType: 'start' | 'move' | 'end') => {
    const target = e.target as HTMLElement;
    
    // Allow touch events on interactive elements
    if (target.closest('button') || target.closest('input')) {
      return;
    }
    
    // Pass through to drag handlers
    switch (eventType) {
      case 'start':
        onTouchStart?.(e, item.id);
        break;
      case 'move':
        onTouchMove?.(e);
        break;
      case 'end':
        onTouchEnd?.(e);
        break;
    }
  };

  const handleSave = () => {
    // Save whatever the user typed - no validation here
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
          <div className="absolute -top-1 left-0 right-0 h-1 bg-accent-green animate-pulse rounded-full shadow-lg shadow-accent-green/50"></div>
        )}
        <div 
          className={`group min-h-[3rem] flex items-center justify-center relative px-sm py-md border border-border/50 rounded-md transition-all duration-fast ${
            isDragOver ? 'bg-accent-green/20 border-accent-green' : 'bg-background-subtle/30 hover:bg-background-subtle/50'
          } ${isDragging ? 'opacity-50 scale-95 shadow-lg' : ''}`}
          draggable={!isTouch}
          onDragStart={(e) => onDragStart?.(e, item.id)}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDrop={(e) => onDrop?.(e, item.id)}
          onTouchStart={(e) => onTouchStart?.(e, item.id)}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          data-item-id={item.id}
        >
          {/* Drag Handle for divider - enhanced for touch */}
          <div className={`absolute left-0 flex items-center justify-center w-10 h-10 transition-all duration-fast ${
            isTouch || isMobile ? 'opacity-80' : 'opacity-50 group-hover:opacity-100'
          } ${isDragging ? 'scale-110 opacity-100' : ''}`}>
            <GripVertical 
              className={`text-foreground-subtle cursor-grab active:cursor-grabbing touch-manipulation transition-all duration-fast ${
                isTouch || isMobile ? 'w-7 h-7' : 'w-6 h-6'
              } ${isDragging ? 'text-accent-green scale-110' : ''}`}
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
          <div className="absolute -top-1 left-0 right-0 h-1 bg-accent-green animate-pulse rounded-full shadow-lg shadow-accent-green/50"></div>
        )}
        
        {/* Divider line above bold items */}
        {item.isBold && (
          <div className="mb-sm">
            <div className="w-full h-px bg-border opacity-30"></div>
          </div>
        )}
        
        <div
          className={`group flex items-center gap-sm p-sm rounded-md transition-all duration-fast min-h-[3rem] relative ${
            isSelected
              ? "border-2 border-accent-red bg-accent-red/5"
              : "border border-border"
          } ${isChild ? "ml-lg" : ""} ${
            isDeleting ? "animate-slide-out-left" : ""
          } ${isDragging ? "opacity-50 scale-95 rotate-1 shadow-lg" : ""}`}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop?.(e, item.id)}
          onTouchStart={(e) => handleTouchEvents(e, 'start')}
          onTouchMove={(e) => handleTouchEvents(e, 'move')}
          onTouchEnd={(e) => handleTouchEvents(e, 'end')}
          onClick={handleItemClick}
          data-item-id={item.id}
        >
        {/* Enhanced Drag Handle */}
        <div 
          className={`flex items-center justify-center flex-shrink-0 transition-all duration-fast ${
            isTouch || isMobile ? 'w-8 h-8' : 'w-6 h-6'
          } ${isDragging ? 'scale-110' : ''}`}
          draggable={true}
          onDragStart={(e) => {
            console.log('Drag started from handle:', item.id);
            onDragStart?.(e, item.id);
          }}
          onDragEnd={onDragEnd}
        >
          <GripVertical 
            className={`grip-vertical text-foreground-subtle transition-all duration-fast cursor-grab active:cursor-grabbing touch-manipulation ${
              isTouch || isMobile ? 'w-6 h-6 opacity-80' : 'w-5 h-5 opacity-60 group-hover:opacity-100'
            } ${isDragging ? 'text-accent-green scale-110 opacity-100' : ''}`}
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
            <div className="relative w-full pr-16">
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
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Item..."
                className={`w-full bg-input border border-input-border rounded-sm px-sm py-sm text-sm transition-colors duration-fast focus:border-input-border focus:ring-0 focus:ring-offset-0 focus:outline-none ${
                  item.isBold ? "font-bold text-base" : "font-normal"
                }`}
                autoFocus
              />
            </div>
          ) : (
            <div
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

        {/* Unified Voice Edit Button */}
        {isEditing && (
          <div className="flex-shrink-0 ml-xs">
            <div className="relative">
              <button
                onClick={handleMicrophoneClick}
                onTouchEnd={handleMicrophoneClick}
                disabled={isProcessing}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-fast shadow-lg border-2 touch-manipulation ${
                  isRecording 
                    ? "bg-accent-red text-white animate-pulse shadow-accent-red/40 scale-105 border-accent-red" 
                    : "text-accent-red hover:text-white hover:bg-accent-red border-accent-red bg-background-card hover:shadow-xl hover:scale-105 active:scale-95"
                } ${isProcessing ? "opacity-75 cursor-wait" : "cursor-pointer"}`}
                type="button"
                aria-label={isRecording ? "Stop recording" : "Start voice recording"}
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mic className={`transition-all duration-fast ${isRecording ? 'w-7 h-7' : 'w-6 h-6'}`} />
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
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cancelVoiceEdit();
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-accent-red rounded-full flex items-center justify-center hover:bg-accent-red/90 transition-all duration-fast shadow-lg border border-white touch-manipulation"
                  type="button"
                  aria-label="Cancel voice recording"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions - Three Dots Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={handleMenuToggle}
            onTouchEnd={handleMenuToggle}
            className="w-10 h-10 rounded-md border border-transparent hover:border-border text-foreground-subtle hover:text-foreground transition-colors duration-fast flex items-center justify-center touch-manipulation"
          >
            <MoreVertical className="w-5 h-5" />
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
                     className="w-full px-lg py-md text-left text-sm text-foreground hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm"
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
                    className={`w-full px-lg py-md text-left text-sm hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm ${
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
                      className="w-full px-lg py-md text-left text-sm text-foreground hover:bg-background-subtle transition-colors duration-fast flex items-center gap-sm"
                    >
                      <ArrowRight className="w-4 h-4" />
                      2nd List
                    </button>
                  )}
                  
                   {/* Delete */}
                   <button
                     onClick={handleImmediateDelete}
                     className="w-full px-lg py-md text-left text-sm text-foreground hover:bg-background-subtle hover:text-accent-red transition-colors duration-fast flex items-center gap-sm"
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