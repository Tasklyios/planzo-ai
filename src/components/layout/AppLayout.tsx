
import React from "react";
import AppSidebar from "./AppSidebar";
import { SearchBar } from "@/components/SearchBar";

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
        <div className="h-16 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="w-full max-w-3xl px-4">
            <SearchBar />
          </div>
        </div>
        <main className="max-w-full mx-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
