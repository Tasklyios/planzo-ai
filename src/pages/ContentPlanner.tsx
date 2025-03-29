
import { useState, useEffect } from "react";
import { Plus, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  KanbanBoard, 
  KanbanCard, 
  KanbanCards, 
  KanbanHeader, 
  KanbanProvider, 
  Status,
  VideoIdea
} from "@/components/ui/kanban";
import type { DragEndEvent } from "@dnd-kit/core";
import { SearchIdeasDialog } from "@/components/search/SearchIdeasDialog";
import { PlannerColumn as PlannerColumnType } from "@/types/idea";
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
import EditIdea from "@/components/EditIdea";

const columnFormSchema = z.object({
  title: z.string().min(1, "Column title is required").max(50, "Column title must be less than 50 characters"),
});

const DEFAULT_COLUMNS = [
  { title: 'Ideas', order: 0, color: '#6B7280' },
  { title: 'Planning', order: 1, color: '#F59E0B' },
  { title: 'To Film', order: 2, color: '#3B82F6' },
  { title: 'To Edit', order: 3, color: '#EC4899' },
  { title: 'To Post', order: 4, color: '#10B981' },
];

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

export default function ContentPlanner() {
  const { toast } = useToast();
  const [columns, setColumns] = useState<Status[]>([]);
  const [videoIdeas, setVideoIdeas] = useState<VideoIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchColumnId, setSearchColumnId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Status | null>(null);

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
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: columnsData, error: columnsError } = await supabase
        .from('planner_columns')
        .select('*')
        .eq('user_id', session.user.id)
        .order('order', { ascending: true });

      if (columnsError) throw columnsError;

      // If no columns exist, create the default ones
      if (!columnsData || columnsData.length === 0) {
        await createDefaultColumns(session.user.id);
        return; // fetchColumnsAndIdeas will be called again after creating default columns
      } else {
        // Format columns data with default colors based on index if no color is present
        const formattedColumns: Status[] = columnsData.map((col, index) => ({
          id: col.id,
          name: col.title,
          // Use default colors or assign color based on order to ensure consistency
          color: DEFAULT_COLUMNS[index % DEFAULT_COLUMNS.length].color
        }));
        setColumns(formattedColumns);
      }

      // Fetch all saved ideas
      const { data: ideas, error: ideasError } = await supabase
        .from('video_ideas')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_saved', true);

      if (ideasError) throw ideasError;

      if (ideas && ideas.length > 0) {
        // Get the first column's ID for ideas without a status (Ideas column)
        const firstColumnId = columnsData && columnsData.length > 0 ? 
          columnsData[0].id : null;
        
        // Format video ideas
        const formattedIdeas: VideoIdea[] = ideas.map(idea => {
          // Make sure each idea has a valid status
          const columnId = idea.status || firstColumnId;
          const column = columnsData?.find(col => col.id === columnId);
          const columnIndex = columnsData?.findIndex(col => col.id === columnId) || 0;
          
          return {
            id: idea.id,
            title: idea.title,
            description: idea.description,
            category: idea.category,
            tags: idea.tags,
            color: idea.color,
            status: {
              id: column?.id || firstColumnId,
              name: column?.title || 'Ideas',
              // Use the default colors for columns based on their index
              color: DEFAULT_COLUMNS[columnIndex % DEFAULT_COLUMNS.length].color
            },
            is_on_calendar: idea.scheduled_for !== null,
            scheduled_for: idea.scheduled_for
          };
        });
        
        setVideoIdeas(formattedIdeas);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultColumns = async (userId: string) => {
    try {
      for (const column of DEFAULT_COLUMNS) {
        const columnId = crypto.randomUUID();
        await supabase
          .from('planner_columns')
          .insert({
            id: columnId,
            title: column.title,
            user_id: userId,
            order: column.order
            // Color is stored in DEFAULT_COLUMNS but not in the DB table
            // We'll use these default colors when displaying columns
          });
      }
      
      // Fetch the newly created columns
      fetchColumnsAndIdeas();
    } catch (error: any) {
      console.error('Error creating default columns:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create default columns."
      });
    }
  };

  const getColorValue = (color: string): string => {
    return color.startsWith('#') ? color : colorMap[color] || '#3b82f6';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const ideaId = active.id as string;
    const newStatusName = over.id as string;
    
    // Find the column by name
    const newStatus = columns.find(col => col.name === newStatusName);
    if (!newStatus) return;
    
    try {
      // Update the status in the database
      const { error } = await supabase
        .from('video_ideas')
        .update({ 
          status: newStatus.id,
          is_saved: true 
        })
        .eq('id', ideaId);

      if (error) throw error;
      
      // Update the videoIdeas state to reflect the change
      setVideoIdeas(videoIdeas.map(idea => {
        if (idea.id === ideaId) {
          return { ...idea, status: newStatus };
        }
        return idea;
      }));
      
    } catch (error: any) {
      console.error('Error updating idea status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update idea status."
      });
    }
  };

  const handleAddColumn = async (data: z.infer<typeof columnFormSchema>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const newColumnId = crypto.randomUUID();
      const newColumnOrder = columns.length;
      const newColumnColor = DEFAULT_COLUMNS[newColumnOrder % DEFAULT_COLUMNS.length].color;

      const { error } = await supabase
        .from('planner_columns')
        .insert({
          id: newColumnId,
          title: data.title,
          user_id: session.user.id,
          order: newColumnOrder
          // Note: color isn't stored in DB, we assign it based on the order
        });

      if (error) throw error;

      // Add the new column to the state with the color
      const newColumn: Status = {
        id: newColumnId,
        name: data.title,
        color: newColumnColor
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

  const handleDeleteColumn = async (column: Status) => {
    setColumnToDelete(column);
    setConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Find ideas in this column
      const ideasInColumn = videoIdeas.filter(idea => idea.status.id === columnToDelete.id);
      
      // Find the first column (default column)
      const firstColumn = columns.find((_, index) => index === 0);
      
      if (firstColumn && ideasInColumn.length > 0) {
        // Move all ideas to the first column
        for (const idea of ideasInColumn) {
          await supabase
            .from('video_ideas')
            .update({ status: firstColumn.id })
            .eq('id', idea.id);
          
          // Update in state
          setVideoIdeas(videoIdeas.map(i => {
            if (i.id === idea.id) {
              return { ...i, status: firstColumn };
            }
            return i;
          }));
        }
      }
      
      // Delete the column
      const { error } = await supabase
        .from('planner_columns')
        .delete()
        .eq('id', columnToDelete.id);
        
      if (error) throw error;
      
      // Remove the column from state
      setColumns(columns.filter(col => col.id !== columnToDelete.id));
      
      // Reorder remaining columns
      const remainingColumns = columns.filter(col => col.id !== columnToDelete.id);
      for (let i = 0; i < remainingColumns.length; i++) {
        await supabase
          .from('planner_columns')
          .update({ order: i })
          .eq('id', remainingColumns[i].id);
      }
      
      toast({
        title: "Column Deleted",
        description: `Column "${columnToDelete.name}" has been deleted.`
      });
    } catch (error: any) {
      console.error('Error deleting column:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete column. Please try again."
      });
    } finally {
      setConfirmDeleteDialogOpen(false);
      setColumnToDelete(null);
    }
  };

  const handleOpenSearch = (columnId: string) => {
    setSearchColumnId(columnId);
    setIsSearchOpen(true);
  };

  const handleIdeaAdded = () => {
    fetchColumnsAndIdeas();
  };

  const handleEditIdea = (ideaId: string) => {
    setEditingIdeaId(ideaId);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
                <Plus className="mr-2 h-4 w-4" />
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

      <div 
        className="overflow-x-auto pb-4"
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top left',
          width: `${100 * (100 / zoomLevel)}%`,
          minWidth: '100%'
        }}
      >
        <KanbanProvider 
          onDragEnd={handleDragEnd}
          className="min-w-max"
        >
          {columns.map((column, index) => (
            <KanbanBoard 
              key={column.id} 
              id={column.name}
            >
              <KanbanHeader 
                name={column.name} 
                color={column.color}
                isFirstColumn={index === 0}
                onAddIdea={() => handleOpenSearch(column.id)}
                onDeleteColumn={index === 0 ? undefined : () => handleDeleteColumn(column)}
              />
              <KanbanCards>
                {videoIdeas
                  .filter(idea => idea.status.id === column.id)
                  .map((idea, index) => (
                    <KanbanCard
                      key={idea.id}
                      id={idea.id}
                      title={idea.title}
                      description={idea.description}
                      color={getColorValue(idea.color || 'blue')}
                      index={index}
                      parent={column.name}
                      isOnCalendar={idea.is_on_calendar}
                      className="hover:shadow-md transition-shadow cursor-grab"
                      onClick={() => handleEditIdea(idea.id)}
                    />
                  ))}
              </KanbanCards>
            </KanbanBoard>
          ))}
        </KanbanProvider>
      </div>

      {searchColumnId && (
        <SearchIdeasDialog 
          open={isSearchOpen} 
          onOpenChange={setIsSearchOpen}
          columnId={searchColumnId}
          columnTitle={columns.find(col => col.id === searchColumnId)?.name || ''}
          onIdeaAdded={handleIdeaAdded}
        />
      )}

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
            fetchColumnsAndIdeas();
          }}
        />
      )}

      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{columnToDelete?.name}" column? All ideas will be moved to the first column.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteColumn}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
