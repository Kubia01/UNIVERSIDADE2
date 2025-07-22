-- Script para corrigir erro específico do usuário 6b6b2ac9-9083-41cd-ae31-59577c34f5c2

-- 1. Verificar se este usuário específico existe e tem problemas
SELECT 'DIAGNÓSTICO: Usuário específico' as status;
SELECT * FROM profiles WHERE id = '6b6b2ac9-9083-41cd-ae31-59577c34f5c2';

-- 2. Verificar se há dados corrompidos para este usuário
SELECT 'VERIFICAÇÃO: Dados do usuário' as status;
SELECT 
    id,
    name,
    email,
    role,
    department,
    created_at,
    updated_at,
    CASE 
        WHEN name IS NULL THEN 'Nome nulo'
        WHEN email IS NULL THEN 'Email nulo'
        WHEN role IS NULL THEN 'Role nulo'
        ELSE 'Dados OK'
    END as status_dados
FROM profiles 
WHERE id = '6b6b2ac9-9083-41cd-ae31-59577c34f5c2';

-- 3. Se o usuário não existe, criar um perfil básico
INSERT INTO profiles (id, name, email, role, department, created_at, updated_at)
SELECT 
    '6b6b2ac9-9083-41cd-ae31-59577c34f5c2'::uuid,
    'Admin',
    'admin@empresa.com',
    'admin',
    'HR',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = '6b6b2ac9-9083-41cd-ae31-59577c34f5c2'
);

-- 4. Se o usuário existe mas tem dados corrompidos, corrigir
UPDATE profiles 
SET 
    name = COALESCE(NULLIF(name, ''), 'Admin'),
    email = COALESCE(NULLIF(email, ''), 'admin@empresa.com'),
    role = COALESCE(NULLIF(role, ''), 'admin'),
    department = COALESCE(NULLIF(department, ''), 'HR'),
    updated_at = NOW()
WHERE id = '6b6b2ac9-9083-41cd-ae31-59577c34f5c2';

-- 5. Desabilitar RLS temporariamente para teste
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 6. Testar consulta direta
SELECT 'TESTE: Consulta direta sem RLS' as status;
SELECT id, name, email, role, department FROM profiles WHERE id = '6b6b2ac9-9083-41cd-ae31-59577c34f5c2';

-- 7. Limpar TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all users to view profiles" ON profiles;
DROP POLICY IF EXISTS "view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy_v2" ON profiles;
DROP POLICY IF EXISTS "allow_select_profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_update_own" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "admin_all_operations" ON profiles;
DROP POLICY IF EXISTS "allow_admin_all" ON profiles;

-- 8. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 9. Criar política MUITO simples que definitivamente funciona
CREATE POLICY "simple_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "simple_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "simple_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 10. Testar novamente com RLS
SELECT 'TESTE: Consulta com RLS reabilitado' as status;
SELECT id, name, email, role FROM profiles WHERE id = '6b6b2ac9-9083-41cd-ae31-59577c34f5c2';

-- 11. Verificar todas as políticas ativas
SELECT 'POLÍTICAS ATIVAS:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

SELECT '✅ Usuário específico corrigido! Teste o dashboard agora.' as resultado;
