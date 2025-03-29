
import { Draggable } from "react-beautiful-dnd";
import { Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteIcon } from "./DeleteIcon";
import EditIdea from "@/components/EditIdea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PlannerCardProps {
  id: string;
  index: number;
  title: string;
  description?: string;
  color?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isOnCalendar?: boolean;
}

export function PlannerCard({ 
  id, 
  index, 
  title,
  description,
  color = "blue",
  onEdit,
  onDelete,
  isOnCalendar = false
}: PlannerCardProps) {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getColorValue = (color: string | null | undefined): string => {
    if (!color) return "#3b82f6"; // Default to blue if color is null or undefined
    
    const colorMap: Record<string, string> = {
      red: "#ef4444",
      orange: "#f97316",
      yellow: "#eab308",
      green: "#22c55e",
      blue: "#3b82f6",
      indigo: "#6366f1",
      purple: "#a855f7",
      pink: "#ec4899",
    };
    
    return color.startsWith('#') ? color : colorMap[color] || colorMap.blue;
  };

  const handleDeleteIdea = async () => {
    try {
      const { error } = await supabase
        .from("video_ideas")
        .update({ is_saved: false })
        .eq("id", id);

      if (error) throw error;
      
      if (onDelete) {
        onDelete();
      }
      
      toast({
        title: "Success",
        description: "Idea removed from planner",
      });
    } catch (error: any) {
      console.error('Error deleting idea:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete idea: " + error.message,
      });
    }
  };

  return (
    <>
      <Draggable draggableId={id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-card border rounded-md p-3 mb-2 hover:shadow-md transition-shadow ${
              snapshot.isDragging ? "shadow-lg" : ""
            }`}
            style={{
              ...provided.draggableProps.style,
              borderLeftWidth: '4px',
              borderLeftColor: getColorValue(color),
            }}
          >
            <div className="flex justify-between">
              <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
              <div className="flex items-center space-x-1">
                {isOnCalendar && (
                  <span className="text-blue-500" title="Also on calendar">
                    <Calendar className="h-3.5 w-3.5" />
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <DeleteIcon 
                  size="sm"
                  onDelete={handleDeleteIdea}
                  title="Remove from Planner"
                  description="This will remove the idea from your planner. You can always add it again later."
                />
              </div>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-3 mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </Draggable>

      {editDialogOpen && (
        <EditIdea
          ideaId={id}
          onClose={() => {
            setEditDialogOpen(false);
            if (onEdit) onEdit();
          }}
        />
      )}
    </>
  );
}
