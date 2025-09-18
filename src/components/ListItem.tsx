import { useState } from "react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Trash2, GripVertical, Type } from "lucide-react";

export interface ListItemData {
  id: string;
  content: string;
  isBold: boolean;
  isEmpty: boolean;
  createdAt: Date;
}

interface ListItemProps {
  item: ListItemData;
  onUpdate: (id: string, content: string) => void;
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
  const [localContent, setLocalContent] = useState(item.content);

  const handleSave = () => {
    onUpdate(item.id, localContent);
    onSave?.(item.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
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
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-full bg-input border border-input-border rounded-sm px-sm py-xs text-sm resize-none transition-colors duration-fast focus:border-input-focus focus:outline-none ${
              item.isBold ? "font-bold text-lg" : "font-normal"
            }`}
            rows={Math.max(1, Math.ceil(localContent.length / 40))}
            autoFocus
          />
        ) : (
          <div
            onClick={() => onEdit?.(item.id)}
            className={`cursor-text p-sm -m-sm rounded transition-colors duration-fast hover:bg-background-subtle ${
              item.isBold
                ? "font-bold text-lg text-foreground"
                : "font-normal text-foreground"
            }`}
          >
            {item.content || (
              <span className="text-foreground-subtle italic">Click to edit...</span>
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