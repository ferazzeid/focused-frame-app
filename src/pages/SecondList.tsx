import { useState, useEffect } from "react";
import { ListItem, ListItemData } from "@/components/ListItem";
import { ContentModal } from "@/components/ContentModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { FileText } from "lucide-react";
import { loadData, saveData, createTextItem, createEmptyItem, archiveItem } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAddFunctions } from "@/components/MobileLayout";

export const SecondList = () => {
  const [items, setItems] = useState<ListItemData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<ListItemData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setAddTextItem, setAddEmptyLine } = useAddFunctions();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const data = await loadData();
          setItems(data.secondList);
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
      setItems(newItems);
      console.log("Items saved and state updated");
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
    const newItems = [...items, newItem];
    
    const boldValid = validateBoldItemRules(newItems);
    const emptyValid = validateEmptyLineRules(newItems);
    console.log("Validation results - bold:", boldValid, "empty:", emptyValid);
    
    if (boldValid && emptyValid) {
      console.log("Validation passed, saving items and setting editing");
      saveItems(newItems);
      setEditingId(newItem.id);
      console.log("Set editing ID to:", newItem.id);
    } else {
      console.log("Validation failed");
      toast({
        title: "Cannot add item",
        description: "This would violate formatting rules",
        variant: "destructive",
      });
    }
  };

  const addEmptyLine = () => {
    console.log("addEmptyLine called");
    
    const newItem = createEmptyItem();
    console.log("Created empty item:", newItem);
    
    let newItems: ListItemData[];
    
    if (selectedItemId) {
      // Find the selected item and insert after it
      const selectedIndex = items.findIndex(item => item.id === selectedItemId);
      if (selectedIndex !== -1) {
        newItems = [
          ...items.slice(0, selectedIndex + 1),
          newItem,
          ...items.slice(selectedIndex + 1)
        ];
        console.log(`Inserted empty line after item at index ${selectedIndex}`);
      } else {
        // If selected item not found, add at top
        newItems = [newItem, ...items];
        console.log("Selected item not found, added at top");
      }
    } else {
      // No item selected, add at top
      newItems = [newItem, ...items];
      console.log("No selection, added empty line at top");
    }
    
    if (validateEmptyLineRules(newItems)) {
      console.log("Validation passed, saving items");
      // Clear selection after adding divider
      setSelectedItemId(null);
      saveItems(newItems);
    } else {
      console.log("Validation failed");
      toast({
        title: "Cannot add empty line",
        description: "No two consecutive empty lines allowed",
        variant: "destructive",
      });
    }
  };
    const newItem = createEmptyItem();
    const newItems = [...items, newItem];
    
    if (validateEmptyLineRules(newItems)) {
      saveItems(newItems);
    } else {
      toast({
        title: "Cannot add empty line",
        description: "No two consecutive empty lines allowed",
        variant: "destructive",
      });
    }
  };

  const updateItem = (id: string, title: string, content: string) => {
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
    
    const newItems = items.map(item => 
      item.id === id ? { ...item, title: title.trim(), content: content.trim() } : item
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
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    try {
      // Archive the item
      await archiveItem(itemToDelete);

      // Remove from current list
      const newItems = items.filter(item => item.id !== id);
      await saveItems(newItems);

      toast({
        title: "Item archived",
        description: "Item moved to archive (cannot be permanently deleted in free version)",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error deleting item",
        description: "Failed to delete the item",
        variant: "destructive",
      });
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

  const handleSendToFreeList = async (id: string) => {
    const itemToSend = items.find(item => item.id === id);
    if (!itemToSend) return;

    try {
      const data = await loadData();
      
      // Add to free list with new timestamp and remove bold status
      data.freeList = [...data.freeList, { ...itemToSend, isBold: false, createdAt: new Date() }];
      
      // Remove from second list
      const newItems = items.filter(item => item.id !== id);
      data.secondList = newItems;
      
      await saveData(data);
      setItems(newItems);

      toast({
        title: "Item moved",
        description: "Item sent to List successfully",
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Find which item we're hovering over by looking at the target element
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const itemId = target.closest('[data-item-id]')?.getAttribute('data-item-id');
    
    if (itemId && itemId !== draggedItem) {
      setDragOverItem(itemId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
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
    
    setDraggedItem(null);
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
            <p className="text-sm">Your second list is empty</p>
          </div>
        ) : (
          items.map((item, index) => (
            <ListItem
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onDelete={deleteItem}
              onToggleBold={toggleBold}
              onSendToSecondList={handleSendToFreeList}
              sendToSecondListLabel="Send to List"
              isEditing={editingId === item.id}
              isSelected={selectedItemId === item.id}
              onEdit={handleEdit}
              onSave={handleSave}
              onSelect={handleItemSelect}
              onViewContent={handleViewContent}
              onDeleteConfirm={handleDeleteConfirm}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteExecute}
        itemTitle=""
      />
    </div>
  );
};
