
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
  onIdeaAdded?: () => void; 
  onColumnDeleted?: () => void;
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
      const { data: columnItems } = await supabase
        .from('video_ideas')
        .select('id')
        .eq('status', id);
      
      // Get the first column id to move items to
      const { data: columns } = await supabase
        .from('planner_columns')
        .select('id')
        .order('order', { ascending: true })
        .limit(1);
        
      const firstColumnId = columns && columns.length > 0 ? columns[0].id : null;
      
      if (columnItems && columnItems.length > 0 && firstColumnId) {
        for (const item of columnItems) {
          await supabase
            .from('video_ideas')
            .update({ status: firstColumnId })
            .eq('id', item.id);
        }
      }
      
      const { error } = await supabase
        .from('planner_columns')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      if (onColumnDeleted) {
        onColumnDeleted();
      }
      
      toast({
        title: "Success",
        description: "Column deleted successfully."
      });
      
    } catch (error) {
      console.error('Error deleting column:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete column."
      });
    }
  };

  return (
    <Draggable draggableId={id} index={index} isDragDisabled={!isDeletable}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-muted/50 rounded-lg p-4 h-full w-[320px] flex-shrink-0 ${
            snapshot.isDragging ? "opacity-90 shadow-lg" : ""
          }`}
          style={{
            ...provided.draggableProps.style,
            width: snapshot.isDragging ? "320px" : undefined,
          }}
        >
          <div 
            className="flex justify-between items-center mb-4"
          >
            <div className="flex items-center gap-2">
              <div 
                {...provided.dragHandleProps}
                className={`cursor-grab hover:text-primary ${!isDeletable ? 'opacity-50 cursor-not-allowed' : ''} ${
                  snapshot.isDragging ? "cursor-grabbing" : ""
                }`}
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
                  description={`Are you sure you want to delete the "${title}" column? All ideas will be moved to the first column.`}
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
                className="space-y-2 min-h-[calc(100vh-16rem)] planner-column-content"
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
