
import React from "react";
import AppSidebar from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="fixed h-screen z-10">
        <AppSidebar />
      </div>
      <div className="flex-1 overflow-auto ml-64">
        <main className="container mx-auto p-4">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default AppLayout;
