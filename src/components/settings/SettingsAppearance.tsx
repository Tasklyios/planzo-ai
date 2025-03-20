
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, MonitorSmartphone } from "lucide-react";

// Import from the existing theme hook
import { useTheme } from "@/hooks/use-theme";

const SettingsAppearance = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setSelectedTheme(newTheme);
  };

  const saveChanges = () => {
    setTheme(selectedTheme);
    toast({
      title: "Appearance updated",
      description: "Your appearance settings have been saved.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Theme Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Choose how the application looks to you
        </p>
      </div>

      <RadioGroup 
        value={selectedTheme} 
        onValueChange={handleThemeChange}
        className="grid gap-4 sm:grid-cols-3"
      >
        <div className={`flex flex-col items-center space-y-2 rounded-lg border p-4 ${selectedTheme === "light" ? "border-primary bg-primary/5" : "border-border"}`}>
          <RadioGroupItem value="light" id="light" className="sr-only" />
          <label 
            htmlFor="light" 
            className="flex cursor-pointer flex-col items-center justify-between gap-2"
          >
            <Sun className="h-6 w-6" />
            <div className="text-center">
              <div className="text-sm font-medium">Light</div>
              <div className="text-xs text-muted-foreground">
                Use the light theme
              </div>
            </div>
          </label>
        </div>

        <div className={`flex flex-col items-center space-y-2 rounded-lg border p-4 ${selectedTheme === "dark" ? "border-primary bg-primary/5" : "border-border"}`}>
          <RadioGroupItem value="dark" id="dark" className="sr-only" />
          <label 
            htmlFor="dark" 
            className="flex cursor-pointer flex-col items-center justify-between gap-2"
          >
            <Moon className="h-6 w-6" />
            <div className="text-center">
              <div className="text-sm font-medium">Dark</div>
              <div className="text-xs text-muted-foreground">
                Use the dark theme
              </div>
            </div>
          </label>
        </div>

        <div className={`flex flex-col items-center space-y-2 rounded-lg border p-4 ${selectedTheme === "system" ? "border-primary bg-primary/5" : "border-border"}`}>
          <RadioGroupItem value="system" id="system" className="sr-only" />
          <label 
            htmlFor="system" 
            className="flex cursor-pointer flex-col items-center justify-between gap-2"
          >
            <MonitorSmartphone className="h-6 w-6" />
            <div className="text-center">
              <div className="text-sm font-medium">System</div>
              <div className="text-xs text-muted-foreground">
                Follow system preference
              </div>
            </div>
          </label>
        </div>
      </RadioGroup>

      <Button onClick={saveChanges}>
        Save Preferences
      </Button>
    </div>
  );
};

export default SettingsAppearance;
