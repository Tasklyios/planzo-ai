
import React from 'react';
import AppSidebarNew from './AppSidebarNew';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const AppLayout = ({ children, className }: AppLayoutProps) => {
  const { isMobile } = useMobile();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const closeDrawer = () => {
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {isMobile ? (
        <>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
                <Menu />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="w-full h-[calc(100vh-4rem)] overflow-auto">
                <AppSidebarNew isMobile={isMobile} closeDrawer={closeDrawer} />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <AppSidebarNew />
      )}

      <div className={`flex-1 ${className || ''}`}>
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
