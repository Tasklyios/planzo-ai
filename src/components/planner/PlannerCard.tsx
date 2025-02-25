
import { Draggable } from "react-beautiful-dnd";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import EditIdea from "@/components/EditIdea";

interface PlannerCardProps {
  id: string;
  index: number;
  title: string;
  description: string;
  color?: string;
}

export function PlannerCard({ id, index, title, description, color = "blue" }: PlannerCardProps) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <Draggable draggableId={id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="bg-background rounded-md p-3 shadow-sm border relative group"
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: color ? `var(--${color}-500)` : 'var(--blue-500)'
            }}
          >
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <h4 className="font-medium mb-1 pr-8">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}
      </Draggable>
      {showEdit && (
        <EditIdea 
          ideaId={id} 
          onClose={() => setShowEdit(false)} 
        />
      )}
    </>
  );
}
