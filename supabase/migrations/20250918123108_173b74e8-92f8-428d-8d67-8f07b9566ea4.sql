-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create lists table for storing list items
CREATE TABLE public.list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_bold BOOLEAN NOT NULL DEFAULT false,
  is_empty BOOLEAN NOT NULL DEFAULT false,
  list_type TEXT NOT NULL DEFAULT 'free', -- 'free' or 'second'
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on list_items
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Create archive table for deleted items
CREATE TABLE public.archived_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  original_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_bold BOOLEAN NOT NULL DEFAULT false,
  is_empty BOOLEAN NOT NULL DEFAULT false,
  list_type TEXT NOT NULL DEFAULT 'free',
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on archived_items
ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for list_items
CREATE POLICY "Users can view own list items" ON public.list_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own list items" ON public.list_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own list items" ON public.list_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own list items" ON public.list_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for archived_items
CREATE POLICY "Users can view own archived items" ON public.archived_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived items" ON public.archived_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own archived items" ON public.archived_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_list_items_updated_at
  BEFORE UPDATE ON public.list_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_list_items_user_id ON public.list_items(user_id);
CREATE INDEX idx_list_items_list_type ON public.list_items(list_type);
CREATE INDEX idx_list_items_position ON public.list_items(position);
CREATE INDEX idx_archived_items_user_id ON public.archived_items(user_id);