
import { useState, useEffect } from "react";
import { Droppable, DroppableProvided, DroppableStateSnapshot } from "react-beautiful-dnd";
import { Trash2 } from "lucide-react";

interface DeleteBinProps {
  isDragging: boolean;
}

export function DeleteBin({ isDragging }: DeleteBinProps) {
  const [show, setShow] = useState(false);
  
  // Only show the bin when something is being dragged
  useEffect(() => {
    setShow(isDragging);
  }, [isDragging]);
  
  if (!show) {
    return null;
  }
  
  return (
    <Droppable droppableId="delete-bin" type={["column", "task"]}>
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            mt-8 p-8 border-2 border-dashed rounded-lg 
            flex flex-col items-center justify-center gap-4
            transition-all duration-300 ease-in-out
            ${snapshot.isDraggingOver 
              ? "bg-destructive/20 border-destructive scale-105 animate-pulse" 
              : "bg-muted/30 border-muted-foreground/30"}
          `}
          style={{
            minHeight: "160px"
          }}
        >
          <Trash2 
            className={`
              h-10 w-10 mb-2 transition-all duration-200
              ${snapshot.isDraggingOver ? "text-destructive scale-110" : "text-muted-foreground"}
            `} 
          />
          <p className={`
            text-sm font-medium text-center transition-colors duration-200
            ${snapshot.isDraggingOver ? "text-destructive" : "text-muted-foreground"}
          `}>
            Drop here to delete
          </p>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
