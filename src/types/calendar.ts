
export interface VideoIdea {
  id: string;
  title: string;
  description: string;
  platform?: string;
  created_at: string;
  symbol?: string;
  color?: string;
  category?: string;
  tags?: string[];
  is_saved?: boolean;
  script?: string;
  user_id?: string;
  scheduled_for?: string;
}

export interface ScheduledPost extends VideoIdea {
  scheduled_for: string;
}
