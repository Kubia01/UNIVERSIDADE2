-- Script corrigido para políticas de storage (sem erro de tipo)

-- 1. Verificar se o bucket existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'course-videos') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true);
    END IF;
END $$;

-- 2. Remover políticas antigas se existirem e recriar
DROP POLICY IF EXISTS "Admins can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete videos" ON storage.objects;

-- 3. Criar políticas para o bucket course-videos
CREATE POLICY "Admins can upload videos" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view videos" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'course-videos' AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete videos" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);