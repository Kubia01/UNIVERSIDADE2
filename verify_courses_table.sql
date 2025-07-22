-- Script para verificar e corrigir tabela courses

-- 1. Verificar se a tabela courses existe
SELECT 'VERIFICANDO TABELA COURSES:' as info;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'courses'
) as courses_table_exists;

-- 2. Se existe, mostrar estrutura
SELECT 'ESTRUTURA DA TABELA COURSES:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- 3. Verificar dados na tabela courses
SELECT 'CURSOS EXISTENTES:' as info;
SELECT id, title, is_published, created_at FROM courses ORDER BY created_at;

-- 4. Criar tabela courses se não existir
CREATE TABLE IF NOT EXISTS courses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    type text DEFAULT 'training',
    duration integer DEFAULT 0,
    instructor text,
    thumbnail text,
    is_published boolean DEFAULT false,
    is_mandatory boolean DEFAULT false,
    department text DEFAULT 'HR',
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- 5. Habilitar RLS para courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas para courses
DROP POLICY IF EXISTS "courses_select_policy" ON courses;
CREATE POLICY "courses_select_policy" ON courses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "courses_admin_policy" ON courses;
CREATE POLICY "courses_admin_policy" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Verificar se há cursos, se não criar um de exemplo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM courses LIMIT 1) THEN
        INSERT INTO courses (title, description, is_published, instructor, department)
        VALUES (
            'Curso de Exemplo',
            'Este é um curso de exemplo para testar o sistema.',
            true,
            'Instrutor Exemplo',
            'HR'
        );
        RAISE NOTICE 'Curso de exemplo criado';
    ELSE
        RAISE NOTICE 'Já existem cursos na tabela';
    END IF;
END $$;

-- 8. Verificar resultado final
SELECT 'RESULTADO FINAL:' as info;
SELECT count(*) as total_courses FROM courses;
SELECT id, title, is_published FROM courses LIMIT 3;

SELECT '✅ Tabela courses verificada e configurada!' as resultado;
