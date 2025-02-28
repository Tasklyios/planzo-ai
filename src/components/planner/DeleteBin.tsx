
import { Droppable } from "react-beautiful-dnd";
import { Trash2 } from "lucide-react";

interface DeleteBinProps {
  isOver?: boolean;
}

export function DeleteBin({ isOver }: DeleteBinProps) {
  return (
    <Droppable droppableId="delete-bin" type="column">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            mt-8 p-6 border-2 border-dashed rounded-lg 
            flex items-center justify-center
            transition-colors duration-200
            ${snapshot.isDraggingOver 
              ? "bg-destructive/20 border-destructive" 
              : "bg-muted/30 border-muted-foreground/30"}
          `}
        >
          <div className="flex flex-col items-center gap-2">
            <Trash2 
              className={`h-8 w-8 ${snapshot.isDraggingOver ? "text-destructive" : "text-muted-foreground"}`} 
            />
            <p className={`text-sm font-medium ${snapshot.isDraggingOver ? "text-destructive" : "text-muted-foreground"}`}>
              Drop column here to delete
            </p>
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
