import { useState, useEffect } from "react";
import { ListItem, ListItemData } from "@/components/ListItem";
import { MobileButton } from "@/components/ui/mobile-button";
import { Plus, Mic, Crown, Lock } from "lucide-react";
import { loadData, saveData, createTextItem, createEmptyItem } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface PremiumListProps {
  isLocked: boolean;
}

export const PremiumList = ({ isLocked }: PremiumListProps) => {
  const [items, setItems] = useState<ListItemData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const data = loadData();
    setItems(data.premiumList);
  }, []);

  const saveItems = (newItems: ListItemData[]) => {
    const data = loadData();
    data.premiumList = newItems;
    saveData(data);
    setItems(newItems);
  };

  const handleVoiceInput = async () => {
    if (isLocked) {
      toast({
        title: "Premium Feature",
        description: "Voice input requires premium subscription",
        variant: "destructive",
      });
      return;
    }

    setIsRecording(true);
    
    // TODO: Implement voice recording and AI summarization
    // For now, show a placeholder
    setTimeout(() => {
      setIsRecording(false);
      toast({
        title: "Voice input coming soon",
        description: "AI-powered voice summarization will be available with backend integration",
      });
    }, 2000);
  };

  const addTextItem = () => {
    if (isLocked) {
      toast({
        title: "Premium Feature",
        description: "Premium list requires subscription",
        variant: "destructive",
      });
      return;
    }

    const newItem = createTextItem("");
    const newItems = [...items, newItem];
    saveItems(newItems);
    setEditingId(newItem.id);
  };

  const updateItem = (id: string, content: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, content: content.trim() } : item
    );
    saveItems(newItems);
  };

  const deleteItem = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    const data = loadData();
    data.archive = [...data.archive, { ...itemToDelete, createdAt: new Date() }];
    saveData(data);

    const newItems = items.filter(item => item.id !== id);
    saveItems(newItems);

    toast({
      title: "Item archived",
      description: "Item moved to archive",
    });
  };

  const toggleBold = (id: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, isBold: !item.isBold } : item
    );
    saveItems(newItems);
  };

  const handleEdit = (id: string) => {
    if (isLocked) {
      toast({
        title: "Premium Feature",
        description: "Premium list requires subscription",
        variant: "destructive",
      });
      return;
    }
    setEditingId(id);
  };

  const handleSave = (id: string) => {
    setEditingId(null);
  };

  if (isLocked) {
    return (
      <div className="flex flex-col h-full">
        {/* Premium Header */}
        <div className="flex-shrink-0 px-md py-md border-b border-border bg-background-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <Crown className="w-5 h-5 text-accent-green" />
              <div>
                <h2 className="text-lg font-medium text-foreground">Premium List</h2>
                <p className="text-xs text-foreground-muted">Voice input + AI summarization</p>
              </div>
            </div>
            <Lock className="w-5 h-5 text-foreground-subtle" />
          </div>
        </div>

        {/* Locked Content */}
        <div className="flex-1 flex items-center justify-center px-md">
          <div className="text-center max-w-sm">
            <Crown className="w-16 h-16 mx-auto mb-lg text-accent-green opacity-50" />
            <h3 className="text-xl font-medium text-foreground mb-sm">Premium Features</h3>
            <p className="text-sm text-foreground-muted mb-lg leading-relaxed">
              Unlock the second list with voice input and AI-powered task summarization. 
              Transform your spoken thoughts into clean, organized 3-word task labels.
            </p>
            <MobileButton variant="primary" className="w-full">
              <Crown className="w-4 h-4 mr-sm" />
              Upgrade to Premium
            </MobileButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Premium Header */}
      <div className="flex-shrink-0 px-md py-md border-b border-border bg-background-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <Crown className="w-5 h-5 text-accent-green" />
            <div>
              <h2 className="text-lg font-medium text-foreground">Premium List</h2>
              <p className="text-xs text-foreground-muted">Voice input + AI summarization</p>
            </div>
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
            <Crown className="w-12 h-12 mx-auto mb-md text-accent-green opacity-50" />
            <p className="text-sm">Your premium list is empty</p>
            <p className="text-xs mt-xs">Use voice input or manual typing</p>
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
            onClick={handleVoiceInput}
            className="flex-1"
            disabled={isRecording}
          >
            <Mic className={`w-4 h-4 mr-sm ${isRecording ? "animate-pulse" : ""}`} />
            {isRecording ? "Listening..." : "Voice Input"}
          </MobileButton>
          <MobileButton
            variant="outline"
            onClick={addTextItem}
            className="px-md"
          >
            <Plus className="w-4 h-4" />
          </MobileButton>
        </div>
      </div>
    </div>
  );
};