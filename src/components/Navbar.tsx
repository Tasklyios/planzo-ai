import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  CreditCard,
  LogOut,
  Menu,
  Grid3X3,
  Film,
  Calendar,
  BookCopy,
  LightbulbIcon,
  BookOpen,
  Anchor,
  BookmarkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import PricingSheet from "./pricing/PricingSheet";
import { Separator } from "@/components/ui/separator";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const closeSheet = () => setIsOpen(false);

  const MENU_CATEGORIES = [
    {
      title: "Overview",
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <Grid3X3 className="h-5 w-5 mr-2" /> },
        { path: '/planner', label: 'Content Planner', icon: <BookCopy className="h-5 w-5 mr-2" /> },
        { path: '/calendar', label: 'Calendar', icon: <Calendar className="h-5 w-5 mr-2" /> },
      ]
    },
    {
      title: "Create",
      items: [
        { path: '/generator', label: 'Generate Ideas', icon: <LightbulbIcon className="h-5 w-5 mr-2" /> },
        { path: '/script', label: 'Generate Scripts', icon: <BookOpen className="h-5 w-5 mr-2" /> },
        { path: '/hooks', label: 'Generate Hooks', icon: <Anchor className="h-5 w-5 mr-2" /> },
      ]
    },
    {
      title: "Library",
      items: [
        { path: '/ideas', label: 'Saved Ideas', icon: <Film className="h-5 w-5 mr-2" /> },
        { path: '/saved-hooks', label: 'Saved Hooks', icon: <BookmarkIcon className="h-5 w-5 mr-2" /> },
      ]
    }
  ];

  const currentPath = window.location.pathname;
  const isIndexPage = currentPath === '/';
  const isAuthPage = currentPath === '/auth';
  const isLandingPage = isIndexPage || isAuthPage;

  return (
    <header className={`fixed w-full ${isLandingPage ? 'bg-white' : 'bg-card/80 backdrop-blur-sm'} border-b border-border z-50`}>
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Logo size="medium" />
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={isLandingPage ? "outline" : "ghost"} className={isLandingPage ? "text-[#333333]" : ""}>Overview</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {MENU_CATEGORIES[0].items.map(item => (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                  <div className="flex items-center">
                    {item.icon}
                    {item.label}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={isLandingPage ? "outline" : "ghost"} className={isLandingPage ? "text-[#333333]" : ""}>Create</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {MENU_CATEGORIES[1].items.map(item => (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                  <div className="flex items-center">
                    {item.icon}
                    {item.label}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={isLandingPage ? "outline" : "ghost"} className={isLandingPage ? "text-[#333333]" : ""}>Library</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {MENU_CATEGORIES[2].items.map(item => (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                  <div className="flex items-center">
                    {item.icon}
                    {item.label}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <PricingSheet 
            trigger={
              <Button variant="default" size="sm" className="blue-gradient">
                Upgrade
              </Button>
            }
          />
        </div>

        
        <div className="flex items-center space-x-4">
          {!isIndexPage && <ThemeToggle />}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isLandingPage ? "outline" : "ghost"} size="icon" className={isLandingPage ? "text-[#333333]" : ""}>
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/account')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant={isLandingPage ? "outline" : "ghost"} className="md:hidden" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader className="flex items-center">
                <SheetTitle className="flex justify-start">
                  <Logo size="medium" />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4">
                
                {MENU_CATEGORIES.map((category, idx) => (
                  <div key={category.title} className="space-y-2">
                    <h3 className="text-xs uppercase font-medium text-muted-foreground">{category.title}</h3>
                    {category.items.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-2 py-2 text-sm ${
                          currentPath === item.path
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={closeSheet}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    {idx < MENU_CATEGORIES.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
                
                <PricingSheet 
                  trigger={
                    <Button variant="default" size="sm" className="w-full blue-gradient mt-2">
                      Upgrade
                    </Button>
                  }
                />
                <Button variant="outline" onClick={() => {
                  navigate('/account');
                  closeSheet();
                }}>
                  Account Settings
                </Button>
                <Button variant="outline" onClick={() => {
                  handleLogout();
                  closeSheet();
                }}>
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
