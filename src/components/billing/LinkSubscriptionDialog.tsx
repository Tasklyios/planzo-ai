
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LinkSubscriptionDialogProps {
  onSuccess: () => void;
}

const LinkSubscriptionDialog = ({ onSuccess }: LinkSubscriptionDialogProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email format
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be logged in to link a subscription");
      }

      console.log("Sending link subscription request with email:", email);

      // Call the Supabase Edge Function directly
      const response = await supabase.functions.invoke('link-subscription', {
        body: { email },
      });

      console.log("Response from link-subscription:", response);
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to link subscription");
      }

      toast({
        title: "Subscription linked successfully",
        description: `Your ${response.data.subscription.tier} subscription has been linked to your account.`,
      });
      
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error("Error linking subscription:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Link Existing Subscription
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Existing Subscription</DialogTitle>
          <DialogDescription>
            If you've already subscribed through Stripe, you can link that subscription
            to your account using the email address you used during checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter the email used for your Stripe subscription"
              required
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Linking..." : "Link Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkSubscriptionDialog;
