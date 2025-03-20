
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsGeneral from "@/components/settings/SettingsGeneral";
import SettingsProfile from "@/components/settings/SettingsProfile";
import SettingsAppearance from "@/components/settings/SettingsAppearance";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  
  return (
    <div className="container max-w-full mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="general">
            <TabsList className="grid w-full grid-cols-4 h-9 mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="m-0">
              <SettingsGeneral />
            </TabsContent>
            <TabsContent value="profile" className="m-0">
              <SettingsProfile />
            </TabsContent>
            <TabsContent value="appearance" className="m-0">
              <SettingsAppearance />
            </TabsContent>
            <TabsContent value="advanced" className="m-0">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Advanced Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced settings will appear here in future updates.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
