-- Script corrigido para políticas de storage
-- Este script verifica se as políticas já existem antes de criar

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

-- 4. Verificar se tudo foi criado corretamente
SELECT 
    'Bucket criado' as status,
    name,
    public
FROM storage.buckets 
WHERE id = 'course-videos'

UNION ALL

SELECT 
    'Política criada' as status,
    policyname as name,
    'N/A' as public
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname IN ('Admins can upload videos', 'Authenticated users can view videos', 'Admins can delete videos');