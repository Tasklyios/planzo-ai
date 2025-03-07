
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InputFormProps {
  niche: string;
  audience: string;
  videoType: string;
  platform: string;
  customIdeas: string;
  setNiche: (value: string) => void;
  setAudience: (value: string) => void;
  setVideoType: (value: string) => void;
  setPlatform: (value: string) => void;
  setCustomIdeas: (value: string) => void;
}

const InputForm = ({ 
  niche, 
  audience, 
  videoType, 
  platform,
  customIdeas,
  setNiche, 
  setAudience, 
  setVideoType, 
  setPlatform,
  setCustomIdeas
}: InputFormProps) => {
  const [activeTab, setActiveTab] = useState<string>("basic");
  
  const platformOptions = [
    { value: "TikTok", label: "TikTok" },
    { value: "Instagram Reels", label: "Instagram Reels" },
    { value: "YouTube Shorts", label: "YouTube Shorts" }
  ];
  
  const videoTypeOptions = [
    { value: "Tutorial", label: "Tutorial" },
    { value: "Day in the Life", label: "Day in the Life" },
    { value: "Storytelling", label: "Storytelling" },
    { value: "Product Review", label: "Product Review" },
    { value: "Behind the Scenes", label: "Behind the Scenes" },
    { value: "Q&A", label: "Q&A" },
    { value: "Challenge", label: "Challenge" },
    { value: "Reaction", label: "Reaction" }
  ];

  return (
    <div className="bg-card border rounded-md p-5 mb-6">
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="custom">Custom Ideas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Niche / Content Topic</Label>
              <Input
                id="niche"
                placeholder="e.g., Fitness, Cooking, Tech Reviews"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                placeholder="e.g., Young professionals, Fitness enthusiasts"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="videoType">Video Format</Label>
              <Select value={videoType} onValueChange={setVideoType}>
                <SelectTrigger id="videoType">
                  <SelectValue placeholder="Select video format" />
                </SelectTrigger>
                <SelectContent>
                  {videoTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="customIdeas">Custom Ideas</Label>
            <Textarea
              id="customIdeas"
              placeholder="Enter custom ideas or topics you'd like to generate content around..."
              className="min-h-[150px]"
              value={customIdeas}
              onChange={(e) => setCustomIdeas(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Add specific ideas, themes, or topics you'd like to explore. This helps the AI generate more personalized content.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InputForm;
