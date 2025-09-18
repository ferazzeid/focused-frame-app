import { Dialog, DialogContent } from "@/components/ui/dialog";
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
        <div className="pt-md pb-md">
          <p className="text-sm text-foreground-muted">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-sm">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-10 h-10 p-0 rounded-md border border-border hover:bg-background-hover"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            className="rounded-md border border-border"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};