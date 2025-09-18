import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemTitle: string;
}

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }: DeleteConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-background border border-border">
        <DialogHeader className="flex flex-row items-center justify-between pr-6">
          <DialogTitle className="text-lg font-medium text-foreground">
            Delete Note
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-6 h-6 text-foreground-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="pt-md pb-md">
          <p className="text-sm text-foreground-muted">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-sm">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};