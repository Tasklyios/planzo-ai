
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import AuthGuard from "@/components/AuthGuard";

export default function Account() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email) {
        setEmail(session.user.email);
      }
    };
    getProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <div className="container mx-auto py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account preferences and billing information</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Billing Information</h2>
              <p className="text-gray-600">Manage your subscription and payment methods.</p>
              <Button variant="outline">
                Manage Billing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
