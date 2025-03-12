
export interface HookType {
  id?: string;
  hook_text: string;
  category: string;
  explanation?: string;
  created_at?: string;
  is_saved?: boolean;
}

export interface SavedHook {
  id: string;
  hook: string;
  category: string;
  user_id: string;
  created_at: string;
  is_saved?: boolean;
}
