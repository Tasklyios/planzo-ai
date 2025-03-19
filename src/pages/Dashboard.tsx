
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  LightbulbIcon,
  PenSquareIcon,
  CalendarIcon,
  TrendingUpIcon,
  BookmarkIcon,
  MoreVerticalIcon,
  User,
  CreditCard,
  LogOut,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PricingSheet from "@/components/pricing/PricingSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface IdeaType {
  title: string;
  created_at: string;
  is_saved: boolean;
}

interface ScheduledContentType {
  id: string;
  title: string;
  platform: string;
  scheduled_for: string;
  color?: string;
  symbol?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recentIdeas, setRecentIdeas] = useState<IdeaType[]>([]);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContentType[]>([]);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [upcomingIdeasCount, setUpcomingIdeasCount] = useState(0);
  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Get user's email to extract first name
      const email = session.user.email;
      if (email) {
        // Try to extract a name from the email
        const nameMatch = email.match(/^([^.@]+)/);
        if (nameMatch && nameMatch[0]) {
          // Capitalize first letter
          const firstName = nameMatch[0].charAt(0).toUpperCase() + nameMatch[0].slice(1);
          setUserName(firstName);
        }
      }
    };

    // Set appropriate greeting based on time of day
    const setTimeBasedGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good morning");
      else if (hour < 18) setGreeting("Good afternoon");
      else setGreeting("Good evening");
    };

    setTimeBasedGreeting();
    checkUser();
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Fetch upcoming ideas (scheduled content)
      const today = new Date();
      const { data: scheduled, error: scheduledError } = await supabase
        .from("scheduled_content")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("scheduled_for", today.toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(5);

      if (scheduledError) throw scheduledError;
      setScheduledContent(scheduled || []);
      
      // Count total upcoming ideas
      const { count, error: countError } = await supabase
        .from("scheduled_content")
        .select("*", { count: "exact" })
        .eq("user_id", session.user.id)
        .gte("scheduled_for", today.toISOString());
        
      if (countError) throw countError;
      setUpcomingIdeasCount(count || 0);

      // Fetch recent ideas
      const { data: ideas, error: ideasError } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(2);

      if (ideasError) throw ideasError;
      setRecentIdeas(ideas || []);

      // Get total ideas count
      const { count: ideaCount } = await supabase
        .from("video_ideas")
        .select("*", { count: "exact" })
        .eq("user_id", session.user.id);

      setTotalIdeas(ideaCount || 0);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return format(d, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  const formatShortDate = (date: string) => {
    const d = new Date(date);
    return format(d, "MMM d, yyyy");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-6">
        <section className="mb-8">
          <div className="bg-card p-6 rounded-xl border border-border mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {greeting}, {userName || "Creator"} 😄
            </h1>
            <p className="text-muted-foreground text-lg">
              You have <span className="font-semibold text-primary">{upcomingIdeasCount}</span> upcoming video {upcomingIdeasCount === 1 ? "idea" : "ideas"} to create
            </p>
          </div>

          {scheduledContent.length > 0 ? (
            <div className="bg-card rounded-xl p-6 border border-border mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-foreground">Upcoming Content</h2>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/calendar')}
                  className="text-sm"
                >
                  View Calendar
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledContent.map((content) => (
                      <TableRow key={content.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/calendar?selected=${content.id}`)}>
                        <TableCell className="font-medium">
                          {formatShortDate(content.scheduled_for)}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          <div className="flex items-center gap-2">
                            {content.symbol && (
                              <span className="text-lg">{content.symbol}</span>
                            )}
                            {content.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            content.platform === "TikTok" 
                              ? "bg-pink-500/10 text-pink-500" 
                              : content.platform === "Instagram"
                              ? "bg-purple-500/10 text-purple-500"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {content.platform}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/calendar?selected=${content.id}`);
                            }}
                          >
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl p-8 border border-border mb-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No upcoming content</h3>
              <p className="text-muted-foreground mb-4">
                Start planning your content calendar to see upcoming video ideas here.
              </p>
              <Button onClick={() => navigate('/calendar')}>
                Plan Content
              </Button>
            </div>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <section className="bg-card rounded-xl p-8 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Ideas Generated</h2>
              <span className="text-primary bg-primary/10 px-4 py-2 rounded-full text-sm">This Month</span>
            </div>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-primary mb-2">{totalIdeas}</div>
              <p className="text-muted-foreground">Video Ideas Generated</p>
              <div className="flex items-center justify-center mt-4 text-emerald-500">
                <TrendingUpIcon className="w-4 h-4 mr-2" />
                <span>Active this month</span>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 border border-border relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Upgrade Your Plan</h2>
            </div>
            <div className="relative z-10">
              <p className="text-muted-foreground mb-6">
                Unlock unlimited ideas, advanced analytics, and premium features to supercharge your content creation.
              </p>
              <PricingSheet 
                trigger={
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Rocket className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                }
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          </section>
        </div>

        <section className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-8">Quick Access</h1>
          <div className="grid md:grid-cols-3 gap-6">
            <button 
              onClick={() => navigate('/ideas')}
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 dark:from-blue-500/10 dark:to-blue-600/10 hover:bg-accent text-foreground p-8 rounded-xl border border-border hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center">
                <LightbulbIcon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform text-blue-500 dark:text-blue-400" />
                <h3 className="text-xl font-semibold">Generate Video Ideas</h3>
              </div>
            </button>
            <button 
              onClick={() => navigate('/calendar')}
              className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 dark:from-purple-500/10 dark:to-purple-600/10 hover:bg-accent text-foreground p-8 rounded-xl border border-border hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center">
                <CalendarIcon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform text-purple-500 dark:text-purple-400" />
                <h3 className="text-xl font-semibold">Content Calendar</h3>
              </div>
            </button>
            <button 
              onClick={() => navigate('/account')}
              className="bg-gradient-to-br from-green-500/20 to-green-600/20 dark:from-green-500/10 dark:to-green-600/10 hover:bg-accent text-foreground p-8 rounded-xl border border-border hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center">
                <User className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform text-green-500 dark:text-green-400" />
                <h3 className="text-xl font-semibold">Account Settings</h3>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
