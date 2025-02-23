import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import AuthGuard from "@/components/AuthGuard";

const themeOptions = [
  {
    value: "light",
    title: "Light",
    description: "Light theme for bright environments",
    icon: Sun,
  },
  {
    value: "dark",
    title: "Dark",
    description: "Dark theme for low-light environments",
    icon: Moon,
  },
  {
    value: "system",
    title: "System",
    description: "Sync with your system preferences",
    icon: Monitor,
  },
];

export default function Account() {
  const [activeTab, setActiveTab] = useState<'settings' | 'customize'>('settings');
  const { theme, setTheme } = useTheme();

  return (
    <AuthGuard>
      <div className="container mx-auto py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Account</h1>
            <div className="inline-flex items-center rounded-lg border p-1 bg-card shadow-sm">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'customize'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Customize
              </button>
            </div>
          </div>

          {activeTab === 'settings' ? (
            <div className="space-y-6">
              <div className="widget-box p-6">
                <h2 className="text-xl font-semibold mb-6">Theme Settings</h2>
                <div className="space-y-4">
                  <RadioGroup
                    value={theme}
                    onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
                    className="grid gap-4"
                  >
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <div key={option.value} className="relative">
                          <RadioGroupItem
                            value={option.value}
                            id={`theme-${option.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`theme-${option.value}`}
                            className="flex items-center gap-4 p-4 rounded-lg border-2 border-muted bg-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Icon className="h-5 w-5" />
                            <div>
                              <div className="font-semibold">{option.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              </div>

              <div className="widget-box p-6">
                <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <input
                      id="name"
                      type="text"
                      className="rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <input
                      id="email"
                      type="email"
                      className="rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Your email"
                    />
                  </div>
                </div>
              </div>

              <div className="widget-box p-6">
                <h2 className="text-xl font-semibold mb-6">Billing</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-accent">
                    <div>
                      <p className="font-medium">Free Plan</p>
                      <p className="text-sm text-muted-foreground">Basic features included</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90">
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="widget-box p-6">
              <h2 className="text-xl font-semibold mb-6">Customize Experience</h2>
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    className="rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="utc">UTC</option>
                    <option value="est">EST</option>
                    <option value="pst">PST</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
