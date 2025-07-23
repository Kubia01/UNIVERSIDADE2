# 📁 Guia Completo: Criar Bucket no Supabase Storage

## 🎯 Objetivo
Criar o bucket `course-videos` para armazenar os vídeos das aulas do sistema.

---

## 📋 Passo a Passo Detalhado

### **Passo 1: Acessar o Supabase Dashboard**

1. **Abra seu navegador** e vá para: https://supabase.com/dashboard
2. **Faça login** com sua conta Supabase
3. **Selecione seu projeto** na lista de projetos

---

### **Passo 2: Navegar para Storage**

1. **No menu lateral esquerdo**, procure por **"Storage"**
2. **Clique em "Storage"** - você verá uma página com buckets existentes (se houver)
3. Se for a primeira vez, você verá uma tela vazia ou com poucos buckets

---

### **Passo 3: Criar Novo Bucket**

1. **Clique no botão "New Bucket"** (botão verde/azul no canto superior direito)
2. **Uma modal/popup será aberta** com o formulário de criação

---

### **Passo 4: Configurar o Bucket**

**Preencha os campos exatamente assim:**

#### **4.1 - Name (Nome)**
```
course-videos
```
⚠️ **IMPORTANTE**: Digite exatamente `course-videos` (sem espaços, sem maiúsculas)

#### **4.2 - Public bucket**
- ✅ **MARQUE esta opção** (checkbox deve ficar marcado)
- Isso permite que os vídeos sejam acessados publicamente via URL

#### **4.3 - File size limit**
```
524288000
```
⚠️ **IMPORTANTE**: Digite exatamente `524288000` (isso equivale a 500MB em bytes)

#### **4.4 - Allowed MIME types (Opcional)**
Se houver este campo, adicione:
```
video/mp4
video/webm
video/ogg
video/avi
video/mov
video/mkv
```
**Nota**: Alguns projetos não mostram este campo - tudo bem, pode pular.

---

### **Passo 5: Criar o Bucket**

1. **Revise todas as configurações**:
   - Nome: `course-videos`
   - Public bucket: ✅ Marcado
   - File size limit: `524288000`

2. **Clique em "Create Bucket"** ou "Save"

3. **Aguarde alguns segundos** - o bucket será criado

---

### **Passo 6: Verificar se foi Criado**

1. **Você deve ver o bucket** `course-videos` na lista
2. **Deve aparecer um ícone indicando que é público**
3. **Se clicar no bucket**, deve abrir uma pasta vazia

---

### **Passo 7: Configurar Políticas de Segurança**

1. **No menu lateral**, clique em **"Authentication"** → **"Policies"**
2. **Procure por "storage.objects"** na lista de tabelas
3. **Clique em "New Policy"** ao lado de `storage.objects`

#### **Política 1: Upload para Admins**
```sql
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
```

#### **Política 2: Leitura Pública**
```sql
CREATE POLICY "Public can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-videos');
```

#### **Política 3: Delete para Admins**
```sql
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

**Como aplicar as políticas:**
1. Vá para **SQL Editor** no menu lateral
2. **Cole cada política** uma por vez
3. **Execute** clicando em "Run"

---

## ✅ Verificação Final

### **Teste 1: Executar Script**
```bash
node check-storage-config.js
```

### **Teste 2: Verificação Manual**
1. **Vá para Storage** → **course-videos**
2. **Tente fazer upload** de um arquivo pequeno
3. **Deve funcionar sem erro**

---

## 🚨 Problemas Comuns

### **Erro: "Bucket não encontrado"**
- ✅ Verifique se o nome é exatamente `course-videos`
- ✅ Verifique se está no projeto correto

### **Erro: "Permission denied"**
- ✅ Verifique se marcou "Public bucket"
- ✅ Execute as políticas de segurança

### **Erro: "File too large"**
- ✅ Verifique se o File size limit é `524288000`
- ✅ No plano gratuito, limite real é 50MB por arquivo

### **Não consigo encontrar "Storage"**
- ✅ Verifique se está no projeto correto
- ✅ Alguns projetos antigos podem não ter Storage habilitado

---

## 📞 Se Ainda Não Funcionar

1. **Execute o script de verificação**: `node check-storage-config.js`
2. **Copie e cole o resultado** para análise
3. **Verifique se seu projeto Supabase** tem Storage habilitado
4. **Considere criar um novo projeto** se for muito antigo

---

## 🎉 Sucesso!

Quando tudo estiver funcionando:
- ✅ Bucket `course-videos` criado e público
- ✅ Políticas de segurança configuradas
- ✅ Upload de vídeos funcionando
- ✅ URLs públicas sendo geradas

**Agora você pode fazer upload de vídeos até 500MB (plano pago) ou 50MB (plano gratuito)!**