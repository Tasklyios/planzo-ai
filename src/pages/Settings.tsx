
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { User, Palette, UserCircle } from "lucide-react";
import SettingsGeneral from "@/components/settings/SettingsGeneral";
import SettingsProfile from "@/components/settings/SettingsProfile";
import SettingsAppearance from "@/components/settings/SettingsAppearance";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <ToggleGroup 
              type="single" 
              value={activeTab} 
              onValueChange={(value) => value && setActiveTab(value)}
              className="justify-start border rounded-lg p-1 w-full sm:w-auto"
            >
              <ToggleGroupItem value="general" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="general">
              <SettingsGeneral />
            </TabsContent>
            <TabsContent value="profile">
              <SettingsProfile />
            </TabsContent>
            <TabsContent value="appearance">
              <SettingsAppearance />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
