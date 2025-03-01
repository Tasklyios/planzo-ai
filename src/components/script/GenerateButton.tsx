
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { GeneratedIdea } from "@/types/idea";

interface GenerateButtonProps {
  loading: boolean;
  scriptType: "existing" | "custom";
  selectedIdea: GeneratedIdea | null;
  customTitle: string;
  customDescription: string;
  generateScript: () => Promise<void>;
}

export function GenerateButton({
  loading,
  scriptType,
  selectedIdea,
  customTitle,
  customDescription,
  generateScript
}: GenerateButtonProps) {
  const isDisabled = loading || 
    (scriptType === "existing" && !selectedIdea) || 
    (scriptType === "custom" && (!customTitle || !customDescription));

  return (
    <div className="pt-4">
      <Button 
        onClick={generateScript} 
        disabled={isDisabled}
        className="w-full"
      >
        {loading ? (
          <>Generating...</>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Script
          </>
        )}
      </Button>
    </div>
  );
}
