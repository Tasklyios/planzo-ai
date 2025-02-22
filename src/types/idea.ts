
import { LucideIcon, Lightbulb, Video, Music, Gamepad, Camera, Heart, Star, Trophy } from "lucide-react";

export interface IdeaResearch {
  statistics: string;
  trends: string;
  examples: string;
}

export interface Idea {
  title: string;
  description: string;
  research: IdeaResearch;
  hashtags: string;
  engagementPrediction: string;
}

export interface IdeaGeneratorFormData {
  topic: string;
  targetAudience: string;
  videoStyle: string;
  toneOfVoice: string;
}

export interface GeneratedIdea {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  platform?: string;
  symbol?: keyof typeof IconMap;
  color?: string;
  is_saved?: boolean;
}

export interface AddToCalendarIdea {
  idea: GeneratedIdea;
  title: string;
  scheduledFor: string;
}

export const IconMap = {
  Lightbulb,
  Video,
  Music,
  Gamepad,
  Camera,
  Heart,
  Star,
  Trophy,
} as const;

