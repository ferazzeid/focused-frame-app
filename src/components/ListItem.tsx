import { useState } from "react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Trash2, GripVertical, Bold, X } from "lucide-react";

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

  const handleSave = () => {
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
        className={`group flex items-start gap-sm p-sm rounded-md border border-border transition-colors duration-fast ${
          item.isBold ? "mt-md" : ""
        } ${isChild ? "ml-lg" : ""}`}
        draggable
        onDragStart={(e) => onDragStart?.(e, item.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, item.id)}
        data-item-id={item.id}
      >
        {/* Drag Handle */}
        <div className="flex items-center justify-center w-6 h-6 mt-0.5">
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
        <div className="flex-1 min-w-0 ml-xs">
          {isEditing ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="Title..."
              className={`w-full bg-input border border-input-border rounded-sm px-sm py-sm text-sm transition-colors duration-fast focus:border-input-border focus:ring-0 focus:ring-offset-0 focus:outline-none ${
                item.isBold ? "font-bold text-base" : "font-normal"
              }`}
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-sm">
              <div
                onClick={() => onEdit?.(item.id)}
                className={`flex-1 cursor-text p-sm -m-sm rounded transition-colors duration-fast hover:bg-background-subtle ${
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
              {item.content && (
                <button
                  onClick={() => onViewContent?.(item.id)}
                  className="text-xs px-sm py-xs rounded-md border border-border bg-background-subtle text-foreground-muted hover:bg-background-hover transition-colors duration-fast"
                >
                  View
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-xs transition-opacity duration-fast">
          <MobileButton
            variant="ghost"
            size="icon"
            onClick={() => onToggleBold(item.id)}
            className={`w-8 h-8 rounded-md border border-transparent hover:border-border ${item.isBold ? "text-accent-green" : "text-foreground-subtle"}`}
          >
            <Bold className="w-3 h-3" />
          </MobileButton>
          <MobileButton
            variant="ghost"
            size="icon"
            onClick={() => onDeleteConfirm?.(item.id)}
            className="w-8 h-8 rounded-md border border-transparent hover:border-border text-foreground-subtle hover:text-accent-red"
          >
            <Trash2 className="w-3 h-3" />
          </MobileButton>
        </div>
      </div>
    </div>
  );
};