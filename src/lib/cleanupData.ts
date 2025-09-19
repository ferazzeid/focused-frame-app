import { ListItemData } from "@/components/ListItem";

/**
 * Clean up data to remove invalid items and fix consecutive dividers
 */
export const cleanupItems = (items: ListItemData[]): ListItemData[] => {
  console.log("=== Starting cleanup process ===");
  console.log("Original items:", items.length);
  console.log("Items before cleanup:", items.map((item, i) => ({ index: i, title: item.title, isEmpty: item.isEmpty })));
  
  const cleaned: ListItemData[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Skip empty text items (not dividers) - these are the "Click to add item..." items
    if (!item.isEmpty && item.title.trim() === "" && item.content.trim() === "") {
      console.log(`Removing empty text item at index ${i}: "${item.title}"`);
      continue;
    }
    
    // Skip consecutive dividers - HARD RULE ENFORCEMENT
    if (item.isEmpty) {
      const lastItem = cleaned[cleaned.length - 1];
      if (lastItem && lastItem.isEmpty) {
        console.log(`REMOVING CONSECUTIVE DIVIDER at index ${i} - HARD RULE VIOLATION`);
        continue; // Skip this divider
      }
    }
    
    cleaned.push(item);
  }
  
  console.log("Cleaned items:", cleaned.length);
  console.log("Items after cleanup:", cleaned.map((item, i) => ({ index: i, title: item.title, isEmpty: item.isEmpty })));
  console.log("=== Cleanup complete ===");
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