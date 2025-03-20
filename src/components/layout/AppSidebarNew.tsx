
import { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar-new";
import {
  Home,
  LayoutDashboard,
  ListChecks,
  Lightbulb,
  Calendar,
  Settings,
  BrainCircuit,
  Rocket,
  Mail,
  FileVideo2,
  User,
} from "lucide-react";

const AppSidebarNew = ({ isMobile = false, closeDrawer = () => {} }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  return (
    <div className={cn("flex h-full flex-col overflow-auto bg-background", { "pb-20": isMobile })}>
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="font-bold">Planzo</span>
      </div>
      
      <div className="px-3 py-2">
        <h4 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground">
          {isCollapsed ? "Menu" : "Main Menu"}
        </h4>
        <div className="space-y-1">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start w-full"
            )}
            onClick={() => isMobile && closeDrawer()}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {!isCollapsed && "Dashboard"}
          </NavLink>
          <NavLink 
            to="/generator" 
            className={({ isActive }) => cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start w-full"
            )}
            onClick={() => isMobile && closeDrawer()}
          >
            <BrainCircuit className="mr-2 h-4 w-4" />
            {!isCollapsed && "Generator"}
          </NavLink>
          <NavLink 
            to="/idea-generator" 
            className={({ isActive }) => cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start w-full"
            )}
            onClick={() => isMobile && closeDrawer()}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            {!isCollapsed && "Idea Generator"}
          </NavLink>
          <NavLink 
            to="/content-planner" 
            className={({ isActive }) => cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start w-full"
            )}
            onClick={() => isMobile && closeDrawer()}
          >
            <ListChecks className="mr-2 h-4 w-4" />
            {!isCollapsed && "Content Planner"}
          </NavLink>
          <NavLink 
            to="/script" 
            className={({ isActive }) => cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start w-full"
            )}
            onClick={() => isMobile && closeDrawer()}
          >
            <FileVideo2 className="mr-2 h-4 w-4" />
            {!isCollapsed && "Script"}
          </NavLink>
          <NavLink 
            to="/hooks" 
            className={({ isActive }) => cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start w-full"
            )}
            onClick={() => isMobile && closeDrawer()}
          >
            <Rocket className="mr-2 h-4 w-4" />
            {!isCollapsed && "Hooks"}
          </NavLink>
          
          <NavLink 
            to="/settings" 
            className={({ isActive }) => cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start w-full"
            )}
            onClick={() => isMobile && closeDrawer()}
          >
            <Settings className="mr-2 h-4 w-4" />
            {!isCollapsed && "Settings"}
          </NavLink>
          
          <NavLink 
            to="/email-templates" 
            className={({ isActive }) => cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start w-full"
            )}
            onClick={() => isMobile && closeDrawer()}
          >
            <Mail className="mr-2 h-4 w-4" />
            {!isCollapsed && "Email Templates"}
          </NavLink>
        </div>
      </div>
      
      <div className="mt-auto border-t px-3 py-2">
        <NavLink 
          to="/account"
          className={({ isActive }) => cn(
            buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
            "justify-start w-full"
          )}
          onClick={() => isMobile && closeDrawer()}
        >
          <User className="mr-2 h-4 w-4" />
          {!isCollapsed && "Account"}
        </NavLink>
      </div>
    </div>
  );
};

export default AppSidebarNew;
