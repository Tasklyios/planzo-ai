import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Trash2, Check, Plus } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { 
  getEmojiForIdea, 
  commonEmojis, 
  foodEmojis, 
  activityEmojis,
  emotionEmojis,
  natureEmojis
} from "@/utils/emojiUtils";
import { SavedHooksDialog } from "@/components/hooks/SavedHooksDialog";
import { HookType } from "@/types/hooks";

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
  emoji?: string;
}

const standardColors = [
  'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'
];

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
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [savedHooksDialogOpen, setSavedHooksDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (ideaId) fetchIdea();
  }, [ideaId]);

  useEffect(() => {
    if (idea?.color && !standardColors.includes(idea.color)) {
      setCustomColor(idea.color);
    }
  }, [idea]);

  const fetchIdea = async () => {
    try {
      console.log("Fetching idea with ID:", ideaId);
      
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
        .single();

      if (error) {
        console.error("Error fetching idea:", error);
        throw error;
      }
      
      console.log("Fetched idea data:", data);
      
      if (!data.emoji) {
        data.emoji = getEmojiForIdea(data.title, data.category);
      }
      
      if (!data.user_id) {
        data.user_id = userId;
      }
      
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
      const currentPath = window.location.pathname;
      const isCalendarPage = currentPath === "/calendar";
      const isPlannerPage = currentPath === "/content-planner" || currentPath === "/planner";
      
      if (isCalendarPage) {
        const { error } = await supabase
          .from("video_ideas")
          .update({ 
            scheduled_for: null,
            is_saved: true,
            user_id: userId
          })
          .eq("id", idea.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
      } 
      else if (isPlannerPage) {
        const { error } = await supabase
          .from("video_ideas")
          .update({ 
            status: 'ideas',
            is_saved: true,
            user_id: userId
          })
          .eq("id", idea.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
      }
      else {
        const { error } = await supabase
          .from("video_ideas")
          .update({ 
            is_saved: false,
            user_id: userId
          })
          .eq("id", idea.id);

        if (error) {
          console.error("Delete error:", error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: isCalendarPage 
          ? "Idea removed from calendar" 
          : isPlannerPage
            ? "Idea removed from planner"
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

  const handleOpenSavedHooks = () => {
    setSavedHooksDialogOpen(true);
  };

  const handleSelectHook = (hook: HookType) => {
    if (!idea) return;
    setIdea({
      ...idea,
      hook_text: hook.hook_text,
      hook_category: hook.category
    });
    setSavedHooksDialogOpen(false);
    toast({
      title: "Hook added",
      description: "Hook has been added to your idea",
    });
  };

  const handleSave = async () => {
    if (!idea) return;

    try {
      setSaving(true);
      console.log("Saving idea with data:", idea);
      
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
      const currentPath = window.location.pathname;
      const isGeneratorPage = currentPath === "/generator" || currentPath === "/idea-generator";
      const isPlannerPage = currentPath === "/content-planner" || currentPath === "/planner";
      const isCalendarPage = currentPath === "/calendar";
      
      let newStatus = idea.status || 'generated';
      let newSavedStatus = idea.is_saved || isGeneratorPage;
      
      if (isPlannerPage && idea.scheduled_for) {
        newStatus = idea.status || 'planning';
        newSavedStatus = true;
      } else if (isCalendarPage && ['planning', 'creation', 'review', 'approved'].includes(idea.status || '')) {
        newStatus = idea.status;
        newSavedStatus = true;
      } else if (isCalendarPage) {
        newStatus = 'calendar';
        newSavedStatus = true;
      } else if (isPlannerPage) {
        newSavedStatus = true;
      } else if (isGeneratorPage) {
        newSavedStatus = true;
        newStatus = 'ideas';
      }
      
      console.log(`Current path: ${currentPath}, Setting status to: ${newStatus}, is_saved to: ${newSavedStatus}`);
      
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
          is_saved: newSavedStatus,
          status: newStatus,
          user_id: userId,
          emoji: idea.emoji
        })
        .eq("id", idea.id);

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
    if (idea) {
      setIdea({ ...idea, color });
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    selectColor(newColor);
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

  const ideaEmoji = idea.emoji || getEmojiForIdea(idea.title, idea.category);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-background border-0 shadow-xl rounded-xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Idea</DialogTitle>
          <DialogDescription>Edit your content idea</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-4 p-6 bg-card border-b">
            <div className="flex-1">
              <Input
                value={`${ideaEmoji} ${idea.title}`}
                onChange={(e) => {
                  const value = e.target.value;
                  const newTitle = value.startsWith(ideaEmoji) 
                    ? value.substring(ideaEmoji.length).trim() 
                    : value;
                  setIdea(prev => prev ? { ...prev, title: newTitle } : null);
                }}
                className="text-3xl font-bold border-none px-0 h-auto py-3 focus-visible:ring-0 bg-transparent"
                placeholder="Enter idea title..."
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-6">
              <Card className="p-4 bg-white dark:bg-card border-0 shadow-sm">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">Color</label>
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

                  <div>
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">Schedule</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={dateValue}
                        onChange={(e) => handleDateTimeChange('date', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="time"
                        value={timeValue}
                        onChange={(e) => handleDateTimeChange('time', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Category</label>
                  <Input
                    value={idea.category}
                    onChange={(e) => setIdea({ ...idea, category: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Description</label>
                  <Textarea
                    value={idea.description}
                    onChange={(e) => setIdea({ ...idea, description: e.target.value })}
                    className="min-h-[100px] w-full resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Tags</label>
                  <Input
                    value={idea.tags ? idea.tags.join(", ") : ""}
                    onChange={(e) => setIdea({ ...idea, tags: e.target.value.split(",").map(t => t.trim()) })}
                    placeholder="Enter tags separated by commas"
                    className="w-full"
                  />
                </div>

                <Card className="p-4 bg-white dark:bg-card border-0 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-muted-foreground">Hook</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenSavedHooks}
                        className="h-8 text-xs gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add from Saved Hooks
                      </Button>
                    </div>
                    <div className="relative">
                      <Textarea
                        value={idea.hook_text || ""}
                        onChange={(e) => setIdea({ ...idea, hook_text: e.target.value })}
                        placeholder="Add a hook for your video..."
                        className={`min-h-[80px] w-full resize-none ${idea.hook_category ? "pr-16" : ""}`}
                      />
                      {idea.hook_category && (
                        <Badge 
                          className="absolute top-2 right-2"
                          variant="outline"
                        >
                          {capitalizeFirstLetter(idea.hook_category)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              
                <Card className="p-4 bg-white dark:bg-card border-0 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-muted-foreground">Script</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigateToScript}
                        className="h-8 text-xs gap-1"
                      >
                        <Wand2 className="w-3 h-3" />
                        Generate Script
                      </Button>
                    </div>
                    <Textarea
                      value={idea.script || ""}
                      onChange={(e) => setIdea({ ...idea, script: e.target.value })}
                      className="min-h-[150px] w-full resize-none"
                    />
                  </div>
                </Card>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between p-4 bg-card border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              size="sm"
              className="h-9"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "Deleting..." : (window.location.pathname === "/calendar" ? "Remove" : "Delete")}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} size="sm" className="h-9">
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving} size="sm" className="h-9">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>

      <SavedHooksDialog 
        open={savedHooksDialogOpen}
        onOpenChange={setSavedHooksDialogOpen}
        onSelectHook={handleSelectHook}
      />
    </Dialog>
  );
};

export default EditIdea;
