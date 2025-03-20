
import React, { useState, useEffect, useCallback } from "react";
import { format, isSameDay, isEqual } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import EditIdea from "@/components/EditIdea";
import { Card } from "@/components/ui/card";
import { FullScreenCalendar, CalendarEvent } from "@/components/ui/fullscreen-calendar";
import { SearchIdeasDialog } from "@/components/search/SearchIdeasDialog";

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

// Map color names to actual hex values for display
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

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [selectedDatePosts, setSelectedDatePosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getRandomColor = (id: string): string => {
    const colors = ["red", "green", "blue", "yellow", "purple", "orange"];
    const index = Math.abs(id.charCodeAt(0) % colors.length);
    return colors[index];
  };

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

      console.log("Formatted posts for calendar:", formattedPosts);
      
      setScheduledPosts(formattedPosts);
      
      const events: CalendarEvent[] = formattedPosts.map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description,
        date: new Date(post.scheduled_for || new Date()),
        color: post.color || getRandomColor(post.id),
        platform: post.platform,
        category: post.category,
        allDay: true,
      }));
      
      console.log("Calendar events:", events);
      setCalendarEvents(events);
      
      // Update selected date posts
      updateSelectedDatePosts(selectedDate, formattedPosts);
      
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching scheduled posts:", error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize the updateSelectedDatePosts function to avoid recreating it on every render
  const updateSelectedDatePosts = useCallback((date: Date, posts: ScheduledPost[] = scheduledPosts) => {
    console.log("Updating selected date posts for:", format(date, "yyyy-MM-dd"));
    const postsForSelectedDate = posts.filter(post => {
      if (!post.scheduled_for) return false;
      const postDate = new Date(post.scheduled_for);
      return isSameDay(postDate, date);
    });
    console.log("Found posts for date:", postsForSelectedDate.length);
    setSelectedDatePosts(postsForSelectedDate);
    setSelectedDate(prevDate => {
      // Only update if the dates are different to avoid infinite loops
      return isSameDay(prevDate, date) ? prevDate : date;
    });
  }, [scheduledPosts]);

  const handleEventClick = (event: CalendarEvent) => {
    console.log("Event clicked:", event);
    setEditingIdeaId(event.id);
  };

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setSearchDialogOpen(true);
  };

  const handleDateSelect = useCallback((date: Date) => {
    if (!isEqual(date, selectedDate)) {
      updateSelectedDatePosts(date);
    }
  }, [selectedDate, updateSelectedDatePosts]);

  const handleDeleteIdea = async (ideaId: string) => {
    try {
      const { error } = await supabase
        .from("video_ideas")
        .update({ status: "draft" })
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

  return (
    <div className="container h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col space-y-1">
          <h3 className="text-lg font-semibold">Calendar</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage your scheduled content
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Card className="flex-1 overflow-hidden border shadow-sm">
          <FullScreenCalendar 
            events={calendarEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
            showSidePanel={true}
          />
        </Card>
      )}

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
            fetchScheduledPosts();
          }}
        />
      )}

      <SearchIdeasDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        selectedDate={selectedDate}
        onIdeaAdded={fetchScheduledPosts}
      />
    </div>
  );
};

export default CalendarPage;
