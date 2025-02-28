
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlannerColumn } from "@/components/planner/PlannerColumn";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { DeleteBin } from "@/components/planner/DeleteBin";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedIdea } from "@/types/idea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'column' | 'task';
    id: string;
    name: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    const { source, destination, type } = result;
    
    // If there's no destination or it's the same place, do nothing
    if (!destination) return;

    // Handle dropping in delete bin
    if (destination.droppableId === 'delete-bin') {
      if (type === 'column') {
        const columnId = result.draggableId.replace('column-', '');
        const column = columns.find(col => col.id === columnId);
        
        if (column) {
          setPendingDelete({
            type: 'column',
            id: columnId,
            name: column.title
          });
          setDeleteDialogOpen(true);
        }
        return;
      }
      
      if (type === 'task') {
        const ideaId = result.draggableId;
        const sourceColumn = columns.find(col => col.id === source.droppableId);
        const item = sourceColumn?.items.find(item => item.id === ideaId);
        
        if (item) {
          setPendingDelete({
            type: 'task',
            id: ideaId,
            name: item.title
          });
          setDeleteDialogOpen(true);
        }
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

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    
    try {
      if (pendingDelete.type === 'column') {
        const columnId = pendingDelete.id;
        
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
          description: `Column "${pendingDelete.name}" has been deleted.`,
        });
      } else if (pendingDelete.type === 'task') {
        const ideaId = pendingDelete.id;
        
        // Delete the idea from Supabase
        const { error } = await supabase
          .from('video_ideas')
          .update({ is_saved: false }) // Mark as not saved instead of hard deleting
          .eq('id', ideaId);

        if (error) throw error;
        
        // Remove the idea from the local state
        const newColumns = columns.map(col => ({
          ...col,
          items: col.items.filter(item => item.id !== ideaId)
        }));
        
        setColumns(newColumns);
        
        toast({
          title: "Idea Deleted",
          description: "The idea has been removed from your planner."
        });
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item. Please try again."
      });
    } finally {
      setDeleteDialogOpen(false);
      setPendingDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPendingDelete(null);
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

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
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
        
        <DeleteBin isDragging={isDragging} />
      </DragDropContext>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {pendingDelete?.type === 'column'
                ? `Are you sure you want to delete the "${pendingDelete.name}" column? All ideas will be moved to the Ideas column.`
                : `Are you sure you want to delete the idea "${pendingDelete?.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
