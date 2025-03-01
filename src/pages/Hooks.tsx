
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

const Hooks = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Generate Hooks</h1>
        <p className="text-muted-foreground">Create attention-grabbing hooks for your content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Hook Generator</CardTitle>
              <CardDescription>Tell us what your content is about and we'll create engaging hooks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">What's your content about?</Label>
                <Input id="topic" placeholder="e.g., Mindfulness meditation benefits" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Who's your target audience?</Label>
                <Input id="audience" placeholder="e.g., Working professionals ages 25-40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Additional details (optional)</Label>
                <Textarea id="details" placeholder="Add any specific details or requirements for your hooks" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full blue-gradient">
                <Zap className="mr-2 h-4 w-4" />
                Generate Hooks
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Hook Types</CardTitle>
              <CardDescription>Different styles for different platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <h3 className="font-medium">Question Hooks</h3>
                <p className="text-sm text-muted-foreground">Engage your audience with thought-provoking questions</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <h3 className="font-medium">Statistic Hooks</h3>
                <p className="text-sm text-muted-foreground">Grab attention with surprising facts and numbers</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <h3 className="font-medium">Story Hooks</h3>
                <p className="text-sm text-muted-foreground">Begin with a compelling narrative or anecdote</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <h3 className="font-medium">Challenge Hooks</h3>
                <p className="text-sm text-muted-foreground">Address common misconceptions or beliefs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hooks;
