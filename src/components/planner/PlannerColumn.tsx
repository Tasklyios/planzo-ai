
import { Draggable, Droppable } from "react-beautiful-dnd";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlannerColumnProps {
  title: string;
  id: string;
  index: number;
  children: React.ReactNode;
}

export function PlannerColumn({ title, id, index, children }: PlannerColumnProps) {
  return (
    <Draggable draggableId={`column-${id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-muted/50 rounded-lg p-4 h-full min-w-[320px]"
        >
          <div 
            className="flex justify-between items-center mb-4"
            {...provided.dragHandleProps}
          >
            <h3 className="font-semibold text-lg">{title}</h3>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Droppable droppableId={id} type="task">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[200px]"
              >
                {children}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
}
