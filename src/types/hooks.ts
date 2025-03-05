
export interface HookType {
  id?: string;
  hook_text: string;
  category: string;
  created_at?: string;
  explanation?: string;
}

export interface SavedHook {
  id: string;
  user_id: string;
  hook: string;  // Changed from hook_text to hook to match the database
  category: string;
  created_at: string;
  updated_at: string;
  description?: string;  // Added to match the database schema
}

export interface GenerateHooksFormData {
  topic: string;
  audience: string;
  details?: string;
}
