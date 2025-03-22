
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

const newIdeaSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  platform: z.string().optional(),
  scheduled_for: z.string().optional(),
  tags: z.string().optional(),
});

type NewIdeaFormValues = z.infer<typeof newIdeaSchema>;

export function AddCalendarPostDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<NewIdeaFormValues>({
    resolver: zodResolver(newIdeaSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      platform: "TikTok",
      scheduled_for: format(new Date(), "yyyy-MM-dd"),
      tags: "",
    },
  });

  const handleIdeaSelect = async (idea: GeneratedIdea) => {
    try {
      const { error } = await supabase
        .from("video_ideas")
        .update({ status: "calendar" })
        .eq("id", idea.id);

      if (error) throw error;

      toast({
        title: "Added to calendar",
        description: "The idea has been added to your calendar",
      });
      setOpen(false);
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
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Idea created",
        description: "Your idea has been added to the calendar",
      });
      
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create idea: " + error.message,
      });
    }
  };

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
