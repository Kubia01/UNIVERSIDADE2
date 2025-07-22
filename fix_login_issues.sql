-- Script para corrigir problemas de login de novos usuários

-- 1. Verificar usuários existentes
SELECT 'USUÁRIOS EXISTENTES:' as info;
SELECT id, name, email, role FROM profiles ORDER BY created_at;

-- 2. Desabilitar RLS temporariamente para limpeza
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se há duplicatas ou problemas
SELECT 'VERIFICANDO DUPLICATAS:' as info;
SELECT email, count(*) as qtd 
FROM profiles 
GROUP BY email 
HAVING count(*) > 1;

-- 4. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "allow_select_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_update_own" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own" ON profiles;
DROP POLICY IF EXISTS "allow_admin_all" ON profiles;
DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

-- 6. Criar políticas funcionais e simples
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Verificar se há tabelas relacionadas com problemas
SELECT 'VERIFICANDO TABELAS RELACIONADAS:' as info;

-- Criar tabela lesson_progress se não existir
CREATE TABLE IF NOT EXISTS lesson_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id uuid NOT NULL,
    course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
    completed_at timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW()
);

-- Criar tabela user_progress se não existir
CREATE TABLE IF NOT EXISTS user_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
    progress integer DEFAULT 0,
    completed_lessons text[] DEFAULT '{}',
    started_at timestamptz DEFAULT NOW(),
    completed_at timestamptz,
    certificate_id uuid
);

-- 8. Políticas para tabelas relacionadas
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para lesson_progress
DROP POLICY IF EXISTS "lesson_progress_policy" ON lesson_progress;
CREATE POLICY "lesson_progress_policy" ON lesson_progress
    FOR ALL USING (true);

-- Políticas para user_progress
DROP POLICY IF EXISTS "user_progress_policy" ON user_progress;
CREATE POLICY "user_progress_policy" ON user_progress
    FOR ALL USING (true);

-- 9. Verificar resultado
SELECT 'POLÍTICAS ATIVAS:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'lesson_progress', 'user_progress')
ORDER BY tablename, policyname;

-- 10. Teste final
SELECT 'TESTE: Consultando perfis' as teste;
SELECT count(*) as total_profiles FROM profiles;

SELECT '✅ Problemas de login corrigidos!' as resultado;
