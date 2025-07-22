-- Script para verificar e corrigir a estrutura da tabela profiles

-- 1. Verificar se a tabela profiles existe e sua estrutura
SELECT 'VERIFICAÇÃO: Estrutura da tabela profiles' as check_type;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Verificar se há dados na tabela
SELECT 'VERIFICAÇÃO: Dados existentes' as check_type;
SELECT count(*) as total_profiles FROM profiles;

-- 3. Verificar se há algum perfil com dados nulos críticos
SELECT 'VERIFICAÇÃO: Perfis com problemas' as check_type;
SELECT 
    id,
    name,
    email,
    role,
    CASE 
        WHEN id IS NULL THEN 'ID nulo'
        WHEN name IS NULL OR name = '' THEN 'Nome vazio'
        WHEN email IS NULL OR email = '' THEN 'Email vazio'
        WHEN role IS NULL OR role = '' THEN 'Role vazio'
        ELSE 'OK'
    END as problema
FROM profiles
WHERE id IS NULL OR name IS NULL OR name = '' OR email IS NULL OR email = '' OR role IS NULL OR role = '';

-- 4. Corrigir perfis com problemas (se houver)
UPDATE profiles 
SET name = COALESCE(NULLIF(name, ''), split_part(email, '@', 1), 'Usuário')
WHERE name IS NULL OR name = '';

UPDATE profiles 
SET role = 'user'
WHERE role IS NULL OR role = '';

UPDATE profiles 
SET department = 'HR'
WHERE department IS NULL OR department = '';

-- 5. Verificar políticas RLS
SELECT 'VERIFICAÇÃO: Políticas RLS' as check_type;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- 6. Testar consulta básica
SELECT 'TESTE: Consulta básica' as check_type;
SELECT id, name, email, role, department FROM profiles LIMIT 3;

-- 7. Verificar se RLS está causando problemas
SELECT 'VERIFICAÇÃO: Status RLS' as check_type;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

SELECT 'Verificação e correção concluída!' as resultado;
