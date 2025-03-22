import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoIdeaSelector from "@/components/script/VideoIdeaSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedIdea } from "@/types/idea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getEmojiForIdea } from "@/utils/emojiUtils";
import { cn } from "@/lib/utils";

const newIdeaSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  platform: z.string().optional(),
  scheduled_for: z.string().optional(),
  tags: z.string().optional(),
  color: z.string().optional(),
});

type NewIdeaFormValues = z.infer<typeof newIdeaSchema>;

export function AddCalendarPostDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<NewIdeaFormValues>({
    resolver: zodResolver(newIdeaSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      platform: "TikTok",
      scheduled_for: format(new Date(), "yyyy-MM-dd"),
      tags: "",
      color: "blue",
    },
  });

  const handleIdeaSelect = async (idea: GeneratedIdea) => {
    try {
      console.log("Selected idea for calendar:", idea);
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to add ideas to calendar",
        });
        return;
      }

      const { error } = await supabase
        .from("video_ideas")
        .update({ 
          status: "calendar", 
          is_saved: true,
          scheduled_for: format(new Date(), "yyyy-MM-dd")
        })
        .eq("id", idea.id)
        .eq("user_id", sessionData.session.user.id);

      if (error) throw error;

      toast({
        title: "Added to calendar",
        description: "The idea has been added to your calendar",
      });
      setOpen(false);
      
      navigate(0);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add idea to calendar: " + error.message,
      });
    }
  };

  const onSubmit = async (values: NewIdeaFormValues) => {
    try {
      console.log("Submitting new idea form with values:", values);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to create ideas",
        });
        return;
      }

      const tagsArray = values.tags 
        ? values.tags.split(',').map(tag => tag.trim()) 
        : [];
      
      const emoji = getEmojiForIdea(values.title, values.category);
      
      const { data, error } = await supabase
        .from("video_ideas")
        .insert([
          {
            title: values.title,
            description: values.description,
            category: values.category,
            platform: values.platform,
            tags: tagsArray,
            user_id: sessionData.session.user.id,
            is_saved: true,
            status: "calendar",
            scheduled_for: values.scheduled_for,
            color: values.color || "blue",
            emoji: emoji,
          },
        ])
        .select();

      if (error) throw error;

      console.log("Idea successfully created and added to calendar:", data);
      
      toast({
        title: "Idea created",
        description: "Your idea has been added to the calendar",
      });
      
      form.reset();
      setOpen(false);
      
      navigate(0);
    } catch (error: any) {
      console.error("Error creating new idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create idea: " + error.message,
      });
    }
  };

  const availableColors = [
    { name: "Red", value: "red" },
    { name: "Orange", value: "orange" },
    { name: "Yellow", value: "yellow" },
    { name: "Green", value: "green" },
    { name: "Blue", value: "blue" },
    { name: "Indigo", value: "indigo" },
    { name: "Purple", value: "purple" },
    { name: "Pink", value: "pink" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add post to calendar</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="saved">Choose from saved ideas</TabsTrigger>
            <TabsTrigger value="new">Create new idea</TabsTrigger>
          </TabsList>
          <TabsContent value="saved">
            <VideoIdeaSelector onSelectIdea={handleIdeaSelect} />
          </TabsContent>
          <TabsContent value="new">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter idea title" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter idea description" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Tutorial, Behind the scenes" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <FormControl>
                          <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                            {...field}
                          >
                            <option value="TikTok">TikTok</option>
                            <option value="Instagram Reels">Instagram Reels</option>
                            <option value="YouTube Shorts">YouTube Shorts</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduled_for"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tags separated by commas" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((color) => (
                            <div 
                              key={color.value}
                              className={cn(
                                "w-8 h-8 rounded-full cursor-pointer border-2",
                                field.value === color.value ? "border-primary" : "border-transparent"
                              )}
                              style={{ 
                                backgroundColor: color.value === "red" ? "#ef4444" : 
                                  color.value === "orange" ? "#f97316" : 
                                  color.value === "yellow" ? "#eab308" :
                                  color.value === "green" ? "#22c55e" :
                                  color.value === "blue" ? "#3b82f6" :
                                  color.value === "indigo" ? "#6366f1" :
                                  color.value === "purple" ? "#a855f7" : "#ec4899"
                              }}
                              onClick={() => field.onChange(color.value)}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-4">
                  <Button type="submit">Add to Calendar</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
