
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
  color?: string;
  hook_text?: string;
  hook_category?: string;
  is_saved?: boolean;
  scheduled_for?: string;
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

export interface ContentIdeaProtocol {
  type: 'value' | 'product' | 'hybrid'; 
  format: string;
  angle: string; 
  hook: string;
  premise: string;
}

// Add StyleProfile interface to fix the import errors
export interface StyleProfile {
  id: string;
  user_id: string;
  name: string;
  content_style: string | null;
  content_personality: string | null;
  is_active: boolean;
  created_at?: string;
}
