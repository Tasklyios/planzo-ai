
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Moon, Sun, Monitor, CheckCircle2 } from "lucide-react";

const SettingsAppearance = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">(
    theme as "light" | "dark" | "system"
  );

  // Ensure selectedTheme stays in sync with theme from context
  useEffect(() => {
    setSelectedTheme(theme as "light" | "dark" | "system");
  }, [theme]);

  const handleSaveAppearance = () => {
    setTheme(selectedTheme);
    toast({
      title: "Appearance updated",
      description: "Your theme preferences have been saved.",
    });
  };

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

  return (
    <div className="space-y-8 w-full">
      <div className="space-y-6 w-full bg-card rounded-lg p-6 border border-border/40 shadow-sm">
        <div className="space-y-3">
          <h3 className="text-xl font-medium">Theme Preferences</h3>
          <p className="text-muted-foreground">Choose how Storyhero looks for you</p>
        </div>
        
        <RadioGroup 
          value={selectedTheme} 
          onValueChange={handleThemeChange}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
        >
          <div className={`flex flex-col rounded-lg border p-4 transition-all duration-200 ${selectedTheme === "light" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" className="sr-only" />
                <Sun className="h-5 w-5 text-amber-500" />
                <Label htmlFor="light" className="font-medium">Light</Label>
              </div>
              {selectedTheme === "light" && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
            <div className="rounded-md bg-[#f8f9fa] dark:bg-[#f8f9fa] p-3 border border-[#e9ecef] h-20 w-full"></div>
          </div>
          
          <div className={`flex flex-col rounded-lg border p-4 transition-all duration-200 ${selectedTheme === "dark" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                <Moon className="h-5 w-5 text-indigo-400" />
                <Label htmlFor="dark" className="font-medium">Dark</Label>
              </div>
              {selectedTheme === "dark" && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
            <div className="rounded-md bg-[#212529] dark:bg-[#212529] p-3 border border-[#343a40] h-20 w-full"></div>
          </div>
          
          <div className={`flex flex-col rounded-lg border p-4 transition-all duration-200 ${selectedTheme === "system" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" className="sr-only" />
                <Monitor className="h-5 w-5 text-green-500" />
                <Label htmlFor="system" className="font-medium">System</Label>
              </div>
              {selectedTheme === "system" && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
            <div className="rounded-md bg-gradient-to-r from-[#f8f9fa] to-[#212529] p-3 border border-[#e9ecef] h-20 w-full"></div>
          </div>
        </RadioGroup>
        
        <Button onClick={handleSaveAppearance} className="mt-6 w-full sm:w-auto hidden">
          Save Theme Preference
        </Button>
      </div>
    </div>
  );
};

export default SettingsAppearance;
