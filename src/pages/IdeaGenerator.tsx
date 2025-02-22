
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  CreditCard,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditIdea from "@/components/EditIdea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useIdeaGenerator } from "@/hooks/use-idea-generator";
import GeneratorHeader from "@/components/idea-generator/GeneratorHeader";
import InputForm from "@/components/idea-generator/InputForm";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import MobileMenuDialog from "@/components/idea-generator/MobileMenuDialog";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { AddToCalendarIdea } from "@/types/idea";

const IdeaGenerator = () => {
  const {
    niche,
    setNiche,
    audience,
    setAudience,
    videoType,
    setVideoType,
    platform,
    setPlatform,
    loading,
    ideas,
    generateIdeas,
  } = useIdeaGenerator();

  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
          platform: addingToCalendar.idea.platform || platform,
        })
        .eq("id", addingToCalendar.idea.id)
        .eq("user_id", userId);

      if (error) throw error;

      setAddingToCalendar(null);
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
    }
  };

  const updateCalendarIdea = (field: keyof AddToCalendarIdea, value: string) => {
    if (!addingToCalendar) return;
    setAddingToCalendar(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFC] to-white">
      <header className="fixed w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-[#4F92FF]">TrendAI</div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/dashboard" className="text-gray-600 hover:text-[#4F92FF] cursor-pointer">
              Dashboard
            </Link>
            <Link to="/ideas" className="text-[#4F92FF] font-medium cursor-pointer">
              Ideas
            </Link>
            <Link to="/calendar" className="text-gray-600 hover:text-[#4F92FF] cursor-pointer">
              Calendar
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="ghost" className="md:hidden" size="icon" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-12">
        <section className="mb-12">
          <GeneratorHeader />
          <InputForm
            niche={niche}
            audience={audience}
            videoType={videoType}
            platform={platform}
            setNiche={setNiche}
            setAudience={setAudience}
            setVideoType={setVideoType}
            setPlatform={setPlatform}
          />

          <div className="flex justify-center mb-8">
            <Button
              onClick={generateIdeas}
              disabled={loading}
              className="bg-gradient-to-r from-[#33C3F0] to-[#0EA5E9] hover:from-[#33C3F0]/90 hover:to-[#0EA5E9]/90 text-white px-8 py-6 rounded-full font-medium flex items-center gap-2 h-12 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⚡</span>
                  Generating...
                </>
              ) : (
                <>
                  ⚡ Generate Viral Ideas
                </>
              )}
            </Button>
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
      </main>

      <MobileMenuDialog 
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onLogout={handleLogout}
      />

      <AddToCalendarDialog
        idea={addingToCalendar}
        onOpenChange={() => setAddingToCalendar(null)}
        onAddToCalendar={handleAddToCalendar}
        onUpdate={updateCalendarIdea}
      />

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => setEditingIdeaId(null)}
        />
      )}
    </div>
  );
};

export default IdeaGenerator;
