
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GeneratedIdea } from "@/types/idea";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface IdeaSelectionProps {
  savedIdeas: GeneratedIdea[];
  selectedIdea: GeneratedIdea | null;
  setSelectedIdea: (idea: GeneratedIdea | null) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

// Available colors with their corresponding Tailwind classes
const colorClasses: { [key: string]: string } = {
  red: "border-red-500",
  orange: "border-orange-500",
  yellow: "border-yellow-500",
  green: "border-green-500",
  blue: "border-blue-500",
  indigo: "border-indigo-500",
  purple: "border-purple-500",
  pink: "border-pink-500"
};

export function IdeaSelection({ 
  savedIdeas, 
  selectedIdea, 
  setSelectedIdea, 
  selectedStatus, 
  setSelectedStatus 
}: IdeaSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const statuses = [
    { id: 'all', label: 'All Ideas' },
    { id: 'ideas', label: 'Ideas' },
    { id: 'planning', label: 'Planning' },
    { id: 'filming', label: 'Ready to Film' },
    { id: 'editing', label: 'To Edit' },
    { id: 'ready', label: 'Ready to Post' },
  ];

  const filteredIdeas = savedIdeas.filter(idea =>
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Button
            key={status.id}
            variant={selectedStatus === status.id ? "default" : "outline"}
            onClick={() => setSelectedStatus(status.id)}
            className="text-sm"
          >
            {status.label}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ideas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[200px] rounded-lg border p-4">
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea) => (
                <CarouselItem 
                  key={idea.id} 
                  className="pl-2 md:pl-4 pt-2 pb-2 md:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-1">
                    <Card 
                      className={cn(
                        "p-3 cursor-pointer transition-all border-l-4 relative overflow-visible",
                        colorClasses[idea.color || 'blue'] || colorClasses.blue,
                        selectedIdea?.id === idea.id 
                          ? 'ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5' 
                          : 'hover:border-primary hover:shadow-md hover:scale-[1.01]'
                      )}
                      onClick={() => setSelectedIdea(idea)}
                    >
                      {selectedIdea?.id === idea.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs z-20">
                          ✓
                        </div>
                      )}
                      <h4 className="font-medium mb-2 pr-8">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {idea.description}
                      </p>
                    </Card>
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem className="pl-2 md:pl-4 pt-2 pb-2">
                <div className="p-4 text-center">
                  <p className="text-muted-foreground">No saved ideas found. Try changing the filters or create a custom idea.</p>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          {filteredIdeas.length > 3 && (
            <>
              <CarouselPrevious className="-left-12 md:-left-16" />
              <CarouselNext className="-right-12 md:-right-16" />
            </>
          )}
        </Carousel>
      </ScrollArea>
    </div>
  );
}
