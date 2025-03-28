
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
import { EditColumnDialog } from "@/components/planner/EditColumnDialog";

const columnFormSchema = z.object({
  title: z.string().min(1, "Column title is required").max(50, "Column title must be less than 50 characters"),
});

const DEFAULT_COLORS = [
  '#6B7280', // gray for Ideas
  '#F59E0B', // amber for Planning
  '#3B82F6', // blue for To Film
  '#EC4899', // pink for To Edit
  '#10B981', // emerald for To Post
];

const DEFAULT_COLUMNS = [
  { title: 'Ideas', order: 0, color: DEFAULT_COLORS[0] },
  { title: 'Planning', order: 1, color: DEFAULT_COLORS[1] },
  { title: 'To Film', order: 2, color: DEFAULT_COLORS[2] },
  { title: 'To Edit', order: 3, color: DEFAULT_COLORS[3] },
  { title: 'To Post', order: 4, color: DEFAULT_COLORS[4] },
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
  const [editColumnDialogOpen, setEditColumnDialogOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState<Status | null>(null);

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

      if (!columnsData || columnsData.length === 0) {
        await createDefaultColumns(session.user.id);
        return; // fetchColumnsAndIdeas will be called again after creating default columns
      } else {
        const formattedColumns: Status[] = columnsData.map((col) => ({
          id: col.id,
          name: col.title,
          color: col.color || DEFAULT_COLORS[col.order % DEFAULT_COLORS.length] // Use color from DB or default
        }));
        setColumns(formattedColumns);
      }

      const { data: ideas, error: ideasError } = await supabase
        .from('video_ideas')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_saved', true);

      if (ideasError) throw ideasError;

      if (ideas && ideas.length > 0) {
        const firstColumnId = columnsData && columnsData.length > 0 ? 
          columnsData[0].id : null;
        
        const formattedIdeas: VideoIdea[] = ideas.map(idea => {
          const columnId = idea.status || firstColumnId;
          const column = columnsData?.find(col => col.id === columnId);
          const columnIndex = columnsData?.findIndex(col => col.id === columnId) ?? 0;
          
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
              color: DEFAULT_COLORS[columnIndex % DEFAULT_COLORS.length]
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
            order: column.order,
            color: column.color // Make sure to save color when creating
          });
      }
      
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
    
    const newStatus = columns.find(col => col.name === newStatusName);
    if (!newStatus) return;
    
    try {
      const { error } = await supabase
        .from('video_ideas')
        .update({ 
          status: newStatus.id,
          is_saved: true 
        })
        .eq('id', ideaId);

      if (error) throw error;
      
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
      const newColumnColor = DEFAULT_COLORS[newColumnOrder % DEFAULT_COLORS.length];

      const { error } = await supabase
        .from('planner_columns')
        .insert({
          id: newColumnId,
          title: data.title,
          user_id: session.user.id,
          order: newColumnOrder
        });

      if (error) throw error;

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

      const ideasInColumn = videoIdeas.filter(idea => idea.status.id === columnToDelete.id);
      
      const firstColumn = columns.find((_, index) => index === 0);
      
      if (firstColumn && ideasInColumn.length > 0) {
        for (const idea of ideasInColumn) {
          await supabase
            .from('video_ideas')
            .update({ status: firstColumn.id })
            .eq('id', idea.id);
          
          setVideoIdeas(videoIdeas.map(i => {
            if (i.id === idea.id) {
              return { ...i, status: firstColumn };
            }
            return i;
          }));
        }
      }
      
      const { error } = await supabase
        .from('planner_columns')
        .delete()
        .eq('id', columnToDelete.id);
        
      if (error) throw error;
      
      setColumns(columns.filter(col => col.id !== columnToDelete.id));
      
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

  const handleEditColumn = (column: Status) => {
    setColumnToEdit(column);
    setEditColumnDialogOpen(true);
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
              index={index}
            >
              <KanbanHeader 
                name={column.name} 
                color={column.color}
                isFirstColumn={index === 0}
                onAddIdea={() => handleOpenSearch(column.id)}
                onDeleteColumn={index === 0 ? undefined : () => handleDeleteColumn(column)}
                onEditColumn={() => handleEditColumn(column)}
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

      <EditColumnDialog
        column={columnToEdit}
        open={editColumnDialogOpen}
        onOpenChange={setEditColumnDialogOpen}
        onColumnUpdated={fetchColumnsAndIdeas}
      />
    </div>
  );
}
