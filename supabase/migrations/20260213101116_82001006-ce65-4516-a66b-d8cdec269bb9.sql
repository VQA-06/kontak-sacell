-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false);

-- Allow service role to manage backups (edge functions use service role)
CREATE POLICY "Service role can manage backups"
ON storage.objects
FOR ALL
USING (bucket_id = 'backups')
WITH CHECK (bucket_id = 'backups');
