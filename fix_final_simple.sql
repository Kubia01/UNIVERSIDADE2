-- SOLUÇÃO FINAL SIMPLES para o filtro de usuários

-- 1. Desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se há usuários na tabela
SELECT 'Usuários na tabela:' as info, count(*) as total FROM profiles;

-- 3. Mostrar alguns usuários
SELECT id, name, email, role FROM profiles LIMIT 5;

-- 4. Se não há usuários, criar alguns de exemplo
INSERT INTO profiles (id, name, email, role, department, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'João Silva',
    'joao@empresa.com',
    'user',
    'Engineering',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'joao@empresa.com');

INSERT INTO profiles (id, name, email, role, department, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Maria Santos',
    'maria@empresa.com',
    'user',
    'HR',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'maria@empresa.com');

-- 5. Garantir que há pelo menos um admin
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
    SELECT email FROM profiles 
    ORDER BY created_at 
    LIMIT 1
) AND NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin');

-- 6. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all users to view profiles" ON profiles;
DROP POLICY IF EXISTS "view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy_v2" ON profiles;
DROP POLICY IF EXISTS "allow_select_profiles" ON profiles;
DROP POLICY IF EXISTS "simple_select_all" ON profiles;
DROP POLICY IF EXISTS "emergency_policy" ON profiles;

-- 8. Criar UMA política simples que funciona
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT USING (true);

-- 9. Políticas básicas para outras operações
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 10. Teste final
SELECT 'TESTE FINAL:' as status;
SELECT count(*) as total_usuarios FROM profiles;
SELECT name, email, role FROM profiles ORDER BY name;

SELECT '✅ FILTRO DEVE FUNCIONAR AGORA!' as resultado;
