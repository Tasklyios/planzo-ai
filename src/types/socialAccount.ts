
export interface SocialAccount {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}
