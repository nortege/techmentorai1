
-- Drop conflicting policies first, then recreate
DO $$ BEGIN
  -- Try dropping existing policies (ignore errors)
  BEGIN DROP POLICY "Users can upload criteria" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Users can view criteria" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Public criteria access" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Users can upload photos" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Users can view photos" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Public photos access" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Users can upload pdfs" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Users can view pdfs" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Public pdfs access" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY "Users can delete own pdfs" ON storage.objects; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Storage policies for criteria bucket
CREATE POLICY "criteria_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'criteria' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "criteria_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'criteria');
CREATE POLICY "criteria_select_anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'criteria');

-- Storage policies for photos bucket
CREATE POLICY "photos_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "photos_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'photos');

-- Storage policies for pdfs bucket
CREATE POLICY "pdfs_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "pdfs_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');
CREATE POLICY "pdfs_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add research fields to notebooks
ALTER TABLE public.notebooks ADD COLUMN IF NOT EXISTS research_data text DEFAULT ''::text;
ALTER TABLE public.notebooks ADD COLUMN IF NOT EXISTS research_graphs text DEFAULT ''::text;
ALTER TABLE public.notebooks ADD COLUMN IF NOT EXISTS research_relevance text DEFAULT ''::text;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  rating integer NOT NULL,
  comment text DEFAULT '',
  likes integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  BEGIN CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (true); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN CREATE POLICY "reviews_insert_auth" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
