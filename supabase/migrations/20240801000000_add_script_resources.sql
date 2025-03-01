
-- Create tables for script hooks and structures

-- Table for storing script hooks
CREATE TABLE IF NOT EXISTS public.script_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hook TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies for script_hooks
ALTER TABLE public.script_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hooks" 
  ON public.script_hooks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hooks" 
  ON public.script_hooks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hooks" 
  ON public.script_hooks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hooks" 
  ON public.script_hooks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Table for storing script structures
CREATE TABLE IF NOT EXISTS public.script_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  structure TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies for script_structures
ALTER TABLE public.script_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own structures" 
  ON public.script_structures 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own structures" 
  ON public.script_structures 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own structures" 
  ON public.script_structures 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own structures" 
  ON public.script_structures 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS script_hooks_user_id_idx ON public.script_hooks (user_id);
CREATE INDEX IF NOT EXISTS script_structures_user_id_idx ON public.script_structures (user_id);
