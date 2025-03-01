
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AuthGuard from "@/components/AuthGuard";
import { useCompletion } from "ai/react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import StyleProfileSelector from "@/components/StyleProfileSelector";

export default function Script() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [niche, setNiche] = useLocalStorage("niche", "");
  const [audience, setAudience] = useLocalStorage("audience", "");
  const [platform, setPlatform] = useLocalStorage("platform", "");
  const [videoType, setVideoType] = useLocalStorage("videoType", "");
  const [contentStyle] = useLocalStorage("contentStyle", "");
  const [contentPersonality] = useLocalStorage("contentPersonality", "");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug values in useEffect to avoid spamming console on every render
  useEffect(() => {
    console.log("Profile settings:", {
      niche,
      audience,
      platform,
      videoType,
      contentStyle,
      contentPersonality,
    });
  }, [niche, audience, platform, videoType, contentStyle, contentPersonality]);

  const {
    completion,
    complete,
    isLoading: isGenerating,
  } = useCompletion({
    api: "/api/generate-script",
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const prompt = `Create a script for a ${platform} video in the ${niche} niche, targeting ${audience}. The video should be a ${videoType} video. Use this video as inspiration: ${videoUrl}. The content style should be ${contentStyle || "natural and authentic"}. The content personality should be ${contentPersonality || "friendly and engaging"}.`;

      await complete(prompt);
    } catch (error: any) {
      console.error("Error generating script:", error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate script. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a direct way to set values for testing/fixing if they're missing
  const setMissingValues = () => {
    if (!niche) setNiche("General");
    if (!audience) setAudience("General audience");
    if (!platform) setPlatform("YouTube");
    if (!videoType) setVideoType("Educational");
    
    toast({
      title: "Default values set",
      description: "Default profile values have been set to help you get started."
    });
  };

  // More lenient condition - show form even if some values are empty strings
  // This helps users who have technically set values but they might be empty strings
  const isMissingCriticalInfo = !niche || !audience || !platform || !videoType;

  if (isMissingCriticalInfo) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-20">
          <Alert>
            <AlertDescription className="mb-4">
              Please complete your profile settings before generating scripts.
              According to our system, the following information is missing:
              {!niche && <span className="block mt-1">• Content Niche</span>}
              {!audience && <span className="block mt-1">• Target Audience</span>}
              {!platform && <span className="block mt-1">• Platform</span>}
              {!videoType && <span className="block mt-1">• Video Type</span>}
            </AlertDescription>
            <div className="flex gap-4 mt-2">
              <Button onClick={() => navigate("/account")}>
                Go to Account Settings
              </Button>
              <Button variant="outline" onClick={setMissingValues}>
                Set Default Values
              </Button>
            </div>
          </Alert>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Generate Script</h1>
            <p className="text-muted-foreground mt-2">
              Enter a video URL for inspiration, and we'll generate a unique script
              based on your style.
            </p>
          </div>

          <div className="widget-box p-6">
            <StyleProfileSelector 
              contentStyle={contentStyle} 
              contentPersonality={contentPersonality} 
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Inspiration Video URL</Label>
                <Input
                  id="videoUrl"
                  placeholder="Paste a video URL here..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading || isGenerating}
                className="w-full"
              >
                {(isLoading || isGenerating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isLoading && !isGenerating && <Wand2 className="mr-2 h-4 w-4" />}
                {isLoading || isGenerating
                  ? "Generating..."
                  : "Generate Script"}
              </Button>
            </form>
          </div>

          {completion && (
            <div className="widget-box p-6">
              <h2 className="text-xl font-semibold mb-4">Generated Script</h2>
              <Textarea
                value={completion}
                readOnly
                className="min-h-[300px]"
              />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
