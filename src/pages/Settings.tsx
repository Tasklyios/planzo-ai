
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsGeneral from "@/components/settings/SettingsGeneral";
import SettingsProfile from "@/components/settings/SettingsProfile";
import SettingsAppearance from "@/components/settings/SettingsAppearance";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="general">
            <TabsList className="grid grid-cols-3 h-9">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          <TabsContent value="general" className="m-0">
            <SettingsGeneral />
          </TabsContent>
          <TabsContent value="profile" className="m-0">
            <SettingsProfile />
          </TabsContent>
          <TabsContent value="appearance" className="m-0">
            <SettingsAppearance />
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
