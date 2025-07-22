-- Script para criar bucket de storage via SQL
-- Execute este script APÓS criar o bucket via interface

-- 1. Políticas para o bucket course-videos
INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true);

-- 2. Política para upload de vídeos (apenas admins)
CREATE POLICY "Admins can upload videos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 3. Política para visualizar vídeos (usuários autenticados)
CREATE POLICY "Authenticated users can view videos" ON storage.objects FOR SELECT USING (
  bucket_id = 'course-videos' AND auth.role() = 'authenticated'
);

-- 4. Política para deletar vídeos (apenas admins)
CREATE POLICY "Admins can delete videos" ON storage.objects FOR DELETE USING (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);