
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
