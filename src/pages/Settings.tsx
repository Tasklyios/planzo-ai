
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
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
          <TabsList className="grid grid-cols-3 h-9">
            <TabsTrigger 
              value="general"
              onClick={() => setActiveTab("general")}
              className={activeTab === "general" ? "data-[state=active]" : ""}
            >
              General
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              onClick={() => setActiveTab("profile")}
              className={activeTab === "profile" ? "data-[state=active]" : ""}
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="appearance"
              onClick={() => setActiveTab("appearance")}
              className={activeTab === "appearance" ? "data-[state=active]" : ""}
            >
              Appearance
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="general" className="m-0">
              <SettingsGeneral />
            </TabsContent>
            <TabsContent value="profile" className="m-0">
              <SettingsProfile />
            </TabsContent>
            <TabsContent value="appearance" className="m-0">
              <SettingsAppearance />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
