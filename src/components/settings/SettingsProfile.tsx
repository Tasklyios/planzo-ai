
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SettingsProfile = () => {
  const { toast } = useToast();
  const [accountType, setAccountType] = useState("creator");
  const [niche, setNiche] = useState("tech");
  const [bio, setBio] = useState("Content creator focused on technology and productivity tips.");
  const [website, setWebsite] = useState("https://example.com");
  const [socialLinks, setSocialLinks] = useState({
    youtube: "https://youtube.com/username",
    tiktok: "https://tiktok.com/@username",
    instagram: "https://instagram.com/username"
  });
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Profile updated",
        description: "Your profile settings have been saved successfully.",
      });
    }, 1000);
  };

  const handleSocialChange = (platform: keyof typeof socialLinks, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your public profile information
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountType">Account Type</Label>
          <Select value={accountType} onValueChange={setAccountType}>
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creator">Content Creator</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="niche">Content Niche</Label>
          <Select value={niche} onValueChange={setNiche}>
            <SelectTrigger>
              <SelectValue placeholder="Select your content niche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tech">Technology</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="fitness">Fitness</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            rows={4}
            placeholder="Tell us about yourself or your brand"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input 
            id="website" 
            type="url"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Social Media Links</Label>
          
          <div className="space-y-2">
            <Label htmlFor="youtube" className="text-sm">YouTube</Label>
            <Input 
              id="youtube" 
              type="url"
              placeholder="https://youtube.com/username"
              value={socialLinks.youtube}
              onChange={(e) => handleSocialChange('youtube', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tiktok" className="text-sm">TikTok</Label>
            <Input 
              id="tiktok" 
              type="url"
              placeholder="https://tiktok.com/@username"
              value={socialLinks.tiktok}
              onChange={(e) => handleSocialChange('tiktok', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram" className="text-sm">Instagram</Label>
            <Input 
              id="instagram" 
              type="url"
              placeholder="https://instagram.com/username"
              value={socialLinks.instagram}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="mt-4">
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsProfile;
