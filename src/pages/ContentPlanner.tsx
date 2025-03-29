import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { useState, useEffect } from "react";
import { Plus, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlannerColumn } from "@/components/planner/PlannerColumn";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { DeleteBin } from "@/components/planner/DeleteBin";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedIdea, PlannerColumn as PlannerColumnType } from "@/types/idea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface PlannerItem extends GeneratedIdea {
  status: string;
  is_on_calendar?: boolean;
}

interface PlannerColumnWithItems extends PlannerColumnType {
  items: PlannerItem[];
}

const columnFormSchema = z.object({
  title: z.string().min(1, "Column title is required").max(50, "Column title must be less than 50 characters"),
});

export default function ContentPlanner() {
  const { toast } = useToast();
  const [columns, setColumns] = useState<PlannerColumnWithItems[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'column' | 'task';
    id: string;
    name: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof columnFormSchema>>({
    resolver: zodResolver(columnFormSchema),
    defaultValues: {
      title: "",
    },
  });

  useEffect(() => {
    fetchColumnsAndIdeas();
  }, []);

  const fetchColumnsAndIdeas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: columnsData, error: columnsError } = await supabase
        .from('planner_columns')
        .select('*')
        .eq('user_id', session.user.id)
        .order('order', { ascending: true });

      if (columnsError) throw columnsError;

      // Check if we have an 'ideas' column - use the first column as the ideas column by default
      let ideasColumnId = columnsData && columnsData.length > 0 ? columnsData[0].id : null;
      let hasIdeasColumn = ideasColumnId !== null;
      
      // If we don't have any columns, create default columns
      if (!columnsData || columnsData.length === 0) {
        // Create default columns with generated UUIDs
        const defaultColumns = [
          { id: crypto.randomUUID(), title: 'Ideas', order: 0 },
          { id: crypto.randomUUID(), title: 'Planning', order: 1 },
          { id: crypto.randomUUID(), title: 'Ready to Film', order: 2 },
          { id: crypto.randomUUID(), title: 'To Edit', order: 3 },
          { id: crypto.randomUUID(), title: 'Ready to Post', order: 4 },
        ];

        // Set the first column as our ideas column
        ideasColumnId = defaultColumns[0].id;

        // Insert all default columns
        for (const column of defaultColumns) {
          await supabase
            .from('planner_columns')
            .insert({
              id: column.id,
              title: column.title,
              user_id: session.user.id,
              order: column.order
            });
        }

        const { data: newColumnsData, error: newColumnsError } = await supabase
          .from('planner_columns')
          .select('*')
          .eq('user_id', session.user.id)
          .order('order', { ascending: true });

        if (newColumnsError) throw newColumnsError;
        
        if (newColumnsData) {
          const columnsWithItems = newColumnsData.map(col => ({
            ...col,
            items: []
          }));
          setColumns(columnsWithItems);
        }
      } else {
        const columnsWithItems = columnsData.map(col => ({
          ...col,
          items: []
        }));
        setColumns(columnsWithItems);
      }

      // Fetch all saved ideas
      const { data: ideas, error: ideasError } = await supabase
        .from('video_ideas')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_saved', true);

      if (ideasError) throw ideasError;

      if (ideas && ideas.length > 0) {
        console.log("Fetched saved ideas:", ideas);
        
        const groupedIdeas = ideas.reduce((acc: { [key: string]: PlannerItem[] }, idea) => {
          // Use the set status, or use the first column (ideasColumnId) as default
          const status = idea.status || ideasColumnId;
          
          // Check if the column exists (extra safety)
          const columnExists = columnsData?.some(col => col.id === status);
          
          const targetStatus = columnExists ? status : ideasColumnId;
          
          if (!acc[targetStatus]) acc[targetStatus] = [];
          acc[targetStatus].push({
            ...idea,
            status: targetStatus,
            is_on_calendar: idea.scheduled_for !== null
          } as PlannerItem);
          
          return acc;
        }, {});

        console.log("Grouped ideas:", groupedIdeas);

        setColumns(prevColumns => 
          prevColumns.map(col => ({
            ...col,
            items: groupedIdeas[col.id] || []
          }))
        );
      } else {
        console.log("No saved ideas found");
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data. Please try again."
      });
    }
  };

  const onDragStart = () => {
    setIsDragging(true);
    document.body.classList.add('dragging');
    document.body.setAttribute('data-dragging', 'true');
  };

  const onDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    document.body.classList.remove('dragging');
    document.body.removeAttribute('data-dragging');
    
    const { source, destination, type, draggableId } = result;
    
    if (!destination) return;

    if (destination.droppableId === 'delete-bin') {
      if (type === 'column') {
        const columnId = draggableId;
        // Don't allow deletion of the first column
        if (columns.length > 0 && columnId === columns[0].id) {
          toast({
            title: "Cannot Delete",
            description: "The first column cannot be deleted as it's required.",
            variant: "destructive"
          });
          return;
        }
        
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
      } else if (type === 'task') {
        const ideaId = draggableId;
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
    
    if (type === 'column') {
      if (source.index === destination.index) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Don't allow moving the first column out of first position
        if (destination.index === 0 && source.index !== 0) {
          toast({
            title: "Cannot Reorder",
            description: "The first column must remain first.",
            variant: "destructive"
          });
          return;
        }

        // Don't allow moving any column to the first position
        if (source.index === 0 && destination.index !== 0) {
          toast({
            title: "Cannot Reorder",
            description: "The first column must remain first.",
            variant: "destructive"
          });
          return;
        }
        
        const newColumns = [...columns];
        const [removed] = newColumns.splice(source.index, 1);
        newColumns.splice(destination.index, 0, removed);

        const updatedColumns = newColumns.map((col, index) => ({
          ...col,
          order: index
        }));

        setColumns(updatedColumns);

        for (const column of updatedColumns) {
          await supabase
            .from('planner_columns')
            .update({ order: column.order })
            .eq('id', column.id)
            .eq('user_id', session.user.id);
        }
      } catch (error: any) {
        console.error('Error reordering columns:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reorder columns. Please try again."
        });
      }
      return;
    }
    
    if (type === 'task') {
      try {
        const ideaId = result.draggableId;
        const sourceColumn = columns.find(col => col.id === source.droppableId);
        const sourceItem = sourceColumn?.items.find(item => item.id === ideaId);
        
        if (!sourceItem) return;
        
        // Check if the item is on the calendar
        const isOnCalendar = sourceItem.scheduled_for !== null;
        
        // When moving to a new column, update the status while preserving calendar status
        const { error } = await supabase
          .from('video_ideas')
          .update({ 
            status: destination.droppableId,
            is_saved: true
          })
          .eq('id', ideaId);

        if (error) throw error;

        if (source.droppableId !== destination.droppableId) {
          const sourceColumn = columns.find(col => col.id === source.droppableId);
          const destColumn = columns.find(col => col.id === destination.droppableId);
          
          if (!sourceColumn || !destColumn) return;

          const sourceItems = [...sourceColumn.items];
          const destItems = [...destColumn.items];
          const [removed] = sourceItems.splice(source.index, 1);
          removed.is_saved = true;
          removed.status = destination.droppableId;
          // Preserve calendar state
          removed.is_on_calendar = isOnCalendar;
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
      setIsDeleting(true);
      
      if (pendingDelete.type === 'column') {
        const columnId = pendingDelete.id;
        
        // Don't allow deletion of the first column
        if (columns.length > 0 && columnId === columns[0].id) {
          toast({
            title: "Cannot Delete",
            description: "The first column cannot be deleted as it's required.",
            variant: "destructive"
          });
          setIsDeleting(false);
          setDeleteDialogOpen(false);
          setPendingDelete(null);
          return;
        }
        
        const columnItems = columns.find(col => col.id === columnId)?.items || [];
        const firstColumnId = columns.length > 0 ? columns[0].id : null;
        
        if (firstColumnId) {
          for (const item of columnItems) {
            const { error: updateError } = await supabase
              .from('video_ideas')
              .update({ status: firstColumnId })
              .eq('id', item.id);
            
            if (updateError) {
              console.error('Error moving items from deleted column:', updateError);
              throw updateError;
            }
          }
        }
        
        const { error: deleteError } = await supabase
          .from('planner_columns')
          .delete()
          .eq('id', columnId);
          
        if (deleteError) {
          console.error('Error deleting column from database:', deleteError);
          throw deleteError;
        }
        
        const newColumns = columns.filter(col => col.id !== columnId);
        setColumns(newColumns);
        
        toast({
          title: "Column Deleted",
          description: `Column "${pendingDelete.name}" has been deleted and items moved to the first column.`,
        });
      } else if (pendingDelete.type === 'task') {
        const ideaId = pendingDelete.id;
        
        const { error } = await supabase
          .from('video_ideas')
          .update({ is_saved: false })
          .eq('id', ideaId);

        if (error) {
          console.error('Error deleting idea from database:', error);
          throw error;
        }
        
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
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPendingDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPendingDelete(null);
  };

  const handleAddColumn = async (data: z.infer<typeof columnFormSchema>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const newColumnId = crypto.randomUUID();
      const newColumnOrder = columns.length;

      const { error } = await supabase
        .from('planner_columns')
        .insert({
          id: newColumnId,
          title: data.title,
          user_id: session.user.id,
          order: newColumnOrder
        });

      if (error) throw error;

      const newColumn: PlannerColumnWithItems = {
        id: newColumnId,
        title: data.title,
        user_id: session.user.id,
        order: newColumnOrder,
        items: []
      };

      setColumns([...columns, newColumn]);
      
      toast({
        title: "Column Added",
        description: `Column "${data.title}" has been added.`
      });

      form.reset();
      setAddColumnDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding column:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add column. Please try again."
      });
    }
  };

  const handleIdeaDeleted = () => {
    fetchColumnsAndIdeas();
  };

  const handleColumnDeleted = () => {
    fetchColumnsAndIdeas();
  };

  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Content Planner</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-4 bg-accent/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {zoomLevel}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" />
                Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Column</DialogTitle>
                <DialogDescription>
                  Create a new column to organize your content workflow.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddColumn)} className="space-y-4">
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
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddColumnDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Column</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .dragging {
          cursor: grabbing !important;
        }
        [data-dragging="true"] * {
          cursor: grabbing !important;
        }
        /* Fix for dragging offset - ensure item is positioned at cursor */
        .react-beautiful-dnd-draggable {
          transform: translate(0, 0) !important;
        }
        /* Additional fix for proper drag positioning */
        [data-rbd-draggable-id] {
          position: relative;
          z-index: 1;
        }
        [data-rbd-draggable-dragging] {
          position: fixed !important;
          pointer-events: none;
        }
      `}} />

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="column">
          {(provided) => (
            <div 
              className="flex gap-4 overflow-x-auto pb-4 transition-transform duration-200" 
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
                width: `${100 * (100 / zoomLevel)}%`,
                minWidth: '100%'
              }}
            >
              {columns.map((column, index) => (
                <PlannerColumn 
                  key={column.id} 
                  title={column.title} 
                  id={column.id}
                  index={index}
                  isDeletable={index !== 0} // First column is not deletable
                  onIdeaAdded={fetchColumnsAndIdeas}
                  onColumnDeleted={handleColumnDeleted}
                >
                  {column.items.map((item, itemIndex) => (
                    <PlannerCard 
                      key={item.id} 
                      id={item.id}
                      index={itemIndex}
                      title={item.title}
                      description={item.description}
                      color={item.color}
                      onEdit={fetchColumnsAndIdeas}
                      onDelete={handleIdeaDeleted}
                      isOnCalendar={item.is_on_calendar}
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
                ? `Are you sure you want to delete the "${pendingDelete.name}" column? All ideas will be moved to the first column.`
                : `Are you sure you want to delete the idea "${pendingDelete?.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm} 
              disabled={isDeleting}
              className={isDeleting ? "opacity-70 cursor-not-allowed" : ""}
            >
              {isDeleting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
