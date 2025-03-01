
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Anchor, Loader2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { getSavedHooks } from '@/services/hookService';
import { Input } from "@/components/ui/input";

interface HookSelectorProps {
  onSelectHook: (hookText: string) => void;
}

const HookSelector = ({ onSelectHook }: HookSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  
  // Fetch saved hooks
  const { data: savedHooks, isLoading } = useQuery({
    queryKey: ['savedHooks'],
    queryFn: getSavedHooks,
  });

  const filterHooks = (category: string) => {
    if (!savedHooks) return [];
    
    return savedHooks
      .filter(hook => 
        hook.category === category && 
        (searchTerm === '' || hook.hook.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  };

  const handleSelectHook = (hookText: string) => {
    onSelectHook(hookText);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <Anchor className="mr-2 h-4 w-4" />
          Add a Hook
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md" side="right">
        <SheetHeader>
          <SheetTitle>Select a Hook</SheetTitle>
          <SheetDescription>
            Choose from your saved hooks to add to your script
          </SheetDescription>
        </SheetHeader>
        
        <div className="my-4">
          <Input
            placeholder="Search hooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !savedHooks || savedHooks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No saved hooks found. Create some in the Hooks section.</p>
            </div>
          ) : (
            <Tabs defaultValue="question" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="question">Question</TabsTrigger>
                <TabsTrigger value="statistic">Statistic</TabsTrigger>
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="challenge">Challenge</TabsTrigger>
              </TabsList>
              
              {['question', 'statistic', 'story', 'challenge'].map(category => (
                <TabsContent key={category} value={category} className="max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2 py-2">
                    {filterHooks(category).length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        {searchTerm ? 'No matching hooks found' : `No ${category} hooks saved`}
                      </p>
                    ) : (
                      filterHooks(category).map(hook => (
                        <Button
                          key={hook.id}
                          variant="ghost"
                          className="w-full justify-start text-left p-3 h-auto"
                          onClick={() => handleSelectHook(hook.hook)}
                        >
                          {hook.hook}
                        </Button>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HookSelector;
