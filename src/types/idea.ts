
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
  description: string;
  category?: string;
  tags?: string[];
  is_saved?: boolean;
  platform?: string;
  hook_text?: string;
  hook_category?: string;
  scheduled_for?: string | null;
  color?: string;
  symbol?: string;
  status?: string;
  expires_at?: string;
  emoji?: string;
}

export interface PreviousIdeasContext {
  count?: number;
  titles: string[];
  categories?: string[];
  descriptions?: string[];
}

export interface AddToCalendarIdea {
  idea: GeneratedIdea;
  title: string;
  scheduledFor: string;
  color?: string;  // Added color property
}

export interface ScriptHook {
  id?: string;
  hook: string;
  category: string;
  description?: string;
  user_id?: string;
}

export interface ScriptStructure {
  id?: string;
  name: string;
  structure: string;
  description?: string;
  user_id?: string;
}

export interface PlannerColumn {
  id: string;
  title: string;
  user_id?: string;
  created_at?: string;
  order?: number;
}

export type AccountType = 'personal' | 'ecommerce' | 'business';

export interface ContentIdeaProtocol {
  type: 'value' | 'product' | 'hybrid'; 
  format: string;
  angle: string; 
  hook: string;
  premise: string;
}

export interface StyleProfile {
  id: string;
  user_id: string;
  name: string;
  content_style: string | null;
  content_personality: string | null;
  is_active: boolean;
  created_at?: string;
}

// Added new export for the viral content prompt
export const VIRAL_CONTENT_PROMPT = `You are an expert in viral social media content creation, specializing in YouTube, TikTok, and Instagram Reels. Your goal is to generate highly engaging video ideas, scripts, and hooks that maximize views, shares, and watch time. You understand trends, audience psychology, and platform algorithms to craft compelling content. Always provide structured video content with strong hooks, engaging storytelling, and clear calls to action. Adapt ideas for different niches when needed.`;
