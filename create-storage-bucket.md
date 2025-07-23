# 📁 Configuração do Storage Bucket para Vídeos

## 🚨 Problema Identificado
O bucket `course-videos` não existe ou não está configurado corretamente. Vamos criar manualmente.

## 🔧 Solução: Criar Bucket Manualmente

### **Passo 1: Acessar o Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **Storage** no menu lateral

### **Passo 2: Criar Novo Bucket**
1. Clique em **"New Bucket"**
2. Configure:
   - **Name**: `course-videos`
   - **Public bucket**: ✅ **Ativado** (importante!)
   - **File size limit**: `524288000` (500MB em bytes)
   - **Allowed MIME types**: 
     ```
     video/mp4
     video/webm
     video/ogg
     video/avi
     video/mov
     video/mkv
     ```

### **Passo 3: Configurar Políticas de Segurança**

Após criar o bucket, vá para **Policies** e adicione:

```sql
-- Política para permitir uploads de admins
CREATE POLICY "Admins can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-videos' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para permitir leitura pública
CREATE POLICY "Public can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-videos');

-- Política para permitir admins deletarem
CREATE POLICY "Admins can delete videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-videos' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

## ✅ Verificação
Após criar o bucket, teste fazendo upload de um vídeo pequeno primeiro.