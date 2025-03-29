
'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DndContext,
  rectIntersection,
  useDraggable,
  useDroppable,
  DragOverlay,
  Active,
  pointerWithin,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useState } from 'react';
import type { ReactNode } from 'react';

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type VideoIdea = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  color?: string;
  status: Status;
  is_on_calendar?: boolean;
  scheduled_for?: string | null;
};

export type KanbanBoardProps = {
  id: Status['id'];
  children: ReactNode;
  className?: string;
  index?: number; // Added index for columns
};

export const KanbanBoard = ({ id, children, className, index }: KanbanBoardProps) => {
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({ 
    id,
    data: { type: 'column', index }
  });
  
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: `column-${id}`,
    data: { type: 'column', id, index },
  });

  return (
    <div
      className={cn(
        'flex h-full min-h-40 flex-col gap-2 rounded-lg border bg-muted/50 p-4 text-xs shadow-sm outline outline-2 transition-all',
        isOver ? 'outline-primary' : 'outline-transparent',
        isDragging ? 'opacity-50' : '',
        className
      )}
      ref={setDroppableRef}
    >
      <div
        ref={setDraggableRef}
        {...attributes}
        {...listeners}
        className="cursor-move"
      >
        {children}
      </div>
    </div>
  );
};

export type KanbanCardProps = {
  id: string;
  title: string;
  description?: string;
  color?: string;
  index: number;
  parent: string;
  children?: ReactNode;
  className?: string;
  isOnCalendar?: boolean;
  onClick?: () => void; // Add onClick prop
};

export const KanbanCard = ({
  id,
  title,
  description,
  color,
  index,
  parent,
  children,
  className,
  isOnCalendar,
  onClick, // Add onClick to the component props
}: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data: { type: 'card', index, parent },
    });

  return (
    <Card
      className={cn(
        'rounded-md p-3 shadow-sm',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{
        transform: transform
          ? `translateX(${transform.x}px) translateY(${transform.y}px)`
          : 'none',
        borderLeft: color ? `4px solid ${color}` : undefined,
      }}
      {...listeners}
      {...attributes}
      ref={setNodeRef}
      onClick={onClick} // Add onClick handler
    >
      {children ?? (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="m-0 font-medium text-sm">{title}</p>
            {isOnCalendar && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-100">
                Scheduled
              </span>
            )}
          </div>
          {description && (
            <p className="m-0 text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export type KanbanCardsProps = {
  children: ReactNode;
  className?: string;
};

export const KanbanCards = ({ children, className }: KanbanCardsProps) => (
  <div className={cn('flex flex-1 flex-col gap-2 mt-2', className)}>{children}</div>
);

export type KanbanHeaderProps =
  | {
      children: ReactNode;
    }
  | {
      name: Status['name'];
      color: Status['color'];
      isFirstColumn?: boolean;
      onAddIdea?: () => void;
      onDeleteColumn?: () => void;
      onEditColumn?: () => void; // Added edit column callback
      className?: string;
    };

export const KanbanHeader = (props: KanbanHeaderProps) =>
  'children' in props ? (
    props.children
  ) : (
    <div className={cn('flex shrink-0 items-center justify-between', props.className)}>
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: props.color }}
        />
        <p className="m-0 font-semibold text-sm">
          {props.name}
          {props.isFirstColumn && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
        </p>
      </div>
      <div className="flex items-center">
        {props.onEditColumn && (
          <button 
            onClick={props.onEditColumn}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            title={`Edit ${props.name} Column`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        {props.onDeleteColumn && !props.isFirstColumn && (
          <button 
            onClick={props.onDeleteColumn}
            className="p-1 hover:bg-muted rounded-full transition-colors ml-1"
            title={`Delete ${props.name} Column`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        {props.onAddIdea && (
          <button 
            onClick={props.onAddIdea}
            className="p-1 hover:bg-muted rounded-full transition-colors ml-1"
            title={`Add idea to ${props.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

export type KanbanProviderProps = {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  className?: string;
};

export const KanbanProvider = ({
  children,
  onDragEnd,
  className,
}: KanbanProviderProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  return (
    <DndContext 
      collisionDetection={pointerWithin} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn('grid w-full auto-cols-[320px] grid-flow-col gap-4', className)}
      >
        {children}
      </div>
    </DndContext>
  );
};
