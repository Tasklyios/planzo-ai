import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, PenSquare, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  scheduled_for: string;
  created_at: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch scheduled posts
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

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

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

      setEditingPost(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(
      (post) => format(new Date(post.scheduled_for), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#222831]">Content Calendar</h2>
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
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className={`mt-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          post.platform === "Instagram"
                            ? "bg-purple-50 border-purple-100 hover:bg-purple-100"
                            : "bg-blue-50 border-blue-100 hover:bg-blue-100"
                        }`}
                      >
                        <div className="flex items-center">
                          <i className={`fa-brands fa-${post.platform.toLowerCase()} text-xs mr-2`}></i>
                          <span className="text-xs">{post.title}</span>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}>
                            <PenSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
                {getPostsForDate(selectedDate).map((post) => (
                  <div
                    key={post.id}
                    className={`p-4 rounded-xl border ${
                      post.platform === "Instagram"
                        ? "bg-purple-50 border-purple-100"
                        : "bg-blue-50 border-blue-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          post.platform === "Instagram" ? "bg-purple-100" : "bg-blue-100"
                        }`}>
                          <i className={`fa-brands fa-${post.platform.toLowerCase()} ${
                            post.platform === "Instagram" ? "text-purple-600" : "text-blue-600"
                          }`}></i>
                        </div>
                        <span className="font-medium">{post.title}</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        post.platform === "Instagram" ? "text-purple-600" : "text-blue-600"
                      }`}>
                        {format(new Date(post.scheduled_for), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}>
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Dialog open={editingPost !== null} onOpenChange={(open) => !open && setEditingPost(null)}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Scheduled Post</DialogTitle>
                    </DialogHeader>
                    {editingPost && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label htmlFor="title">Title</label>
                          <Input
                            id="title"
                            value={editingPost.title}
                            onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="scheduled_for">Scheduled For</label>
                          <Input
                            id="scheduled_for"
                            type="datetime-local"
                            value={format(new Date(editingPost.scheduled_for), "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => setEditingPost({ ...editingPost, scheduled_for: new Date(e.target.value).toISOString() })}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingPost(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => editingPost && handleEditPost(editingPost)}>
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
