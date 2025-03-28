
import React from "react";
import { Button } from "@/components/ui/button";

interface GeneratorHeaderProps {
  activeTab?: 'input' | 'ideas';
  setActiveTab?: React.Dispatch<React.SetStateAction<'input' | 'ideas'>>;
  hasIdeas?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
  onToggleForm?: () => void;
  showForm?: boolean;
}

const GeneratorHeader: React.FC<GeneratorHeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  hasIdeas = false,
  loading,
  onRefresh,
  onToggleForm,
  showForm
}) => {
  return (
    <div className="text-left mb-8">
      <h1 className="text-4xl md:text-4xl font-bold text-black dark:text-white mb-4">Video Idea Generator</h1>
      <p className="text-black/70 dark:text-white/70 max-w-2xl text-sm md:text-base">
        Generate trending video ideas tailored to your niche and audience.
      </p>
      
      {hasIdeas && setActiveTab && (
        <div className="flex justify-start mt-6 space-x-2">
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
