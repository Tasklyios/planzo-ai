
import React, { useState } from "react";
import AppSidebar from "./AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {!isMobile && (
        <div className="fixed h-screen z-10">
          <AppSidebar />
        </div>
      )}
      
      <div className={`flex-1 overflow-auto ${!isMobile ? "ml-64" : "ml-0"}`}>
        <header className="h-16 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-between px-4">
          {isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <AppSidebar isMobile={true} onNavItemClick={() => setIsOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
          
          <div className="w-full max-w-3xl">
            <SearchBar />
          </div>
        </header>
        
        <main className="max-w-full mx-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
