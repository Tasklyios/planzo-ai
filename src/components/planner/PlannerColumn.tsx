
import { Draggable, Droppable } from "react-beautiful-dnd";
import { GripVertical } from "lucide-react";

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
          >
            <div className="flex items-center gap-2">
              <div 
                {...provided.dragHandleProps}
                className="cursor-grab hover:text-primary"
              >
                <GripVertical className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
            </div>
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
