-- SOLUÇÃO SIMPLES E DIRETA para o filtro do dashboard

-- Passo 1: Limpar todas as políticas existentes
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all users to view profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy_v2" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

-- Passo 2: Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Passo 3: Criar UMA política simples para SELECT (visualização)
CREATE POLICY "view_all_profiles" ON profiles
    FOR SELECT USING (true);

-- Passo 4: Política para UPDATE (próprio perfil)
CREATE POLICY "update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Passo 5: Política para INSERT (próprio perfil)
CREATE POLICY "insert_own_profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Passo 6: Políticas admin para todas as operações
CREATE POLICY "admin_all_operations" ON profiles
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Teste simples
SELECT 'Políticas criadas!' as status;
SELECT count(*) as total_users FROM profiles;

-- Teste da consulta que o frontend faz
SELECT name, email, department FROM profiles ORDER BY name LIMIT 3;

SELECT 'Filtro do dashboard deve funcionar agora!' as resultado;
