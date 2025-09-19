import { GripVertical } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

interface DraggableWrapperProps {
  id: string;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onTouchStart?: (e: React.TouchEvent, id: string) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export const DraggableWrapper = ({
  id,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  children,
  className = ""
}: DraggableWrapperProps) => {
  const { isTouch, isMobile } = useDeviceDetection();

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle touch events on the drag handle, not on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle') && !target.closest('button, input')) {
      onTouchStart?.(e, id);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    onTouchMove?.(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    onTouchEnd?.(e);
  };

  return (
    <div className="relative">
      {isDragOver && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-accent-green animate-pulse rounded-full shadow-lg shadow-accent-green/50"></div>
      )}
      
      <div
        className={`group flex items-center gap-xs p-xs rounded-md transition-all duration-fast min-h-[2.5rem] relative ${
          isDragging ? "opacity-50 scale-95 rotate-1 shadow-lg" : ""
        } ${className}`}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, id)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-item-id={id}
      >
        {/* Drag Handle */}
        <div 
          className={`drag-handle flex items-center justify-center flex-shrink-0 transition-all duration-fast ${
            isTouch || isMobile ? 'w-6 h-6' : 'w-5 h-5'
          } ${isDragging ? 'scale-110' : ''}`}
          draggable={!isTouch}
          onDragStart={(e) => {
            console.log('Drag started from handle:', id);
            onDragStart(e, id);
          }}
          onDragEnd={onDragEnd}
        >
          <GripVertical 
            className={`text-foreground-subtle transition-all duration-fast cursor-grab active:cursor-grabbing touch-manipulation ${
              isTouch || isMobile ? 'w-5 h-5 opacity-80' : 'w-4 h-4 opacity-60 group-hover:opacity-100'
            } ${isDragging ? 'text-accent-green scale-110 opacity-100' : ''}`}
          />
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};