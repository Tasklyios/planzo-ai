
import Sidebar from "./Sidebar";
import SearchCommand from "./SearchCommand";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <main className="md:pl-64 w-full">
        {children}
      </main>
      <SearchCommand />
    </div>
  );
}
