
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddToCalendarIdea } from "@/types/idea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

  // Available colors to choose from
  const colorOptions = [
    { name: "Red", value: "red" },
    { name: "Orange", value: "orange" },
    { name: "Yellow", value: "yellow" },
    { name: "Green", value: "green" },
    { name: "Blue", value: "blue" },
    { name: "Indigo", value: "indigo" },
    { name: "Purple", value: "purple" },
    { name: "Pink", value: "pink" },
  ];

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
          
          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium">Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <div 
                  key={color.value}
                  className={cn(
                    "w-8 h-8 rounded-full cursor-pointer border-2",
                    idea.color === color.value ? "border-primary" : "border-transparent"
                  )}
                  style={{ 
                    backgroundColor: color.value === "red" ? "#ef4444" : 
                      color.value === "orange" ? "#f97316" : 
                      color.value === "yellow" ? "#eab308" :
                      color.value === "green" ? "#22c55e" :
                      color.value === "blue" ? "#3b82f6" :
                      color.value === "indigo" ? "#6366f1" :
                      color.value === "purple" ? "#a855f7" : "#ec4899"
                  }}
                  onClick={() => onUpdate('color', color.value)}
                  title={color.name}
                />
              ))}
            </div>
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
