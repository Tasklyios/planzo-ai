
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
} from "lucide-react";

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
    <div className="min-h-screen bg-[#F9FAFC]">
      <header className="fixed w-full top-0 bg-white border-b border-[#EAECEF] z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-[#4F92FF]">TrendAI</div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <span className="text-[#222831] hover:text-[#4F92FF] cursor-pointer">Ideation</span>
              <span className="text-[#222831] hover:text-[#4F92FF] cursor-pointer">Content Calendar</span>
              <span className="text-[#222831] hover:text-[#4F92FF] cursor-pointer">Saved Ideas</span>
              <span className="text-[#222831] hover:text-[#4F92FF] cursor-pointer">Settings</span>
            </nav>
            <div className="flex items-center space-x-4">
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/auth");
                }}
                className="text-[#222831] hover:text-[#4F92FF]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24">
        <section className="mb-12">
          <h1 className="text-4xl font-bold text-[#222831] mb-8">Welcome back!</h1>
          <div className="grid md:grid-cols-3 gap-6">
            <button className="bg-gradient-to-br from-[#4F92FF] to-[#6BA5FF] text-white p-8 rounded-xl hover:shadow-lg transition-all group">
              <LightbulbIcon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold">Generate Video Ideas</h3>
            </button>
            <button className="bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] text-white p-8 rounded-xl hover:shadow-lg transition-all group">
              <PenSquareIcon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold">Generate AI Script</h3>
            </button>
            <button className="bg-gradient-to-br from-[#6C63FF] to-[#8A84FF] text-white p-8 rounded-xl hover:shadow-lg transition-all group">
              <CalendarIcon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold">Content Calendar</h3>
            </button>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#222831]">Ideas Generated</h2>
              <span className="text-[#4F92FF] bg-[#F0F7FF] px-4 py-2 rounded-full text-sm">This Month</span>
            </div>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-[#4F92FF] mb-2">{totalIdeas}</div>
              <p className="text-[#666]">Video Ideas Generated</p>
              <div className="flex items-center justify-center mt-4 text-[#22C55E]">
                <TrendingUpIcon className="w-4 h-4 mr-2" />
                <span>Active this month</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#222831]">Recent Ideas</h2>
              <button className="text-[#4F92FF] hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {recentIdeas.map((idea, index) => (
                <div key={index} className="p-4 bg-[#F0F7FF] rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="text-[#222831] font-semibold">{idea.title}</h3>
                    <BookmarkIcon 
                      className={`w-5 h-5 cursor-pointer hover:scale-110 transition-transform ${
                        idea.is_saved ? "fill-[#4F92FF]" : ""
                      } text-[#4F92FF]`}
                    />
                  </div>
                  <p className="text-sm text-[#666] mt-2">{getTimeSince(idea.created_at)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-white rounded-xl p-8 shadow-sm mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#222831]">Upcoming Posts</h2>
            <button className="text-[#4F92FF] bg-[#F0F7FF] px-4 py-2 rounded-full hover:bg-[#E1EFFF] transition-colors">
              Open Calendar
            </button>
          </div>
          <div className="space-y-4">
            {scheduledContent.map((content, index) => (
              <div key={index} className="flex items-center p-4 bg-[#F0F7FF] rounded-lg hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4">
                  {content.platform === "TikTok" ? (
                    <i className="fa-brands fa-tiktok text-xl text-[#FF4F4F]"></i>
                  ) : (
                    <i className="fa-brands fa-instagram text-xl text-[#4F92FF]"></i>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-[#222831]">{content.title}</h3>
                  <p className="text-sm text-[#666]">
                    Scheduled for {formatDate(content.scheduled_for)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 ${
                    content.platform === "TikTok" 
                      ? "bg-[#FFE4E4] text-[#FF4F4F]" 
                      : "bg-[#E1EFFF] text-[#4F92FF]"
                  } rounded-full text-sm`}>
                    {content.platform}
                  </span>
                  <button className={content.platform === "TikTok" ? "text-[#FF4F4F]" : "text-[#4F92FF]"}>
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
};

export default Dashboard;
