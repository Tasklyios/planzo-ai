
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/kanban";

const columnFormSchema = z.object({
  title: z.string().min(1, "Column title is required").max(50, "Column title must be less than 50 characters"),
  color: z.string().min(1, "Color is required"),
});

// Predefined color options
const colorOptions = [
  { value: "#6B7280", label: "Gray" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#EC4899", label: "Pink" },
  { value: "#10B981", label: "Emerald" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange" },
  { value: "#84CC16", label: "Lime" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#A855F7", label: "Violet" },
  { value: "#EC4899", label: "Fuchsia" },
  { value: "#F43F5E", label: "Rose" },
];

interface EditColumnDialogProps {
  column: Status | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColumnUpdated: () => void;
}

export function EditColumnDialog({
  column,
  open,
  onOpenChange,
  onColumnUpdated
}: EditColumnDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof columnFormSchema>>({
    resolver: zodResolver(columnFormSchema),
    defaultValues: {
      title: column?.name || "",
      color: column?.color || "#6B7280",
    },
  });

  useEffect(() => {
    if (column && open) {
      form.reset({
        title: column.name,
        color: column.color,
      });
    }
  }, [column, open, form]);

  const onSubmit = async (data: z.infer<typeof columnFormSchema>) => {
    if (!column) return;
    
    try {
      setIsLoading(true);
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to update columns."
        });
        return;
      }
      
      // Update the column in the database
      const { error } = await supabase
        .from('planner_columns')
        .update({ 
          title: data.title,
          color: data.color // Save the color to the database
        })
        .eq('id', column.id)
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      toast({
        title: "Column Updated",
        description: "Your column has been updated successfully."
      });
      
      // Call the callback to refresh the UI
      onColumnUpdated();
      
      // Close the dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating column:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update column. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Column</DialogTitle>
          <DialogDescription>
            Update the column title and color.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter column title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <div
                          key={color.value}
                          className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                            field.value === color.value
                              ? "ring-2 ring-offset-2 ring-primary scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => form.setValue("color", color.value)}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
