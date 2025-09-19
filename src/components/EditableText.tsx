import { useState, useRef, useEffect } from "react";
import { Mic, X } from "lucide-react";
import { useVoiceEdit } from "@/hooks/useVoiceEdit";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

interface EditableTextProps {
  id: string;
  value: string;
  content: string;
  isBold: boolean;
  isEditing: boolean;
  onUpdate: (text: string, content: string, fromVoice?: boolean) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDelete: () => void;
  placeholder?: string;
}

export const EditableText = ({
  id,
  value,
  content,
  isBold,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onDelete,
  placeholder = "Item..."
}: EditableTextProps) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    console.log('Saving text:', id, 'with value:', localValue);
    onUpdate(localValue, content);
    onStopEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      onStopEdit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Auto-capitalize first letter
    const capitalizedValue = newValue.length > 0 ? 
      newValue.charAt(0).toUpperCase() + newValue.slice(1) : newValue;
    setLocalValue(capitalizedValue);
  };


  if (isEditing) {
    return (
      <div className="flex-1">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-input border border-input-border rounded-sm px-xs py-xs text-sm transition-colors duration-fast focus:border-input-border focus:ring-0 focus:ring-offset-0 focus:outline-none ${
            isBold ? "font-bold text-base" : "font-normal"
          }`}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      className={`flex-1 cursor-text py-xs rounded transition-colors duration-fast hover:bg-background-subtle flex items-center ${
        isBold
          ? "font-bold text-base text-foreground"
          : "font-light text-sm text-foreground leading-tight"
      }`}
      onClick={onStartEdit}
    >
      {value ? (
        <span>
          {value}
          {content && content.trim() && (
            <span className="text-foreground-subtle ml-xs">*</span>
          )}
        </span>
      ) : (
        <span className="text-foreground-subtle italic">Click to add item...</span>
      )}
    </div>
  );
};