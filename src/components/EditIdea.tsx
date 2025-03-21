
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Trash2, Check, Apple, Plus } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  hook_text?: string;
  hook_category?: string;
  scheduled_for?: string | null;
  is_saved?: boolean;
  status?: string;
  user_id?: string;
}

const standardColors = [
  'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'
];

// Map color names to actual hex values for display
const colorMap: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  indigo: "#6366f1",
  purple: "#a855f7",
  pink: "#ec4899",
};

const EditIdea = ({ ideaId, onClose }: EditIdeaProps) => {
  const [idea, setIdea] = useState<IdeaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customColor, setCustomColor] = useState("#3b82f6"); // Default blue
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (ideaId) fetchIdea();
  }, [ideaId]);

  useEffect(() => {
    // Set custom color when idea loads if it's not in standard colors
    if (idea?.color && !standardColors.includes(idea.color)) {
      setCustomColor(idea.color);
    }
  }, [idea]);

  const fetchIdea = async () => {
    try {
      console.log("Fetching idea with ID:", ideaId);
      
      // Get current session to ensure we have the user_id
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "You must be logged in to edit ideas",
        });
        onClose();
        navigate("/auth");
        return;
      }
      
      const userId = sessionData.session.user.id;
      console.log("User ID from session:", userId);
      
      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("id", ideaId)
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching idea:", error);
        throw error;
      }
      
      console.log("Fetched idea data:", data);
      setIdea(data);
    } catch (error: any) {
      console.error("Error fetching idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load idea details: " + (error.message || "Unknown error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!idea) return;
    
    try {
      setDeleting(true);
      
      // Get current session to ensure we have the user_id
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "You must be logged in to delete ideas",
        });
        return;
      }

      const userId = sessionData.session.user.id;
      
      const { error } = await supabase
        .from("video_ideas")
        .update({ 
          scheduled_for: null,
          is_saved: window.location.pathname !== "/calendar",
          user_id: userId
        })
        .eq("id", idea.id)
        .eq("user_id", userId);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: window.location.pathname === "/calendar" 
          ? "Idea removed from calendar" 
          : "Idea deleted successfully",
      });
      onClose();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete idea: " + (error.message || "Unknown error"),
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleNavigateToScript = () => {
    onClose();
    navigate(`/script?idea=${idea?.id}`);
  };

  const handleNavigateToSavedHooks = () => {
    onClose();
    navigate(`/hooks?selectForIdea=${idea?.id}`);
  };

  const handleSave = async () => {
    if (!idea) return;

    try {
      setSaving(true);
      console.log("Saving idea with data:", idea);
      
      // Get current session to ensure we have the user_id
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "You must be logged in to save ideas",
        });
        navigate("/auth");
        return;
      }

      const userId = sessionData.session.user.id;
      
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
          hook_text: idea.hook_text,
          hook_category: idea.hook_category,
          scheduled_for: idea.scheduled_for,
          is_saved: true,
          status: idea.status || "ideas",
          user_id: userId // Explicitly set user_id
        })
        .eq("id", idea.id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error saving idea:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Idea updated successfully",
      });
      onClose();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save idea",
      });
    } finally {
      setSaving(false);
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

  const selectColor = (color: string) => {
    setIdea({ ...idea, color });
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    selectColor(newColor);
  };

  // Get emoji based on title and category
  const ideaEmoji = idea ? getEmojiForIdea(idea.title, idea.category) : "🍎";

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start gap-4 pb-2 border-b">
          <div className="text-4xl" aria-hidden="true">
            {ideaEmoji}
          </div>
          <div className="flex-1">
            <Input
              value={idea.title}
              onChange={(e) => setIdea({ ...idea, title: e.target.value })}
              className="text-xl font-semibold border-none px-0 h-auto focus-visible:ring-0"
              placeholder="Enter idea title..."
            />
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label>Color</label>
              <div className="flex flex-wrap gap-2 items-center">
                {standardColors.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`w-8 h-8 rounded-full p-0 border-2 ${idea.color === color ? 'border-gray-900 dark:border-gray-100' : 'border-transparent'}`}
                    style={{ backgroundColor: colorMap[color] }}
                    onClick={() => selectColor(color)}
                  >
                    {idea.color === color && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                    <span className="sr-only">{color}</span>
                  </Button>
                ))}
                
                {/* Custom color picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`w-8 h-8 rounded-full p-0 border-2 ${!standardColors.includes(idea.color || '') ? 'border-gray-900 dark:border-gray-100' : 'border-transparent'}`}
                      style={{ 
                        backgroundColor: !standardColors.includes(idea.color || '') 
                          ? idea.color 
                          : '#ffffff',
                        backgroundImage: !standardColors.includes(idea.color || '') ? 'none' : 'linear-gradient(45deg, #f59e0b 0%, #3b82f6 50%, #ec4899 100%)'
                      }}
                    >
                      {!standardColors.includes(idea.color || '') && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                      <span className="sr-only">Custom color</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="custom-color" className="text-sm font-medium">
                        Pick a custom color
                      </label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="custom-color"
                          type="color"
                          value={customColor}
                          onChange={handleCustomColorChange}
                          className="w-10 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          type="text"
                          value={customColor}
                          onChange={handleCustomColorChange}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
              value={idea.tags ? idea.tags.join(", ") : ""}
              onChange={(e) => setIdea({ ...idea, tags: e.target.value.split(",").map(t => t.trim()) })}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <label>Hook</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToSavedHooks}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add from Saved Hooks
              </Button>
            </div>
            <div className="relative">
              <Textarea
                value={idea.hook_text || ""}
                onChange={(e) => setIdea({ ...idea, hook_text: e.target.value })}
                placeholder="Add a hook for your video..."
                className={idea.hook_category ? "pr-16" : ""}
              />
              {idea.hook_category && (
                <Badge 
                  className="absolute top-2 right-2"
                  variant="outline"
                >
                  {idea.hook_category}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <label>Script</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToScript}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Script
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
              {deleting ? "Deleting..." : (window.location.pathname === "/calendar" ? "Remove" : "Delete")}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Import this function from the utils file
import { getEmojiForIdea } from "@/utils/emojiUtils";

export default EditIdea;
