import { useState, useEffect } from "react";
import { ListItem, ListItemData } from "@/components/ListItem";
import { MobileButton } from "@/components/ui/mobile-button";
import { Archive as ArchiveIcon, Trash2, RotateCcw } from "lucide-react";
import { loadData, saveData } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface ArchiveProps {
  isPremium: boolean;
}

export const Archive = ({ isPremium }: ArchiveProps) => {
  const [items, setItems] = useState<ListItemData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const data = loadData();
    setItems(data.archive.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  }, []);

  const saveArchive = (newItems: ListItemData[]) => {
    const data = loadData();
    data.archive = newItems;
    saveData(data);
    setItems(newItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  };

  const restoreItem = (id: string) => {
    const itemToRestore = items.find(item => item.id === id);
    if (!itemToRestore) return;

    const data = loadData();
    // Add back to free list (could be enhanced to remember original list)
    data.freeList = [...data.freeList, { ...itemToRestore, createdAt: new Date() }];
    
    // Remove from archive
    const newArchive = items.filter(item => item.id !== id);
    data.archive = newArchive;
    saveData(data);
    
    setItems(newArchive);
    
    toast({
      title: "Item restored",
      description: "Item has been restored to your free list",
    });
  };

  const permanentlyDelete = (id: string) => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Permanent deletion requires premium subscription",
        variant: "destructive",
      });
      return;
    }

    const newItems = items.filter(item => item.id !== id);
    saveArchive(newItems);
    
    toast({
      title: "Item permanently deleted",
      description: "This action cannot be undone",
      variant: "destructive",
    });
  };

  const bulkDelete = () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Permanent deletion requires premium subscription",
        variant: "destructive",
      });
      return;
    }

    const newItems = items.filter(item => !selectedItems.has(item.id));
    saveArchive(newItems);
    setSelectedItems(new Set());
    
    toast({
      title: `${selectedItems.size} items permanently deleted`,
      description: "This action cannot be undone",
      variant: "destructive",
    });
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Archive Header */}
      <div className="flex-shrink-0 px-md py-md border-b border-border bg-background-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <ArchiveIcon className="w-5 h-5 text-foreground-muted" />
            <div>
              <h2 className="text-lg font-medium text-foreground">Archive</h2>
              <p className="text-xs text-foreground-muted">
                {isPremium ? "Restore or permanently delete" : "Restore items (permanent deletion requires premium)"}
              </p>
            </div>
          </div>
          <div className="text-xs text-foreground-subtle">
            {items.length} items
          </div>
        </div>
        
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between mt-md pt-md border-t border-border">
            <span className="text-sm text-foreground-muted">
              {selectedItems.size} selected
            </span>
            <MobileButton
              variant="destructive"
              size="sm"
              onClick={bulkDelete}
              disabled={!isPremium}
            >
              <Trash2 className="w-3 h-3 mr-xs" />
              Delete Forever
            </MobileButton>
          </div>
        )}
      </div>

      {/* Archive Content */}
      <div className="flex-1 overflow-y-auto px-md py-md space-y-xs">
        {items.length === 0 ? (
          <div className="text-center py-xl text-foreground-muted">
            <ArchiveIcon className="w-12 h-12 mx-auto mb-md opacity-50" />
            <p className="text-sm">Archive is empty</p>
            <p className="text-xs mt-xs">Deleted items will appear here</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`group p-sm rounded-md border transition-colors duration-fast ${
                selectedItems.has(item.id)
                  ? "border-accent-green bg-accent-green/10"
                  : "border-border hover:border-border-focus"
              }`}
            >
              <div className="flex items-start gap-sm">
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="mt-1 w-4 h-4 rounded border-border text-accent-green focus:ring-accent-green focus:ring-offset-background"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${item.isBold ? "font-bold" : "font-normal"} text-foreground mb-xs`}>
                    {item.content || <span className="italic text-foreground-subtle">Empty item</span>}
                  </div>
                  <div className="text-xs text-foreground-subtle">
                    Archived {formatDate(item.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
                  <MobileButton
                    variant="ghost"
                    size="icon"
                    onClick={() => restoreItem(item.id)}
                    className="w-8 h-8 text-foreground-subtle hover:text-accent-green"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </MobileButton>
                  <MobileButton
                    variant="ghost"
                    size="icon"
                    onClick={() => permanentlyDelete(item.id)}
                    disabled={!isPremium}
                    className="w-8 h-8 text-foreground-subtle hover:text-accent-red disabled:opacity-30"
                  >
                    <Trash2 className="w-3 h-3" />
                  </MobileButton>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};