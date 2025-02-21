import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import EditIdea from "@/components/EditIdea";

// Define the type based on the database schema
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
}

// Define our ScheduledPost type that includes scheduled_for
interface ScheduledPost extends Omit<VideoIdea, 'description'> {
  description?: string;
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
    gradient: 'bg-gradient-to-br from-red-200 to-red-300 border-red-200'
  },
  { 
    name: 'orange', 
    class: 'bg-orange-500 hover:bg-orange-600 border-orange-400',
    gradient: 'bg-gradient-to-br from-orange-200 to-orange-300 border-orange-200'
  },
  { 
    name: 'yellow', 
    class: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400',
    gradient: 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-yellow-200'
  },
  { 
    name: 'green', 
    class: 'bg-green-500 hover:bg-green-600 border-green-400',
    gradient: 'bg-gradient-to-br from-green-200 to-green-300 border-green-200'
  },
  { 
    name: 'blue', 
    class: 'bg-blue-500 hover:bg-blue-600 border-blue-400',
    gradient: 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-200'
  },
  { 
    name: 'purple', 
    class: 'bg-purple-500 hover:bg-purple-600 border-purple-400',
    gradient: 'bg-gradient-to-br from-purple-200 to-purple-300 border-purple-200'
  },
  { 
    name: 'pink', 
    class: 'bg-pink-500 hover:bg-pink-600 border-pink-400',
    gradient: 'bg-gradient-to-br from-pink-200 to-pink-300 border-pink-200'
  },
  { 
    name: 'indigo', 
    class: 'bg-indigo-500 hover:bg-indigo-600 border-indigo-400',
    gradient: 'bg-gradient-to-br from-indigo-200 to-indigo-300 border-indigo-200'
  },
] as const;

// Helper function to get color classes
const getColorClasses = (color: string | undefined, variant: 'solid' | 'gradient' = 'solid') => {
  const colorConfig = availableColors.find(c => c.name === color);
  if (!color || !colorConfig) return 'bg-gray-100 border-gray-200 hover:bg-gray-200';
  return variant === 'gradient' ? colorConfig.gradient : colorConfig.class;
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

      // First, get all video ideas that have schedules
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
          user_id
        `)
        .eq("user_id", sessionData.session.user.id);

      if (scheduledError) throw scheduledError;

      // Map the data to include scheduled_for
      const formattedPosts: ScheduledPost[] = scheduledData?.map(post => ({
        ...post,
        scheduled_for: new Date().toISOString(), // Default value
        description: post.description || "",
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

      // Create the new video idea first
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

      // Create a scheduled post entry
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
    // Important: This now correctly sets the editingIdeaId using the video_ideas id
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

  const renderPost = (post: ScheduledPost) => {
    const colorClasses = getColorClasses(post.color);
    const IconComponent = availableSymbols.find(s => s.name === post.symbol)?.icon || CalendarIcon;

    return (
      <div
        key={post.id}
        className={cn(
          "mt-2 p-2 rounded-lg border cursor-pointer transition-colors hover:opacity-90",
          colorClasses
        )}
        onClick={() => openEditDialog(post)}
      >
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-white" />
          <span className="text-xs text-white font-medium">{post.title}</span>
        </div>
      </div>
    );
  };

  const renderDailyViewPost = (post: ScheduledPost) => (
    <div
      key={post.id}
      className={cn(
        "p-4 rounded-xl border transition-all shadow-sm cursor-pointer hover:opacity-90",
        getColorClasses(post.color, 'gradient')
      )}
      onClick={() => openEditDialog(post)}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            getColorClasses(post.color)
          )}>
            {(() => {
              const IconComponent = availableSymbols.find(s => s.name === post.symbol)?.icon || CalendarIcon;
              return <IconComponent className="h-4 w-4 text-white" />;
            })()}
          </div>
          <span className="font-medium text-gray-800">{post.title}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openEditDialog(post);
          }}
        >
          <PenSquare className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 text-sm font-medium text-gray-600 pl-11">
        {format(new Date(post.scheduled_for), "h:mm a")}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-20">
        <div className="flex flex-col space-y-6">
          {/* Mobile: Daily View First */}
          <div className="md:hidden bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{format(selectedDate, "MMMM d, yyyy")}</h3>
              <span className="text-sm text-gray-500">{format(selectedDate, "EEEE")}</span>
            </div>
            <div className="space-y-3">
              {getPostsForDate(selectedDate).map(post => (
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
                        {(() => {
                          const IconComponent = availableSymbols.find(s => s.name === post.symbol)?.icon || CalendarIcon;
                          return <IconComponent className="h-3 w-3 text-white" />;
                        })()}
                      </div>
                      <span className="font-medium text-sm text-gray-800">{post.title}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {format(new Date(post.scheduled_for), "h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
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

            <div className="grid grid-cols-7 text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 md:p-4 text-center font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {daysInMonth.map((date) => {
                const posts = getPostsForDate(date);
                return (
                  <div
                    key={date.toString()}
                    className={`min-h-[80px] md:min-h-[100px] p-2 md:p-3 cursor-pointer ${
                      !isSameMonth(date, currentDate) ? "text-gray-400" :
                      isToday(date) ? "bg-blue-50/30" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span className={isToday(date) ? "font-medium" : ""}>{format(date, "d")}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {posts.map((post) => (
                        <div
                          key={post.id}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            getColorClasses(post.color)
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: Daily View Sidebar */}
          <div className="hidden md:block w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{format(selectedDate, "MMMM d, yyyy")}</h3>
                <span className="text-sm text-gray-500">{format(selectedDate, "EEEE")}</span>
              </div>
              <div className="space-y-4">
                {getPostsForDate(selectedDate).map(renderDailyViewPost)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EditIdea Dialog */}
      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
            fetchScheduledPosts(); // Refresh the posts after editing
          }}
        />
      )}
    </>
  );
}
