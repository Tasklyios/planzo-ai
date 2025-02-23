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
import AppLayout from "@/components/layout/AppLayout";

interface VideoIdea {
  id: string;
  title: string;
  description: string;
  platform?: string;
  created_at: string;
  symbol?: string;
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

const availableSymbols = [
  { name: 'calendar', icon: CalendarIcon },
  { name: 'video', icon: Video },
  { name: 'check', icon: Check },
  { name: 'heart', icon: Heart },
  { name: 'star', icon: Star },
  { name: 'music', icon: Music },
  { name: 'image', icon: Image },
  { name: 'film', icon: Film },
  { name: 'book', icon: BookOpen },
  { name: 'camera', icon: Camera },
  { name: 'palette', icon: Palette }
] as const;

const availableColors = [
  { 
    name: 'red', 
    class: 'bg-red-500 hover:bg-red-600 border-red-400',
    gradient: 'bg-gradient-to-br from-red-200 to-red-300 border-red-200',
    accent: 'bg-red-500'
  },
  { 
    name: 'orange', 
    class: 'bg-orange-500 hover:bg-orange-600 border-orange-400',
    gradient: 'bg-gradient-to-br from-orange-200 to-orange-300 border-orange-200',
    accent: 'bg-orange-500'
  },
  { 
    name: 'yellow', 
    class: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400',
    gradient: 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-yellow-200',
    accent: 'bg-yellow-500'
  },
  { 
    name: 'green', 
    class: 'bg-green-500 hover:bg-green-600 border-green-400',
    gradient: 'bg-gradient-to-br from-green-200 to-green-300 border-green-200',
    accent: 'bg-green-500'
  },
  { 
    name: 'blue', 
    class: 'bg-blue-500 hover:bg-blue-600 border-blue-400',
    gradient: 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-200',
    accent: 'bg-blue-500'
  },
  { 
    name: 'purple', 
    class: 'bg-purple-500 hover:bg-purple-600 border-purple-400',
    gradient: 'bg-gradient-to-br from-purple-200 to-purple-300 border-purple-200',
    accent: 'bg-purple-500'
  },
  { 
    name: 'pink', 
    class: 'bg-pink-500 hover:bg-pink-600 border-pink-400',
    gradient: 'bg-gradient-to-br from-pink-200 to-pink-300 border-pink-200',
    accent: 'bg-pink-500'
  },
  { 
    name: 'indigo', 
    class: 'bg-indigo-500 hover:bg-indigo-600 border-indigo-400',
    gradient: 'bg-gradient-to-br from-indigo-200 to-indigo-300 border-indigo-200',
    accent: 'bg-indigo-500'
  },
] as const;

const getColorClasses = (color: string | undefined, variant: 'solid' | 'gradient' | 'accent' = 'solid') => {
  const colorConfig = availableColors.find(c => c.name === color);
  if (!color || !colorConfig) return 'bg-gray-100 border-gray-200 hover:bg-gray-200';
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
  const [selectedSymbol, setSelectedSymbol] = useState<string>("calendar");
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
          symbol,
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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(
      (post) => format(new Date(post.scheduled_for), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  return (
    <AppLayout>
      <div className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
                        "min-h-[100px] p-3 bg-white rounded-lg border border-gray-200",
                        !isSameMonth(date, currentDate) && "bg-gray-50",
                        isToday(date) && "ring-2 ring-blue-500 ring-offset-2"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-sm font-medium",
                          !isSameMonth(date, currentDate) && "text-gray-400"
                        )}>
                          {format(date, "d")}
                        </span>
                        {isToday(date) && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      {posts.map((post, index) => (
                        <Draggable
                          key={post.id}
                          draggableId={post.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "mb-2 p-2 bg-white rounded border text-sm",
                                getColorClasses(post.color, 'gradient')
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const IconComponent = availableSymbols.find(s => s.name === post.symbol)?.icon || CalendarIcon;
                                  return <IconComponent className="h-4 w-4 text-gray-600" />;
                                })()}
                                <span className="truncate">{post.title}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </AppLayout>
  );
}
