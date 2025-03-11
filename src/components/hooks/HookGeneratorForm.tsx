
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Zap, Loader2 } from "lucide-react";

interface HookGeneratorFormProps {
  topic: string;
  setTopic: (value: string) => void;
  audience: string;
  setAudience: (value: string) => void;
  details: string;
  setDetails: (value: string) => void;
  handleGenerateHooks: () => void;
  isGenerating: boolean;
}

const HookGeneratorForm = ({
  topic,
  setTopic,
  audience,
  setAudience,
  details,
  setDetails,
  handleGenerateHooks,
  isGenerating
}: HookGeneratorFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Viral Hook Generator</CardTitle>
            <CardDescription>Create attention-grabbing hooks that stop users from scrolling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">What's your content about?</Label>
              <Input 
                id="topic" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Mindfulness meditation benefits" 
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Who's your target audience?</Label>
              <Input 
                id="audience" 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Working professionals ages 25-40" 
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea 
                id="details" 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add any specific details, key messages, or emotional tone for your hooks" 
                disabled={isGenerating}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full blue-gradient" 
              onClick={handleGenerateHooks}
              disabled={isGenerating || !topic || !audience}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Viral Hooks
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Hook Types</CardTitle>
            <CardDescription>Different styles proven to boost engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <h3 className="font-medium">Question Hooks</h3>
              <p className="text-sm text-muted-foreground">Trigger curiosity with thought-provoking questions</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <h3 className="font-medium">Statistic Hooks</h3>
              <p className="text-sm text-muted-foreground">Create pattern-interrupts with surprising data points</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <h3 className="font-medium">Story Hooks</h3>
              <p className="text-sm text-muted-foreground">Build emotional connection with relatable narratives</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <h3 className="font-medium">Challenge Hooks</h3>
              <p className="text-sm text-muted-foreground">Create polarizing reactions by challenging assumptions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HookGeneratorForm;
