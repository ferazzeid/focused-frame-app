import { useState, useEffect } from "react";
import { ListItem, ListItemData } from "@/components/ListItem";
import { ContentModal } from "@/components/ContentModal";
import { FileText } from "lucide-react";
import { loadData, saveData, createTextItem, createEmptyItem, archiveItem } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/useNotification";
import { useAuth } from "@/hooks/useAuth";
import { useAddFunctions } from "@/components/MobileLayout";

export const FreeList = () => {
  const [items, setItems] = useState<ListItemData[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<ListItemData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { showSuccess: showNotificationSuccess, showError: showNotificationError } = useNotification();
  const { user } = useAuth();
  const { setAddTextItem, setAddEmptyLine } = useAddFunctions();

  // Handle deselect all event
  useEffect(() => {
    const handleDeselectAll = () => {
      setSelectedItemId(null);
    };

    window.addEventListener('deselect-all-items', handleDeselectAll);
    return () => window.removeEventListener('deselect-all-items', handleDeselectAll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          console.log("=== LOADING DATA ===");
          const data = await loadData();
          console.log("Loaded data from database:", data);
          console.log("Free list items:", data.freeList);
          setItems(data.freeList);
          console.log("Set items state to:", data.freeList);
        } catch (error) {
          console.error("Error loading data:", error);
          toast({
            title: "Error loading data",
            description: "Failed to load your list items",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Register add functions with the context
  useEffect(() => {
    setAddTextItem(() => addTextItem);
    setAddEmptyLine(() => addEmptyLine);
    
    // Cleanup functions when component unmounts
    return () => {
      setAddTextItem(null);
      setAddEmptyLine(null);
    };
  }, [setAddTextItem, setAddEmptyLine]);

  // Calculate which items should be indented as children
  const calculateChildItems = (items: ListItemData[]): boolean[] => {
    const childFlags = new Array(items.length).fill(false);
    let currentParentIndex = -1;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.isBold && !item.isEmpty) {
        // This is a bold item (parent), reset current parent
        currentParentIndex = i;
      } else if (item.isEmpty) {
        // Empty line ends the current parent's children
        currentParentIndex = -1;
      } else if (currentParentIndex !== -1 && i > currentParentIndex) {
        // This is a child of the current parent
        childFlags[i] = true;
      }
    }
    
    return childFlags;
  };

  const childFlags = calculateChildItems(items);

  const saveItems = async (newItems: ListItemData[]) => {
    console.log("saveItems called with:", newItems.length, "items");
    try {
      const data = await loadData();
      data.freeList = newItems;
      await saveData(data);
      console.log("Items saved to database");
      // Don't update state here since we're using functional updates
    } catch (error) {
      console.error("Error saving items:", error);
      toast({
        title: "Error saving",
        description: "Failed to save your changes",
        variant: "destructive",
      });
    }
  };

  const validateBoldItemRules = (newItems: ListItemData[]): boolean => {
    console.log("=== Bold Rules Validation ===");
    for (let i = 0; i < newItems.length; i++) {
      const current = newItems[i];
      const previous = i > 0 ? newItems[i - 1] : null;
      const next = i < newItems.length - 1 ? newItems[i + 1] : null;

      console.log(`Item ${i}: "${current.title}" - Bold: ${current.isBold}, Empty: ${current.isEmpty}`);

      // Bold items must be preceded by blank line (or be first item)
      if (current.isBold && !current.isEmpty && previous && !previous.isEmpty) {
        console.log(`RULE VIOLATION: Bold item "${current.title}" at index ${i} not preceded by blank line`);
        console.log(`Previous item: "${previous.title}" - Empty: ${previous.isEmpty}`);
        return false;
      }

      // Two bold items cannot appear directly under one another
      if (current.isBold && !current.isEmpty && next && next.isBold && !next.isEmpty) {
        console.log(`RULE VIOLATION: Two consecutive bold items "${current.title}" and "${next.title}" at indices ${i} and ${i+1}`);
        return false;
      }
    }
    console.log("Bold rules validation PASSED");
    return true;
  };

  const validateEmptyLineRules = (newItems: ListItemData[]): boolean => {
    console.log("=== Empty Lines Validation ===");
    let consecutiveEmpty = 0;
    for (const item of newItems) {
      if (item.isEmpty) {
        consecutiveEmpty++;
        console.log(`Empty line found: "${item.title}" - Consecutive count: ${consecutiveEmpty}`);
        if (consecutiveEmpty > 1) {
          console.log(`RULE VIOLATION: More than one consecutive empty line`);
          return false;
        }
      } else {
        consecutiveEmpty = 0;
      }
    }
    console.log("Empty line rules validation PASSED");
    return true;
  };

  const addTextItem = () => {
    console.log("addTextItem clicked, current items:", items.length);
    
    // Check if there's already an item with empty title
    const hasEmptyTitleItem = items.some(item => !item.isEmpty && item.title.trim() === "");
    if (hasEmptyTitleItem) {
      toast({
        title: "Complete current item",
        description: "Please add content to the existing empty item before creating a new one",
        variant: "destructive",
      });
      return;
    }
    
    const newItem = createTextItem("", "");
    console.log("Created new item:", newItem);
    
    // Use functional state update to get current items
    setItems(currentItems => {
      console.log("Current items in addTextItem:", currentItems.length);
      let newItems;
      
      // If an item is selected, add as child (with indentation logic)
      if (selectedItemId) {
        const selectedIndex = currentItems.findIndex(item => item.id === selectedItemId);
        if (selectedIndex !== -1) {
          // Insert after the selected item
          newItems = [
            ...currentItems.slice(0, selectedIndex + 1),
            { ...newItem, isChild: true }, // Mark as child for styling
            ...currentItems.slice(selectedIndex + 1)
          ];
        } else {
          // Fallback to append if selected item not found
          newItems = [...currentItems, newItem];
        }
      } else {
        // No selection, add normally at the end
        newItems = [...currentItems, newItem];
      }
      
      const boldValid = validateBoldItemRules(newItems);
      const emptyValid = validateEmptyLineRules(newItems);
      console.log("Validation results - bold:", boldValid, "empty:", emptyValid);
      
      if (boldValid && emptyValid) {
        console.log("Validation passed, saving items and setting editing");
        // Save to database in background
        saveItems(newItems);
        setEditingId(newItem.id);
        console.log("Set editing ID to:", newItem.id);
        return newItems;
      } else {
        console.log("Validation failed");
        toast({
          title: "Cannot add item",
          description: "This would violate formatting rules",
          variant: "destructive",
        });
        return currentItems; // Return unchanged items
      }
    });
  };

  const addEmptyLine = () => {
    console.log("addEmptyLine called");
    
    // Use functional state update to get current items
    setItems(currentItems => {
      console.log("Current items in addEmptyLine:", currentItems.length);
      console.log("Selected item ID:", selectedItemId);
      
      const newItem = createEmptyItem();
      console.log("Created empty item:", newItem);
      
      let newItems: ListItemData[];
      
      if (selectedItemId) {
        // Find the selected item and insert after it
        const selectedIndex = currentItems.findIndex(item => item.id === selectedItemId);
        if (selectedIndex !== -1) {
          newItems = [
            ...currentItems.slice(0, selectedIndex + 1),
            newItem,
            ...currentItems.slice(selectedIndex + 1)
          ];
          console.log(`Inserted empty line after item at index ${selectedIndex}`);
        } else {
          // If selected item not found, add at top
          newItems = [newItem, ...currentItems];
          console.log("Selected item not found, added at top");
        }
      } else {
        // No item selected, add at top
        newItems = [newItem, ...currentItems];
        console.log("No selection, added empty line at top");
      }
      
      if (validateEmptyLineRules(newItems)) {
        console.log("Validation passed, saving items");
        // Clear selection after adding divider
        setSelectedItemId(null);
        // Save to database in background
        saveItems(newItems);
        return newItems;
      } else {
        console.log("Validation failed");
        toast({
          title: "Cannot add empty line",
          description: "No two consecutive empty lines allowed",
          variant: "destructive",
        });
        return currentItems; // Return unchanged items
      }
    });
  };

  const updateItem = async (id: string, title: string, content: string) => {
    console.log("updateItem called for id:", id, "with title:", title, "and content:", content);
    
    // Don't allow empty items
    if (title.trim() === "") {
      toast({
        title: "Item required",
        description: "Items must have content",
        variant: "destructive",
      });
      return;
    }

    let processedTitle = title.trim();
    
    // Check if title has more than 3 words and needs AI summarization
    const wordCount = processedTitle.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 3) {
      try {
        // Import SpeechService dynamically to avoid circular dependencies
        const { SpeechService } = await import("@/lib/speechService");
        const speechService = new SpeechService();
        
        // Use AI to create a 3-word summary
        processedTitle = await speechService.generateSummary(processedTitle);
        
        toast({
          title: "Text summarized",
          description: "Your text was automatically summarized to 3 words",
        });
      } catch (error) {
        console.error("Error generating summary:", error);
        // If AI summarization fails, truncate to first 3 words
        const words = processedTitle.split(/\s+/).filter(word => word.length > 0);
        processedTitle = words.slice(0, 3).join(" ");
        
        toast({
          title: "Text truncated",
          description: "Text was shortened to 3 words (AI summarization unavailable)",
          variant: "destructive",
        });
      }
    }
    
    const newItems = items.map(item => 
      item.id === id ? { ...item, title: processedTitle, content: content.trim() } : item
    );
    
    if (validateBoldItemRules(newItems)) {
      console.log("Item update validation passed, saving");
      saveItems(newItems);
    } else {
      console.log("Item update validation failed");
      toast({
        title: "Invalid formatting",
        description: "Bold items must be preceded by a blank line and cannot be consecutive",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string) => {
    console.log("deleteItem called with id:", id);
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) {
      console.log("Item not found for deletion:", id);
      return;
    }

    console.log("Deleting item:", itemToDelete.title);
    
    try {
      // Archive the item
      await archiveItem(itemToDelete);

      // Remove from current list
      const newItems = items.filter(item => item.id !== id);
      console.log("New items after deletion:", newItems.length, "items");
      
      // Update state first for immediate UI response
      setItems(newItems);
      // Then save to database
      await saveItems(newItems);
      console.log("Item deleted and saved successfully");

      showNotificationSuccess("Item deleted", "Item moved to archive");
    } catch (error) {
      console.error("Error deleting item:", error);
      showNotificationError("Error deleting item", "Failed to delete the item");
    }
  };

  const toggleBold = (id: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, isBold: !item.isBold } : item
    );
    
    if (validateBoldItemRules(newItems)) {
      saveItems(newItems);
    } else {
      toast({
        title: "Cannot make bold",
        description: "Bold items must be preceded by a blank line and cannot be consecutive",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    // Clear selection when editing
    setSelectedItemId(null);
  };

  const handleItemSelect = (id: string) => {
    // Toggle selection - if same item clicked, deselect
    setSelectedItemId(selectedItemId === id ? null : id);
    console.log("Selected item:", selectedItemId === id ? null : id);
  };

  const handleViewContent = (id: string) => {
    const item = items.find(item => item.id === id);
    if (item) {
      setViewingItem(item);
      setIsModalOpen(true);
    }
  };

  const handleModalSave = (id: string, title: string, content: string) => {
    updateItem(id, title, content);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setViewingItem(null);
  };

  const handleSave = (id: string) => {
    setEditingId(null);
    // Only remove empty items that are not the one we just edited and not intentional empty lines
    const newItems = items.filter(item => {
      if (item.id === id) return true; // Keep the item we just edited
      return !(item.title.trim() === "" && item.content.trim() === "" && !item.isEmpty); // Remove other empty text items
    });
    if (newItems.length !== items.length) {
      saveItems(newItems);
    }
  };

  const handleDeleteConfirm = (id: string) => {
    setDeleteItemId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteItemId(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteExecute = () => {
    if (deleteItemId) {
      deleteItem(deleteItemId);
      setDeleteItemId(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleSendToSecondList = async (id: string) => {
    const itemToSend = items.find(item => item.id === id);
    if (!itemToSend) return;

    try {
      const data = await loadData();
      
      // Add to second list with new timestamp and remove bold status
      if (!data.secondList) {
        data.secondList = [];
      }
      data.secondList = [...data.secondList, { ...itemToSend, isBold: false, createdAt: new Date() }];
      
      // Remove from free list
      const newItems = items.filter(item => item.id !== id);
      data.freeList = newItems;
      
      await saveData(data);
      setItems(newItems);

      toast({
        title: "Item moved",
        description: "Item sent to 2nd List successfully",
      });
    } catch (error) {
      console.error("Error moving item:", error);
      toast({
        title: "Error moving item",
        description: "Failed to move the item",
        variant: "destructive",
      });
    }
  };

  const clearDragState = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Set a fallback timeout to clear state in case drag gets stuck
    setTimeout(() => {
      if (draggedItem === id) {
        console.log("Drag timeout - clearing stuck state");
        clearDragState();
      }
    }, 10000); // 10 second timeout
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Find which item we're hovering over by looking at the target element
    const target = e.currentTarget as HTMLElement;
    const itemId = target.closest('[data-item-id]')?.getAttribute('data-item-id');
    
    if (itemId && itemId !== draggedItem) {
      setDragOverItem(itemId);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Always clear drag state when drag ends, regardless of success/failure
    console.log("Drag ended - clearing all drag state");
    clearDragState();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    console.log("Drop event triggered for target:", targetId);
    
    // Clear drag over state immediately
    setDragOverItem(null);
    
    if (!draggedItem || draggedItem === targetId) {
      console.log("Invalid drop - no dragged item or same target");
      clearDragState();
      return;
    }

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      console.log("Invalid indices - clearing drag state");
      clearDragState();
      return;
    }

    const newItems = [...items];
    const [draggedItemData] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItemData);
    
    const boldValid = validateBoldItemRules(newItems);
    const emptyValid = validateEmptyLineRules(newItems);
    
    console.log("Drag validation results:");
    console.log("- Bold rules valid:", boldValid);
    console.log("- Empty rules valid:", emptyValid);
    
    if (boldValid && emptyValid) {
      // Everything is valid, proceed normally
      saveItems(newItems);
    } else if (!boldValid && emptyValid && draggedItemData.isBold) {
      // Bold rules failed but empty rules passed, and the dragged item is bold
      // Try converting the bold item to regular
      const convertedItems = [...newItems];
      const convertedItemIndex = convertedItems.findIndex(item => item.id === draggedItem);
      if (convertedItemIndex !== -1) {
        convertedItems[convertedItemIndex] = { ...convertedItems[convertedItemIndex], isBold: false };
        
        // Validate again with the converted item
        if (validateBoldItemRules(convertedItems)) {
          console.log("Converting bold item to regular to allow drag");
          saveItems(convertedItems);
          toast({
            title: "Item converted",
            description: "Bold item was converted to regular text to allow this arrangement",
          });
        } else {
          // Still invalid even after conversion
          console.log("VALIDATION FAILED - Even after converting bold to regular");
          toast({
            title: "Invalid order",
            description: "This arrangement would violate formatting rules",
            variant: "destructive",
          });
        }
      }
    } else {
      // Other validation failures
      console.log("VALIDATION FAILED - Bold valid:", boldValid, "Empty valid:", emptyValid);
      toast({
        title: "Invalid order",
        description: "This arrangement would violate formatting rules",
        variant: "destructive",
      });
    }
    
    // Always clear all drag state at end of drop
    clearDragState();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* List Content */}
      <div className="flex-1 overflow-y-auto px-md py-md space-y-xs min-h-[400px]">
        {items.length === 0 ? (
          <div className="text-center py-xl text-foreground-muted">
            <FileText className="w-12 h-12 mx-auto mb-md opacity-50" />
            <p className="text-sm">Your list is empty</p>
          </div>
        ) : (
          items.map((item, index) => (
            <ListItem
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onDelete={deleteItem}
              onToggleBold={toggleBold}
              onSendToSecondList={handleSendToSecondList}
              isEditing={editingId === item.id}
              isSelected={selectedItemId === item.id}
              onEdit={handleEdit}
              onSave={handleSave}
              onSelect={handleItemSelect}
              onViewContent={handleViewContent}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isDragOver={dragOverItem === item.id}
              isChild={childFlags[index]}
            />
          ))
        )}
      </div>

      {/* Content Modal */}
      <ContentModal
        item={viewingItem}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
      />
    </div>
  );
};