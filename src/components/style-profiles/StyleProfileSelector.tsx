
import React from 'react';
import { StyleProfile } from '@/types/idea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Paintbrush } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StyleProfileSelectorProps {
  profiles: StyleProfile[];
  activeProfile: StyleProfile | null;
  loading: boolean;
  onActivate: (profileId: string) => void;
}

const StyleProfileSelector: React.FC<StyleProfileSelectorProps> = ({
  profiles,
  activeProfile,
  loading,
  onActivate
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-32" />
          ))}
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No style profiles found. Create one in your Profile settings.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Style Profiles</h3>
      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => (
          <Button
            key={profile.id}
            variant={profile.id === activeProfile?.id ? "default" : "outline"}
            size="sm"
            className={cn(
              "border-2 transition-all",
              profile.id === activeProfile?.id 
                ? "border-primary" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onActivate(profile.id)}
          >
            <Paintbrush className="mr-2 h-4 w-4" />
            {profile.name}
            {profile.id === activeProfile?.id && (
              <Check className="ml-2 h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StyleProfileSelector;
