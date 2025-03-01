
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Link as LinkIcon, ThumbsUp, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StyleProfile } from "@/types/idea";

const FindYourStyle = () => {
  const [links, setLinks] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const addLinkField = () => {
    setLinks([...links, ""]);
  };

  const updateLink = (index: number, value: string) => {
    const updatedLinks = [...links];
    updatedLinks[index] = value;
    setLinks(updatedLinks);
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      const updatedLinks = [...links];
      updatedLinks.splice(index, 1);
      setLinks(updatedLinks);
    }
  };

  const validateLinks = () => {
    // Filter out empty links
    const filteredLinks = links.filter(link => link.trim() !== "");
    
    if (filteredLinks.length === 0) {
      setError("Please add at least one valid content link");
      return false;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|tiktok\.com|instagram\.com)\/([a-zA-Z0-9_\-\.]+)/;
    const invalidLinks = filteredLinks.filter(link => !urlPattern.test(link));
    
    if (invalidLinks.length > 0) {
      setError("Please provide valid YouTube, TikTok, or Instagram links");
      return false;
    }

    setError(null);
    return true;
  };

  const analyzeContent = async () => {
    if (!validateLinks()) return;

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to analyze content.",
        });
        navigate("/auth");
        return;
      }

      // Filter out empty links
      const filteredLinks = links.filter(link => link.trim() !== "");

      const { data, error } = await supabase.functions.invoke('analyze-content-style', {
        body: {
          links: filteredLinks,
          notes: notes.trim(),
          userId
        }
      });

      if (error) {
        console.error("Error analyzing content:", error);
        throw new Error(`Error analyzing content: ${error.message}`);
      }

      if (!data || data.error) {
        throw new Error(data?.error || "Failed to analyze content");
      }

      setAnalysisResult(data);
      
      // Set a default name for the style profile if user hasn't provided one
      if (!profileName) {
        setProfileName(`My Style ${new Date().toLocaleDateString()}`);
      }

      toast({
        title: "Analysis Complete!",
        description: "Your content style has been analyzed.",
      });

    } catch (err: any) {
      console.error("Content analysis error:", err);
      setError(err.message || "Failed to analyze content");
      
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err.message || "An error occurred while analyzing your content",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStyleProfile = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to save your style profile.",
        });
        navigate("/auth");
        return;
      }

      if (!profileName.trim()) {
        toast({
          variant: "destructive",
          title: "Name Required",
          description: "Please provide a name for your style profile.",
        });
        return;
      }

      // Save the new style profile
      const { data: newProfile, error: saveError } = await supabase
        .from('style_profiles')
        .insert({
          user_id: userId,
          name: profileName.trim(),
          content_style: analysisResult.contentStyle || "",
          content_personality: analysisResult.contentPersonality || "",
          is_active: false
        })
        .select('*')
        .single();

      if (saveError) {
        throw saveError;
      }

      // Update the user's profile with the new style
      await supabase
        .from('profiles')
        .update({
          content_style: analysisResult.contentStyle,
          content_personality: analysisResult.contentPersonality
        })
        .eq('id', userId);

      // Store in localStorage for immediate use
      localStorage.setItem("contentStyle", analysisResult.contentStyle || "");
      localStorage.setItem("contentPersonality", analysisResult.contentPersonality || "");
      
      toast({
        title: "Style Profile Saved",
        description: `Your style profile "${profileName}" has been saved.`,
      });

      // Navigate to account page
      navigate("/account");
      
    } catch (err: any) {
      console.error("Error saving style profile:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to save style profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyAndGenerate = () => {
    // Save the style in localStorage for immediate use
    if (analysisResult) {
      localStorage.setItem("contentStyle", analysisResult.contentStyle || "");
      localStorage.setItem("contentPersonality", analysisResult.contentPersonality || "");
      
      // Navigate to generator page
      navigate("/generator");
      
      toast({
        title: "Style Applied",
        description: "Your content style will be used for idea generation",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Find Your Content Style</h1>
      <p className="text-muted-foreground mb-8">
        Analyze your favorite content or your own videos to discover your unique style
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Links</CardTitle>
            <CardDescription>
              Add links to videos or content that represents the style you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <Input
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  placeholder="Paste YouTube, TikTok or Instagram link"
                  className="flex-1"
                />
                {links.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeLink(index)}
                    className="flex-shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={addLinkField}
              className="w-full"
            >
              Add Another Link
            </Button>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what you like about these videos or your content goals..."
                className="min-h-[100px]"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={analyzeContent} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Analyzing...</span>
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Analyze Content Style
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Content Style</CardTitle>
            <CardDescription>
              {analysisResult 
                ? "Here's what we found about your content style" 
                : "Analysis results will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisResult ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Style Profile Name</Label>
                  <Input
                    id="profileName"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Give your style profile a name"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium">Content Style</div>
                  <div className="bg-secondary p-3 rounded-md">
                    {analysisResult.contentStyle}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium">Content Personality</div>
                  <div className="bg-secondary p-3 rounded-md">
                    {analysisResult.contentPersonality}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium">Key Strengths</div>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResult.strengths?.map((strength: string, index: number) => (
                      <li key={index} className="text-sm">{strength}</li>
                    ))}
                  </ul>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Style Analyzed</AlertTitle>
                  <AlertDescription>
                    Save this as a style profile to use it for generating ideas and scripts.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                <ThumbsUp className="h-12 w-12 mb-4 opacity-20" />
                <p>Add links to your favorite content or your own videos and hit analyze to discover your content style</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 flex-col sm:flex-row">
            {analysisResult && (
              <>
                <Button 
                  onClick={saveStyleProfile} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : "Save Style Profile"}
                </Button>
                <Button 
                  onClick={applyAndGenerate} 
                  variant="outline" 
                  className="w-full"
                >
                  Use & Generate Ideas
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default FindYourStyle;
