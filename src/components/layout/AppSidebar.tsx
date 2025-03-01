
import { Link, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Sparkles, BookCopy, Zap, Calendar, Film, PenTool, Grid3X3, UserCircle, CreditCard, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarItem = ({ href, icon, label }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent"
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

const AppSidebar = () => {
  return (
    <div className="w-64 border-r h-full flex flex-col">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          ContentCraft
        </h1>
      </div>
      <Separator />
      <div className="flex-1 px-4 py-4 space-y-1">
        <SidebarItem
          href="/dashboard"
          icon={<Grid3X3 className="w-5 h-5" />}
          label="Dashboard"
        />
        <SidebarItem
          href="/generator"
          icon={<Zap className="w-5 h-5" />}
          label="Generate Ideas"
        />
        <SidebarItem
          href="/script"
          icon={<PenTool className="w-5 h-5" />}
          label="Script Creator"
        />
        <SidebarItem
          href="/planner"
          icon={<BookCopy className="w-5 h-5" />}
          label="Content Planner"
        />
        <SidebarItem
          href="/find-your-style"
          icon={<Palette className="w-5 h-5" />}
          label="Find Your Style"
        />
        <SidebarItem
          href="/ideas"
          icon={<Film className="w-5 h-5" />}
          label="Saved Ideas"
        />
        <SidebarItem
          href="/calendar"
          icon={<Calendar className="w-5 h-5" />}
          label="Calendar"
        />
      </div>
      <Separator />
      <div className="px-4 py-4 space-y-1">
        <SidebarItem
          href="/account"
          icon={<UserCircle className="w-5 h-5" />}
          label="Account"
        />
        <SidebarItem
          href="/billing"
          icon={<CreditCard className="w-5 h-5" />}
          label="Billing"
        />
      </div>
    </div>
  );
};

export default AppSidebar;
