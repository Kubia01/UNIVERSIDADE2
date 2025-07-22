-- Script completo para corrigir storage de vídeos

-- 1. Garantir que o bucket existe e está público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('course-videos', 'course-videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];

-- 2. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete videos" ON storage.objects;

-- 3. Criar políticas mais permissivas para vídeos

-- Qualquer pessoa pode visualizar vídeos (necessário para reprodução)
CREATE POLICY "Anyone can view course videos" ON storage.objects 
FOR SELECT USING (bucket_id = 'course-videos');

-- Admins podem fazer upload
CREATE POLICY "Admins can upload course videos" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Admins podem atualizar metadados
CREATE POLICY "Admins can update course videos" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Admins podem deletar vídeos
CREATE POLICY "Admins can delete course videos" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. Verificar configuração
SELECT 
    'Bucket Status' as info,
    name,
    public::text,
    file_size_limit::text,
    array_to_string(allowed_mime_types, ', ') as mime_types
FROM storage.buckets 
WHERE id = 'course-videos'

UNION ALL

SELECT 
    'Policy' as info,
    policyname,
    cmd,
    'N/A' as mime_types
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%course%videos%'
ORDER BY info, name;