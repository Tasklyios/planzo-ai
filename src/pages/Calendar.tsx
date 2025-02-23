
import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { DragDropContext } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { CalendarDayCell } from "@/components/calendar/CalendarDayCell";
import { availableSymbols, getColorClasses } from "@/utils/calendar-utils";
import type { ScheduledPost } from "@/types/calendar";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      <div className="min-h-screen bg-[#F9FAFC] pt-8 px-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysInMonth.map((date) => (
              <CalendarDayCell
                key={format(date, "yyyy-MM-dd")}
                date={date}
                currentDate={currentDate}
                posts={getPostsForDate(date)}
                getColorClasses={getColorClasses}
                availableSymbols={availableSymbols}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </AppLayout>
  );
}
