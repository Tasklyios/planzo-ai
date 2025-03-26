
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface DeleteIconProps {
  onDelete: () => void;
  title: string;
  description: string;
  isRemoveFromCalendar?: boolean;
  size?: string; // Add the size prop
}

export function DeleteIcon({ 
  onDelete, 
  title, 
  description, 
  isRemoveFromCalendar = false,
  size = "icon" // Default value for the size prop
}: DeleteIconProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = () => {
    setOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      setOpen(false);
      toast({
        title: isRemoveFromCalendar ? "Removed" : "Deleted",
        description: isRemoveFromCalendar 
          ? "The item has been removed from the calendar." 
          : "The item has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isRemoveFromCalendar ? "remove" : "delete"}. Please try again.`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size={size as any} // Use the size prop
        onClick={handleDeleteClick}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">{isRemoveFromCalendar ? "Remove" : "Delete"}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className={isDeleting ? "opacity-70 cursor-not-allowed" : ""}
            >
              {isDeleting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isRemoveFromCalendar ? "Removing..." : "Deleting..."}
                </>
              ) : (
                isRemoveFromCalendar ? "Remove" : "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
