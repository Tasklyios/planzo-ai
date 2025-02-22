import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BookmarkIcon, LightbulbIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IdeaType {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_saved: boolean;
}

export default function Ideas() {
  const [ideas, setIdeas] = useState<IdeaType[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setIdeas(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <main className="container mx-auto px-4 pt-16 md:pt-28 pb-12">
      <section className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#222831]">Your Ideas</h1>
          <button
            onClick={() => navigate('/generator')}
            className="bg-gradient-to-br from-[#4F92FF] to-[#6BA5FF] text-white px-4 py-2 rounded-full hover:shadow-md transition-all flex items-center"
          >
            <LightbulbIcon className="w-4 h-4 mr-2" />
            Generate New
          </button>
        </div>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea) => (
          <div key={idea.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-[#222831]">{idea.title}</h2>
              <BookmarkIcon
                className={`w-5 h-5 cursor-pointer hover:scale-110 transition-transform ${
                  idea.is_saved ? "fill-[#4F92FF]" : ""
                } text-[#4F92FF]`}
              />
            </div>
            <p className="text-gray-600 mb-4">{idea.description}</p>
            <p className="text-sm text-gray-500">
              Created {getTimeSince(idea.created_at)}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
