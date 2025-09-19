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
  const { isRecording, isProcessing, toggleVoiceEdit, cancelVoiceEdit } = useVoiceEdit();
  const { isMobile } = useDeviceDetection();

  // Sync local state when value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleVoiceTranscription = async (transcribedText: string) => {
    console.log("Voice transcription received:", transcribedText);
    
    if (transcribedText.trim() === "") {
      console.log("Empty transcription received, removing item");
      onDelete();
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
      
      setLocalValue(processedText);
      onUpdate(processedText, content, true);
    } catch (error) {
      console.error("Voice transcription processing failed:", error);
      onDelete();
    }
  };

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

  const handleMicrophoneClick = () => {
    console.log('Microphone button clicked');
    toggleVoiceEdit(handleVoiceTranscription);
  };

  if (isEditing) {
    return (
      <div className="flex-1 flex items-center gap-sm">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full bg-input border border-input-border rounded-sm px-sm py-sm text-sm transition-colors duration-fast focus:border-input-border focus:ring-0 focus:ring-offset-0 focus:outline-none ${
              isBold ? "font-bold text-base" : "font-normal"
            }`}
            autoFocus
          />
        </div>
        
        {/* Voice Input Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleMicrophoneClick}
            disabled={isProcessing}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-fast shadow-lg border-2 touch-manipulation ${
              isRecording 
                ? "bg-accent-red text-white animate-pulse shadow-accent-red/40 scale-105 border-accent-red" 
                : "text-accent-red hover:text-white hover:bg-accent-red border-accent-red bg-background-card hover:shadow-xl hover:scale-105"
            } ${isProcessing ? "opacity-75 cursor-wait" : "cursor-pointer"}`}
            type="button"
            aria-label={isRecording ? "Stop recording" : "Start voice recording"}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Mic className={`transition-all duration-fast ${isRecording ? 'w-6 h-6' : 'w-5 h-5'}`} />
            )}
          </button>
          
          {/* Cancel Voice Button */}
          {isRecording && (
            <button
              onClick={cancelVoiceEdit}
              className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red rounded-full flex items-center justify-center hover:bg-accent-red/90 transition-all duration-fast shadow-lg border border-white touch-manipulation"
              type="button"
              aria-label="Cancel voice recording"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 cursor-text py-sm rounded transition-colors duration-fast hover:bg-background-subtle flex items-center ${
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