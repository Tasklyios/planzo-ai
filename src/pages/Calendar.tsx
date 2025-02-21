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
  Palette
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import EditIdea from "@/components/EditIdea";

interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  scheduled_for: string;
  created_at: string;
  symbol?: string;
  color?: string;
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

      const { data, error } = await supabase
        .from("scheduled_content")
        .select("*")
        .eq("user_id", sessionData.session.user.id);

      if (error) throw error;
      setScheduledPosts(data || []);
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

      const newPost = {
        title: `New ${platform} Post`,
        platform,
        scheduled_for: new Date().toISOString(),
        user_id: userId,
      };

      const { data, error } = await supabase
        .from("scheduled_content")
        .insert(newPost)
        .select()
        .single();

      if (error) throw error;

      setScheduledPosts([...scheduledPosts, data]);
      
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

  const handleEditPost = async (post: ScheduledPost) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("scheduled_content")
        .update({
          title: post.title,
          scheduled_for: post.scheduled_for,
          symbol: post.symbol,
          color: post.color
        })
        .eq("id", post.id)
        .eq("user_id", userId);

      if (error) throw error;

      setScheduledPosts(posts =>
        posts.map(p => p.id === post.id ? post : p)
      );

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingPost(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (editingPost) {
      const updatedPost = {
        ...editingPost,
        title: editingTitle,
        scheduled_for: editingScheduledFor,
        symbol: selectedSymbol,
        color: selectedColor
      };
      await handleEditPost(updatedPost);
    }
  };

  const openEditDialog = (post: ScheduledPost) => {
    setEditingPost(post);
    setEditingTitle(post.title);
    setEditingScheduledFor(post.scheduled_for);
    setSelectedSymbol(post.symbol || "calendar");
    setSelectedColor(post.color || "blue");
    setIsEditDialogOpen(true);
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
      <Dialog>
        <DialogTrigger asChild>
          <div
            key={post.id}
            className={cn(
              "mt-2 p-2 rounded-lg border cursor-pointer transition-colors hover:opacity-90",
              colorClasses
            )}
          >
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-white" />
              <span className="text-xs text-white font-medium">{post.title}</span>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                defaultValue={post.title}
                onChange={(e) => setEditingTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="scheduled_date">Date</label>
              <Input
                id="scheduled_date"
                type="date"
                defaultValue={post.scheduled_for.split('T')[0]}
                onChange={(e) => {
                  const time = post.scheduled_for.split('T')[1];
                  setEditingScheduledFor(`${e.target.value}T${time}`);
                }}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="scheduled_time">Time</label>
              <Input
                id="scheduled_time"
                type="time"
                defaultValue={post.scheduled_for.split('T')[1].split('.')[0]}
                onChange={(e) => {
                  const date = post.scheduled_for.split('T')[0];
                  setEditingScheduledFor(`${date}T${e.target.value}`);
                }}
              />
            </div>
            <div className="grid gap-2">
              <label>Icon</label>
              <div className="flex flex-wrap gap-2">
                {availableSymbols.map(({ name, icon: Icon }) => (
                  <Button
                    key={name}
                    variant={selectedSymbol === name ? "default" : "outline"}
                    size="icon"
                    onClick={() => setSelectedSymbol(name)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <label>Color</label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(({ name, class: colorClass }) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="icon"
                    className={cn(
                      "w-8 h-8 rounded-full",
                      selectedColor === name && "ring-2 ring-offset-2",
                      colorClass.split(' ')[0]
                    )}
                    onClick={() => setSelectedColor(name)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              const updatedPost = {
                ...post,
                title: editingTitle || post.title,
                scheduled_for: editingScheduledFor || post.scheduled_for,
                symbol: selectedSymbol,
                color: selectedColor
              };
              handleEditPost(updatedPost);
            }}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDailyViewPost = (post: ScheduledPost) => (
    <Dialog>
      <DialogTrigger asChild>
        <div
          key={post.id}
          className={cn(
            "p-4 rounded-xl border transition-all shadow-sm cursor-pointer hover:opacity-90",
            getColorClasses(post.color, 'gradient')
          )}
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
                setEditingIdeaId(post.id);
              }}
            >
              <PenSquare className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-sm font-medium text-gray-600 pl-11">
            {format(new Date(post.scheduled_for), "h:mm a")}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title">Title</label>
            <Input
              id="title"
              defaultValue={post.title}
              onChange={(e) => setEditingTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="scheduled_date">Date</label>
            <Input
              id="scheduled_date"
              type="date"
              defaultValue={post.scheduled_for.split('T')[0]}
              onChange={(e) => {
                const time = post.scheduled_for.split('T')[1];
                setEditingScheduledFor(`${e.target.value}T${time}`);
              }}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="scheduled_time">Time</label>
            <Input
              id="scheduled_time"
              type="time"
              defaultValue={post.scheduled_for.split('T')[1].split('.')[0]}
              onChange={(e) => {
                const date = post.scheduled_for.split('T')[0];
                setEditingScheduledFor(`${date}T${e.target.value}`);
              }}
            />
          </div>
          <div className="grid gap-2">
            <label>Icon</label>
            <div className="flex flex-wrap gap-2">
              {availableSymbols.map(({ name, icon: Icon }) => (
                <Button
                  key={name}
                  variant={selectedSymbol === name ? "default" : "outline"}
                  size="icon"
                  onClick={() => setSelectedSymbol(name)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <label>Color</label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map(({ name, class: colorClass }) => (
                <Button
                  key={name}
                  variant="outline"
                  size="icon"
                  className={cn(
                    "w-8 h-8 rounded-full",
                    selectedColor === name && "ring-2 ring-offset-2",
                    colorClass.split(' ')[0]
                  )}
                  onClick={() => setSelectedColor(name)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            const updatedPost = {
              ...post,
              title: editingTitle || post.title,
              scheduled_for: editingScheduledFor || post.scheduled_for,
              symbol: selectedSymbol,
              color: selectedColor
            };
            handleEditPost(updatedPost);
          }}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#222831] hover:text-primary cursor-pointer" onClick={() => navigate("/calendar")}>
              Content Calendar
            </h2>
            <p className="text-gray-600">Plan and schedule your content across platforms</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Month
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Post</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Button onClick={() => handleNewPost("Instagram")} className="bg-gradient-to-r from-purple-500 to-pink-500">
                    Instagram Post
                  </Button>
                  <Button onClick={() => handleNewPost("TikTok")} className="bg-black">
                    TikTok Video
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-100">
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
                <div key={day} className="p-4 text-center font-medium text-gray-600">
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
                    className={`min-h-[100px] p-3 cursor-pointer ${
                      !isSameMonth(date, currentDate) ? "text-gray-400" :
                      isToday(date) ? "bg-blue-50/30" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span className={isToday(date) ? "font-medium" : ""}>{format(date, "d")}</span>
                    {posts.map((post) => renderPost(post))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-1/3">
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

      {/* Edit Idea Dialog */}
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
