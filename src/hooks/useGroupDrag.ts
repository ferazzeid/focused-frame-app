import { ListItemData } from "@/components/ListItem";

export interface GroupDragResult {
  itemsToMove: ListItemData[];
  newPosition: number;
}

export const useGroupDrag = () => {
  // Get all children of a bold parent item
  const getChildrenOfParent = (items: ListItemData[], parentIndex: number): ListItemData[] => {
    const children: ListItemData[] = [];
    const parentItem = items[parentIndex];
    
    if (!parentItem.isBold || parentItem.isEmpty) {
      return children;
    }
    
    // Find all consecutive items after the parent that are not bold and not empty
    for (let i = parentIndex + 1; i < items.length; i++) {
      const currentItem = items[i];
      
      // Stop if we hit another bold item or reach the end
      if (currentItem.isBold && !currentItem.isEmpty) {
        break;
      }
      
      // Add non-empty items as children
      if (!currentItem.isEmpty) {
        children.push(currentItem);
      }
    }
    
    return children;
  };

  // Calculate what items need to be moved when dragging a bold item
  const calculateGroupMove = (
    items: ListItemData[], 
    draggedId: string, 
    targetId: string
  ): GroupDragResult | null => {
    const draggedIndex = items.findIndex(item => item.id === draggedId);
    const targetIndex = items.findIndex(item => item.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      return null;
    }
    
    const draggedItem = items[draggedIndex];
    
    // If dragging a bold item, include all its children
    if (draggedItem.isBold && !draggedItem.isEmpty) {
      const children = getChildrenOfParent(items, draggedIndex);
      const allItemsToMove = [draggedItem, ...children];
      
      return {
        itemsToMove: allItemsToMove,
        newPosition: targetIndex
      };
    }
    
    // For non-bold items, just move the single item
    return {
      itemsToMove: [draggedItem],
      newPosition: targetIndex
    };
  };

  // Execute the group move operation
  const executeGroupMove = (
    items: ListItemData[],
    draggedId: string,
    targetId: string
  ): ListItemData[] | null => {
    const groupMove = calculateGroupMove(items, draggedId, targetId);
    
    if (!groupMove) {
      return null;
    }
    
    const { itemsToMove, newPosition } = groupMove;
    const newItems = [...items];
    
    // Remove all items to move from their current positions (in reverse order to maintain indices)
    const itemsToRemove = itemsToMove.map(item => 
      newItems.findIndex(existingItem => existingItem.id === item.id)
    ).sort((a, b) => b - a);
    
    itemsToRemove.forEach(index => {
      if (index !== -1) {
        newItems.splice(index, 1);
      }
    });
    
    // Calculate adjusted target position after removals
    const originalTargetIndex = items.findIndex(item => item.id === targetId);
    let adjustedTargetIndex = newItems.findIndex(item => item.id === targetId);
    
    if (adjustedTargetIndex === -1) {
      // Target was removed, use original position adjusted for removals
      adjustedTargetIndex = Math.min(originalTargetIndex, newItems.length);
    }
    
    // Insert all items at the new position
    itemsToMove.forEach((item, index) => {
      newItems.splice(adjustedTargetIndex + index, 0, item);
    });
    
    return newItems;
  };

  return {
    calculateGroupMove,
    executeGroupMove,
    getChildrenOfParent
  };
};