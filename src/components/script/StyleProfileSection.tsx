
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Paintbrush } from "lucide-react";
import { StyleProfile } from "@/types/idea";

interface StyleProfileSectionProps {
  activeStyleProfile: StyleProfile | null;
}

export function StyleProfileSection({ activeStyleProfile }: StyleProfileSectionProps) {
  const navigate = useNavigate();

  const navigateToStyleProfiles = () => {
    navigate('/account');
    // Set the active tab to 'styles' in localStorage so Account component opens it
    localStorage.setItem('accountActiveTab', 'styles');
  };

  if (!activeStyleProfile) return null;

  return (
    <div className="mb-6 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/10 hover:bg-primary/15">
          <Paintbrush className="h-3.5 w-3.5 mr-1.5" />
          Style: {activeStyleProfile.name}
        </Badge>
      </div>
      <Button 
        variant="link" 
        onClick={navigateToStyleProfiles}
        className="text-sm"
      >
        Change Style Profile
      </Button>
    </div>
  );
}
