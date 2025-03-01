
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIdeaGenerator } from '@/hooks/use-idea-generator';
import { useStyleProfiles } from '@/hooks/use-style-profiles';
import StyleProfileSelector from '@/components/style-profiles/StyleProfileSelector';
import ChatWidget from '@/components/ChatWidget';
import AuthGuard from '@/components/AuthGuard';

const Generator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [script, setScript] = useState('');
  const [scriptTitle, setScriptTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUserEditedScript, setHasUserEditedScript] = useState(false);
  const ideaGenerator = useIdeaGenerator();
  
  // Import style profiles hook
  const { 
    styleProfiles,
    activeProfile,
    loading: loadingProfiles,
    activateStyleProfile
  } = useStyleProfiles();

  const generateInitialScript = async () => {
    try {
      if (!ideaGenerator.niche || !ideaGenerator.audience || !ideaGenerator.videoType) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in the niche, audience, and video type before generating a script.",
        });
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to generate scripts.",
        });
        navigate("/auth");
        return;
      }
      
      const userId = sessionData.session.user.id;

      // Use the check-usage-limits edge function
      const { data: usageResponse, error: usageError } = await supabase.functions.invoke('check-usage-limits', {
        body: {
          user_id: userId,
          action: 'script'
        }
      });

      if (usageError) {
        console.error("Usage check error:", usageError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Usage check error: ${usageError.message}`,
        });
        return;
      }

      // Check if we can proceed or not
      if (!usageResponse.canProceed) {
        console.error("Usage limit reached:", usageResponse.message);
        
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', userId)
          .single();

        // Prepare upgrade message based on current tier
        let message = usageResponse.message || "You've reached your daily limit for generating scripts. ";
        
        if (subscription?.tier === 'free') {
          message += " Upgrade to Pro or Plus for more generations!";
        } else if (subscription?.tier === 'pro') {
          message += " Upgrade to Plus or Business for more generations!";
        } else if (subscription?.tier === 'plus') {
          message += " Upgrade to Business for unlimited generations!";
        }

        toast({
          variant: "destructive",
          title: "Usage Limit Reached",
          description: message,
        });
        return;
      }

      setIsSaving(true);

      const contentStyle = localStorage.getItem("contentStyle") || "";
      const contentPersonality = localStorage.getItem("contentPersonality") || "";

      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          type: 'script',
          niche: ideaGenerator.niche.trim(),
          audience: ideaGenerator.audience.trim(),
          videoType: ideaGenerator.videoType.trim(),
          platform: ideaGenerator.platform,
          contentStyle: contentStyle,
          contentPersonality: contentPersonality
        },
      });

      if (error) {
        console.error("Error generating script:", error);
        toast({
          variant: "destructive",
          title: "Failed to Generate Script",
          description: error.message || 'An unexpected error occurred. Please try again.',
        });
        return;
      }

      if (!data || !data.script) {
        console.error("Empty or invalid response from function");
        toast({
          variant: "destructive",
          title: "Failed to Generate Script",
          description: 'The script generation service returned an invalid response. Please try again.',
        });
        return;
      }

      setScript(data.script);
      setScriptTitle(data.title || `${ideaGenerator.videoType} Script for ${ideaGenerator.niche}`);
      setHasUserEditedScript(false);

      toast({
        title: "Script Generated!",
        description: "Your script has been generated successfully.",
      });
    } catch (error: any) {
      console.error("Script generation error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Generate Script",
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleScriptUpdate = (updatedScript: string) => {
    setScript(updatedScript);
    setHasUserEditedScript(true);
  };

  const saveScript = async () => {
    try {
      if (!script.trim() || !scriptTitle.trim()) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please ensure your script and title are not empty.",
        });
        return;
      }

      setIsSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to save scripts.",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('scripts')
        .insert({
          title: scriptTitle,
          content: script,
          user_id: session.user.id,
          video_type: ideaGenerator.videoType,
          niche: ideaGenerator.niche,
          target_audience: ideaGenerator.audience,
          platform: ideaGenerator.platform,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving script:", error);
        throw error;
      }

      toast({
        title: "Script Saved",
        description: "Your script has been saved successfully.",
      });

      // Optional: Navigate to script detail/edit page
      // navigate(`/scripts/${data.id}`);
    } catch (error: any) {
      console.error("Error saving script:", error);
      toast({
        variant: "destructive",
        title: "Failed to Save Script",
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // This will update the generated script if these values change
    if (script && !hasUserEditedScript) {
      generateInitialScript();
    }
  }, [activeProfile]);

  return (
    <AuthGuard>
      <div className="container py-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Script Generator</h1>
          <p className="text-muted-foreground">Create engaging video scripts based on your preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar with inputs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Information</CardTitle>
                <CardDescription>Define your content type and audience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="niche">Content Niche</Label>
                  <Input
                    id="niche"
                    value={ideaGenerator.niche}
                    onChange={(e) => {
                      ideaGenerator.setNiche(e.target.value);
                      localStorage.setItem("niche", e.target.value);
                    }}
                    placeholder="e.g., Fitness, Fashion, Technology"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    value={ideaGenerator.audience}
                    onChange={(e) => {
                      ideaGenerator.setAudience(e.target.value);
                      localStorage.setItem("audience", e.target.value);
                    }}
                    placeholder="e.g., Young adults, Parents, Professionals"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="videoType">Video Type</Label>
                  <Input
                    id="videoType"
                    value={ideaGenerator.videoType}
                    onChange={(e) => {
                      ideaGenerator.setVideoType(e.target.value);
                      localStorage.setItem("videoType", e.target.value);
                    }}
                    placeholder="e.g., Tutorial, Vlog, Review"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Input
                    id="platform"
                    value={ideaGenerator.platform}
                    onChange={(e) => {
                      ideaGenerator.setPlatform(e.target.value);
                      localStorage.setItem("platform", e.target.value);
                    }}
                    placeholder="e.g., TikTok, YouTube, Instagram"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={generateInitialScript} 
                  disabled={isSaving || !ideaGenerator.niche || !ideaGenerator.audience || !ideaGenerator.videoType}
                  className="w-full"
                >
                  {isSaving ? "Generating..." : "Generate Script"}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Add Style Profile Selector component */}
            <Card>
              <CardHeader>
                <CardTitle>Style Profiles</CardTitle>
                <CardDescription>Select a style for your content</CardDescription>
              </CardHeader>
              <CardContent>
                <StyleProfileSelector 
                  profiles={styleProfiles}
                  activeProfile={activeProfile}
                  loading={loadingProfiles}
                  onActivate={activateStyleProfile}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main script area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="space-y-2">
                  <Label htmlFor="scriptTitle">Script Title</Label>
                  <Input
                    id="scriptTitle"
                    value={scriptTitle}
                    onChange={(e) => setScriptTitle(e.target.value)}
                    placeholder="Enter a title for your script"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="edit">
                  <TabsList className="mb-4">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="script">Script Content</Label>
                      <Textarea
                        id="script"
                        value={script}
                        onChange={(e) => {
                          setScript(e.target.value);
                          setHasUserEditedScript(true);
                        }}
                        placeholder="Your script will appear here..."
                        className="min-h-[300px]"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="border rounded-md p-4 min-h-[300px] whitespace-pre-line">
                        {script || "Generate a script to see the preview here..."}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate("/ideas")}>
                  Back to Ideas
                </Button>
                <Button 
                  onClick={saveScript} 
                  disabled={isSaving || !script.trim() || !scriptTitle.trim()}
                >
                  {isSaving ? "Saving..." : "Save Script"}
                </Button>
              </CardFooter>
            </Card>

            {/* Script Coach */}
            <ChatWidget script={script} onScriptUpdate={handleScriptUpdate} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Generator;
