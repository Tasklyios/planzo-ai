
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddToCalendarIdea } from "@/types/idea";

interface AddToCalendarDialogProps {
  idea: AddToCalendarIdea | null;
  onOpenChange: (open: boolean) => void;
  onAddToCalendar: () => void;
  onUpdate: (field: keyof AddToCalendarIdea, value: string) => void;
}

const AddToCalendarDialog = ({ 
  idea, 
  onOpenChange, 
  onAddToCalendar,
  onUpdate 
}: AddToCalendarDialogProps) => {
  if (!idea) return null;

  return (
    <Dialog open={!!idea} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Calendar</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input
              id="title"
              type="text"
              value={idea.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">Date</label>
            <input
              id="date"
              type="date"
              value={idea.scheduledFor}
              onChange={(e) => onUpdate('scheduledFor', e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onAddToCalendar}>Add to Calendar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCalendarDialog;
