
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlannerColumn } from "@/components/planner/PlannerColumn";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { useToast } from "@/components/ui/use-toast";

interface PlannerItem {
  id: string;
  title: string;
  description: string;
}

interface PlannerColumn {
  id: string;
  title: string;
  items: PlannerItem[];
}

export default function ContentPlanner() {
  const { toast } = useToast();
  const [columns, setColumns] = useState<PlannerColumn[]>([
    { id: 'ideas', title: 'Ideas', items: [] },
    { id: 'planning', title: 'Planning', items: [] },
    { id: 'filming', title: 'Ready to Film', items: [] },
    { id: 'editing', title: 'To Edit', items: [] },
    { id: 'ready', title: 'Ready to Post', items: [] },
  ]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);
      
      if (!sourceColumn || !destColumn) return;

      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      setColumns(columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, items: sourceItems };
        }
        if (col.id === destination.droppableId) {
          return { ...col, items: destItems };
        }
        return col;
      }));
    } else {
      const column = columns.find(col => col.id === source.droppableId);
      if (!column) return;

      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);

      setColumns(columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, items: copiedItems };
        }
        return col;
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Content Planner</h1>
        <Button>
          <Plus className="mr-2" />
          Add Column
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div key={column.id} className="min-w-[320px]">
              <PlannerColumn title={column.title} id={column.id}>
                {column.items.map((item, index) => (
                  <PlannerCard 
                    key={item.id} 
                    id={item.id}
                    index={index}
                    title={item.title}
                    description={item.description}
                  />
                ))}
              </PlannerColumn>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
