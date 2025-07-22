-- Script completo para corrigir permissões da tabela profiles
-- Este script resolve definitivamente o problema do filtro de usuários

-- PASSO 1: Desabilitar temporariamente RLS para limpeza
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover todas as políticas existentes para começar limpo
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

-- PASSO 3: Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar política simples e funcional para visualização
-- Permite que todos vejam todos os perfis (necessário para o dashboard funcionar)
CREATE POLICY "Allow all users to view profiles" ON profiles
    FOR SELECT USING (true);

-- PASSO 5: Políticas para UPDATE - usuários só podem atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- PASSO 6: Políticas para INSERT - usuários só podem inserir próprio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- PASSO 7: Políticas administrativas específicas
CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert any profile" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete any profile" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PASSO 8: Verificar se as políticas foram criadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- PASSO 9: Testar a consulta que estava falhandonome
SELECT 'TESTE: Consultando todos os perfis' as status;
SELECT count(*) as total_profiles FROM profiles;
SELECT id, name, email, department, role FROM profiles ORDER BY name LIMIT 5;

-- PASSO 10: Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

SELECT 'Script executado com sucesso! O filtro do dashboard deve funcionar agora.' as resultado;
