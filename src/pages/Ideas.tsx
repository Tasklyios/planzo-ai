
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import { GeneratedIdea } from "@/types/idea";
import EditIdea from "@/components/EditIdea";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { AddToCalendarIdea } from "@/types/idea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { IconMap } from "@/types/idea";

export default function Ideas() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateIconKey = (key: string | undefined): keyof typeof IconMap => {
    if (!key || !(key in IconMap)) {
      return 'Lightbulb';
    }
    return key as keyof typeof IconMap;
  };

  const fetchSavedIdeas = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .eq("is_saved", true);

      if (error) throw error;
      
      // Transform the data to ensure symbol is of the correct type
      const transformedIdeas = (data || []).map(idea => ({
        ...idea,
        symbol: validateIconKey(idea.symbol)
      })) as GeneratedIdea[];

      setIdeas(transformedIdeas);
    } catch (error: any) {
      console.error("Error fetching saved ideas:", error);
      toast({
        title: "Error",
        description: "Failed to load saved ideas",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSavedIdeas();
  }, []);

  const handleAddToCalendar = async () => {
    if (!addingToCalendar?.idea) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("video_ideas")
        .update({
          scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString(),
          is_saved: false
        })
        .eq("id", addingToCalendar.idea.id)
        .eq("user_id", userId);

      if (error) throw error;

      setAddingToCalendar(null);
      await fetchSavedIdeas();
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      toast({
        title: "Error",
        description: "Failed to add idea to calendar",
        variant: "destructive",
      });
    }
  };

  const updateCalendarIdea = (field: keyof AddToCalendarIdea, value: string) => {
    if (!addingToCalendar) return;
    setAddingToCalendar(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-12">
        <section className="mb-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#222831]">Saved Ideas</h1>
            <p className="text-gray-600 mt-2">Browse and manage your bookmarked video ideas</p>
          </div>

          <IdeasGrid
            ideas={ideas}
            onAddToCalendar={(idea) => setAddingToCalendar({
              idea,
              title: idea.title,
              scheduledFor: new Date().toISOString().split('T')[0],
            })}
            onEdit={(ideaId) => setEditingIdeaId(ideaId)}
          />
        </section>

        {editingIdeaId && (
          <EditIdea
            ideaId={editingIdeaId}
            onClose={() => {
              setEditingIdeaId(null);
              fetchSavedIdeas();
            }}
          />
        )}

        <AddToCalendarDialog
          idea={addingToCalendar}
          onOpenChange={() => setAddingToCalendar(null)}
          onAddToCalendar={handleAddToCalendar}
          onUpdate={updateCalendarIdea}
        />
      </main>
    </AuthGuard>
  );
}
