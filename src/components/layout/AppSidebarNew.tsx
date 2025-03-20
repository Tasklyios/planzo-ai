
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, PenSquare, Calendar, Lightbulb, 
  FileText, BookText, UserRound, CreditCard,
  Settings, Instagram, Users, PlusCircle
} from 'lucide-react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';

interface AppSidebarNewProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
}

interface SidebarItemProps {
  icon?: React.ReactNode;
  text: string;
  href: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, href, active, onClick }) => {
  return (
    <li>
      <Link
        to={href}
        className={`flex items-center space-x-3 rounded-md px-3 py-2 text-sm ${
          active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
        }`}
        onClick={onClick}
      >
        {icon && <span>{icon}</span>}
        <span>{text}</span>
      </Link>
    </li>
  );
};

interface SidebarMenuProps {
  title: string;
  children: React.ReactNode;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ title, children }) => {
  return (
    <div className="px-2 py-2">
      <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">{title}</h2>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
};

const AppSidebarNew: React.FC<AppSidebarNewProps> = ({ isMobile, closeDrawer }) => {
  const location = useLocation();
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const handleItemClick = () => {
    if (isMobile && closeDrawer) {
      closeDrawer();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="flex flex-col w-64 border-r bg-background h-screen">
      <div className="p-4 flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-lg">Creator Studio</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto">
        <SidebarMenu title="Create">
          <SidebarItem 
            icon={<Home size={18} />} 
            text="Dashboard" 
            href="/dashboard" 
            active={isActive('/dashboard')}
            onClick={handleItemClick}
          />
          <SidebarItem 
            icon={<Lightbulb size={18} />} 
            text="Idea Generator" 
            href="/idea-generator" 
            active={isActive('/idea-generator')}
            onClick={handleItemClick}
          />
          <SidebarItem 
            icon={<FileText size={18} />} 
            text="Script Generator" 
            href="/script" 
            active={isActive('/script')}
            onClick={handleItemClick}
          />
          
          <SidebarItem 
            icon={<BookText size={18} />} 
            text="Hook Generator" 
            href="/hooks" 
            active={isActive('/hooks')}
            onClick={handleItemClick}
          />
          <SidebarItem 
            icon={<PenSquare size={18} />} 
            text="Content Planner" 
            href="/content-planner" 
            active={isActive('/content-planner')}
            onClick={handleItemClick}
          />
          <SidebarItem 
            icon={<Calendar size={18} />} 
            text="Calendar" 
            href="/calendar" 
            active={isActive('/calendar')}
            onClick={handleItemClick}
          />
        </SidebarMenu>
        
        <SidebarMenu title="Saved">
          <SidebarItem 
            text="Ideas" 
            href="/ideas" 
            active={isActive('/ideas')}
            onClick={handleItemClick}
          />
          <SidebarItem 
            text="Hooks" 
            href="/saved-hooks" 
            active={isActive('/saved-hooks')}
            onClick={handleItemClick}
          />
          <SidebarItem 
            text="Find Your Style" 
            href="/find-your-style" 
            active={isActive('/find-your-style')}
            onClick={handleItemClick}
          />
        </SidebarMenu>

        <SidebarMenu title="Social Accounts">
          <SidebarItem 
            icon={<Instagram size={18} />} 
            text="Manage Accounts" 
            href="/social-accounts" 
            active={isActive('/social-accounts')}
            onClick={handleItemClick}
          />
        </SidebarMenu>

        <SidebarMenu title="Profile">
          <SidebarItem 
            icon={<UserRound size={18} />} 
            text="Account" 
            href="/account" 
            active={isActive('/account')}
            onClick={handleItemClick}
          />
          <SidebarItem 
            icon={<CreditCard size={18} />} 
            text="Billing" 
            href="/billing" 
            active={isActive('/billing')}
            onClick={handleItemClick}
          />
        </SidebarMenu>
      </div>
      
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="space-y-0.5 text-sm">
            <p className="font-medium leading-none">{user?.user_metadata?.full_name || user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebarNew;
