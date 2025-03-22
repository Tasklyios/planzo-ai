
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoIdeaSelector from "@/components/script/VideoIdeaSelector";
import InputForm from "@/components/idea-generator/InputForm";
import { GeneratedIdea } from "@/types/idea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AddCalendarPostDialog() {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const handleIdeaSelect = async (idea: GeneratedIdea) => {
    try {
      const { error } = await supabase
        .from("video_ideas")
        .update({ status: "calendar" })
        .eq("id", idea.id);

      if (error) throw error;

      toast({
        title: "Added to calendar",
        description: "The idea has been added to your calendar",
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add idea to calendar: " + error.message,
      });
    }
  };

  const handleNewIdeaCreated = async (ideas: GeneratedIdea[]) => {
    if (ideas.length > 0) {
      await handleIdeaSelect(ideas[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add post to calendar</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="saved">Choose from saved ideas</TabsTrigger>
            <TabsTrigger value="new">Create new idea</TabsTrigger>
          </TabsList>
          <TabsContent value="saved">
            <VideoIdeaSelector onSelectIdea={handleIdeaSelect} />
          </TabsContent>
          <TabsContent value="new">
            <InputForm onIdeaGenerated={handleNewIdeaCreated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
