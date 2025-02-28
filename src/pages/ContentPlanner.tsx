
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlannerColumn } from "@/components/planner/PlannerColumn";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { DeleteBin } from "@/components/planner/DeleteBin";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedIdea } from "@/types/idea";

interface PlannerItem extends GeneratedIdea {
  status: string;
}

interface PlannerColumn {
  id: string;
  title: string;
  items: PlannerItem[];
}

export default function ContentPlanner() {
  const { toast } = useToast();
  const [columns, setColumns] = useState<PlannerColumn[]>([
    { id: 'ideas', title: 'Ideas', items: [] },
    { id: 'planning', title: 'Planning', items: [] },
    { id: 'filming', title: 'Ready to Film', items: [] },
    { id: 'editing', title: 'To Edit', items: [] },
    { id: 'ready', title: 'Ready to Post', items: [] },
  ]);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: ideas, error } = await supabase
        .from('video_ideas')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_saved', true); // Only fetch saved ideas

      if (error) throw error;

      // Group ideas by status
      const groupedIdeas = ideas.reduce((acc: { [key: string]: PlannerItem[] }, idea) => {
        const status = idea.status || 'ideas';
        if (!acc[status]) acc[status] = [];
        acc[status].push(idea as PlannerItem);
        return acc;
      }, {});

      // Update columns with fetched ideas
      setColumns(columns.map(col => ({
        ...col,
        items: groupedIdeas[col.id] || []
      })));

    } catch (error: any) {
      console.error('Error fetching ideas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load ideas. Please try again."
      });
    }
  };

  const onDragEnd = async (result: any) => {
    const { source, destination, type } = result;
    
    if (!destination) return;

    // Handle column deletion
    if (type === 'column' && destination.droppableId === 'delete-bin') {
      const columnId = result.draggableId.replace('column-', '');
      
      try {
        // Update status of all items in the column to be moved to 'ideas' column
        const columnItems = columns.find(col => col.id === columnId)?.items || [];
        
        for (const item of columnItems) {
          await supabase
            .from('video_ideas')
            .update({ status: 'ideas' })
            .eq('id', item.id);
        }
        
        // Remove the column from the UI
        const newColumns = columns.filter(col => col.id !== columnId);
        setColumns(newColumns);
        
        toast({
          title: "Column Deleted",
          description: `Column "${columns.find(col => col.id === columnId)?.title}" has been deleted.`,
        });
        
        return;
      } catch (error: any) {
        console.error('Error deleting column:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete column. Please try again."
        });
        return;
      }
    }
    
    // Handle regular card dragging
    if (type === 'task') {
      try {
        // Update in Supabase first
        const ideaId = result.draggableId;
        const { error } = await supabase
          .from('video_ideas')
          .update({ status: destination.droppableId })
          .eq('id', ideaId);

        if (error) throw error;

        // Then update local state
        if (source.droppableId !== destination.droppableId) {
          const sourceColumn = columns.find(col => col.id === source.droppableId);
          const destColumn = columns.find(col => col.id === destination.droppableId);
          
          if (!sourceColumn || !destColumn) return;

          const sourceItems = [...sourceColumn.items];
          const destItems = [...destColumn.items];
          const [removed] = sourceItems.splice(source.index, 1);
          destItems.splice(destination.index, 0, removed);

          setColumns(columns.map(col => {
            if (col.id === source.droppableId) {
              return { ...col, items: sourceItems };
            }
            if (col.id === destination.droppableId) {
              return { ...col, items: destItems };
            }
            return col;
          }));
        } else {
          const column = columns.find(col => col.id === source.droppableId);
          if (!column) return;

          const copiedItems = [...column.items];
          const [removed] = copiedItems.splice(source.index, 1);
          copiedItems.splice(destination.index, 0, removed);

          setColumns(columns.map(col => {
            if (col.id === source.droppableId) {
              return { ...col, items: copiedItems };
            }
            return col;
          }));
        }
      } catch (error: any) {
        console.error('Error updating idea status:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update idea status. Please try again."
        });
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Content Planner</h1>
        <Button>
          <Plus className="mr-2" />
          Add Column
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="column">
          {(provided) => (
            <div 
              className="flex gap-4 overflow-x-auto pb-4" 
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {columns.map((column, index) => (
                <PlannerColumn 
                  key={column.id} 
                  title={column.title} 
                  id={column.id}
                  index={index}
                >
                  {column.items.map((item, itemIndex) => (
                    <PlannerCard 
                      key={item.id} 
                      id={item.id}
                      index={itemIndex}
                      title={item.title}
                      description={item.description}
                      color={item.color}
                      onEdit={fetchIdeas}
                    />
                  ))}
                </PlannerColumn>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        
        <DeleteBin />
      </DragDropContext>
    </div>
  );
}
