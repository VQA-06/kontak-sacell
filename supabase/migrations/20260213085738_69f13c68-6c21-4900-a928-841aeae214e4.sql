
-- Drop existing RLS policies
DROP POLICY "Users can view their own contacts" ON public.contacts;
DROP POLICY "Users can create their own contacts" ON public.contacts;
DROP POLICY "Users can update their own contacts" ON public.contacts;
DROP POLICY "Users can delete their own contacts" ON public.contacts;

-- Create open policies for personal use
CREATE POLICY "Allow all select" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.contacts FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.contacts FOR DELETE USING (true);

-- Make user_id nullable since we won't use auth
ALTER TABLE public.contacts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.contacts ALTER COLUMN user_id SET DEFAULT null;
