import { useState, useRef, useCallback } from 'react';

interface TouchDragState {
  isDragging: boolean;
  draggedItem: string | null;
  dragOverItem: string | null;
  dragStartPosition: { x: number; y: number } | null;
  dragCurrentPosition: { x: number; y: number } | null;
}

interface TouchDragHandlers {
  onTouchStart: (e: React.TouchEvent, itemId: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  clearDragState: () => void;
  dragState: TouchDragState;
}

interface UseTouchDragProps {
  onDrop: (draggedId: string, targetId: string) => void;
  onDragStart?: (itemId: string) => void;
  onDragEnd?: () => void;
  dragThreshold?: number;
}

export const useTouchDrag = ({
  onDrop,
  onDragStart,
  onDragEnd,
  dragThreshold = 10,
}: UseTouchDragProps): TouchDragHandlers => {
  const [dragState, setDragState] = useState<TouchDragState>({
    isDragging: false,
    draggedItem: null,
    dragOverItem: null,
    dragStartPosition: null,
    dragCurrentPosition: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartTimeRef = useRef<number | null>(null);

  const clearDragState = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverItem: null,
      dragStartPosition: null,
      dragCurrentPosition: null,
    });
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    onDragEnd?.();
  }, [onDragEnd]);

  const onTouchStart = useCallback((e: React.TouchEvent, itemId: string) => {
    e.preventDefault();
    
    const touch = e.touches[0];
    const startPosition = { x: touch.clientX, y: touch.clientY };
    
    dragStartTimeRef.current = Date.now();
    
    setDragState(prev => ({
      ...prev,
      dragStartPosition: startPosition,
      draggedItem: itemId,
    }));

    // Set up timeout to prevent stuck drag states
    timeoutRef.current = setTimeout(() => {
      console.log('Touch drag timeout - clearing stuck state');
      clearDragState();
    }, 15000); // 15 second timeout
    
  }, [clearDragState]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.draggedItem || !dragState.dragStartPosition) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentPosition = { x: touch.clientX, y: touch.clientY };
    
    // Calculate distance from start
    const deltaX = currentPosition.x - dragState.dragStartPosition.x;
    const deltaY = currentPosition.y - dragState.dragStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Start dragging if we've moved far enough
    if (!dragState.isDragging && distance > dragThreshold) {
      setDragState(prev => ({
        ...prev,
        isDragging: true,
      }));
      onDragStart?.(dragState.draggedItem);
    }
    
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        dragCurrentPosition: currentPosition,
      }));
      
      // Find element under touch point
      const elementBelow = document.elementFromPoint(currentPosition.x, currentPosition.y);
      const listItem = elementBelow?.closest('[data-item-id]');
      const targetId = listItem?.getAttribute('data-item-id');
      
      if (targetId && targetId !== dragState.draggedItem) {
        setDragState(prev => ({
          ...prev,
          dragOverItem: targetId,
        }));
      } else if (targetId === dragState.draggedItem) {
        setDragState(prev => ({
          ...prev,
          dragOverItem: null,
        }));
      }
    }
  }, [dragState, dragThreshold, onDragStart]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (!dragState.isDragging || !dragState.draggedItem) {
      clearDragState();
      return;
    }
    
    const touch = e.changedTouches[0];
    const endPosition = { x: touch.clientX, y: touch.clientY };
    
    // Find the element under the end position
    const elementBelow = document.elementFromPoint(endPosition.x, endPosition.y);
    const listItem = elementBelow?.closest('[data-item-id]');
    const targetId = listItem?.getAttribute('data-item-id');
    
    if (targetId && targetId !== dragState.draggedItem) {
      console.log('Touch drop:', dragState.draggedItem, '->', targetId);
      onDrop(dragState.draggedItem, targetId);
    }
    
    clearDragState();
  }, [dragState, onDrop, clearDragState]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    clearDragState,
    dragState,
  };
};