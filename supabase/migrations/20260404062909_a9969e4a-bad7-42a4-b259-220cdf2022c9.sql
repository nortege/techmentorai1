
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  team_name TEXT DEFAULT '',
  season TEXT DEFAULT '2024-2025',
  region TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notebooks table
CREATE TABLE public.notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  innovation_problem TEXT DEFAULT '',
  innovation_research TEXT DEFAULT '',
  innovation_solution TEXT DEFAULT '',
  innovation_next_step TEXT DEFAULT '',
  robot_iterations TEXT DEFAULT '',
  robot_main_problem TEXT DEFAULT '',
  robot_how_solved TEXT DEFAULT '',
  robot_what_different TEXT DEFAULT '',
  cv_discovery TEXT DEFAULT '',
  cv_innovation TEXT DEFAULT '',
  cv_impact TEXT DEFAULT '',
  cv_inclusion TEXT DEFAULT '',
  cv_teamwork TEXT DEFAULT '',
  cv_fun TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notebook" ON public.notebooks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notebook" ON public.notebooks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notebook" ON public.notebooks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Diary entries table
CREATE TABLE public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  q1 TEXT NOT NULL DEFAULT '',
  q2 TEXT DEFAULT '',
  q3 TEXT DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diary entries" ON public.diary_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diary entries" ON public.diary_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own diary entries" ON public.diary_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Exported PDFs table
CREATE TABLE public.exported_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exported_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PDFs" ON public.exported_pdfs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PDFs" ON public.exported_pdfs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own PDFs" ON public.exported_pdfs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('criteria', 'criteria', true);

-- Storage RLS policies
CREATE POLICY "Users can upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos');
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload pdfs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view pdfs" ON storage.objects FOR SELECT TO public USING (bucket_id = 'pdfs');
CREATE POLICY "Users can delete own pdfs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload criteria" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'criteria' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view criteria" ON storage.objects FOR SELECT TO public USING (bucket_id = 'criteria');
CREATE POLICY "Users can delete own criteria" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'criteria' AND (storage.foldername(name))[1] = auth.uid()::text);
