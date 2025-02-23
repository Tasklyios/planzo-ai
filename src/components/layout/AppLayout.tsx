
import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Navbar from "@/components/Navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="flex-none">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-none">
            <Navbar />
          </div>
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
