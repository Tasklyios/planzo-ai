
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  CreditCard,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const closeSheet = () => setIsOpen(false);

  const MENU_ITEMS = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/generator', label: 'Generator' },
    { path: '/ideas', label: 'Ideas' },
    { path: '/calendar', label: 'Calendar' },
  ] as const;

  const currentPath = window.location.pathname;
  const isIndexPage = currentPath === '/';

  return (
    <header className="fixed w-full bg-card/80 backdrop-blur-sm border-b border-border z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-2xl font-bold text-[#0073FF]">Planzo AI</div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                currentPath === item.path
                  ? "text-[#0073FF] font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
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
                <Button variant="ghost" size="icon">
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
                <DropdownMenuItem onClick={() => navigate('/account')}>
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

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4">
                {MENU_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${
                      currentPath === item.path
                        ? "text-[#0073FF] font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={closeSheet}
                  >
                    {item.label}
                  </Link>
                ))}
                <PricingSheet 
                  trigger={
                    <Button variant="default" size="sm" className="w-full blue-gradient">
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
