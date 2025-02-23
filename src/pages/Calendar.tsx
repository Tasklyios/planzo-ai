
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface ScheduledContentType {
  id: string;
  title: string;
  platform: string;
  scheduled_for: string;
  user_id: string;
}

const reorder = (list: ScheduledContentType[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export default function Calendar() {
  const [scheduledContent, setScheduledContent] = useState<ScheduledContentType[][]>([[], [], [], [], [], [], []]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkUser();
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", userId)
        .not("scheduled_for", "is", null)
        .order("scheduled_for", { ascending: true });

      if (error) throw error;

      // Initialize the 2D array with 7 empty arrays (one for each day of the week)
      const initialScheduledContent: ScheduledContentType[][] = [[], [], [], [], [], [], []];

      // Populate the 2D array based on the scheduled_for date
      data.forEach((item: any) => {
        const scheduledDate = new Date(item.scheduled_for);
        const dayOfWeek = scheduledDate.getDay(); // 0 (Sunday) to 6 (Saturday)
        initialScheduledContent[dayOfWeek].push(item);
      });

      setScheduledContent(initialScheduledContent);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) {
      return;
    }

    const sourceDayIndex = parseInt(result.source.droppableId);
    const destinationDayIndex = parseInt(result.destination.droppableId);
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceDayIndex === destinationDayIndex) {
      const items = reorder(
        scheduledContent[sourceDayIndex],
        sourceIndex,
        destinationIndex
      );

      const newScheduledContent = [...scheduledContent];
      newScheduledContent[sourceDayIndex] = items;
      setScheduledContent(newScheduledContent);
    } else {
      const sourceList = Array.from(scheduledContent[sourceDayIndex]);
      const destList = Array.from(scheduledContent[destinationDayIndex]);
      const [removed] = sourceList.splice(sourceIndex, 1);
      destList.splice(destinationIndex, 0, removed);

      const newScheduledContent = [...scheduledContent];
      newScheduledContent[sourceDayIndex] = sourceList;
      newScheduledContent[destinationDayIndex] = destList;

      setScheduledContent(newScheduledContent);

      // Update the scheduled_for date in the database
      try {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + (destinationDayIndex - newDate.getDay()));

        const { error } = await supabase
          .from("video_ideas")
          .update({ scheduled_for: newDate.toISOString() })
          .eq("id", removed.id);

        if (error) throw error;
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update the scheduled date.",
        });
      }
    }
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <AppLayout>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="container mx-auto py-8">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            {daysOfWeek.map((day, dayIndex) => (
              <div key={dayIndex} className="w-full">
                <h2 className="text-xl font-semibold mb-4">{day}</h2>
                <Droppable droppableId={dayIndex.toString()}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="bg-gray-100 rounded p-4 min-h-[200px]"
                    >
                      {scheduledContent[dayIndex].map((content, index) => (
                        <Draggable key={content.id} draggableId={content.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white rounded p-2 mb-2 shadow-sm border border-gray-200"
                            >
                              <div className="flex items-center space-x-2">
                                <CalendarIcon className="h-4 w-4 text-gray-500" />
                                <span>{content.title}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </AppLayout>
  );
}
