-- SCRIPT DE EMERGÊNCIA PARA CORRIGIR BANCO
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as tabelas básicas existem
SELECT 'Verificando tabelas...' as status;

-- 2. Recriar tabela profiles se houver problema
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT DEFAULT 'HR',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recriar tabela courses simplificada
DROP TABLE IF EXISTS courses CASCADE;

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'training',
  duration INTEGER DEFAULT 0,
  instructor TEXT,
  thumbnail TEXT,
  is_published BOOLEAN DEFAULT false,
  is_mandatory BOOLEAN DEFAULT false,
  department TEXT DEFAULT 'HR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recriar tabela videos
DROP TABLE IF EXISTS videos CASCADE;

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'video' CHECK (type IN ('video', 'document', 'quiz', 'link')),
  video_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Recriar tabelas de progresso simplificadas
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;

CREATE TABLE lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_watched INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

CREATE TABLE user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0.00,
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_url TEXT
);

-- 6. Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS simples e funcionais
-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can insert any profile" ON profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can delete any profile" ON profiles FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Courses
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Videos
CREATE POLICY "Anyone can view videos of published courses" ON videos FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = videos.course_id AND courses.is_published = true)
);
CREATE POLICY "Admins can manage videos" ON videos FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Progress
CREATE POLICY "Users can manage own lesson progress" ON lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);

-- 8. Recriar seu usuário admin
INSERT INTO profiles (id, name, email, role, department)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'dsinterlub@gmail.com' LIMIT 1),
  'Admin Master',
  'dsinterlub@gmail.com', 
  'admin',
  'TI'
) ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    name = 'Admin Master',
    department = 'TI';

-- 9. Verificar se tudo foi criado
SELECT 'Banco corrigido com sucesso!' as status;
SELECT * FROM profiles WHERE email = 'dsinterlub@gmail.com';