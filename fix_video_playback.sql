-- Script para corrigir reprodução de vídeos do storage

-- 1. Verificar se o bucket está público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'course-videos';

-- 2. Remover e recriar políticas para garantir acesso público aos vídeos
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;

-- 3. Criar política para acesso público aos vídeos (para reprodução)
CREATE POLICY "Public can view videos" ON storage.objects 
FOR SELECT USING (bucket_id = 'course-videos');

-- 4. Manter política de upload apenas para admins
DROP POLICY IF EXISTS "Admins can upload videos" ON storage.objects;
CREATE POLICY "Admins can upload videos" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Política para deletar vídeos (apenas admins)
DROP POLICY IF EXISTS "Admins can delete videos" ON storage.objects;
CREATE POLICY "Admins can delete videos" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 6. Verificar configuração
SELECT 
    'Bucket' as tipo,
    name,
    public,
    'Configurado corretamente' as status
FROM storage.buckets 
WHERE id = 'course-videos';