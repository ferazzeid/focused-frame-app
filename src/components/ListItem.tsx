import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { EditableText } from "./EditableText";
import { DraggableWrapper } from "./DraggableWrapper";
import { ActionMenu } from "./ActionMenu";
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  hasChildren?: boolean;
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
  isCollapsed = false,
  onToggleCollapse,
  hasChildren = false,
}: ListItemProps) => {
  const [isInternalEdit, setIsInternalEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Combined editing state - true if either parent says we're editing OR we're internally editing
  const actuallyEditing = isEditing || isInternalEdit;

  const handleStartEdit = () => {
    console.log('Starting edit mode for item:', item.id);
    setIsInternalEdit(true);
    onEdit?.(item.id);
  };

  const handleStopEdit = () => {
    console.log('Stopping edit mode for item:', item.id);
    setIsInternalEdit(false);
    onSave?.(item.id);
  };

  const handleUpdate = (title: string, content: string, fromVoice?: boolean) => {
    onUpdate(item.id, title, content, fromVoice);
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  const handleToggleBold = () => {
    onToggleBold(item.id);
  };

  const handleViewContent = () => {
    onViewContent?.(item.id);
  };

  const handleSendToSecondList = () => {
    onSendToSecondList?.(item.id);
  };

  const handleDeleteConfirm = () => {
    onDeleteConfirm?.(item.id);
  };

  const handleImmediateDelete = () => {
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

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleCollapse?.();
  };

  // Handle empty/divider items
  if (item.isEmpty) {
    return (
      <DraggableWrapper
        id={item.id}
        isDragging={isDragging}
        isDragOver={isDragOver}
        onDragStart={onDragStart!}
        onDragOver={onDragOver!}
        onDragEnd={onDragEnd!}
        onDrop={onDrop!}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`${
          isDragOver ? 'bg-accent-green/20 border-accent-green' : 'bg-background-subtle/30 hover:bg-background-subtle/50'
        } ${isDeleting ? "animate-slide-out-left" : ""} border border-border/50 mb-xs`}
      >
        {/* Divider Content */}
        <div className="flex-1 flex items-center justify-center px-md">
          <div className="w-full h-px bg-border opacity-50"></div>
          <span className="px-sm text-xs text-foreground-muted font-medium bg-background-card rounded-full border border-border/30 mx-sm opacity-70 group-hover:opacity-100 transition-opacity duration-fast">
            DIVIDER
          </span>
          <div className="w-full h-px bg-border opacity-50"></div>
        </div>
        
        {/* Delete button for divider */}
        <div className="flex items-center justify-center w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity duration-fast">
          <button
            onClick={handleImmediateDelete}
            className="w-6 h-6 rounded-full bg-accent-red/20 hover:bg-accent-red/40 transition-all duration-fast flex items-center justify-center touch-manipulation"
          >
            <X className="w-3 h-3 text-accent-red" />
          </button>
        </div>
      </DraggableWrapper>
    );
  }

  // Regular list item
  return (
    <>
      {/* Divider line above bold items */}
      {item.isBold && (
        <div className="mb-xs">
          <div className="w-full h-px bg-border opacity-30"></div>
        </div>
      )}
      
      <div className="relative mb-xs">
        <DraggableWrapper
          id={item.id}
          isDragging={isDragging}
          isDragOver={isDragOver}
          onDragStart={onDragStart!}
          onDragOver={onDragOver!}
          onDragEnd={onDragEnd!}
          onDrop={onDrop!}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={`${
            isSelected
              ? "border-2 border-accent-red bg-accent-red/5"
              : "border border-border"
          } ${isChild ? "ml-md" : ""} ${
            isDeleting ? "animate-slide-out-left" : ""
          }`}
        >
          <EditableText
            id={item.id}
            value={item.title}
            content={item.content}
            isBold={item.isBold}
            isEditing={actuallyEditing}
            onUpdate={handleUpdate}
            onStartEdit={handleStartEdit}
            onStopEdit={handleStopEdit}
            onDelete={handleDelete}
          />

          {!actuallyEditing && (
            <ActionMenu
              id={item.id}
              isBold={item.isBold}
              hasContent={!!(item.content && item.content.trim())}
              onToggleBold={handleToggleBold}
              onViewContent={onViewContent ? handleViewContent : undefined}
              onSendToSecondList={onSendToSecondList ? handleSendToSecondList : undefined}
              onDeleteConfirm={handleDeleteConfirm}
              sendToSecondListLabel={sendToSecondListLabel}
            />
          )}
        </DraggableWrapper>
        
        {/* Collapse/Expand button for bold items with children */}
        {item.isBold && hasChildren && !actuallyEditing && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={handleToggleCollapse}
              className="w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:bg-background-subtle"
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
    </>
  );
};