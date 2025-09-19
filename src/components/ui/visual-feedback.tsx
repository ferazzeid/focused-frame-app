import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualFeedbackProps {
  state: 'idle' | 'processing' | 'success' | 'error';
  className?: string;
}

export const VisualFeedback = ({ state, className }: VisualFeedbackProps) => {
  if (state === 'idle') return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center",
      "bg-background/80 backdrop-blur-sm rounded-full",
      "transition-all duration-200",
      className
    )}>
      {state === 'processing' && (
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      )}
      {state === 'success' && (
        <div className="flex items-center justify-center w-6 h-6 bg-success rounded-full">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      {state === 'error' && (
        <div className="flex items-center justify-center w-6 h-6 bg-destructive rounded-full">
          <X className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};