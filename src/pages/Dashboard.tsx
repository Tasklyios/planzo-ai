import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  LightbulbIcon,
  CalendarIcon,
  TrendingUpIcon,
  Rocket,
  User,
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

interface IdeaType {
  title: string;
  created_at: string;
  is_saved: boolean;
}

interface ScheduledVideoIdea {
  id: string;
  title: string;
  platform: string;
  scheduled_for: string;
}

interface ProfileData {
  first_name?: string;
  last_name?: string;
  id?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recentIdeas, setRecentIdeas] = useState<IdeaType[]>([]);
  const [scheduledContent, setScheduledContent] = useState<ScheduledVideoIdea[]>([]);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        
        // Get user profile data including first name
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", session.user.id)
          .single();
        
        if (profileData && profileData.first_name) {
          setFirstName(profileData.first_name);
        }
      }
    };

    // Set greeting based on time of day
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

  // Set up real-time listener for profile changes
  useEffect(() => {
    if (!userId) return;

    // Set up a subscription to listen for changes on the profiles table
    const profilesChannel = supabase
      .channel('profiles-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          // Update the firstName if the profile is updated
          if (payload.new && typeof payload.new === 'object' && 'first_name' in payload.new) {
            const newProfile = payload.new as ProfileData;
            if (newProfile.first_name) {
              setFirstName(newProfile.first_name);
            }
          }
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch scheduled content from video_ideas table with status "calendar"
      const { data: scheduled, error: scheduledError } = await supabase
        .from("video_ideas")
        .select("id, title, platform, scheduled_for")
        .eq("status", "calendar")
        .not("scheduled_for", "is", null)
        .order("scheduled_for", { ascending: true });

      if (scheduledError) throw scheduledError;
      setScheduledContent(scheduled || []);

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
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8">
        <section className="mb-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {firstName ? `${greeting}, ${firstName} 😄` : `${greeting} 😄`}
            </h1>
            <p className="text-xl text-muted-foreground">
              You have <span className="font-bold text-primary">{scheduledContent.length}</span> upcoming video ideas to create
            </p>
          </div>
          
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

        <section className="bg-card rounded-xl p-8 border border-border mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Upcoming Video Ideas</h2>
            <button 
              onClick={() => navigate('/calendar')}
              className="text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
            >
              Open Calendar
            </button>
          </div>
          
          {scheduledContent.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledContent.map((content) => (
                  <TableRow key={content.id} className="hover:bg-accent/50 cursor-pointer">
                    <TableCell className="font-medium">{formatDate(content.scheduled_for)}</TableCell>
                    <TableCell>{content.title}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        content.platform === "TikTok" 
                          ? "bg-pink-500/10 text-pink-500" 
                          : content.platform === "Instagram Reels"
                          ? "bg-purple-500/10 text-purple-500"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {content.platform}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No scheduled content yet.</p>
              <Button 
                onClick={() => navigate('/calendar')}
                variant="outline" 
                className="mt-4"
              >
                Schedule Your First Video
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
