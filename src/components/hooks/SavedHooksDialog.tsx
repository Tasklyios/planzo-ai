
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HookType, SavedHook } from "@/types/hooks";
import SavedHooksView from "@/components/hooks/SavedHooksView";

interface SavedHooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectHook: (hook: HookType) => void;
}

export function SavedHooksDialog({ open, onOpenChange, onSelectHook }: SavedHooksDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [savedHooks, setSavedHooks] = useState<HookType[]>([]);
  const [isFetchingHooks, setIsFetchingHooks] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchHooks();
    }
  }, [open]);

  const fetchHooks = async () => {
    setIsFetchingHooks(true);
    try {
      const { data, error } = await supabase
        .from("script_hooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedHooks(data || []);
    } catch (error: any) {
      console.error("Error fetching hooks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load saved hooks",
      });
    } finally {
      setIsFetchingHooks(false);
    }
  };

  const handleDeleteHook = async (id: string) => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("script_hooks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSavedHooks(savedHooks.filter(hook => hook.id !== id));
      toast({
        title: "Hook deleted",
        description: "Hook successfully deleted",
      });
    } catch (error: any) {
      console.error("Error deleting hook:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete hook",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filterHooksByCategory = (hooks: (HookType | SavedHook)[], category: string) => {
    const filteredByCategory = hooks.filter(hook => 
      hook.category?.toLowerCase() === category.toLowerCase()
    );
    
    if (!searchTerm) return filteredByCategory;
    
    return filteredByCategory.filter(hook => 
      getHookText(hook).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getHookText = (hook: HookType | SavedHook) => {
    return hook.hook_text || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select from Saved Hooks</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <SavedHooksView
            savedHooks={savedHooks}
            isFetchingHooks={isFetchingHooks}
            handleDeleteHook={handleDeleteHook}
            isDeleting={isDeleting}
            filterHooksByCategory={filterHooksByCategory}
            getHookText={getHookText}
            onSelectHook={onSelectHook}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
