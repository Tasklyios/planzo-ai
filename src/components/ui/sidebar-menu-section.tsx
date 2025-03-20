
import React from "react";
import { cn } from "@/lib/utils";

interface SidebarMenuSectionProps {
  className?: string;
  title: string;
  children: React.ReactNode;
}

export function SidebarMenuSection({ className, title, children }: SidebarMenuSectionProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

interface SidebarMenuItemProps {
  icon?: React.ReactNode;
  text: string;
  href: string;
  active?: boolean;
}

export function SidebarMenuItem({ icon, text, href, active }: SidebarMenuItemProps) {
  return (
    <li>
      <a
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
          active
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50 hover:text-accent-foreground"
        )}
      >
        {icon && <span className="h-5 w-5">{icon}</span>}
        <span>{text}</span>
      </a>
    </li>
  );
}
