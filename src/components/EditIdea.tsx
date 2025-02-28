
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Trash2 } from "lucide-react";
import { Check } from "lucide-react";
import { format } from "date-fns";

interface EditIdeaProps {
  ideaId: string | null;
  onClose: () => void;
}

interface IdeaData {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  platform?: string;
  color?: string;
  script?: string;
  scheduled_for?: string | null;
}

const availableColors = [
  'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'
] as const;

const EditIdea = ({ ideaId, onClose }: EditIdeaProps) => {
  const [idea, setIdea] = useState<IdeaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (ideaId) fetchIdea();
  }, [ideaId]);

  const fetchIdea = async () => {
    try {
      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("id", ideaId)
        .single();

      if (error) throw error;
      setIdea(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load idea details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!idea) return;
    
    try {
      setDeleting(true);
      
      // Instead of deleting, update is_saved to false
      const { error } = await supabase
        .from("video_ideas")
        .update({ is_saved: false })
        .eq("id", idea.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Idea deleted successfully",
      });
      onClose();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete idea. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!idea) return;

    try {
      const { error } = await supabase
        .from("video_ideas")
        .update({
          title: idea.title,
          description: idea.description,
          category: idea.category,
          tags: idea.tags,
          platform: idea.platform,
          color: idea.color || 'blue',
          script: idea.script,
          scheduled_for: idea.scheduled_for
        })
        .eq("id", idea.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Idea updated successfully",
      });
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const generateScript = async () => {
    if (!idea) return;

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
        throw new Error('Failed to generate script');
      }

      setIdea({ ...idea, script: data.script });
      
      toast({
        title: "Success",
        description: "Script generated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setGeneratingScript(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!idea) {
    return null;
  }

  const scheduledDate = idea.scheduled_for ? new Date(idea.scheduled_for) : new Date();
  const dateValue = format(scheduledDate, "yyyy-MM-dd");
  const timeValue = format(scheduledDate, "HH:mm");

  const handleDateTimeChange = (type: 'date' | 'time', value: string) => {
    if (!idea) return;
    
    const currentDate = idea.scheduled_for ? new Date(idea.scheduled_for) : new Date();
    let newDate = new Date(currentDate);

    if (type === 'date') {
      const [year, month, day] = value.split('-').map(Number);
      newDate.setFullYear(year, month - 1, day);
    } else {
      const [hours, minutes] = value.split(':').map(Number);
      newDate.setHours(hours, minutes);
    }

    setIdea({ ...idea, scheduled_for: newDate.toISOString() });
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Idea</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label>Color</label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <Button
                  key={color}
                  variant={idea.color === color ? "default" : "outline"}
                  size="sm"
                  className={`bg-${color}-500 hover:bg-${color}-600 relative`}
                  onClick={() => setIdea({ ...idea, color })}
                >
                  <div className="h-4 w-4 flex items-center justify-center">
                    {idea.color === color && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label>Schedule</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="date"
                  value={dateValue}
                  onChange={(e) => handleDateTimeChange('date', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleDateTimeChange('time', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label>Title</label>
            <Input
              value={idea.title}
              onChange={(e) => setIdea({ ...idea, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <label>Category</label>
            <Input
              value={idea.category}
              onChange={(e) => setIdea({ ...idea, category: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <label>Description</label>
            <Textarea
              value={idea.description}
              onChange={(e) => setIdea({ ...idea, description: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <label>Tags (comma-separated)</label>
            <Input
              value={idea.tags.join(", ")}
              onChange={(e) => setIdea({ ...idea, tags: e.target.value.split(",").map(t => t.trim()) })}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <label>Script</label>
              <Button
                variant="outline"
                size="sm"
                onClick={generateScript}
                disabled={generatingScript}
              >
                {generatingScript ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={idea.script || ""}
              onChange={(e) => setIdea({ ...idea, script: e.target.value })}
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditIdea;
