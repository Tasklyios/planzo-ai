
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  LightbulbIcon,
  Filter,
  ArrowDownWideNarrow,
  PenSquare,
  Wand2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface GeneratedIdea {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  platform?: string;
}

interface Script {
  id: string;
  idea_id: string;
  content: string;
  created_at: string;
}

const Scripts = () => {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [script, setScript] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", sessionData.session.user.id);

      if (error) throw error;
      setIdeas(data || []);
    } catch (error: any) {
      console.error("Error fetching ideas:", error);
    }
  };

  const generateScript = async (idea: GeneratedIdea) => {
    setGeneratingScript(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          type: 'script',
          title: idea.title,
          description: idea.description,
          platform: idea.platform,
          tags: idea.tags,
        },
      });

      if (error) throw error;

      if (!data || !data.script) {
        throw new Error('Invalid response format from AI');
      }

      setScript(data.script);

      // Save the script to the database
      const { data: sessionData } = await supabase.auth.getSession();
      const { error: saveError } = await supabase.from("scripts").insert({
        idea_id: idea.id,
        content: data.script,
        user_id: sessionData.session?.user.id,
      });

      if (saveError) throw saveError;

      toast({
        title: "Success!",
        description: "Your script has been generated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate script. Please try again.",
      });
    } finally {
      setGeneratingScript(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFC] to-white">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#222831] mb-4">Video Scripts</h1>
            <p className="text-gray-600 max-w-2xl">
              Select a video idea to generate an engaging script with a captivating hook. Our AI uses proven storytelling techniques to create compelling content.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <ArrowDownWideNarrow className="w-4 h-4" />
              Sort
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => setSelectedIdea(idea)}
              className="group bg-[#F9FAFC] rounded-xl p-6 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-[#4F92FF]/20 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4F92FF]/10 flex items-center justify-center text-[#4F92FF]">
                    <LightbulbIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm text-[#4F92FF] font-medium">{idea.category}</span>
                    <h3 className="text-lg font-medium text-[#222831]">{idea.title}</h3>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <PenSquare className="h-4 w-4 mr-2" />
                  Create Script
                </Button>
              </div>
              <p className="text-gray-600">{idea.description}</p>
              <div className="flex gap-3 mt-4">
                {idea.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="px-3 py-1 bg-[#4F92FF]/10 text-[#4F92FF] text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={selectedIdea !== null} onOpenChange={(open) => !open && setSelectedIdea(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Script - {selectedIdea?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {script ? (
              <Textarea
                value={script}
                className="min-h-[300px]"
                readOnly
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Ready to create an engaging script for your video? Our AI will help you craft a compelling narrative with a strong hook.
                </p>
                <Button
                  onClick={() => selectedIdea && generateScript(selectedIdea)}
                  disabled={generatingScript}
                  className="gap-2"
                >
                  {generatingScript ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Generate Script
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedIdea(null);
              setScript("");
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scripts;
