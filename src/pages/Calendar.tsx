import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  PenSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import EditIdea from "@/components/EditIdea";

interface VideoIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  is_saved?: boolean;
  platform?: string;
  color?: string;
  script?: string;
  user_id?: string;
  scheduled_for?: string;
  status?: string;
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
      setLoading(true);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!sessionData.session?.user.id) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to view your calendar",
        });
        navigate("/auth");
        return;
      }

      console.log("Fetching scheduled posts for user:", sessionData.session.user.id);

      const { data: scheduledData, error: scheduledError } = await supabase
        .from("video_ideas")
        .select(`
          id,
          title,
          description,
          category,
          tags,
          platform,
          color,
          hook_text,
          hook_category,
          is_saved,
          script,
          user_id,
          scheduled_for,
          status
        `)
        .eq("user_id", sessionData.session.user.id)
        .not("scheduled_for", "is", null)
        .eq("status", "calendar");

      if (scheduledError) {
        console.error("Error fetching scheduled posts:", scheduledError);
        throw scheduledError;
      }

      console.log("Fetched scheduled posts:", scheduledData);

      if (scheduledData) {
        for (const post of scheduledData) {
          if (!post.is_saved) {
            await supabase
              .from("video_ideas")
              .update({ is_saved: true, status: 'calendar' })
              .eq("id", post.id)
              .eq("user_id", sessionData.session.user.id);
          }
        }
      }

      const formattedPosts: ScheduledPost[] = (scheduledData?.map(post => ({
        ...post,
        scheduled_for: post.scheduled_for || new Date().toISOString(),
      })) || []);

      console.log("Formatted posts for calendar:", formattedPosts);
      
      setScheduledPosts(formattedPosts);
    } catch (error: any) {
      console.error("Error fetching scheduled posts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load scheduled posts",
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

      const scheduledDate = new Date(selectedDate);
      const scheduledISOString = scheduledDate.toISOString();

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
          scheduled_for: scheduledISOString,
          is_saved: true
        })
        .select()
        .single();

      if (videoError) throw videoError;

      const scheduledPost: ScheduledPost = {
        ...videoIdea,
        scheduled_for: scheduledISOString,
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

  const startingDayOfMonth = getDay(startOfMonth(currentDate));

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
          scheduled_for: destinationDate,
          is_saved: true
        })
        .eq("id", draggableId);

      if (updateError) throw updateError;

      const updatedPosts = scheduledPosts.map(post => {
        if (post.id === draggableId) {
          return {
            ...post,
            scheduled_for: destinationDate,
            is_saved: true
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

    return null;
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
              <h3 className="font-semibold text-xl">{format(currentDate, "MMMM yyyy")}</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="hover:bg-accent">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="hover:bg-accent">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-inner">
              <div className="grid grid-cols-7 text-xs mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-center font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayOfMonth }).map((_, index) => (
                  <div key={`empty-start-${index}`} className="aspect-square" />
                ))}
                
                {daysInMonth.map((date) => (
                  <div
                    key={date.toString()}
                    className={cn(
                      "aspect-square flex items-center justify-center relative pt-0.5 cursor-pointer hover:bg-accent/50 rounded-lg transition-colors",
                      !isSameMonth(date, currentDate) && "text-muted-foreground opacity-50",
                      isToday(date) && "font-bold"
                    )}
                    onClick={() => setSelectedDate(date)}
                  >
                    {renderEventDots(date)}
                    <span className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors",
                      isSelectedDate(date) && "bg-primary text-primary-foreground",
                    )}>
                      {format(date, "d")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{format(selectedDate, "MMMM d, yyyy")}</h3>
                <span className="text-sm text-muted-foreground">{format(selectedDate, "EEEE")}</span>
              </div>
              <div className="space-y-3">
                {getPostsForDate(selectedDate).map((post) => (
                  <div
                    key={post.id}
                    className={cn(
                      "p-4 rounded-lg transition-all cursor-pointer hover:opacity-90",
                      getColorClasses(post.color, 'gradient')
                    )}
                    onClick={() => openEditDialog(post)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          getColorClasses(post.color)
                        )} />
                        <span className="font-medium">{post.title}</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(new Date(post.scheduled_for), "h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
                {getPostsForDate(selectedDate).length === 0 && (
                  <div className="text-center text-muted-foreground py-8 bg-accent/50 rounded-lg">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No events scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block flex-grow bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-2xl">{format(currentDate, "MMMM yyyy")}</h3>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-sm">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <div key={day} className="p-4 text-center font-medium text-muted-foreground border-b border-border">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-border">
              {Array.from({ length: startingDayOfMonth }).map((_, index) => (
                <div key={`empty-start-${index}`} className="min-h-[120px] bg-muted/30" />
              ))}
              
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
                          "min-h-[120px] p-3 cursor-pointer relative transition-colors",
                          !isSameMonth(date, currentDate) && "bg-muted/50",
                          isSameMonth(date, currentDate) && "hover:bg-accent/50",
                          isToday(date) && "bg-accent/30"
                        )}
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm mb-1",
                          isSelectedDate(date) && "bg-primary text-primary-foreground",
                          isToday(date) && !isSelectedDate(date) && "font-medium"
                        )}>
                          {format(date, "d")}
                        </span>
                        <div className="space-y-1">
                          {posts.map((post, index) => (
                            <Draggable key={post.id} draggableId={post.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "text-xs p-1.5 rounded truncate",
                                    getColorClasses(post.color, 'gradient')
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(post);
                                  }}
                                >
                                  {post.title}
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block w-1/3">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, "EEEE")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleNewPost('content')}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {getPostsForDate(selectedDate).length > 0 ? (
                  getPostsForDate(selectedDate).map((post) => (
                    <div
                      key={post.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all shadow-sm cursor-pointer hover:shadow-md",
                        getColorClasses(post.color, 'gradient')
                      )}
                      onClick={() => openEditDialog(post)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{post.title}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(post);
                          }}
                          className="h-8 w-8"
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(post.scheduled_for), "h:mm a")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-accent/50 rounded-xl space-y-2">
                    <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No events scheduled</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNewPost('content')}
                      className="mt-2"
                    >
                      Add Event
                    </Button>
                  </div>
                )}
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
