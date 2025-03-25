
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export interface DeleteIconProps {
  onDelete: () => void;
  title: string;
  description: string;
  size?: "sm" | "md" | "lg"; // Make size optional with default value in component
}

export function DeleteIcon({ 
  onDelete, 
  title, 
  description, 
  size = "md" // Default size if not provided
}: DeleteIconProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  // Size-based styling
  const getIconSize = () => {
    switch(size) {
      case "sm": return { buttonSize: "h-6 w-6", iconSize: "h-3 w-3" };
      case "lg": return { buttonSize: "h-10 w-10", iconSize: "h-5 w-5" };
      default: return { buttonSize: "h-8 w-8", iconSize: "h-4 w-4" };
    }
  };

  const { buttonSize, iconSize } = getIconSize();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className={buttonSize}>
          <Trash2 className={`${iconSize} text-red-500`} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
