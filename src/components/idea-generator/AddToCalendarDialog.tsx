
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddToCalendarIdea } from "@/types/idea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Submitting add to calendar form with idea:", idea);
    onAddToCalendar();
  };

  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={!!idea} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Calendar</DialogTitle>
          <DialogDescription>
            Schedule this idea for your content calendar
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              type="text"
              value={idea.title || ""}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">Date</Label>
            <Input
              id="date"
              type="date"
              value={idea.scheduledFor || currentDate}
              onChange={(e) => onUpdate('scheduledFor', e.target.value)}
              className="w-full"
              min={currentDate}
              required
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Note: Adding to calendar will automatically save this idea and move it to your calendar.
          </p>
          <DialogFooter>
            <Button type="submit">Add to Calendar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCalendarDialog;
