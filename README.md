# 🎓 Universidade Corporativa - Sistema de Treinamento

Um sistema completo de treinamento corporativo desenvolvido com **Next.js**, **Supabase** e **Vercel**, projetado para empresas que querem capacitar seus colaboradores com vídeos de treinamento.

## 🚀 Funcionalidades

- ✅ **Autenticação completa** (Login/Registro com Supabase Auth)
- ✅ **Dashboard personalizado** para cada usuário
- ✅ **Sistema de cursos** com vídeos de treinamento
- ✅ **Controle de progresso** dos usuários
- ✅ **Upload de vídeos** para o Supabase Storage
- ✅ **Certificados** de conclusão
- ✅ **Interface responsiva** e moderna
- ✅ **Perfis de usuário** com departamentos
- ✅ **Sistema de níveis** (Iniciante, Intermediário, Avançado)

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Deploy**: Vercel
- **UI**: Lucide React Icons
- **Estilização**: Tailwind CSS com design system customizado

## 📋 Pré-requisitos

Antes de começar, você precisa ter:
- Node.js 18+ instalado
- Uma conta no [Supabase](https://supabase.com)
- Uma conta no [Vercel](https://vercel.com)
- Git instalado

## 🔧 Configuração do Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/universidade-corporativa.git
cd universidade-corporativa
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

#### 3.1 Crie um novo projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha sua organização
4. Dê um nome ao projeto (ex: "universidade-corporativa")
5. Escolha uma senha forte para o banco
6. Selecione a região mais próxima
7. Clique em "Create new project"

#### 3.2 Configure as variáveis de ambiente
1. Copie o arquivo `.env.local.example` para `.env.local`
2. No dashboard do Supabase, vá em **Settings > API**
3. Copie os valores e cole no seu `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 3.3 Crie as tabelas no banco de dados

No Supabase, vá em **SQL Editor** e execute os seguintes comandos:

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
-- Perfis
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Cursos
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Vídeos
CREATE POLICY "Anyone can view videos of published courses" ON videos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = videos.course_id 
    AND courses.is_published = true
  )
);

-- Progresso do usuário
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- Certificados
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
```

#### 3.4 Configure o Storage para vídeos

1. No Supabase, vá em **Storage**
2. Clique em "Create bucket"
3. Nome do bucket: `videos`
4. Deixe público: `false` (privado)
5. Clique em "Create bucket"

Agora configure as políticas do Storage:

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

#### 3.5 Configure a autenticação

1. No Supabase, vá em **Authentication > Settings**
2. Em **Site URL**, adicione: `http://localhost:3000`
3. Em **Redirect URLs**, adicione: `http://localhost:3000/auth/callback`
4. Salve as configurações

### 4. Execute o projeto localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver o sistema funcionando.

## 🚀 Deploy na Nuvem

### 1. Deploy no Vercel

#### 1.1 Prepare o projeto para produção

1. Faça commit de todas as alterações:
```bash
git add .
git commit -m "Configuração inicial do projeto"
git push origin main
```

#### 1.2 Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte seu repositório do GitHub
4. Selecione o projeto
5. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (será algo como `https://seu-projeto.vercel.app`)

6. Clique em "Deploy"

#### 1.3 Atualize as configurações do Supabase

Após o deploy, você terá uma URL do Vercel. Atualize no Supabase:

1. Vá em **Authentication > Settings**
2. Atualize **Site URL** para: `https://seu-projeto.vercel.app`
3. Adicione em **Redirect URLs**: `https://seu-projeto.vercel.app/auth/callback`

### 2. Configure o domínio customizado (opcional)

1. No Vercel, vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure o DNS conforme instruções do Vercel
4. Atualize as URLs no Supabase

## 👥 Como Usar o Sistema

### Para Administradores

1. **Primeiro acesso**: Registre-se no sistema
2. **Tornar-se admin**: Execute no SQL Editor do Supabase:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu-email@empresa.com';
```

3. **Adicionar cursos**: Crie cursos através do painel administrativo
4. **Upload de vídeos**: Faça upload dos vídeos de treinamento
5. **Publicar cursos**: Torne os cursos visíveis para os usuários

### Para Colaboradores

1. **Registro**: Cada colaborador deve se registrar com email corporativo
2. **Acesso**: Login no sistema
3. **Cursos**: Visualizar e assistir cursos disponíveis
4. **Progresso**: Acompanhar progresso dos treinamentos
5. **Certificados**: Baixar certificados de conclusão

## 📊 Funcionalidades Avançadas

### Sistema de Níveis
- **Iniciante**: Cursos básicos
- **Intermediário**: Cursos de nível médio
- **Avançado**: Cursos especializados

### Controle de Progresso
- Progresso por vídeo
- Progresso por curso
- Tempo total de estudo
- Certificados emitidos

### Departamentos
- Segmentação por departamento
- Cursos específicos por área
- Relatórios por departamento

## 🔒 Segurança

- **Autenticação**: Supabase Auth com JWT
- **Autorização**: Row Level Security (RLS)
- **Dados**: Criptografados em trânsito e repouso
- **Vídeos**: Armazenamento seguro no Supabase Storage

## 📈 Escalabilidade

O sistema foi projetado para crescer com sua empresa:

- **Usuários**: Suporta milhares de usuários simultâneos
- **Vídeos**: Armazenamento ilimitado no Supabase
- **Performance**: CDN global do Vercel
- **Banco de dados**: PostgreSQL escalável

## 🆘 Suporte e Solução de Problemas

### Problemas Comuns

1. **Erro de autenticação**: Verifique as URLs no Supabase
2. **Vídeos não carregam**: Verifique as políticas do Storage
3. **Erro 500**: Verifique as variáveis de ambiente
4. **Lentidão**: Otimize imagens e vídeos

### Logs e Debugging

- **Vercel**: Veja logs em tempo real no dashboard
- **Supabase**: Monitore queries no painel
- **Browser**: Use DevTools para debug frontend

## 🔄 Atualizações e Manutenção

### Backup dos Dados
```bash
# Backup do banco via Supabase CLI
supabase db dump --local > backup.sql
```

### Atualizações do Sistema
```bash
# Atualize dependências
npm update

# Deploy nova versão
git push origin main
```

## 📞 Contato e Suporte

Para dúvidas ou suporte:
- 📧 Email: suporte@suaempresa.com
- 💬 Slack: #universidade-corporativa
- 📖 Wiki: Documentação interna

---

## 🎯 Próximos Passos

Após configurar o sistema básico, você pode:

1. **Personalizar o design** com cores da empresa
2. **Adicionar relatórios** de progresso
3. **Integrar com sistemas** existentes
4. **Criar notificações** por email
5. **Implementar gamificação** (pontos, badges)

**Parabéns! 🎉 Seu sistema de Universidade Corporativa está pronto para uso!**

---

*Desenvolvido com ❤️ para capacitar equipes e impulsionar o crescimento profissional.*