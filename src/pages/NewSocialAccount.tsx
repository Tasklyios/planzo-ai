
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { SocialAccount } from "@/types/socialAccount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";

const NewSocialAccount = () => {
  const { user } = useSupabaseUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if this is an edit operation
    const params = new URLSearchParams(location.search);
    const editParam = params.get("edit");
    
    if (editParam) {
      setEditMode(true);
      setEditId(editParam);
      fetchAccountDetails(editParam);
    }
  }, [location]);

  const fetchAccountDetails = async (id: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setName(data.name);
        setPlatform(data.platform);
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching account details",
        description: error.message,
      });
      navigate("/social-accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to create a social account.",
      });
      return;
    }
    
    if (!name.trim() || !platform) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editMode && editId) {
        // Update existing account
        const { error } = await supabase
          .from("social_accounts")
          .update({
            name,
            platform,
            avatar_url: avatarUrl || null,
          })
          .eq("id", editId)
          .eq("user_id", user.id);
          
        if (error) throw error;
        
        toast({
          title: "Account updated",
          description: "Your social account has been updated successfully.",
        });
      } else {
        // Check maximum account limit
        const { data: accountsCount, error: countError } = await supabase
          .from("social_accounts")
          .select("id", { count: 'exact' })
          .eq("user_id", user.id);
        
        if (countError) throw countError;
        
        // Get user's subscription tier
        const { data: subscription, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("tier")
          .eq("user_id", user.id)
          .single();
          
        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          throw subscriptionError;
        }
        
        const tier = subscription?.tier || "free";
        
        let maxAccounts = 1;
        if (tier === "pro") maxAccounts = 2;
        else if (tier === "plus") maxAccounts = 3;
        else if (tier === "business") maxAccounts = 4;
        
        if ((accountsCount?.length || 0) >= maxAccounts) {
          throw new Error(`Your ${tier} plan allows a maximum of ${maxAccounts} account${maxAccounts > 1 ? 's' : ''}`);
        }
        
        // Create new account
        const isFirstAccount = !accountsCount || accountsCount.length === 0;
        
        const { error } = await supabase
          .from("social_accounts")
          .insert({
            user_id: user.id,
            name,
            platform,
            avatar_url: avatarUrl || null,
            is_active: isFirstAccount, // First account is automatically active
          });
          
        if (error) throw error;
        
        toast({
          title: "Account created",
          description: "Your new social account has been created successfully.",
        });
      }
      
      // Invalidate queries to refresh data
      await supabase.functions.invoke("invalidate-queries", {
        method: "POST",
        body: { action: "account_change" }
      });
      
      // Navigate back to accounts list
      navigate("/social-accounts");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editMode ? "Error updating account" : "Error creating account",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/social-accounts")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to accounts
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>{editMode ? "Edit Social Account" : "Create New Social Account"}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My YouTube Channel"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select 
                  value={platform} 
                  onValueChange={setPlatform}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Pinterest">Pinterest</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL (optional)</Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  Enter a URL for your account's avatar image. Leave blank to use default icon.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate("/social-accounts")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editMode ? "Update Account" : "Create Account"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewSocialAccount;
