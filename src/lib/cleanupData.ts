import { ListItemData } from "@/components/ListItem";

/**
 * Clean up data to remove invalid items and fix consecutive dividers
 */
export const cleanupItems = (items: ListItemData[]): ListItemData[] => {
  const cleaned: ListItemData[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Skip empty text items (not dividers)
    if (!item.isEmpty && item.title.trim() === "" && item.content.trim() === "") {
      continue;
    }
    
    // Skip consecutive dividers
    if (item.isEmpty) {
      const lastItem = cleaned[cleaned.length - 1];
      if (lastItem && lastItem.isEmpty) {
        continue; // Skip this divider
      }
    }
    
    cleaned.push(item);
  }
  
  return cleaned;
};

/**
 * Validate that an array of items follows the rules
 */
export const validateItems = (items: ListItemData[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for empty text items
  const emptyTextItems = items.filter(item => !item.isEmpty && item.title.trim() === "" && item.content.trim() === "");
  if (emptyTextItems.length > 0) {
    errors.push(`Found ${emptyTextItems.length} empty text items that should be removed`);
  }
  
  // Check for consecutive dividers
  let consecutiveEmpty = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.isEmpty) {
      consecutiveEmpty++;
      if (consecutiveEmpty > 1) {
        errors.push(`Found consecutive dividers at position ${i}`);
        break;
      }
    } else {
      consecutiveEmpty = 0;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};