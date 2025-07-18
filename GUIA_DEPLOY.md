# 🚀 Guia Completo de Deploy - Universidade Corporativa

Este guia foi criado especialmente para **iniciantes** que nunca fizeram deploy de um sistema antes. Vou te guiar passo a passo para colocar seu sistema na nuvem e fazer com que todos os 80 colaboradores da sua empresa possam acessar.

## 📋 O que você vai precisar

- [ ] Um computador com internet
- [ ] Uma conta no Gmail (para criar outras contas)
- [ ] Aproximadamente 2 horas para configurar tudo
- [ ] Paciência (é normal dar alguns erros no início!)

## 🎯 Resultado Final

Ao final deste guia, você terá:
- ✅ Um sistema funcionando na internet
- ✅ Uma URL que todos podem acessar (ex: `https://universidade-empresa.vercel.app`)
- ✅ Banco de dados seguro na nuvem
- ✅ Sistema de login funcionando
- ✅ Upload de vídeos funcionando

---

## 🔧 PASSO 1: Configurar o Supabase (Banco de Dados)

### 1.1 Criar conta no Supabase

1. **Acesse**: [supabase.com](https://supabase.com)
2. **Clique em**: "Start your project"
3. **Clique em**: "Sign up" (se não tiver conta) ou "Sign in"
4. **Use sua conta do GitHub** (se tiver) ou **crie com email**

### 1.2 Criar um novo projeto

1. **Clique em**: "New Project"
2. **Escolha**: Sua organização (provavelmente já estará selecionada)
3. **Preencha**:
   - **Name**: `universidade-corporativa`
   - **Database Password**: Crie uma senha forte (anote ela!)
   - **Region**: Escolha "South America (São Paulo)" se estiver no Brasil
4. **Clique em**: "Create new project"
5. **Aguarde**: 2-3 minutos para o projeto ser criado

### 1.3 Configurar o banco de dados

1. **No painel do Supabase**, clique em **"SQL Editor"** no menu lateral
2. **Clique em**: "New query"
3. **Copie e cole** o código abaixo na área de texto:

```sql
-- Tabela de usuários (perfis)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cursos
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  duration INTEGER DEFAULT 0,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT false
);

-- Tabela de vídeos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de progresso do usuário
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Tabela de certificados
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_url TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Anyone can view videos of published courses" ON videos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = videos.course_id 
    AND courses.is_published = true
  )
);

CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
```

4. **Clique em**: "Run" (botão play)
5. **Aguarde**: Deve aparecer "Success. No rows returned"

### 1.4 Configurar Storage para vídeos

1. **Clique em**: "Storage" no menu lateral
2. **Clique em**: "Create bucket"
3. **Preencha**:
   - **Name**: `videos`
   - **Public bucket**: Deixe DESMARCADO (privado)
4. **Clique em**: "Create bucket"

### 1.5 Configurar políticas do Storage

1. **Volte para**: "SQL Editor"
2. **Clique em**: "New query"
3. **Copie e cole**:

```sql
-- Política para upload de vídeos (apenas admins)
CREATE POLICY "Admins can upload videos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Política para visualizar vídeos (usuários autenticados)
CREATE POLICY "Authenticated users can view videos" ON storage.objects FOR SELECT USING (
  bucket_id = 'videos' AND auth.role() = 'authenticated'
);
```

4. **Clique em**: "Run"

### 1.6 Pegar as chaves do Supabase

1. **Clique em**: "Settings" no menu lateral
2. **Clique em**: "API"
3. **Anote** (ou copie para um arquivo texto):
   - **Project URL**: `https://xxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role/secret key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**⚠️ IMPORTANTE**: Guarde essas chaves em um local seguro!

---

## 🌐 PASSO 2: Configurar o Vercel (Hospedagem)

### 2.1 Criar conta no Vercel

1. **Acesse**: [vercel.com](https://vercel.com)
2. **Clique em**: "Sign Up"
3. **Escolha**: "Continue with GitHub" (recomendado)
4. **Autorize** o Vercel a acessar sua conta GitHub

### 2.2 Subir o código para o GitHub

**Se você ainda não tem o código no GitHub:**

1. **Acesse**: [github.com](https://github.com)
2. **Clique em**: "New repository"
3. **Preencha**:
   - **Repository name**: `universidade-corporativa`
   - **Description**: `Sistema de treinamento da empresa`
   - **Public** ou **Private** (escolha Private se quiser manter privado)
4. **Clique em**: "Create repository"

**Para subir o código:**

1. **Abra o terminal** na pasta do seu projeto
2. **Execute os comandos**:

```bash
git init
git add .
git commit -m "Primeiro commit - Sistema Universidade Corporativa"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/universidade-corporativa.git
git push -u origin main
```

### 2.3 Fazer deploy no Vercel

1. **No Vercel**, clique em "New Project"
2. **Encontre** seu repositório `universidade-corporativa`
3. **Clique em**: "Import"
4. **Configure** as variáveis de ambiente:
   - Clique em "Environment Variables"
   - Adicione uma por uma:

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_SITE_URL = (deixe vazio por enquanto)
   ```

5. **Clique em**: "Deploy"
6. **Aguarde**: 2-3 minutos para o deploy

### 2.4 Configurar a URL final

1. **Após o deploy**, você verá uma URL como: `https://universidade-corporativa-abc123.vercel.app`
2. **Copie essa URL**
3. **Volte para**: Environment Variables no Vercel
4. **Edite** a variável `NEXT_PUBLIC_SITE_URL` e coloque a URL que você copiou
5. **Clique em**: "Save"

---

## 🔗 PASSO 3: Conectar Supabase com Vercel

### 3.1 Configurar URLs no Supabase

1. **Volte para o Supabase**
2. **Clique em**: "Authentication" no menu lateral
3. **Clique em**: "Settings"
4. **Configure**:
   - **Site URL**: Cole a URL do seu Vercel (ex: `https://universidade-corporativa-abc123.vercel.app`)
   - **Redirect URLs**: Adicione a mesma URL + `/auth/callback`
     - Exemplo: `https://universidade-corporativa-abc123.vercel.app/auth/callback`
5. **Clique em**: "Save"

### 3.2 Testar o sistema

1. **Acesse** sua URL do Vercel
2. **Clique em**: "Cadastre-se"
3. **Preencha** os dados e crie uma conta
4. **Verifique** se recebeu o email de confirmação
5. **Confirme** sua conta pelo email

---

## 👨‍💼 PASSO 4: Configurar Administrador

### 4.1 Tornar-se administrador

1. **Após criar sua conta**, volte para o Supabase
2. **Clique em**: "SQL Editor"
3. **Execute** este comando (substitua SEU-EMAIL):

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu-email@empresa.com';
```

4. **Clique em**: "Run"

### 4.2 Criar perfil de usuário

1. **Ainda no SQL Editor**, execute:

```sql
-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, department, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'department', 'outros'),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 🎥 PASSO 5: Adicionar Primeiro Curso

### 5.1 Criar curso de teste

1. **No SQL Editor**, execute:

```sql
-- Inserir curso de exemplo
INSERT INTO courses (
  title,
  description,
  category,
  level,
  duration,
  is_published,
  created_by
) VALUES (
  'Introdução à Empresa',
  'Curso de boas-vindas para novos colaboradores',
  'Onboarding',
  'beginner',
  1800, -- 30 minutos
  true,
  (SELECT id FROM auth.users WHERE email = 'seu-email@empresa.com')
);
```

### 5.2 Adicionar vídeo de exemplo

```sql
-- Inserir vídeo de exemplo
INSERT INTO videos (
  course_id,
  title,
  description,
  video_url,
  duration,
  order_index
) VALUES (
  (SELECT id FROM courses WHERE title = 'Introdução à Empresa'),
  'Bem-vindos à nossa empresa',
  'Vídeo de apresentação da empresa',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', -- Substitua por seu vídeo
  1800,
  1
);
```

---

## 📧 PASSO 6: Convidar Colaboradores

### 6.1 Criar lista de emails

1. **Crie um arquivo** `colaboradores.txt` com os emails:
```
joao@empresa.com
maria@empresa.com
carlos@empresa.com
...
```

### 6.2 Enviar convites

**Opção 1: Email manual**
- Envie um email para todos com o link do sistema
- Instrua para se cadastrarem

**Opção 2: Convite automático via Supabase**
```sql
-- Para cada colaborador, execute:
SELECT auth.admin_invite_user_by_email('email@empresa.com');
```

---

## 🔧 PASSO 7: Configurações Finais

### 7.1 Personalizar o sistema

1. **Edite** o arquivo `app/layout.tsx` para mudar o nome da empresa
2. **Substitua** "Universidade Corporativa" pelo nome da sua empresa
3. **Faça commit** das alterações:

```bash
git add .
git commit -m "Personalização da empresa"
git push origin main
```

### 7.2 Configurar domínio personalizado (opcional)

1. **No Vercel**, vá em "Settings" > "Domains"
2. **Adicione** seu domínio (ex: `universidade.minhaempresa.com`)
3. **Configure** o DNS conforme instruções
4. **Atualize** as URLs no Supabase

---

## ✅ CHECKLIST FINAL

Antes de liberar para todos os colaboradores:

- [ ] Sistema acessível pela URL
- [ ] Login funcionando
- [ ] Registro funcionando
- [ ] Pelo menos 1 curso criado
- [ ] Pelo menos 1 vídeo funcionando
- [ ] Você consegue se logar como admin
- [ ] Testado em diferentes navegadores
- [ ] Testado no celular

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### "Erro 500 - Internal Server Error"
**Solução**: Verifique as variáveis de ambiente no Vercel

### "Não consigo fazer login"
**Solução**: Verifique se as URLs estão corretas no Supabase

### "Vídeos não carregam"
**Solução**: Verifique as políticas do Storage no Supabase

### "Não recebo email de confirmação"
**Solução**: Verifique a pasta de spam e configurações do Supabase

---

## 📞 SUPORTE

Se você teve problemas seguindo este guia:

1. **Verifique** se seguiu todos os passos
2. **Confira** se copiou as chaves corretamente
3. **Teste** em modo anônimo do navegador
4. **Procure** ajuda da equipe de TI da empresa

---

## 🎉 PARABÉNS!

Se chegou até aqui, você conseguiu:
- ✅ Criar um sistema completo de treinamento
- ✅ Colocar na nuvem para 80+ colaboradores
- ✅ Configurar banco de dados seguro
- ✅ Implementar sistema de login
- ✅ Preparar para upload de vídeos

**Agora é só usar e capacitar sua equipe!** 🚀

---

*💡 Dica: Salve este guia para futuras referências e atualizações do sistema.*