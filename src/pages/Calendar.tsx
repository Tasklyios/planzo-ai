import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon, CheckCircle, GripVertical, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ScheduledPost {
  id: string;
  title: string;
  scheduled_for: string;
  status: "scheduled" | "in progress" | "completed";
  platform: string;
  color?: string;
  created_at?: string;
  user_id?: string;
  symbol?: string;
}

interface EditIdeaProps {
  ideaId: string | null;
  onClose: () => void;
}

const EditIdea: React.FC<EditIdeaProps> = ({ ideaId, onClose }) => {
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined);
  const [platform, setPlatform] = useState("TikTok");
  const { toast } = useToast();

  useEffect(() => {
    const fetchIdea = async () => {
      if (ideaId) {
        const { data, error } = await supabase
          .from("scheduled_content")
          .select("*")
          .eq("id", ideaId)
          .single();

        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch idea details.",
          });
          return;
        }

        setTitle(data.title);
        setScheduledFor(new Date(data.scheduled_for));
        setPlatform(data.platform);
      }
    };

    fetchIdea();
  }, [ideaId, toast]);

  const updateIdea = async () => {
    if (!ideaId) return;

    const { error } = await supabase
      .from("scheduled_content")
      .update({
        title: title,
        scheduled_for: scheduledFor?.toISOString(),
        platform: platform,
      })
      .eq("id", ideaId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update idea.",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Idea updated successfully.",
    });
    onClose();
  };

  return (
    <Sheet open={!!ideaId} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Scheduled Post</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Platform</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Button
                variant={platform === "TikTok" ? "default" : "outline"}
                onClick={() => setPlatform("TikTok")}
              >
                TikTok
              </Button>
              <Button
                variant={platform === "Instagram" ? "default" : "outline"}
                onClick={() => setPlatform("Instagram")}
              >
                Instagram
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Schedule Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !scheduledFor && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledFor ? (
                    format(scheduledFor, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  selected={scheduledFor}
                  onSelect={setScheduledFor}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button onClick={updateIdea}>Update Idea</Button>
      </SheetContent>
    </Sheet>
  );
};

export default function Calendar() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    const { data, error } = await supabase
      .from("scheduled_content")
      .select("*")
      .order("scheduled_for", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch scheduled posts.",
      });
      return;
    }

    // Transform the data to ensure status has a value
    const transformedData: ScheduledPost[] = (data || []).map(post => ({
      id: post.id,
      title: post.title,
      scheduled_for: post.scheduled_for,
      platform: post.platform,
      color: post.color,
      created_at: post.created_at,
      user_id: post.user_id,
      symbol: post.symbol,
      status: (post.status as "scheduled" | "in progress" | "completed") || "scheduled"
    }));

    setScheduledPosts(transformedData);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const postId = result.draggableId;
    const newStatus = result.destination.droppableId as "scheduled" | "in progress" | "completed";

    // Use type assertion to match database schema
    const { error } = await supabase
      .from("scheduled_content")
      .update({
        status: newStatus
      } as {
        status: "scheduled" | "in progress" | "completed"
      })
      .eq("id", postId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update post status.",
      });
      return;
    }

    fetchScheduledPosts();
  };

  const columns = {
    scheduled: {
      title: "Scheduled",
      posts: scheduledPosts.filter((post) => post.status === "scheduled"),
    },
    "in progress": {
      title: "In Progress",
      posts: scheduledPosts.filter((post) => post.status === "in progress"),
    },
    completed: {
      title: "Completed",
      posts: scheduledPosts.filter((post) => post.status === "completed"),
    },
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="container mx-auto pt-16 md:pt-20 px-4 flex flex-col md:flex-row gap-6">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="w-full md:w-1/3">
              <h2 className="text-xl font-semibold mb-4">{column.title}</h2>
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-gray-100 rounded-md p-4 min-h-[300px]"
                  >
                    {column.posts.map((post, index) => (
                      <Draggable key={post.id} draggableId={post.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white rounded-md shadow-sm p-4 mb-4 last:mb-0"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{post.title}</h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => setEditingIdeaId(post.id)}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-sm text-gray-500">
                              Scheduled for {new Date(post.scheduled_for).toLocaleDateString()}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              {columnId === "completed" && (
                                <CheckCircle className="text-green-500 h-4 w-4" />
                              )}
                              <GripVertical className="text-gray-400 h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
            fetchScheduledPosts();
          }}
        />
      )}
    </>
  );
}
