
import React, { useState, useEffect } from "react";
import { LayersIcon, Users, Video, Smartphone, Package2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InputFormProps {
  niche: string;
  audience: string;
  videoType: string;
  platform: string;
  setNiche: (value: string) => void;
  setAudience: (value: string) => void;
  setVideoType: (value: string) => void;
  setPlatform: (value: string) => void;
}

type AccountType = 'personal' | 'ecommerce' | 'business';

const InputForm = ({
  niche,
  audience,
  videoType,
  platform,
  setNiche,
  setAudience,
  setVideoType,
  setPlatform,
}: InputFormProps) => {
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccountType();
  }, []);

  const getAccountType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      if (profile?.account_type) {
        setAccountType(profile.account_type as AccountType);
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
            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <LayersIcon className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Content Niche</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Your content niche"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Users className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Your target audience"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Video className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Type</label>
                  <input
                    type="text"
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Video type"
                  />
                </div>
              </div>
            </div>
          </>
        );
        
      case 'ecommerce':
        return (
          <>
            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Package2 className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Product Niche</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Your product niche"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <LayersIcon className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Content Niche</label>
                  <input
                    type="text"
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Your content focus"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Users className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Your target audience"
                  />
                </div>
              </div>
            </div>
          </>
        );

      case 'business':
        return (
          <>
            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Building2 className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Business Niche</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Your business niche"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <LayersIcon className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Content Niche</label>
                  <input
                    type="text"
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Your content focus"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Users className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Your target audience"
                  />
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
      {renderFields()}
      <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
          <Smartphone className="text-[#4F92FF] w-5 h-5" />
          <div className="flex-1 w-full">
            <label className="text-xs md:text-sm font-medium text-foreground block md:mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option>TikTok</option>
              <option>Instagram Reels</option>
              <option>YouTube Shorts</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputForm;
