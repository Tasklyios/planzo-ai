
import { Draggable, Droppable } from "react-beautiful-dnd";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SearchIdeasDialog } from "../search/SearchIdeasDialog";
import { DeleteIcon } from "./DeleteIcon";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PlannerColumnProps {
  title: string;
  id: string;
  index: number;
  children: React.ReactNode;
  isDeletable?: boolean;
  onIdeaAdded?: () => void; // Add callback for when an idea is added
  onColumnDeleted?: () => void; // Add callback for when column is deleted
}

export function PlannerColumn({ 
  title, 
  id, 
  index, 
  children, 
  isDeletable = true,
  onIdeaAdded,
  onColumnDeleted
}: PlannerColumnProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { toast } = useToast();

  const handleDeleteColumn = async () => {
    try {
      // Get items that need to be moved to 'ideas' column
      const { data: columnItems } = await supabase
        .from('video_ideas')
        .select('id')
        .eq('status', id);
      
      if (columnItems && columnItems.length > 0) {
        // Update each item's status to 'ideas'
        for (const item of columnItems) {
          await supabase
            .from('video_ideas')
            .update({ status: 'ideas' })
            .eq('id', item.id);
        }
      }
      
      // Delete the column
      const { error } = await supabase
        .from('planner_columns')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Notify parent component
      if (onColumnDeleted) {
        onColumnDeleted();
      }
      
    } catch (error) {
      console.error('Error deleting column:', error);
      throw error;
    }
  };

  return (
    <Draggable draggableId={`column-${id}`} index={index} isDragDisabled={!isDeletable}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-muted/50 rounded-lg p-4 h-full w-[350px] flex-shrink-0"
        >
          <div 
            className="flex justify-between items-center mb-4"
          >
            <div className="flex items-center gap-2">
              <div 
                {...provided.dragHandleProps}
                className={`cursor-grab hover:text-primary ${!isDeletable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <GripVertical className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              {!isDeletable && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
            </div>
            <div className="flex items-center">
              {isDeletable && (
                <DeleteIcon 
                  onDelete={handleDeleteColumn}
                  title={`Delete ${title} Column`}
                  description={`Are you sure you want to delete the "${title}" column? All ideas will be moved to the Ideas column.`}
                />
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsSearchOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add idea to {title}</span>
              </Button>
            </div>
          </div>
          <Droppable droppableId={id} type="task">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[calc(100vh-16rem)]"
              >
                {children}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <SearchIdeasDialog 
            open={isSearchOpen} 
            onOpenChange={setIsSearchOpen}
            columnId={id}
            columnTitle={title}
            onIdeaAdded={onIdeaAdded}
          />
        </div>
      )}
    </Draggable>
  );
}
