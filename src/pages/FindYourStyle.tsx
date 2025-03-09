
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
import { AlertCircle, CheckCircle, UserRound, ThumbsUp, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FindYourStyle = () => {
  const [usernames, setUsernames] = useState<string[]>([""]);
  const [platform, setPlatform] = useState<string>("tiktok");
  const [notes, setNotes] = useState("");
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const addUsernameField = () => {
    setUsernames([...usernames, ""]);
  };

  const updateUsername = (index: number, value: string) => {
    const updatedUsernames = [...usernames];
    updatedUsernames[index] = value;
    setUsernames(updatedUsernames);
  };

  const removeUsername = (index: number) => {
    if (usernames.length > 1) {
      const updatedUsernames = [...usernames];
      updatedUsernames.splice(index, 1);
      setUsernames(updatedUsernames);
    }
  };

  const validateUsernames = () => {
    // Filter out empty usernames
    const filteredUsernames = usernames.filter(username => username.trim() !== "");
    
    if (filteredUsernames.length === 0) {
      setError("Please add at least one valid username");
      return false;
    }

    setError(null);
    return true;
  };

  const analyzeContent = async () => {
    if (!validateUsernames()) return;

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

      // Filter out empty usernames
      const filteredUsernames = usernames.filter(username => username.trim() !== "");

      const { data, error } = await supabase.functions.invoke('analyze-content-style', {
        body: {
          usernames: filteredUsernames,
          platform,
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
        setProfileName(`My ${platform.charAt(0).toUpperCase() + platform.slice(1)} Style`);
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
        Analyze creators' content to discover the style you want to emulate
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Creators</CardTitle>
            <CardDescription>
              Add usernames of content creators whose style you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select 
                value={platform} 
                onValueChange={setPlatform}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {usernames.map((username, index) => (
              <div key={index} className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <Input
                  value={username}
                  onChange={(e) => updateUsername(index, e.target.value)}
                  placeholder={`@username on ${platform}`}
                  className="flex-1"
                />
                {usernames.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeUsername(index)}
                    className="flex-shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={addUsernameField}
              className="w-full"
            >
              Add Another Username
            </Button>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what you like about these creators or your content goals..."
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
                <p>Add usernames of your favorite content creators and hit analyze to discover your content style</p>
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
