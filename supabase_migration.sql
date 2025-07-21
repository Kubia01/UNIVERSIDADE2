-- Migração para estrutura de cursos e aulas
-- Execute este script no seu Supabase SQL Editor

-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'HR',
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela courses se não existir
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('onboarding', 'training', 'compliance', 'skills', 'leadership')),
    duration INTEGER DEFAULT 0,
    instructor TEXT NOT NULL,
    thumbnail TEXT,
    is_published BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT false,
    department TEXT NOT NULL DEFAULT 'HR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela videos (aulas) se não existir
CREATE TABLE IF NOT EXISTS videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'document', 'quiz', 'link')),
    video_url TEXT NOT NULL, -- URL do conteúdo (vídeo, documento, link, etc.)
    duration INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela user_progress se não existir
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    progress DECIMAL(5,2) DEFAULT 0.00,
    completed_lessons TEXT[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    certificate_id UUID,
    UNIQUE(user_id, course_id)
);

-- Criar tabela certificates se não existir
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    certificate_url TEXT
);

-- Criar tabela course_assignments se não existir
CREATE TABLE IF NOT EXISTS course_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline TIMESTAMP WITH TIME ZONE
);

-- Criar tabela admin_notifications se não existir
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('welcome', 'policy', 'announcement')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_order ON videos(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_user_id ON course_assignments(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
-- Profiles: usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses: todos podem ver cursos publicados
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);

-- Videos: todos podem ver aulas de cursos publicados
CREATE POLICY "Anyone can view videos of published courses" ON videos FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = videos.course_id AND courses.is_published = true)
);

-- User progress: usuários podem ver e editar apenas seu próprio progresso
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- Certificates: usuários podem ver apenas seus próprios certificados
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);

-- Admin notifications: todos podem ver notificações ativas
CREATE POLICY "Anyone can view active notifications" ON admin_notifications FOR SELECT USING (is_active = true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_admin_notifications_updated_at BEFORE UPDATE ON admin_notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();