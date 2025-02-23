import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  PenSquare, 
  Video, 
  Check,
  Heart,
  Star,
  Music,
  Image,
  Film,
  BookOpen,
  Camera,
  Palette,
  Menu,
  GripHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import EditIdea from "@/components/EditIdea";

interface VideoIdea {
  id: string;
  title: string;
  description: string;
  platform?: string;
  created_at: string;
  color?: string;
  category?: string;
  tags?: string[];
  is_saved?: boolean;
  script?: string;
  user_id?: string;
  scheduled_for?: string;
}

interface ScheduledPost extends VideoIdea {
  scheduled_for: string;
}

const availableColors = [
  { 
    name: 'red', 
    class: 'bg-red-500 hover:bg-red-600 border-red-400 dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-500 dark:text-white',
    gradient: 'bg-gradient-to-br from-red-200 to-red-300 border-red-200 dark:from-red-900/50 dark:to-red-800/50 dark:border-red-800/30 dark:text-white',
    accent: 'bg-red-500 dark:bg-red-600'
  },
  { 
    name: 'orange', 
    class: 'bg-orange-500 hover:bg-orange-600 border-orange-400 dark:bg-orange-600 dark:hover:bg-orange-700 dark:border-orange-500 dark:text-white',
    gradient: 'bg-gradient-to-br from-orange-200 to-orange-300 border-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 dark:border-orange-800/30 dark:text-white',
    accent: 'bg-orange-500 dark:bg-orange-600'
  },
  { 
    name: 'yellow', 
    class: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:border-yellow-500 dark:text-white',
    gradient: 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50 dark:border-yellow-800/30 dark:text-white',
    accent: 'bg-yellow-500 dark:bg-yellow-600'
  },
  { 
    name: 'green', 
    class: 'bg-green-500 hover:bg-green-600 border-green-400 dark:bg-green-600 dark:hover:bg-green-700 dark:border-green-500 dark:text-white',
    gradient: 'bg-gradient-to-br from-green-200 to-green-300 border-green-200 dark:from-green-900/50 dark:to-green-800/50 dark:border-green-800/30 dark:text-white',
    accent: 'bg-green-500 dark:bg-green-600'
  },
  { 
    name: 'blue', 
    class: 'bg-blue-500 hover:bg-blue-600 border-blue-400 dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-500 dark:text-white',
    gradient: 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 dark:border-blue-800/30 dark:text-white',
    accent: 'bg-blue-500 dark:bg-blue-600'
  },
  { 
    name: 'purple', 
    class: 'bg-purple-500 hover:bg-purple-600 border-purple-400 dark:bg-purple-600 dark:hover:bg-purple-700 dark:border-purple-500 dark:text-white',
    gradient: 'bg-gradient-to-br from-purple-200 to-purple-300 border-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 dark:border-purple-800/30 dark:text-white',
    accent: 'bg-purple-500 dark:bg-purple-600'
  },
  { 
    name: 'pink', 
    class: 'bg-pink-500 hover:bg-pink-600 border-pink-400 dark:bg-pink-600 dark:hover:bg-pink-700 dark:border-pink-500 dark:text-white',
    gradient: 'bg-gradient-to-br from-pink-200 to-pink-300 border-pink-200 dark:from-pink-900/50 dark:to-pink-800/50 dark:border-pink-800/30 dark:text-white',
    accent: 'bg-pink-500 dark:bg-pink-600'
  },
  { 
    name: 'indigo', 
    class: 'bg-indigo-500 hover:bg-indigo-600 border-indigo-400 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:border-indigo-500 dark:text-white',
    gradient: 'bg-gradient-to-br from-indigo-200 to-indigo-300 border-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 dark:border-indigo-800/30 dark:text-white',
    accent: 'bg-indigo-500 dark:bg-indigo-600'
  },
] as const;

const getColorClasses = (color: string | undefined, variant: 'solid' | 'gradient' | 'accent' = 'solid') => {
  const colorConfig = availableColors.find(c => c.name === color);
  if (!color || !colorConfig) return 'bg-gray-100 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700';
  return variant === 'gradient' ? colorConfig.gradient : 
         variant === 'accent' ? colorConfig.accent : 
         colorConfig.class;
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingScheduledFor, setEditingScheduledFor] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("blue");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) {
        navigate("/auth");
        return;
      }

      const { data: scheduledData, error: scheduledError } = await supabase
        .from("video_ideas")
        .select(`
          id,
          title,
          description,
          platform,
          created_at,
          color,
          category,
          tags,
          is_saved,
          script,
          user_id,
          scheduled_for
        `)
        .eq("user_id", sessionData.session.user.id);

      if (scheduledError) throw scheduledError;

      const formattedPosts: ScheduledPost[] = scheduledData?.map(post => ({
        ...post,
        scheduled_for: post.scheduled_for || new Date().toISOString(),
      })) || [];

      setScheduledPosts(formattedPosts);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = async (platform: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        navigate("/auth");
        return;
      }

      const { data: videoIdea, error: videoError } = await supabase
        .from("video_ideas")
        .insert({
          title: `New ${platform} Post`,
          description: "", 
          platform,
          user_id: userId,
          color: "blue",
          tags: [],
          category: "",
        })
        .select()
        .single();

      if (videoError) throw videoError;

      const scheduledPost: ScheduledPost = {
        ...videoIdea,
        scheduled_for: new Date().toISOString(),
      };

      setScheduledPosts(prev => [...prev, scheduledPost]);
      setEditingIdeaId(videoIdea.id);
      
      toast({
        title: "Success",
        description: "New post created successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const openEditDialog = (post: ScheduledPost) => {
    setEditingIdeaId(post.id);
  };

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(
      (post) => format(new Date(post.scheduled_for), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const sourceDate = source.droppableId;
    const destinationDate = destination.droppableId;

    if (sourceDate === destinationDate) return;

    const movedPost = scheduledPosts.find(post => post.id === draggableId);
    if (!movedPost) return;

    try {
      const { error: updateError } = await supabase
        .from("video_ideas")
        .update({
          scheduled_for: destinationDate
        })
        .eq("id", draggableId);

      if (updateError) throw updateError;

      const updatedPosts = scheduledPosts.map(post => {
        if (post.id === draggableId) {
          return {
            ...post,
            scheduled_for: destinationDate
          };
        }
        return post;
      });

      setScheduledPosts(updatedPosts);
      
      toast({
        title: "Success",
        description: "Post rescheduled successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const renderPost = (post: ScheduledPost, index: number) => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      return (
        <Draggable key={post.id} draggableId={post.id} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  getColorClasses(post.color)
                )}
                onClick={() => openEditDialog(post)}
              />
            </div>
          )}
        </Draggable>
      );
    }

    return null; // Don't render task widgets on desktop
  };

  const isSelectedDate = (date: Date) => {
    return format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  };

  const renderEventDots = (date: Date) => {
    const posts = getPostsForDate(date);
    const isSelected = isSelectedDate(date);

    if (isSelected) return null;

    return (
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center gap-[3px] max-w-[80%]">
        {posts.map((post, index) => (
          <div
            key={`${post.id}-${index}`}
            className={cn(
              "w-2 h-2 rounded-full",
              getColorClasses(post.color)
            )}
          />
        ))}
      </div>
    );
  };

  function renderDailyViewPost(selectedDate: Date) {
    const posts = getPostsForDate(selectedDate);

    return posts.map(post => (
      <div
        key={post.id}
        className={cn(
          "p-4 rounded-xl border transition-all shadow-sm cursor-pointer hover:opacity-90",
          getColorClasses(post.color, 'gradient')
        )}
        onClick={() => openEditDialog(post)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-800 dark:text-white">{post.title}</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(post);
            }}
          >
            <PenSquare className="h-4 w-4 dark:text-white" />
          </Button>
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-200">
          {format(new Date(post.scheduled_for), "h:mm a")}
        </div>
      </div>
    ));
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="container mx-auto py-8 flex flex-col md:flex-row gap-6">
          <div className="md:hidden w-full bg-card rounded-xl shadow-sm border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-7 text-xs mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-center font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((date) => (
                  <div
                    key={date.toString()}
                    className={cn(
                      "aspect-square flex items-center justify-center relative pt-0.5",
                      !isSameMonth(date, currentDate) && "text-gray-400",
                      isToday(date) && "font-bold"
                    )}
                    onClick={() => setSelectedDate(date)}
                  >
                    {renderEventDots(date)}
                    <span className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-sm",
                      isSelectedDate(date) && "bg-primary text-white",
                    )}>
                      {format(date, "d")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{format(selectedDate, "MMMM d, yyyy")}</h3>
                <span className="text-sm text-gray-500">{format(selectedDate, "EEEE")}</span>
              </div>
              <div className="space-y-3">
                {getPostsForDate(selectedDate).map((post) => (
                  <div
                    key={post.id}
                    className={cn(
                      "p-3 rounded-lg transition-all cursor-pointer",
                      getColorClasses(post.color, 'gradient')
                    )}
                    onClick={() => openEditDialog(post)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center",
                          getColorClasses(post.color)
                        )}>
                        </div>
                        <span className="font-medium text-sm text-gray-800">{post.title}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {format(new Date(post.scheduled_for), "h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
                {getPostsForDate(selectedDate).length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No events scheduled for this day
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block flex-grow bg-card rounded-xl shadow-sm border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{format(currentDate, "MMMM yyyy")}</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-4 text-center font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-border">
              {daysInMonth.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const posts = getPostsForDate(date);
                
                return (
                  <Droppable key={dateStr} droppableId={dateStr}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "min-h-[100px] p-3 cursor-pointer relative bg-card",
                          !isSameMonth(date, currentDate) ? "text-muted-foreground" :
                          isToday(date) ? "bg-accent/30" : "hover:bg-accent/50"
                        )}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-full",
                            isSelectedDate(date) && "bg-primary text-white",
                            isToday(date) && !isSelectedDate(date) && "font-medium"
                          )}>
                            {format(date, "d")}
                          </span>
                        </div>
                        {renderEventDots(date)}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block w-1/3">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {format(selectedDate, "EEEE")}
                </span>
              </div>
              <div className="space-y-4">
                {renderDailyViewPost(selectedDate)}
              </div>
            </div>
          </div>
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
