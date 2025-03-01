
import { Draggable, Droppable } from "react-beautiful-dnd";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SearchIdeasDialog } from "../search/SearchIdeasDialog";

interface PlannerColumnProps {
  title: string;
  id: string;
  index: number;
  children: React.ReactNode;
  isDeletable?: boolean;
}

export function PlannerColumn({ title, id, index, children, isDeletable = true }: PlannerColumnProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <Draggable draggableId={`column-${id}`} index={index} isDragDisabled={!isDeletable}>
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
                className={`cursor-grab hover:text-primary ${!isDeletable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <GripVertical className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              {!isDeletable && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsSearchOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add idea to {title}</span>
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

          <SearchIdeasDialog 
            open={isSearchOpen} 
            onOpenChange={setIsSearchOpen}
            columnId={id}
            columnTitle={title}
          />
        </div>
      )}
    </Draggable>
  );
}
