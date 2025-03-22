
import { ReactNode, useState } from "react";
import AppSidebarNew from "./AppSidebarNew";
import { SearchBar } from "@/components/SearchBar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger
} from "@/components/ui/sidebar-new";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="h-screen flex flex-col">
        <div className="md:hidden flex items-center justify-between p-3 border-b">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[90vh]">
              <div className="h-full overflow-auto">
                <AppSidebarNew isMobile={true} closeDrawer={() => setDrawerOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>
          <div className="flex-1 flex justify-center">
            <SearchBar />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <Sidebar>
            <AppSidebarNew />
          </Sidebar>
          <main className="flex-1 overflow-auto bg-background w-full">
            <div className="w-full h-full px-4 md:px-8 lg:px-10 py-4 md:py-6">
              <div className="mb-4 hidden md:flex items-center">
                <SidebarTrigger className="mr-2" />
                <div className="border border-border rounded-lg overflow-hidden flex-1">
                  <SearchBar />
                </div>
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
