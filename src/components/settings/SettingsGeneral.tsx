
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { User, Mail, Key, Save, Lock } from "lucide-react";

const SettingsGeneral = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
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
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setFirstName(profileData.first_name || "");
          setLastName(profileData.last_name || "");
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
    } catch (error) {
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

  return (
    <div className="space-y-8 w-full">
      <Card className="p-6 border border-border/40 shadow-sm">
        <div className="space-y-6 w-full">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-medium">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first-name" className="text-sm font-medium">First Name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="w-full transition-all focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name" className="text-sm font-medium">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className="w-full transition-all focus:border-primary"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted w-full"
            />
            <p className="text-sm text-muted-foreground mt-1 ml-7">
              To change your email, please contact support.
            </p>
          </div>
          
          <Button
            onClick={handleUpdateName}
            disabled={isUpdatingName}
            className="mt-4 gap-2"
          >
            <Save size={16} />
            {isUpdatingName ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
      
      <Card className="p-6 border border-border/40 shadow-sm">
        <div className="space-y-4 w-full">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-medium">Password & Security</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Regularly updating your password helps maintain the security of your account.
            </p>
            <Button variant="outline" className="gap-2">
              <Key size={16} />
              Change Password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsGeneral;
