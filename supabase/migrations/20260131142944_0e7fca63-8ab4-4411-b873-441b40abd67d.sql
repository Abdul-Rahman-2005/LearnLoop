-- Create enum types for status and roles
CREATE TYPE upload_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_badge AS ENUM ('newcomer', 'contributor', 'expert', 'legend');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE,
  student_name TEXT,
  branch TEXT,
  points INTEGER DEFAULT 0,
  badge user_badge DEFAULT 'newcomer',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create PDFs table for storing document metadata
CREATE TABLE public.pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_roll_number TEXT NOT NULL,
  uploader_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  unit INTEGER NOT NULL CHECK (unit >= 1 AND unit <= 5),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status upload_status DEFAULT 'pending',
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  ai_summary TEXT,
  ai_topics TEXT[],
  upload_reference TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ratings table
CREATE TABLE public.pdf_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID REFERENCES public.pdfs(id) ON DELETE CASCADE NOT NULL,
  roll_number TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pdf_id, roll_number)
);

-- Create reports table for flagging content
CREATE TABLE public.pdf_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID REFERENCES public.pdfs(id) ON DELETE CASCADE NOT NULL,
  reporter_roll_number TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for PDFs (public read, controlled write)
CREATE POLICY "Anyone can view approved PDFs"
ON public.pdfs FOR SELECT
USING (status = 'approved' OR status = 'pending');

CREATE POLICY "Anyone can upload PDFs"
ON public.pdfs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Uploaders can delete their own PDFs"
ON public.pdfs FOR DELETE
USING (true);

CREATE POLICY "Uploaders can update their own PDFs"
ON public.pdfs FOR UPDATE
USING (true);

-- RLS Policies for ratings (anyone can rate)
CREATE POLICY "Anyone can view ratings"
ON public.pdf_ratings FOR SELECT
USING (true);

CREATE POLICY "Anyone can add ratings"
ON public.pdf_ratings FOR INSERT
WITH CHECK (true);

-- RLS Policies for reports
CREATE POLICY "Anyone can create reports"
ON public.pdf_reports FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view reports"
ON public.pdf_reports FOR SELECT
USING (true);

-- Create function to update average rating
CREATE OR REPLACE FUNCTION public.update_pdf_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.pdfs
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating)::DECIMAL(2,1), 0)
      FROM public.pdf_ratings
      WHERE pdf_id = COALESCE(NEW.pdf_id, OLD.pdf_id)
    ),
    ratings_count = (
      SELECT COUNT(*)
      FROM public.pdf_ratings
      WHERE pdf_id = COALESCE(NEW.pdf_id, OLD.pdf_id)
    )
  WHERE id = COALESCE(NEW.pdf_id, OLD.pdf_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for rating updates
CREATE TRIGGER update_pdf_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.pdf_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_pdf_rating();

-- Create function to increment views
CREATE OR REPLACE FUNCTION public.increment_pdf_views(pdf_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.pdfs
  SET views_count = views_count + 1
  WHERE id = pdf_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to increment downloads
CREATE OR REPLACE FUNCTION public.increment_pdf_downloads(pdf_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.pdfs
  SET downloads_count = downloads_count + 1
  WHERE id = pdf_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('pdfs', 'pdfs', true, 31457280);

-- Storage policies for PDFs bucket
CREATE POLICY "Anyone can read PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

CREATE POLICY "Anyone can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Anyone can delete PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs');