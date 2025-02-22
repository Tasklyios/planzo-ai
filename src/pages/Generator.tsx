import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const Generator = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState("Informative");
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("video_ideas")
        .insert([
          {
            title: title,
            description: description,
            tone: tone,
            is_public: isPublic,
          },
        ])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      setTitle("");
      setDescription("");
      setTone("Informative");
      setIsPublic(false);

      toast({
        title: "Success",
        description: "Video idea generated successfully!",
      });

      navigate("/ideas");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFC] to-white">
      <main className="container mx-auto px-4 pt-16 md:pt-28 pb-12">
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Video Idea Generator
          </h1>
          <p className="text-gray-600">
            Enter your video title and description to generate amazing video
            ideas.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Video Title
            </label>
            <div className="mt-1">
              <Input
                type="text"
                id="title"
                placeholder="e.g., Best Productivity Tips for Students"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Video Description
            </label>
            <div className="mt-1">
              <Textarea
                id="description"
                rows={3}
                placeholder="e.g., A video discussing effective productivity tips tailored for students."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tone"
              className="block text-sm font-medium text-gray-700"
            >
              Tone
            </label>
            <Select onValueChange={setTone} defaultValue={tone}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Informative">Informative</SelectItem>
                <SelectItem value="Funny">Funny</SelectItem>
                <SelectItem value="Educational">Educational</SelectItem>
                <SelectItem value="Inspirational">Inspirational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={() => setIsPublic(!isPublic)}
              />
              <label
                htmlFor="public"
                className="ml-3 block text-sm font-medium text-gray-700"
              >
                Public
              </label>
            </div>
            <span className="text-gray-500 text-sm">
              Make this idea public for other users to view?
            </span>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Idea"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Generator;
