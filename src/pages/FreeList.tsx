import { useState, useEffect } from "react";
import { ListItem, ListItemData } from "@/components/ListItem";
import { ContentModal } from "@/components/ContentModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { MobileButton } from "@/components/ui/mobile-button";
import { Plus, FileText } from "lucide-react";
import { loadData, saveData, createTextItem, createEmptyItem } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export const FreeList = () => {
  const [items, setItems] = useState<ListItemData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<ListItemData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const data = loadData();
    setItems(data.freeList);
  }, []);

  const saveItems = (newItems: ListItemData[]) => {
    console.log("saveItems called with:", newItems.length, "items");
    const data = loadData();
    data.freeList = newItems;
    saveData(data);
    setItems(newItems);
    console.log("Items saved and state updated");
  };

  const validateBoldItemRules = (newItems: ListItemData[]): boolean => {
    for (let i = 0; i < newItems.length; i++) {
      const current = newItems[i];
      const previous = i > 0 ? newItems[i - 1] : null;
      const next = i < newItems.length - 1 ? newItems[i + 1] : null;

      // Bold items must be preceded by blank line (or be first item)
      if (current.isBold && !current.isEmpty && previous && !previous.isEmpty) {
        return false;
      }

      // Two bold items cannot appear directly under one another
      if (current.isBold && !current.isEmpty && next && next.isBold && !next.isEmpty) {
        return false;
      }
    }
    return true;
  };

  const validateEmptyLineRules = (newItems: ListItemData[]): boolean => {
    let consecutiveEmpty = 0;
    for (const item of newItems) {
      if (item.isEmpty) {
        consecutiveEmpty++;
        if (consecutiveEmpty > 1) {
          return false;
        }
      } else {
        consecutiveEmpty = 0;
      }
    }
    return true;
  };

  const addTextItem = () => {
    console.log("addTextItem clicked, current items:", items.length);
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

  const deleteItem = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    // Move to archive
    const data = loadData();
    data.archive = [...data.archive, { ...itemToDelete, createdAt: new Date() }];
    saveData(data);

    // Remove from current list
    const newItems = items.filter(item => item.id !== id);
    saveItems(newItems);

    toast({
      title: "Item archived",
      description: "Item moved to archive (cannot be permanently deleted in free version)",
    });
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
    
    if (validateBoldItemRules(newItems) && validateEmptyLineRules(newItems)) {
      saveItems(newItems);
    } else {
      toast({
        title: "Invalid order",
        description: "This arrangement would violate formatting rules",
        variant: "destructive",
      });
    }
    
    setDraggedItem(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* List Content */}
      <div className="flex-1 overflow-y-auto px-md py-md space-y-xs">
        {items.length === 0 ? (
          <div className="text-center py-xl text-foreground-muted">
            <FileText className="w-12 h-12 mx-auto mb-md opacity-50" />
            <p className="text-sm">Your free list is empty</p>
            <p className="text-xs mt-xs">Add your first item to get started</p>
          </div>
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onDelete={deleteItem}
              onToggleBold={toggleBold}
              isEditing={editingId === item.id}
              onEdit={handleEdit}
              onSave={handleSave}
              onViewContent={handleViewContent}
              onDeleteConfirm={handleDeleteConfirm}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragOver={dragOverItem === item.id}
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

      {/* Add Actions */}
      <div className="flex-shrink-0 p-md bg-background-subtle">
        <div className="flex gap-sm">
          <MobileButton
            variant="outline"
            onClick={addTextItem}
            className="flex-1 bg-background-subtle text-foreground-muted border-border rounded-md hover:bg-background-hover"
          >
            <Plus className="w-4 h-4 mr-sm" />
            Add Item
          </MobileButton>
          <MobileButton
            variant="outline"
            onClick={addEmptyLine}
            className="px-md bg-background-subtle text-foreground-muted border-border rounded-md hover:bg-background-hover"
          >
            Space
          </MobileButton>
        </div>
      </div>
    </div>
  );
};