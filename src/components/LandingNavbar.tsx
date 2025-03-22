import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  className?: string;
}

export function LandingNavbar({ className }: Props) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser(profileData);
      } else {
        setUser(null);
      }
    };

    fetchUser();
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/auth");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn("border-b", className)}>
      <div className="flex h-16 items-center px-4">
        <Link className="flex items-center font-semibold" to="/">
          <Icons.logo className="mr-2 h-6 w-6" />
          <span className="hidden sm:inline-block">Planzo</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/privacy-policy" className="text-sm font-medium underline underline-offset-4">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="text-sm font-medium underline underline-offset-4">
              Terms
            </Link>
            {session ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={user?.email} />
                        <AvatarFallback>
                          {user?.first_name?.charAt(0).toUpperCase()}{user?.last_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer">
                      <UserNavHeader
                        name={user?.first_name}
                        email={session?.user?.email}
                      />
                      <DropdownMenuShortcut>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-user-2"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/billing")} className="cursor-pointer">
                      Billing
                      <DropdownMenuShortcut>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-credit-card"
                        >
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                      </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                      Settings
                      <DropdownMenuShortcut>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-settings-2"
                        >
                          <path d="M12.23 2.11A10 10 0 0 1 19 8.16" />
                          <path d="M22 12a10 10 0 0 1-2.11 5.77" />
                          <path d="M17.88 21.89A10 10 0 0 1 16 13" />
                          <path d="M8.16 4.11A10 10 0 0 1 16 13" />
                          <path d="M6.12 2.11A10 10 0 0 0 8 11" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                      Sign out
                      <DropdownMenuShortcut>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-log-out"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" x2="9" y1="12" y2="12" />
                        </svg>
                      </DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild size="sm" className="hidden sm:flex">
                <Link to="/signup">Sign Up</Link>
              </Button>
            )}
          </nav>
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Icons.menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:w-64">
              <Link className="flex items-center space-x-2 font-semibold" to="/">
                <Icons.logo className="mr-2 h-6 w-6" />
                <span>shadnext</span>
              </Link>
              <nav className="grid gap-6 pt-6">
                <Link to="/privacy-policy" className="text-sm font-medium underline underline-offset-4">
                  Privacy
                </Link>
                <Link to="/terms-of-service" className="text-sm font-medium underline underline-offset-4">
                  Terms
                </Link>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

function UserNavHeader({ name, email }: { name: string, email: string }) {
  return (
    <div className="grid gap-1 p-2">
      <p className="text-sm font-medium leading-none">{name ? name : <Skeleton className="h-4 w-[100px]" />}</p>
      <p className="text-xs leading-none text-muted-foreground">{email ? email : <Skeleton className="h-4 w-[100px]" />}</p>
    </div>
  )
}
