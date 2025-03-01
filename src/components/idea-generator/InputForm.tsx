
import React, { useState, useEffect } from "react";
import { LayersIcon, Users, Video, Smartphone, Package2, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

type AccountType = 'personal' | 'ecommerce' | 'business';

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
  setCustomIdeas,
}: InputFormProps) => {
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [productNiche, setProductNiche] = useState("");
  const [contentNiche, setContentNiche] = useState("");

  useEffect(() => {
    getAccountType();
  }, []);

  const getAccountType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('account_type, product_niche, content_niche, business_niche')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      if (profile) {
        setAccountType(profile.account_type as AccountType);
        
        // Store product niche and content niche for ecommerce accounts
        if (profile.account_type === 'ecommerce') {
          setProductNiche(profile.product_niche || "");
          setContentNiche(profile.content_niche || "");
        }
      }
    } catch (error) {
      console.error("Error fetching account type:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/50 rounded-xl h-[120px]"></div>
      ))}
    </div>;
  }

  const renderFields = () => {
    switch (accountType) {
      case 'personal':
        return (
          <>
            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <LayersIcon className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Content Niche</label>
                </div>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your content niche"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Users className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Target Audience</label>
                </div>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your target audience"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Video className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Type</label>
                </div>
                <input
                  type="text"
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Video type"
                />
              </div>
            </div>
          </>
        );
        
      case 'ecommerce':
        return (
          <>
            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Package2 className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Product Niche</label>
                </div>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your product niche"
                  title="This is synced from your account settings"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <LayersIcon className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Content Niche</label>
                </div>
                <input
                  type="text"
                  value={contentNiche}
                  onChange={(e) => setContentNiche(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your content niche"
                  disabled
                  title="This is synced from your account settings"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Video className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Video Type</label>
                </div>
                <input
                  type="text"
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Video type"
                />
              </div>
            </div>
          </>
        );

      case 'business':
        return (
          <>
            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Building2 className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Business Niche</label>
                </div>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your business niche"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <LayersIcon className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Content Niche</label>
                </div>
                <input
                  type="text"
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your content focus"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Users className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Target Audience</label>
                </div>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your target audience"
                />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4">
        {renderFields()}
        <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
              <Smartphone className="text-[#4F92FF] w-4 h-4" />
              <label className="text-xs md:text-sm font-medium text-foreground">Platform</label>
            </div>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground text-sm text-center md:text-left"
            >
              <option>TikTok</option>
              <option>Instagram Reels</option>
              <option>YouTube Shorts</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="mx-auto flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
            <div className="flex items-center justify-center w-full gap-2">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Already have some ideas for your videos? Add them here!
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <Textarea
                value={customIdeas}
                onChange={(e) => setCustomIdeas(e.target.value)}
                placeholder="Enter your video ideas..."
                className="min-h-[100px] bg-background"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export default InputForm;
