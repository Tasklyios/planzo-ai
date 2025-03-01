import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSavedHooks } from '@/services/hookService';
import HookSelector from '@/components/script/HookSelector';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Script = () => {
  const [scriptContent, setScriptContent] = useState('');

  // Add this function to handle hook selection
  const handleSelectHook = (hookText: string) => {
    // Insert the hook at the beginning of the script content
    // This is an example - adjust based on your actual script state management
    if (typeof setScriptContent === 'function') {
      setScriptContent(prevContent => `${hookText}\n\n${prevContent || ''}`);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Generate Scripts</h1>
        <p className="text-muted-foreground">Create engaging scripts for your content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Script Generator</CardTitle>
              <CardDescription>Enter your content details to generate a script</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g., How to meditate effectively" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="e.g., A step-by-step guide to meditation" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Additional details</Label>
                <Textarea id="details" placeholder="Add any specific details or requirements for your script" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generated Script</CardTitle>
              <CardDescription>Your generated script will appear here</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Your script will be generated here" 
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add the HookSelector somewhere in your UI */}
      <div className="mb-4">
        <HookSelector onSelectHook={handleSelectHook} />
      </div>
    </div>
  );
};

export default Script;
