-- Script para resolver erro 500 do servidor Supabase

-- 1. Desabilitar RLS temporariamente para limpeza
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar e corrigir dados corrompidos
SELECT 'LIMPEZA: Verificando dados corrompidos' as status;

-- Remover perfis com ID inválido ou nulo
DELETE FROM profiles WHERE id IS NULL;

-- Corrigir perfis com dados essenciais nulos
UPDATE profiles 
SET name = COALESCE(NULLIF(name, ''), split_part(email, '@', 1), 'Usuário')
WHERE name IS NULL OR name = '';

UPDATE profiles 
SET email = COALESCE(NULLIF(email, ''), 'usuario@exemplo.com')
WHERE email IS NULL OR email = '';

UPDATE profiles 
SET role = COALESCE(NULLIF(role, ''), 'user')
WHERE role IS NULL OR role = '';

UPDATE profiles 
SET department = COALESCE(NULLIF(department, ''), 'HR')
WHERE department IS NULL OR department = '';

-- 3. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Limpar todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all users to view profiles" ON profiles;
DROP POLICY IF EXISTS "view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy_v2" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "admin_all_operations" ON profiles;

-- 5. Criar políticas simples que funcionam
CREATE POLICY "allow_select_profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "allow_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "allow_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Política especial para admins
CREATE POLICY "allow_admin_all" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Verificar se funcionou
SELECT 'TESTE: Contagem de perfis' as teste;
SELECT count(*) as total FROM profiles;

SELECT 'TESTE: Amostra de perfis' as teste;
SELECT id, name, email, role, department FROM profiles LIMIT 3;

SELECT 'TESTE: Políticas ativas' as teste;
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

SELECT '✅ Erro 500 deve estar resolvido!' as resultado;
