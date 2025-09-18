import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { ListItemData } from "./ListItem";

interface ContentModalProps {
  item: ListItemData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, title: string, content: string) => void;
}

export const ContentModal = ({ item, isOpen, onClose, onSave }: ContentModalProps) => {
  const [title, setTitle] = useState(item?.title || "");
  const [content, setContent] = useState(item?.content || "");

  const handleSave = () => {
    if (item) {
      onSave(item.id, title, content);
      onClose();
    }
  };

  const handleClose = () => {
    if (item) {
      setTitle(item.title);
      setContent(item.content);
    }
    onClose();
  };

  // Update local state when item changes
  useState(() => {
    if (item) {
      setTitle(item.title);
      setContent(item.content);
    }
  });

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border border-border">
        <div className="space-y-md pt-md">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title..."
            className="bg-input border-input-border focus:border-input-border focus:ring-0 focus:ring-offset-0 py-sm flex items-center"
          />
          
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your content here..."
            rows={8}
            className="bg-input border-input-border focus:border-input-border focus:ring-0 focus:ring-offset-0 resize-none py-sm"
          />
        </div>

        <div className="flex justify-end gap-sm pt-md">
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="w-10 h-10 p-0 rounded-md border border-border hover:bg-background-hover"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleSave}
            className="rounded-md border border-border"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};