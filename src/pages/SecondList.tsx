import { useState, useEffect } from "react";
import { ListItem, ListItemData } from "@/components/ListItem";
import { ContentModal } from "@/components/ContentModal";
import { FileText } from "lucide-react";
import { loadData, saveData, createTextItem, createEmptyItem, archiveItem } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/useNotification";
import { useAuth } from "@/hooks/useAuth";
import { useAddFunctions } from "@/components/MobileLayout";
import { cleanupItems } from "@/lib/cleanupData";
import { useTouchDrag } from "@/hooks/useTouchDrag";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useGroupDrag } from "@/hooks/useGroupDrag";

export const SecondList = () => {
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
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { showSuccess: showNotificationSuccess, showError: showNotificationError } = useNotification();
  const { user } = useAuth();
  const { setAddTextItem, setAddEmptyLine } = useAddFunctions();
  const { isMobile, isTouch } = useDeviceDetection();
  const { executeGroupMove, getChildrenOfParent } = useGroupDrag();

  // Touch drag handlers for mobile compatibility with group drag support
  const touchDragHandlers = useTouchDrag({
    onDrop: (draggedId, targetId) => {
      console.log("Touch drop:", draggedId, "->", targetId);
      
      // Use group drag logic for both single items and groups
      const newItems = executeGroupMove(items, draggedId, targetId);
      
      if (!newItems) {
        console.log("Invalid touch drop - group move failed");
        return;
      }
      
      const boldValid = validateBoldItemRules(newItems);
      const emptyValid = validateEmptyLineRules(newItems);
      
      if (boldValid && emptyValid) {
        console.log("Touch drop successful - updating items");
        saveItems(newItems);
        toast({
          title: "Item moved",
          description: "Item reordered successfully",
        });
      } else {
        console.log("Touch drop validation failed");
        toast({
          title: "Cannot move item",
          description: "This would break formatting rules",
          variant: "destructive",
        });
      }
    },
    onDragStart: (itemId) => {
      console.log("Touch drag started:", itemId);
      setDraggedItem(itemId);
    },
    onDragEnd: () => {
      console.log("Touch drag ended");
      clearDragState();
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const data = await loadData();
          
          // Force cleanup on data load - remove existing problematic items
          const cleanedItems = cleanupItems(data.secondList);
          console.log("Original secondList length:", data.secondList.length);
          console.log("Cleaned items length:", cleanedItems.length);
          
          if (cleanedItems.length !== data.secondList.length) {
            console.log(`Forced cleanup: removed ${data.secondList.length - cleanedItems.length} invalid items on load`);
            // Save cleaned data back immediately
            const updatedData = { ...data, secondList: cleanedItems };
            await saveData(updatedData);
            setItems(cleanedItems);
          } else {
            console.log("No cleanup needed, setting items as-is");
            setItems(data.secondList);
          }
        } catch (error) {
          console.error("Error loading data:", error);
          toast({
            title: "Error loading data",
            description: "Please try refreshing the page",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user, toast]);

  // Handle deselect all event
  useEffect(() => {
    const handleDeselectAll = () => {
      setSelectedItemId(null);
    };

    window.addEventListener('deselect-all-items', handleDeselectAll);
    return () => window.removeEventListener('deselect-all-items', handleDeselectAll);
  }, []);

  // Register add functions in context for use by mobile layout
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
        childFlags[i] = false; // Parent is not a child
      } else if (currentParentIndex !== -1 && i > currentParentIndex) {
        // This is a child of the current parent
        childFlags[i] = true;
      }
    }
    
    return childFlags;
  };

  const childFlags = calculateChildItems(items);
  
  // Calculate which bold items have children
  const getItemHasChildren = (itemId: string): boolean => {
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) return false;
    
    const item = items[index];
    if (!item.isBold || item.isEmpty) return false;
    
    const children = getChildrenOfParent(items, index);
    return children.length > 0;
  };

  // Handle collapse/expand
  const handleToggleCollapse = (itemId: string) => {
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Filter items for display based on collapse state
  const getVisibleItems = (): ListItemData[] => {
    const visibleItems: ListItemData[] = [];
    let skipUntilNextParent = false;
    let currentParentIndex = -1;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.isBold && !item.isEmpty) {
        // This is a parent item - always show it
        currentParentIndex = i;
        skipUntilNextParent = collapsedItems.has(item.id);
        visibleItems.push(item);
      } else if (skipUntilNextParent) {
        // Skip children of collapsed parent
        continue;
      } else {
        // Show this item (child or non-child)
        visibleItems.push(item);
      }
    }
    
    return visibleItems;
  };

  const visibleItems = getVisibleItems();

  const saveItems = async (newItems: ListItemData[]) => {
    console.log("saveItems called with:", newItems.length, "items");
    
    // Force cleanup before saving to remove any consecutive dividers
    const cleanedItems = cleanupItems(newItems);
    console.log("Items after cleanup:", cleanedItems.length);
    
    try {
      const data = await loadData();
      data.secondList = cleanedItems;
      await saveData(data);
      console.log("Items saved to database");
      // Don't update state here since we're using functional updates
    } catch (error) {
      console.error("Error saving items:", error);
      toast({
        title: "Error saving items",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const validateBoldItemRules = (items: ListItemData[]): boolean => {
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      
      // Skip validation for empty items
      if (currentItem.isEmpty) continue;
      
      // Check if bold item has proper spacing
      if (currentItem.isBold) {
        // Bold items must have an empty line before them (except if they're first)
        const prevItem = i > 0 ? items[i - 1] : null;
        if (prevItem && !prevItem.isEmpty) {
          console.log(`Bold item "${currentItem.title}" at index ${i} must have empty line before it`);
          return false;
        }
      }
    }
    return true;
  };

  const validateEmptyLineRules = (items: ListItemData[]): boolean => {
    let previousWasEmpty = false;
    
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      
      if (currentItem.isEmpty) {
        // No consecutive empty lines allowed
        if (previousWasEmpty) {
          console.log(`Consecutive empty lines at index ${i}`);
          return false;
        }
        previousWasEmpty = true;
      } else {
        previousWasEmpty = false;
      }
    }
    return true;
  };

  const addTextItem = async () => {
    const newItem = createTextItem("", "");
    console.log("Adding new text item to SecondList:", newItem);
    
    const newItems = [...items, newItem];
    setItems(newItems);
    setEditingId(newItem.id);
    
    // Save in background
    saveItems(newItems);
  };

  const addEmptyLine = async () => {
    // Check if the last item is already empty
    if (items.length > 0 && items[items.length - 1].isEmpty) {
      toast({
        title: "Cannot add divider",
        description: "The last item is already a divider",
        variant: "destructive",
      });
      return;
    }

    const newItem = createEmptyItem();
    console.log("Adding new empty line to SecondList:", newItem);
    
    const newItems = [...items, newItem];
    setItems(newItems);
    
    // Save in background
    saveItems(newItems);
  };

  const updateItem = (id: string, title: string, content: string, fromVoice?: boolean) => {
    console.log("Updating item:", id, "title:", title, "content:", content, "fromVoice:", fromVoice);
    
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, title: title.trim(), content: content.trim() }
        : item
    ));

    // Save the updated items to the database
    const updatedItems = items.map(item => 
      item.id === id 
        ? { ...item, title: title.trim(), content: content.trim() }
        : item
    );
    
    // Save in background
    saveItems(updatedItems);
  };

  const deleteItem = async (id: string) => {
    console.log("Deleting item:", id);
    
    try {
      const itemToDelete = items.find(item => item.id === id);
      if (itemToDelete) {
        // Archive the item
        await archiveItem(itemToDelete);
        console.log("Item archived successfully");
      }
      
      // Remove from current list
      const newItems = items.filter(item => item.id !== id);
      setItems(newItems);
      
      // Also stop editing if this was the editing item
      if (editingId === id) {
        setEditingId(null);
      }
      
      // Save in background
      saveItems(newItems);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error deleting item",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const toggleBold = (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) return;

    const newItems = [...items];
    const itemIndex = newItems.findIndex(item => item.id === id);
    const updatedItem = { ...newItems[itemIndex], isBold: !newItems[itemIndex].isBold };
    newItems[itemIndex] = updatedItem;

    // Validate the change
    if (validateBoldItemRules(newItems) && validateEmptyLineRules(newItems)) {
      setItems(newItems);
      saveItems(newItems);
    } else {
      toast({
        title: "Cannot change formatting",
        description: "This would violate formatting rules. Bold items must be preceded by a blank line.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleItemSelect = (id: string) => {
    setSelectedItemId(prev => prev === id ? null : id);
  };

  const handleViewContent = (id: string) => {
    const item = items.find(item => item.id === id);
    if (item) {
      setViewingItem(item);
      setIsModalOpen(true);
    }
  };

  const handleModalSave = (content: string) => {
    if (viewingItem) {
      updateItem(viewingItem.id, viewingItem.title, content);
      setIsModalOpen(false);
      setViewingItem(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setViewingItem(null);
  };

  const handleSave = (id: string, fromVoice?: boolean) => {
    console.log('handleSave called for item:', id);
    setEditingId(null);
    
    if (fromVoice) return;
    
    // Clean up items: remove any that are completely empty
    const currentItems = [...items];
    const cleanedItems = currentItems.filter(item => {
      if (item.isEmpty) return true; // Keep dividers
      return item.title.trim() !== '' || item.content.trim() !== ''; // Keep items with content
    });
    
    if (cleanedItems.length !== currentItems.length) {
      console.log('Cleaned up empty items during save');
      setItems(cleanedItems);
      saveItems(cleanedItems);
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

    // Use group drag logic for both single items and groups
    const newItems = executeGroupMove(items, draggedItem, targetId);
    
    if (!newItems) {
      console.log("Invalid drop - group move failed");
      clearDragState();
      return;
    }
    
    const boldValid = validateBoldItemRules(newItems);
    const emptyValid = validateEmptyLineRules(newItems);
    
    if (boldValid && emptyValid) {
      setItems(newItems);
      saveItems(newItems);
      toast({
        title: "Item moved",
        description: "Item and children moved successfully",
      });
    } else {
      toast({
        title: "Invalid order",
        description: "This arrangement would violate formatting rules",
        variant: "destructive",
      });
    }
    
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
      <div className="flex-1 overflow-y-auto px-md py-md space-y-0 min-h-[400px]">
        {items.length === 0 ? (
          <div className="text-center py-xl text-foreground-muted">
            <FileText className="w-12 h-12 mx-auto mb-md opacity-50" />
            <p className="text-sm">Your second list is empty</p>
          </div>
        ) : (
          visibleItems.map((item, index) => {
            const originalIndex = items.findIndex(i => i.id === item.id);
            return (
              <ListItem
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onToggleBold={toggleBold}
                onSendToSecondList={handleSendToFreeList}
                sendToSecondListLabel="Send to 1st List"
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                onTouchStart={touchDragHandlers.onTouchStart}
                onTouchMove={touchDragHandlers.onTouchMove}
                onTouchEnd={touchDragHandlers.onTouchEnd}
                isEditing={editingId === item.id}
                isSelected={selectedItemId === item.id}
                onEdit={handleEdit}
                onSave={handleSave}
                onSelect={handleItemSelect}
                onViewContent={handleViewContent}
                onDeleteConfirm={handleDeleteConfirm}
                isDragOver={dragOverItem === item.id}
                isDragging={touchDragHandlers.dragState.isDragging && touchDragHandlers.dragState.draggedItem === item.id}
                isChild={childFlags[originalIndex]}
                isCollapsed={collapsedItems.has(item.id)}
                onToggleCollapse={() => handleToggleCollapse(item.id)}
                hasChildren={getItemHasChildren(item.id)}
              />
            );
          })
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