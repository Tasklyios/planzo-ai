import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, addMonths, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import EditIdea from "@/components/EditIdea";
import { EventCalendar, CalendarEvent } from "@/components/ui/event-calendar";
import { DeleteIcon } from "@/components/planner/DeleteIcon";

interface ScheduledPost {
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

const getRandomColor = (id: string): string => {
  const colors = ["red", "green", "blue", "yellow", "purple", "orange"];
  const index = Math.abs(id.charCodeAt(0) % colors.length);
  return colors[index];
};

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [selectedDatePosts, setSelectedDatePosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [ideas, setIdeas] = useState<ScheduledPost[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [calendarHeight, setCalendarHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    setCalendarHeight(window.innerHeight * 0.6);
    
    const handleResize = () => {
      setCalendarHeight(window.innerHeight * 0.6);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        throw scheduledError;
      }

      if (scheduledData) {
        for (const post of scheduledData) {
          if (!post.is_saved) {
            await supabase
              .from("video_ideas")
              .update({ is_saved: true })
              .eq("id", post.id)
              .eq("user_id", sessionData.session.user.id);
          }
        }
      }

      const formattedPosts: ScheduledPost[] = (scheduledData?.map(post => ({
        ...post,
        scheduled_for: post.scheduled_for || new Date().toISOString(),
      })) || []);
      
      setScheduledPosts(formattedPosts);
      
      const events: CalendarEvent[] = formattedPosts.map((post) => {
        return {
          id: post.id,
          title: post.title,
          date: new Date(post.scheduled_for || new Date()),
          color: post.color || getRandomColor(post.id),
          allDay: true,
        };
      });
      
      setCalendarEvents(events);
      
      updateSelectedDatePosts(selectedDate, formattedPosts);
      
      const { data: ideasData } = await supabase
        .from("video_ideas")
        .select("id, title, description, category, tags, platform")
        .eq("user_id", sessionData.session.user.id)
        .eq("status", "ideas")
        .order("created_at", { ascending: false });
        
      setIdeas(ideasData as ScheduledPost[] || []);
      
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load scheduled posts: " + (error.message || "Unknown error"),
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const updateSelectedDatePosts = (date: Date, posts: ScheduledPost[] = scheduledPosts) => {
    const postsForSelectedDate = posts.filter(post => {
      if (!post.scheduled_for) return false;
      const postDate = new Date(post.scheduled_for);
      return isSameDay(postDate, date);
    });
    setSelectedDatePosts(postsForSelectedDate);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedDate(event.date);
    updateSelectedDatePosts(event.date);
  };

  const handleEditClick = (ideaId: string) => {
    setEditingIdeaId(ideaId);
  };

  const handleDeleteIdea = async (ideaId: string) => {
    try {
      const { error } = await supabase
        .from("video_ideas")
        .update({ status: "draft", scheduled_for: null })
        .eq("id", ideaId);
      
      if (error) throw error;
      
      await fetchScheduledPosts();
      toast({
        title: "Removed from calendar",
        description: "The idea has been removed from your calendar",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove idea: " + error.message,
      });
    }
  };

  const handleDateSelect = (newDate: Date | Date[] | { from?: Date; to?: Date } | undefined) => {
    if (newDate instanceof Date) {
      setSelectedDate(newDate);
      updateSelectedDatePosts(newDate);
    }
  };
  
  const handleAddToCalendar = async () => {
    if (!selectedIdea || !scheduledDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select an idea and a date",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from("video_ideas")
        .update({
          scheduled_for: scheduledDate,
          status: "calendar",
          is_saved: true
        })
        .eq("id", selectedIdea);
        
      if (error) throw error;
      
      setAddingToCalendar(false);
      setSelectedIdea("");
      setScheduledDate("");
      
      toast({
        title: "Added to calendar",
        description: "The idea has been added to your calendar",
      });
      
      await fetchScheduledPosts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add idea to calendar: " + error.message,
      });
    }
  };

  const handlePrevMonth = () => {
    setSelectedDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prevDate => addMonths(prevDate, 1));
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between p-6">
        <div className="flex flex-col space-y-1">
          <h3 className="text-lg font-semibold">Calendar</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage your scheduled content
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="font-medium">{format(selectedDate, "MMMM yyyy")}</div>
          </div>
          <Button size="sm" onClick={() => setAddingToCalendar(true)}>
            Add To Calendar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="shadow-sm h-full">
            <CardContent className="p-4 h-full">
              <div style={{ height: calendarHeight }} className="overflow-hidden">
                <EventCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md pointer-events-auto w-full h-full"
                  events={calendarEvents.map(event => ({
                    ...event,
                    color: event.color.startsWith('#') ? event.color : colorMap[event.color] || '#3b82f6'
                  }))}
                  onEventClick={handleEventClick}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="shadow-sm h-full">
            <CardHeader className="bg-slate-50 dark:bg-slate-800">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : selectedDatePosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No content scheduled for this day
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDatePosts.map(post => (
                    <Card 
                      key={post.id} 
                      className="hover:shadow-md transition-shadow border-l-4" 
                      style={{ 
                        borderLeftColor: post.color ? 
                          (post.color.startsWith('#') ? post.color : colorMap[post.color] || '#3b82f6') : 
                          '#3b82f6' 
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{post.title}</h4>
                            <div className="flex items-center space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0" 
                                onClick={() => handleEditClick(post.id)}
                              >
                                <Pencil className="h-4 w-4 text-gray-500" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <DeleteIcon 
                                onDelete={() => handleDeleteIdea(post.id)}
                                title="Remove from Calendar"
                                description="This will remove the idea from your calendar but keep it in your drafts."
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {post.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 justify-center">
                            <Badge variant="outline" className="text-xs">
                              {post.category}
                            </Badge>
                            {post.platform && (
                              <Badge variant="outline" className="text-xs">
                                {post.platform}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
            fetchScheduledPosts();
          }}
        />
      )}
      
      <Dialog open={addingToCalendar} onOpenChange={setAddingToCalendar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Calendar</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="idea">Select an Idea</Label>
              <select 
                id="idea" 
                value={selectedIdea}
                onChange={(e) => setSelectedIdea(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select an idea</option>
                {ideas.map(idea => (
                  <option key={idea.id} value={idea.id}>{idea.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Schedule Date</Label>
              <Input 
                id="date" 
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleAddToCalendar}>Add to Calendar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
