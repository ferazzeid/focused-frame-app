import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
        <DialogHeader className="flex flex-row items-center justify-between pr-6">
          <DialogTitle className="text-lg font-medium text-foreground">
            Edit Note
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="w-6 h-6 text-foreground-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-md pt-md">
          <div className="space-y-xs">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              className="bg-input border-input-border focus:border-input-focus"
            />
          </div>
          
          <div className="space-y-xs">
            <Label htmlFor="content" className="text-sm font-medium text-foreground">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your content here..."
              rows={8}
              className="bg-input border-input-border focus:border-input-focus resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-sm pt-md">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};