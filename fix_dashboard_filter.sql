-- Script para corrigir o filtro de usuários no dashboard
-- O problema está nas políticas RLS da tabela profiles que estão muito restritivas

-- 1. Remover política restritiva existente
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 2. Criar política que permite a todos verem todos os perfis
-- Isso é necessário para que admins possam carregar a lista de usuários no filtro
CREATE POLICY "Users can view all profiles" ON profiles 
FOR SELECT 
USING (true);

-- 3. Manter política para usuários atualizarem apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 4. Manter política para usuários inserirem apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 5. Manter políticas administrativas existentes
-- (estas já devem estar funcionando corretamente)

-- 6. Verificar se as políticas foram aplicadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- 7. Testar se a consulta funciona (deve retornar todos os usuários)
SELECT id, name, email, department, role FROM profiles ORDER BY name;
