
import { useLocation, Link } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { 
  Calendar, 
  Home, 
  Lightbulb, 
  FileText, 
  User, 
  CreditCard, 
  AnchorIcon,
  LayoutGrid,
  Settings,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => (
  <Link to={href} className="w-full">
    <Button 
      variant="ghost" 
      className={cn(
        "w-full justify-start mb-1 font-normal",
        active ? "bg-accent" : "hover:bg-accent"
      )}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  </Link>
);

export default function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Grouped navigation items by category
  const navCategories = [
    {
      title: "Overview",
      items: [
        { 
          label: "Dashboard", 
          href: "/dashboard", 
          icon: <Home className="h-5 w-5" /> 
        }
      ]
    },
    {
      title: "Content Creation",
      items: [
        { 
          label: "Content Generator", 
          href: "/generator", 
          icon: <Sparkles className="h-5 w-5" /> 
        },
        { 
          label: "Script Generator", 
          href: "/script", 
          icon: <FileText className="h-5 w-5" /> 
        },
        { 
          label: "Hook Generator", 
          href: "/hooks", 
          icon: <AnchorIcon className="h-5 w-5" /> 
        },
        { 
          label: "Find Your Style", 
          href: "/find-your-style", 
          icon: <Settings className="h-5 w-5" /> 
        }
      ]
    },
    {
      title: "Planning & Organization",
      items: [
        { 
          label: "Content Planner", 
          href: "/planner", 
          icon: <LayoutGrid className="h-5 w-5" /> 
        },
        { 
          label: "Ideas", 
          href: "/ideas", 
          icon: <Lightbulb className="h-5 w-5" /> 
        },
        { 
          label: "Saved Hooks", 
          href: "/saved-hooks", 
          icon: <Lightbulb className="h-5 w-5" /> 
        },
        { 
          label: "Calendar", 
          href: "/calendar", 
          icon: <Calendar className="h-5 w-5" /> 
        }
      ]
    },
    {
      title: "Account",
      items: [
        { 
          label: "Account", 
          href: "/account", 
          icon: <User className="h-5 w-5" /> 
        },
        { 
          label: "Billing", 
          href: "/billing", 
          icon: <CreditCard className="h-5 w-5" /> 
        }
      ]
    }
  ];
  
  return (
    <div className="h-full flex flex-col bg-card border-r px-3 py-4 overflow-y-auto">
      <div className="flex items-center justify-center mb-6 px-4">
        <Logo />
      </div>
      <div className="space-y-6 flex-1">
        {navCategories.map((category, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-medium text-xs uppercase text-muted-foreground px-4">
              {category.title}
            </h3>
            <div className="space-y-1">
              {category.items.map((item) => (
                <SidebarItem 
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={currentPath === item.href}
                />
              ))}
            </div>
            {index < navCategories.length - 1 && (
              <Separator className="my-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
