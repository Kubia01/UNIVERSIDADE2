-- Migração para estrutura de cursos e aulas
-- Execute este script no seu Supabase SQL Editor

-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
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

-- Criar tabela lesson_progress para progresso individual das aulas
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_watched INTEGER DEFAULT 0, -- em segundos
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Criar tabela user_progress se não existir
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0.00,
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    certificate_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_user_id ON course_assignments(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
-- Profiles: usuários podem ver e editar apenas seu próprio perfil, admins podem ver todos
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Courses: todos podem ver cursos publicados, admins podem gerenciar
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Videos: todos podem ver aulas de cursos publicados
DROP POLICY IF EXISTS "Anyone can view videos of published courses" ON videos;
DROP POLICY IF EXISTS "Admins can manage videos" ON videos;

CREATE POLICY "Anyone can view videos of published courses" ON videos FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = videos.course_id AND courses.is_published = true)
);
CREATE POLICY "Admins can manage videos" ON videos FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Lesson progress: usuários podem ver e editar apenas seu próprio progresso
DROP POLICY IF EXISTS "Users can manage own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Admins can view all lesson progress" ON lesson_progress;

CREATE POLICY "Users can manage own lesson progress" ON lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all lesson progress" ON lesson_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- User progress: usuários podem ver e editar apenas seu próprio progresso
DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON user_progress;

CREATE POLICY "Users can manage own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON user_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Certificates: usuários podem ver apenas seus próprios certificados
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON certificates;

CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all certificates" ON certificates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Admin notifications: todos podem ver notificações ativas
DROP POLICY IF EXISTS "Anyone can view active notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON admin_notifications;

CREATE POLICY "Anyone can view active notifications" ON admin_notifications FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage notifications" ON admin_notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON lesson_progress;
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON admin_notifications;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_admin_notifications_updated_at BEFORE UPDATE ON admin_notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Função para atualizar progresso do curso quando uma aula é concluída
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress_percentage DECIMAL(5,2);
BEGIN
    -- Contar total de aulas do curso
    SELECT COUNT(*) INTO total_lessons
    FROM videos
    WHERE course_id = NEW.course_id;
    
    -- Contar aulas concluídas pelo usuário
    SELECT COUNT(*) INTO completed_lessons
    FROM lesson_progress
    WHERE user_id = NEW.user_id 
    AND course_id = NEW.course_id 
    AND is_completed = true;
    
    -- Calcular porcentagem
    progress_percentage := (completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100;
    
    -- Atualizar ou inserir progresso do curso
    INSERT INTO user_progress (user_id, course_id, progress, completed_lessons, total_lessons)
    VALUES (NEW.user_id, NEW.course_id, progress_percentage, completed_lessons, total_lessons)
    ON CONFLICT (user_id, course_id)
    DO UPDATE SET
        progress = progress_percentage,
        completed_lessons = completed_lessons,
        total_lessons = total_lessons,
        completed_at = CASE 
            WHEN progress_percentage >= 100 THEN NOW()
            ELSE NULL
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar progresso do curso
DROP TRIGGER IF EXISTS trigger_update_course_progress ON lesson_progress;
CREATE TRIGGER trigger_update_course_progress
    AFTER INSERT OR UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE PROCEDURE update_course_progress();