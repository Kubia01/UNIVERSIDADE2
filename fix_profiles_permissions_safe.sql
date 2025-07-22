-- Script SEGURO para corrigir permissões da tabela profiles
-- Versão que trata políticas existentes sem gerar erros

-- PASSO 1: Desabilitar temporariamente RLS para limpeza
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover TODAS as políticas existentes (incluindo a que está causando conflito)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

-- PASSO 3: Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar política com nome único para visualização
CREATE POLICY "profiles_select_policy_v2" ON profiles
    FOR SELECT USING (true);

-- PASSO 5: Políticas para UPDATE - usuários só podem atualizar próprio perfil
CREATE POLICY "profiles_update_own_policy" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- PASSO 6: Políticas para INSERT - usuários só podem inserir próprio perfil  
CREATE POLICY "profiles_insert_own_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- PASSO 7: Políticas administrativas específicas
CREATE POLICY "profiles_admin_update_policy" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "profiles_admin_insert_policy" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "profiles_admin_delete_policy" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PASSO 8: Verificar se as políticas foram criadas corretamente
SELECT 'VERIFICAÇÃO: Políticas ativas na tabela profiles' as status;
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- PASSO 9: Testar a consulta que estava falhando
SELECT 'TESTE: Consultando todos os perfis' as status;
SELECT count(*) as total_profiles FROM profiles;

-- PASSO 10: Mostrar alguns perfis para confirmar
SELECT 'AMOSTRA: Primeiros 5 perfis' as status;
SELECT id, name, email, department, role FROM profiles ORDER BY name LIMIT 5;

-- PASSO 11: Verificar se RLS está ativo
SELECT 'VERIFICAÇÃO: Status do RLS' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- PASSO 12: Resultado final
SELECT '✅ Script executado com sucesso! O filtro do dashboard deve funcionar agora.' as resultado;
