
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsGeneral from "@/components/settings/SettingsGeneral";
import SettingsProfile from "@/components/settings/SettingsProfile";
import SettingsAppearance from "@/components/settings/SettingsAppearance";
import { User, Settings as SettingsIcon, Palette } from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  
  return (
    <div className="w-full mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card className="w-full border-border/40 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-border/30">
          <div>
            <CardTitle className="text-2xl font-semibold">Account Settings</CardTitle>
            <CardDescription className="text-base mt-1">Manage your account settings and preferences</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-8 bg-muted/70 p-1 rounded-lg">
              <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md transition-all duration-200">
                <User size={16} /> General
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md transition-all duration-200">
                <SettingsIcon size={16} /> Profile
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md transition-all duration-200">
                <Palette size={16} /> Appearance
              </TabsTrigger>
            </TabsList>
            
            <div className="w-full">
              <TabsContent value="general" className="m-0 w-full">
                <SettingsGeneral />
              </TabsContent>
              <TabsContent value="profile" className="m-0 w-full">
                <SettingsProfile />
              </TabsContent>
              <TabsContent value="appearance" className="m-0 w-full">
                <SettingsAppearance />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
