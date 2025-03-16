
import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { SearchBar } from "@/components/SearchBar";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block w-64 flex-shrink-0">
          <AppSidebar />
        </div>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">
            <div className="mb-4">
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
