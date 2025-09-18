import { useState } from "react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Trash2, GripVertical, Type } from "lucide-react";

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
      <div className="h-6 border-l-2 border-transparent pl-md">
        <div className="text-foreground-subtle text-xs">— empty line —</div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-start gap-sm p-sm rounded-md border border-transparent hover:border-border transition-colors duration-fast ${
        item.isBold ? "mt-md" : ""
      }`}
      draggable
      onDragStart={(e) => onDragStart?.(e, item.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, item.id)}
    >
      {/* Drag Handle */}
      <GripVertical className="w-4 h-4 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-fast mt-1 cursor-grab" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-xs">
        {isEditing ? (
          <div className="space-y-xs">
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="Title..."
              className={`w-full bg-input border border-input-border rounded-sm px-sm py-xs text-sm transition-colors duration-fast focus:border-input-focus focus:outline-none ${
                item.isBold ? "font-bold text-base" : "font-medium"
              }`}
              autoFocus
            />
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              onBlur={handleSave}
              placeholder="Content (optional)..."
              className="w-full bg-input border border-input-border rounded-sm px-sm py-xs text-sm resize-none transition-colors duration-fast focus:border-input-focus focus:outline-none font-normal"
              rows={Math.max(2, Math.ceil(localContent.length / 50))}
            />
          </div>
        ) : (
          <div
            onClick={() => onEdit?.(item.id)}
            className="cursor-text p-sm -m-sm rounded transition-colors duration-fast hover:bg-background-subtle space-y-xs"
          >
            <div className={`${
              item.isBold
                ? "font-bold text-base text-foreground"
                : "font-medium text-foreground"
            }`}>
              {item.title || (
                <span className="text-foreground-subtle italic">Click to add title...</span>
              )}
            </div>
            {item.content && (
              <div className="text-sm text-foreground-muted whitespace-pre-wrap">
                {item.content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
        <MobileButton
          variant="ghost"
          size="icon"
          onClick={() => onToggleBold(item.id)}
          className={`w-8 h-8 ${item.isBold ? "text-accent-green" : "text-foreground-subtle"}`}
        >
          <Type className="w-3 h-3" />
        </MobileButton>
        <MobileButton
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="w-8 h-8 text-foreground-subtle hover:text-accent-red"
        >
          <Trash2 className="w-3 h-3" />
        </MobileButton>
      </div>
    </div>
  );
};