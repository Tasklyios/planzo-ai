
import { ReactNode, useState } from "react";
import AppSidebar from "./AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[90vh]">
            <div className="h-full overflow-auto">
              <AppSidebar isMobile={true} closeDrawer={() => setDrawerOpen(false)} />
            </div>
          </DrawerContent>
        </Drawer>
        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block w-64 flex-shrink-0">
          <AppSidebar />
        </div>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">
            <div className="mb-4 hidden md:block">
              <SearchBar />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
