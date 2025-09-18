import { useState, useEffect } from "react";
import { ListItem, ListItemData } from "@/components/ListItem";
import { MobileButton } from "@/components/ui/mobile-button";
import { Plus, FileText } from "lucide-react";
import { loadData, saveData, createTextItem, createEmptyItem } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export const FreeList = () => {
  const [items, setItems] = useState<ListItemData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    const newItem = createTextItem("");
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

  const updateItem = (id: string, content: string) => {
    console.log("updateItem called for id:", id, "with content:", content);
    const newItems = items.map(item => 
      item.id === id ? { ...item, content: content.trim() } : item
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

  const handleSave = (id: string) => {
    setEditingId(null);
    // Only remove empty items that are not the one we just edited and not intentional empty lines
    const newItems = items.filter(item => {
      if (item.id === id) return true; // Keep the item we just edited
      return !(item.content.trim() === "" && !item.isEmpty); // Remove other empty text items
    });
    if (newItems.length !== items.length) {
      saveItems(newItems);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* List Header */}
      <div className="flex-shrink-0 px-md py-md border-b border-border bg-background-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">Free List</h2>
            <p className="text-xs text-foreground-muted">Manual input only</p>
          </div>
          <div className="text-xs text-foreground-subtle">
            {items.filter(i => !i.isEmpty).length} items
          </div>
        </div>
      </div>

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
            />
          ))
        )}
      </div>

      {/* Add Actions */}
      <div className="flex-shrink-0 p-md border-t border-border bg-background-subtle">
        <div className="flex gap-sm">
          <MobileButton
            variant="primary"
            onClick={addTextItem}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-sm" />
            Add Item
          </MobileButton>
          <MobileButton
            variant="outline"
            onClick={addEmptyLine}
            className="px-md"
          >
            Add Space
          </MobileButton>
        </div>
      </div>
    </div>
  );
};