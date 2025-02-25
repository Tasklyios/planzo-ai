
import { Draggable } from "react-beautiful-dnd";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import EditIdea from "@/components/EditIdea";
import { cn } from "@/lib/utils";

interface PlannerCardProps {
  id: string;
  index: number;
  title: string;
  description: string;
  color?: string;
  onEdit?: () => void;
}

// Available colors with their corresponding Tailwind classes
const colorClasses: { [key: string]: string } = {
  red: "border-red-500",
  orange: "border-orange-500",
  yellow: "border-yellow-500",
  green: "border-green-500",
  blue: "border-blue-500",
  indigo: "border-indigo-500",
  purple: "border-purple-500",
  pink: "border-pink-500"
};

export function PlannerCard({ id, index, title, description, color = "blue", onEdit }: PlannerCardProps) {
  const [showEdit, setShowEdit] = useState(false);

  const handleEditClose = () => {
    setShowEdit(false);
    if (onEdit) {
      onEdit();
    }
  };

  const borderColorClass = colorClasses[color || 'blue'] || colorClasses.blue;

  return (
    <>
      <Draggable draggableId={id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "bg-background rounded-md p-3 shadow-sm border relative group",
              "border-l-4",
              borderColorClass
            )}
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
          onClose={handleEditClose}
        />
      )}
    </>
  );
}
