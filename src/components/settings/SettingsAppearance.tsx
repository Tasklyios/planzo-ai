
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const SettingsAppearance = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">(
    theme as "light" | "dark" | "system"
  );

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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <RadioGroup 
            value={selectedTheme} 
            onValueChange={(value) => setSelectedTheme(value as "light" | "dark" | "system")}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system">System</Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button onClick={handleSaveAppearance}>
          Save Appearance
        </Button>
      </div>
    </div>
  );
};

export default SettingsAppearance;
