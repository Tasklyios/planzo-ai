
import { Draggable } from "react-beautiful-dnd";

interface PlannerCardProps {
  id: string;
  index: number;
  title: string;
  description: string;
}

export function PlannerCard({ id, index, title, description }: PlannerCardProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-background rounded-md p-3 shadow-sm border"
        >
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </Draggable>
  );
}
