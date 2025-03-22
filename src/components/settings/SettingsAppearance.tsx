
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Moon, Sun, Monitor, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const SettingsAppearance = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">(
    theme as "light" | "dark" | "system"
  );
  const [autoSave, setAutoSave] = useState(true);

  // Ensure selectedTheme stays in sync with theme from context
  useEffect(() => {
    setSelectedTheme(theme as "light" | "dark" | "system");
  }, [theme]);

  const handleThemeChange = (value: string) => {
    // Immediately apply the theme to see the change
    const themeValue = value as "light" | "dark" | "system";
    setSelectedTheme(themeValue);
    setTheme(themeValue);
    
    toast({
      title: "Theme changed",
      description: `Theme set to ${value} mode.`,
    });
  };

  const handleAutoSaveToggle = (checked: boolean) => {
    setAutoSave(checked);
  };

  return (
    <div className="space-y-8 w-full">
      <div className="space-y-6 w-full bg-card rounded-lg p-6 border border-border/40 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium">Theme Preferences</h3>
            <div className="flex items-center space-x-2">
              <Switch 
                id="auto-save" 
                checked={autoSave} 
                onCheckedChange={handleAutoSaveToggle} 
              />
              <Label htmlFor="auto-save" className="text-sm text-muted-foreground">Auto-save changes</Label>
            </div>
          </div>
          <p className="text-muted-foreground">Choose how Planzo looks for you</p>
        </div>
        
        <RadioGroup 
          value={selectedTheme} 
          onValueChange={handleThemeChange}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4"
        >
          <div 
            className={`flex flex-col cursor-pointer rounded-lg border p-5 transition-all duration-200 hover:shadow-md ${
              selectedTheme === "light" 
                ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20" 
                : "border-border hover:border-primary/40"
            }`}
            onClick={() => handleThemeChange("light")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="light" id="light" />
                <Sun className="h-5 w-5 text-amber-500" />
                <Label htmlFor="light" className="font-medium cursor-pointer">Light</Label>
              </div>
              {selectedTheme === "light" && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
            <div className="rounded-md bg-[#f8f9fa] dark:bg-[#f8f9fa] p-4 border border-[#e9ecef] h-24 w-full shadow-sm"></div>
          </div>
          
          <div 
            className={`flex flex-col cursor-pointer rounded-lg border p-5 transition-all duration-200 hover:shadow-md ${
              selectedTheme === "dark" 
                ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20" 
                : "border-border hover:border-primary/40"
            }`}
            onClick={() => handleThemeChange("dark")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="dark" id="dark" />
                <Moon className="h-5 w-5 text-indigo-400" />
                <Label htmlFor="dark" className="font-medium cursor-pointer">Dark</Label>
              </div>
              {selectedTheme === "dark" && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
            <div className="rounded-md bg-[#212529] dark:bg-[#212529] p-4 border border-[#343a40] h-24 w-full shadow-sm"></div>
          </div>
          
          <div 
            className={`flex flex-col cursor-pointer rounded-lg border p-5 transition-all duration-200 hover:shadow-md ${
              selectedTheme === "system" 
                ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20" 
                : "border-border hover:border-primary/40"
            }`}
            onClick={() => handleThemeChange("system")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="system" id="system" />
                <Monitor className="h-5 w-5 text-green-500" />
                <Label htmlFor="system" className="font-medium cursor-pointer">System</Label>
              </div>
              {selectedTheme === "system" && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
            <div className="rounded-md bg-gradient-to-r from-[#f8f9fa] to-[#212529] p-4 border border-[#e9ecef] h-24 w-full shadow-sm"></div>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default SettingsAppearance;
