import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AccountDetails = () => {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setEmail(session.user.email || "");
      }
    };

    fetchUser();
  }, []);
  
  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", session.user.id)
          .single();
          
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
        }
      }
    };
    
    fetchProfile();
  }, []);
  
  const updateProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No user session found");
      
      // Update profile in database
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", session.user.id);
        
      if (profileError) throw profileError;
      
      // Also update user metadata
      await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName
        }
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async () => {
    setIsUpdatingEmail(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: email,
      });
      if (error) throw error;

      toast({
        title: "Email updated",
        description: "Please check your email to verify the new address",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating email",
        description: error.message,
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const updatePassword = async () => {
    setIsUpdatingPassword(true);
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error.message,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const navigateToBilling = () => {
    navigate("/billing");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Account Information</h2>
        <p className="text-muted-foreground">
          Update your account details and preferences.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              First Name
            </label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Last Name
            </label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Email
          </label>
          <div className="flex items-center">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="max-w-md"
            />
            <Button
              onClick={updateEmail}
              disabled={isUpdatingEmail}
              className="ml-2"
            >
              {isUpdatingEmail ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                "Update Email"
              )}
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={updateProfile} 
          disabled={loading}
          className="mt-4"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            "Update Profile"
          )}
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Password Update</h2>
        <p className="text-muted-foreground">
          Change your password to keep your account secure.
        </p>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              type="password"
              id="newPassword"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={updatePassword} disabled={isUpdatingPassword}>
            {isUpdatingPassword ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing details.
        </p>
        <Button onClick={navigateToBilling} className="mt-4">
          Manage Subscription
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Danger Zone</h2>
        <p className="text-muted-foreground">
          Be careful when performing these actions.
        </p>
        <Button variant="destructive" className="mt-4">
          Delete Account
        </Button>
      </div>
    </div>
  );
};

const Account = () => {
  return (
    <div className="container mx-auto py-10">
      <AccountDetails />
    </div>
  );
};

export default Account;
