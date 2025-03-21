
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-6 w-full">
      <div className="space-y-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last Name</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
              className="w-full"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="bg-muted w-full"
          />
          <p className="text-sm text-muted-foreground">
            To change your email, please contact support.
          </p>
        </div>
        
        <Button
          onClick={handleUpdateName}
          disabled={isUpdatingName}
        >
          {isUpdatingName ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      
      <div className="space-y-4 w-full">
        <h3 className="text-lg font-medium">Password</h3>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Update your password for enhanced security.
          </p>
          <Button variant="outline">Change Password</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsGeneral;
