
import { NavLink } from "react-router-dom";
import {
  Grid3X3,
  BookCopy,
  Calendar,
  LightbulbIcon,
  Film,
  BookOpen,
  Anchor,
  BookmarkIcon,
  ChevronDown,
  ChevronRight,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

const menuItems = [
  {
    title: "Overview",
    icon: <Grid3X3 className="h-5 w-5" />,
    href: "/dashboard",
  },
  {
    title: "Content Planner",
    icon: <BookCopy className="h-5 w-5" />,
    href: "/planner",
  },
  {
    title: "Calendar",
    icon: <Calendar className="h-5 w-5" />,
    href: "/calendar",
  },
];

const createCollapsible = {
  title: "Create",
  items: [
    {
      title: "Generate Ideas",
      icon: <LightbulbIcon className="h-5 w-5" />,
      href: "/generator",
    },
    {
      title: "Generate Scripts",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/script",
    },
    {
      title: "Generate Hooks",
      icon: <Anchor className="h-5 w-5" />,
      href: "/hooks",
    },
  ],
};

const libraryCollapsible = {
  title: "Library",
  items: [
    {
      title: "Saved Ideas",
      icon: <Film className="h-5 w-5" />,
      href: "/ideas",
    },
    {
      title: "Saved Hooks",
      icon: <BookmarkIcon className="h-5 w-5" />,
      href: "/saved-hooks",
    },
    {
      title: "Content Style",
      icon: <Palette className="h-5 w-5" />,
      href: "/find-your-style",
    },
  ],
};

export function AppSidebar() {
  const [createOpen, setCreateOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(true);

  return (
    <div className="w-64 flex flex-col bg-card min-h-screen border-r border-card-foreground/10 p-4">
      <div className="space-y-4">
        <div className="w-full">
          <SearchBar />
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center h-9 rounded-md px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
                  isActive && "bg-accent text-foreground"
                )
              }
            >
              <span className="mr-2">{item.icon}</span>
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>

        <div className="space-y-2">
          <Collapsible open={createOpen} onOpenChange={setCreateOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full h-9 rounded-md px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
              <div className="flex items-center">
                <span className="text-sm font-medium">{createCollapsible.title}</span>
              </div>
              {createOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 space-y-1">
              {createCollapsible.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center h-9 rounded-md px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
                      isActive && "bg-accent text-foreground"
                    )
                  }
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="space-y-2">
          <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full h-9 rounded-md px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
              <div className="flex items-center">
                <span className="text-sm font-medium">{libraryCollapsible.title}</span>
              </div>
              {libraryOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 space-y-1">
              {libraryCollapsible.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center h-9 rounded-md px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
                      isActive && "bg-accent text-foreground"
                    )
                  }
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
