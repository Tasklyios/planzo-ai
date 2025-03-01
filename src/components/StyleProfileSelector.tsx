
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface StyleProfileSelectorProps {
  contentStyle?: string;
  contentPersonality?: string;
}

const StyleProfileSelector: React.FC<StyleProfileSelectorProps> = ({ contentStyle, contentPersonality }) => {
  const navigate = useNavigate();

  const handleStyleChange = () => {
    navigate('/account?tab=styles');
  };

  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h2 className="text-xl font-semibold">Your Content Style</h2>
        <p className="text-muted-foreground mt-1">
          {contentStyle || "No style set (using default)"}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Personality: {contentPersonality || "Not specified (using default)"}
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
  );
};

export default StyleProfileSelector;
