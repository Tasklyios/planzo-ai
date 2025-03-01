
export interface HookType {
  id?: string;
  hook_text: string;
  category: string;
  created_at?: string;
}

export interface SavedHook {
  id: string;
  user_id: string;
  hook_text: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateHooksFormData {
  topic: string;
  audience: string;
  details?: string;
}
