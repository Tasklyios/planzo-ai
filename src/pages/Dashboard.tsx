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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface IdeaType {
  title: string;
  created_at: string;
  is_saved: boolean;
}

interface ScheduledContentType {
  title: string;
  platform: string;
  scheduled_for: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recentIdeas, setRecentIdeas] = useState<IdeaType[]>([]);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContentType[]>([]);
  const [totalIdeas, setTotalIdeas] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkUser();
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      // Fetch recent ideas
      const { data: ideas, error: ideasError } = await supabase
        .from("video_ideas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2);

      if (ideasError) throw ideasError;
      setRecentIdeas(ideas);

      // Fetch scheduled content
      const { data: scheduled, error: scheduledError } = await supabase
        .from("scheduled_content")
        .select("*")
        .order("scheduled_for", { ascending: true })
        .limit(2);

      if (scheduledError) throw scheduledError;
      setScheduledContent(scheduled);

      // Get total ideas count
      const { count } = await supabase
        .from("video_ideas")
        .select("*", { count: "exact" });

      setTotalIdeas(count || 0);
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
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8">
        <section className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-8">Welcome back!</h1>
          <div className="grid md:grid-cols-3 gap-6">
            <button 
              onClick={() => navigate('/ideas')}
              className="bg-card hover:bg-accent text-foreground p-8 rounded-xl border border-border hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center">
                <LightbulbIcon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform text-primary" />
                <h3 className="text-xl font-semibold">Generate Video Ideas</h3>
              </div>
            </button>
            <button 
              onClick={() => navigate('/calendar')}
              className="bg-card hover:bg-accent text-foreground p-8 rounded-xl border border-border hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center">
                <CalendarIcon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform text-primary" />
                <h3 className="text-xl font-semibold">Content Calendar</h3>
              </div>
            </button>
            <button 
              onClick={() => navigate('/account')}
              className="bg-card hover:bg-accent text-foreground p-8 rounded-xl border border-border hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center">
                <User className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform text-primary" />
                <h3 className="text-xl font-semibold">Account Settings</h3>
              </div>
            </button>
          </div>
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

          <section className="bg-card rounded-xl p-8 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recent Ideas</h2>
              <button className="text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {recentIdeas.map((idea, index) => (
                <div key={index} className="p-4 bg-accent rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="text-foreground font-semibold">{idea.title}</h3>
                    <BookmarkIcon 
                      className={`w-5 h-5 cursor-pointer hover:scale-110 transition-transform ${
                        idea.is_saved ? "fill-primary" : ""
                      } text-primary`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{getTimeSince(idea.created_at)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-card rounded-xl p-8 border border-border mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Upcoming Posts</h2>
            <button className="text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
              Open Calendar
            </button>
          </div>
          <div className="space-y-4">
            {scheduledContent.map((content, index) => (
              <div key={index} className="flex items-center p-4 bg-accent rounded-lg hover:bg-accent/80 transition-all">
                <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center mr-4 border border-border">
                  {content.platform === "TikTok" ? (
                    <i className="fa-brands fa-tiktok text-xl text-primary"></i>
                  ) : (
                    <i className="fa-brands fa-instagram text-xl text-primary"></i>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-foreground">{content.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Scheduled for {formatDate(content.scheduled_for)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 ${
                    content.platform === "TikTok" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-primary/10 text-primary"
                  } rounded-full text-sm`}>
                    {content.platform}
                  </span>
                  <button className="text-primary">
                    <MoreVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
