
import React from "react";
import { Button } from "@/components/ui/button";

interface GeneratorHeaderProps {
  activeTab?: 'input' | 'ideas';
  setActiveTab?: React.Dispatch<React.SetStateAction<'input' | 'ideas'>>;
  hasIdeas?: boolean;
}

const GeneratorHeader: React.FC<GeneratorHeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  hasIdeas = false 
}) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl md:text-4xl font-bold text-primary dark:text-white mb-4">Video Idea Generator</h1>
      <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
        Generate trending video ideas tailored to your niche and audience.
      </p>
      
      {hasIdeas && setActiveTab && (
        <div className="flex justify-center mt-6 space-x-2">
          <Button
            variant={activeTab === 'input' ? 'default' : 'outline'}
            onClick={() => setActiveTab('input')}
            className={`text-sm ${activeTab === 'input' ? 'blue-gradient dark:text-white' : ''}`}
          >
            Input Form
          </Button>
          <Button
            variant={activeTab === 'ideas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('ideas')}
            className={`text-sm ${activeTab === 'ideas' ? 'blue-gradient dark:text-white' : ''}`}
          >
            View Ideas
          </Button>
        </div>
      )}
    </div>
  );
};

export default GeneratorHeader;
