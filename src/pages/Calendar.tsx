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
          symbol: "calendar",
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

    return (
      <Draggable key={post.id} draggableId={post.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {isMobile ? (
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  getColorClasses(post.color)
                )}
                onClick={() => openEditDialog(post)}
              />
            ) : (
              <div className="mt-2 cursor-pointer transition-colors hover:opacity-90 group">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    getColorClasses(post.color, 'gradient')
                  )}
                  onClick={() => openEditDialog(post)}
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = availableSymbols.find(s => s.name === post.symbol)?.icon || CalendarIcon;
                      return <IconComponent className="h-4 w-4 text-gray-700" />;
                    })()}
                    <span className="text-xs font-medium text-gray-700">{post.title}</span>
                    <GripHorizontal className="h-4 w-4 opacity-0 group-hover:opacity-100 ml-auto text-gray-700" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  const isSelectedDate = (date: Date) => {
    return format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  };

  const renderEventDots = (date: Date) => {
    const posts = getPostsForDate(date);
    const isSelected = isSelectedDate(date);

    if (isSelected) return null;

    return (
      <div className="absolute -top-[2px] left-1/2 transform -translate-x-1/2 flex gap-0.5">
        {posts.map((post, index) => (
          <div
            key={`${post.id}-${index}`}
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              getColorClasses(post.color)
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
            isCollapsed ? "w-[80px]" : "w-[240px]"
          )}
        >
          {/* Logo section */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-[#4F92FF]" />
              {!isCollapsed && (
                <span className="text-xl font-bold text-[#222831]">Lovable</span>
              )}
            </Link>
          </div>

          {/* Main navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors",
                    location.pathname === item.href
                      ? "bg-[#4F92FF] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2">
              {bottomItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors",
                    location.pathname === item.href
                      ? "bg-[#4F92FF] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-3 h-auto"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="ml-2">Logout</span>}
              </Button>
            </div>
          </div>

          {/* Collapse button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-[72px] translate-x-1/2 rounded-full w-6 h-6 p-0 bg-white border shadow-sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? ">" : "<"}
          </Button>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-[#F9FAFC]">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="min-h-screen flex">
              {/* Sidebar */}
              <div className="flex-1">
                <div className="p-6">
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
                </div>
              </div>
            </div>
          </DragDropContext>
        </main>
      </div>
    </AppLayout>
  );
}
