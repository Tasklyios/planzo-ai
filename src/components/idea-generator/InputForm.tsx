
import React, { useState, useEffect } from "react";
import { LayersIcon, Users, Video, Smartphone, Package2, Building2, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AccountType } from "@/types/idea";

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
  accountType?: AccountType;
  setAccountType?: (value: AccountType) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
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
  setCustomIdeas,
  accountType: propAccountType,
  setAccountType: propSetAccountType,
  onGenerate,
  isGenerating
}: InputFormProps) => {
  const [localAccountType, setLocalAccountType] = useState<AccountType>('personal');
  const accountType = propAccountType || localAccountType;
  const setAccountType = propSetAccountType || setLocalAccountType;

  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [productNiche, setProductNiche] = useState("");
  const [contentNiche, setContentNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [businessNiche, setBusinessNiche] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [lastFetchedAccountType, setLastFetchedAccountType] = useState<string | null>(null);

  useEffect(() => {
    getAccountType();
  }, []);

  const getAccountType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('account_type, product_niche, content_niche, business_niche, target_audience, business_description')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      if (profile) {
        const newAccountType = profile.account_type as AccountType;
        const accountTypeChanged = lastFetchedAccountType !== null && lastFetchedAccountType !== newAccountType;
        
        console.log(`InputForm: Account type is ${newAccountType}${accountTypeChanged ? ' (changed from ' + lastFetchedAccountType + ')' : ''}`);
        
        setLocalAccountType(newAccountType);
        if (propSetAccountType) {
          propSetAccountType(newAccountType);
        }
        setLastFetchedAccountType(newAccountType);
        
        setProductNiche(profile.product_niche || "");
        setContentNiche(profile.content_niche || "");
        setBusinessNiche(profile.business_niche || "");
        setTargetAudience(profile.target_audience || "");
        setBusinessDescription(profile.business_description || "");
        
        if (accountTypeChanged || !niche) {
          if (newAccountType === 'personal') {
            console.log("Setting niche to content_niche for personal account:", profile.content_niche);
            setNiche(profile.content_niche || "");
          } else if (newAccountType === 'ecommerce') {
            console.log("Setting niche to product_niche for ecommerce account:", profile.product_niche);
            setNiche(profile.product_niche || "");
          } else if (newAccountType === 'business') {
            console.log("Setting niche to business_niche for business account:", profile.business_niche);
            setNiche(profile.business_niche || "");
          }
          
          if (!videoType && profile.content_niche) {
            setVideoType("");
          }
          
          setAudience(profile.target_audience || "");
        }
      }
    } catch (error) {
      console.error("Error fetching account type:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        
        if (profile && profile.account_type !== accountType) {
          console.log(`Account type changed from ${accountType} to ${profile.account_type}, refreshing...`);
          getAccountType();
        }
      } catch (error) {
        console.error("Error checking account type changes:", error);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [accountType]);

  const handleContentNicheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setContentNiche(newValue);
    
    if (accountType === 'personal') {
      console.log("Setting niche to contentNiche:", newValue);
      setNiche(newValue);
    }
    
    setVideoType(newValue);
  };

  const handleProductNicheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setProductNiche(newValue);
    
    if (accountType === 'ecommerce') {
      console.log("Setting niche to productNiche:", newValue);
      setNiche(newValue);
    }
  };

  const handleBusinessNicheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setBusinessNiche(newValue);
    
    if (accountType === 'business') {
      console.log("Setting niche to businessNiche:", newValue);
      setNiche(newValue);
    }
  };

  const handleTargetAudienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTargetAudience(newValue);
    setAudience(newValue);
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
                  value={contentNiche}
                  onChange={handleContentNicheChange}
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
                  value={targetAudience}
                  onChange={handleTargetAudienceChange}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your target audience"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Video className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Video Type</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="text-primary w-4 h-4 cursor-pointer hover:text-primary/80 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px] p-3 bg-card border shadow-md text-foreground">
                        <p className="text-xs">Specify the type of video you want to create, e.g., "tutorial", "product review", "storytime", "behind-the-scenes", etc. This helps generate more targeted content ideas.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="text"
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Video type (e.g., tutorial, review)"
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
                  value={productNiche}
                  onChange={handleProductNicheChange}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your product niche"
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
                  onChange={handleContentNicheChange}
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
                  value={targetAudience}
                  onChange={handleTargetAudienceChange}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your target audience"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Video className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Video Type</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="text-primary w-4 h-4 cursor-pointer hover:text-primary/80 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px] p-3 bg-card border shadow-md text-foreground">
                        <p className="text-xs">Specify the type of video you want to create, e.g., "product showcase", "how-to", "customer testimonial", etc. This helps generate more targeted content ideas for your e-commerce brand.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="text"
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Video type (e.g., product showcase, tutorial)"
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
                  value={businessNiche}
                  onChange={handleBusinessNicheChange}
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
                  value={contentNiche}
                  onChange={handleContentNicheChange}
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
                  value={targetAudience}
                  onChange={handleTargetAudienceChange}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Your target audience"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow border border-border flex items-center justify-center min-h-[120px]">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                  <Video className="text-[#4F92FF] w-4 h-4" />
                  <label className="text-xs md:text-sm font-medium text-foreground">Video Type</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="text-primary w-4 h-4 cursor-pointer hover:text-primary/80 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px] p-3 bg-card border shadow-md text-foreground">
                        <p className="text-xs">Specify the type of video you want to create, e.g., "explainer", "case study", "thought leadership", etc. This helps generate more targeted content ideas for your business.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="text"
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="w-full p-2 md:p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm text-center md:text-left"
                  placeholder="Video type (e.g., thought leadership, explainer)"
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
        {accountType === 'personal' && (
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
        )}
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
      
      {onGenerate && (
        <div className="flex justify-center">
          <button 
            onClick={onGenerate} 
            disabled={isGenerating} 
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white dark:text-white px-8 py-2 rounded-full font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isGenerating ? "Generating..." : "Generate Ideas"}
          </button>
        </div>
      )}
    </div>
  );
}

export default InputForm;
