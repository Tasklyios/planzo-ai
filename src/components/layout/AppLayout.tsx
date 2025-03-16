
import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden pt-16">
        <div className="hidden md:block w-64 flex-shrink-0">
          <AppSidebar />
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
