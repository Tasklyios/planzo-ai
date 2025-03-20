
import { cn } from "@/lib/utils";
import React from "react";

type BentoGridProps = {
  className?: string;
  children?: React.ReactNode;
};

type BentoGridItemProps = {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

export function BentoGrid({
  className,
  children,
}: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
  children,
}: BentoGridItemProps) {
  return (
    <div
      className={cn(
        "rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-neutral-200 flex flex-col space-y-2",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        {title && <h3 className="font-semibold text-xl mt-4">{title}</h3>}
        {description && (
          <div className="mt-2 text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}
