import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import EditIdea from "@/components/EditIdea";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color: string;
  allDay?: boolean;
}

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

const CalendarPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);

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
      
      // Transform scheduled posts to calendar events
      const events: CalendarEvent[] = formattedPosts.map((post) => {
        console.log("Creating calendar event for post:", post.title, post.scheduled_for);
        return {
          id: post.id,
          title: post.title,
          date: new Date(post.scheduled_for || new Date()),
          color: post.color || getRandomColor(post.id),
          allDay: true,
        };
      });
      
      console.log("Calendar events:", events);
      setCalendarEvents(events);
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
  }, []);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  const handleEditClick = (ideaId: string) => {
    setEditingIdeaId(ideaId);
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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="font-medium">{format(date, "MMMM yyyy")}</div>
        </div>
      </div>
      <Calendar
        mode="month"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
        events={calendarEvents}
        onEventClick={handleEventClick}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={selectedEvent.title} readOnly />
                </div>
                {scheduledPosts.find(post => post.id === selectedEvent.id) && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={scheduledPosts.find(post => post.id === selectedEvent.id)?.description || ""}
                        readOnly
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Badge>{scheduledPosts.find(post => post.id === selectedEvent.id)?.category}</Badge>
                    </div>
                  </>
                )}
              </div>
              <Button onClick={() => {
                setOpen(false);
                if (selectedEvent) {
                  handleEditClick(selectedEvent.id);
                }
              }}>Edit</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
            fetchScheduledPosts();
          }}
        />
      )}
    </div>
  );
};

export default CalendarPage;
