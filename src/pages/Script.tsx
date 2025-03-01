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

export default function Script() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [niche] = useLocalStorage("niche", "");
  const [audience] = useLocalStorage("audience", "");
  const [platform] = useLocalStorage("platform", "");
  const [videoType] = useLocalStorage("videoType", "");
  const [contentStyle] = useLocalStorage("contentStyle", "");
  const [contentPersonality] = useLocalStorage("contentPersonality", "");
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleStyleChange = () => {
    navigate('/account?tab=styles');
  };

  if (!niche || !audience || !platform || !videoType) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-20">
          <Alert>
            <AlertDescription>
              Please complete your profile settings before generating scripts.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate("/account")}>
              Go to Account Settings
            </Button>
          </div>
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
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold">Your Content Style</h2>
                <p className="text-muted-foreground mt-1">
                  {contentStyle || "No style set"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Personality: {contentPersonality || "Not specified"}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStyleChange}
              >
                Change Style Profile
              </Button>
            </div>

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
