import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Copy, Key, Link, Power, Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        setEmail(user.email || "");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setFirstName(profileData.first_name || "");
          setLastName(profileData.last_name || "");
        }

        const { data: subscriptionData } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (subscriptionData) {
          setSubscriptionTier(subscriptionData.tier);
          setSubscriptionStatus(subscriptionData.stripe_subscription_id ? "active" : "inactive");
        }
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateName = async () => {
    if (!user) return;

    setIsUpdatingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your name has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Account Settings</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name and personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleUpdateName}
              disabled={isUpdatingName}
            >
              {isUpdatingName ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Manage your email and subscription details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Email</div>
              <div className="flex items-center">
                <Input type="email" value={email} readOnly className="cursor-not-allowed" />
                <Button variant="ghost" size="sm" className="ml-2">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Email
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Subscription Tier</div>
              <div className="text-muted-foreground">{subscriptionTier}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Subscription Status</div>
              <div className="text-muted-foreground">{subscriptionStatus}</div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Account Settings</h2>
          <Card>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold">Update Password</h3>
                  <p className="text-sm text-muted-foreground">Change your password for enhanced security.</p>
                </div>
                <Button onClick={() => navigate('/auth/update-password')} variant="secondary" size="sm">
                  Update Password <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                </div>
                <Button variant="secondary" size="sm" disabled>
                  Enable 2FA <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <Link className="h-5 w-5 text-muted-foreground" />
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold">Connected Accounts</h3>
                  <p className="text-sm text-muted-foreground">Manage third-party apps with access to your account.</p>
                </div>
                <Button variant="secondary" size="sm" disabled>
                  Manage Accounts <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button variant="destructive" onClick={handleSignOut}>
            <Power className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Account;
