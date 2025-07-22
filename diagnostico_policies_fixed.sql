-- Script de diagnóstico CORRIGIDO para verificar políticas RLS atuais

-- 1. Verificar se a tabela profiles existe
SELECT 'VERIFICAÇÃO: Tabela profiles' as check_type;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'profiles'
) as table_exists;

-- 2. Verificar se RLS está ativo
SELECT 'VERIFICAÇÃO: Status RLS' as check_type;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Listar TODAS as políticas existentes na tabela profiles
SELECT 'VERIFICAÇÃO: Políticas existentes' as check_type;
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- 4. Contar quantos usuários existem
SELECT 'VERIFICAÇÃO: Total de usuários' as check_type;
SELECT count(*) as total_users FROM profiles;

-- 5. Mostrar alguns usuários (sem dados sensíveis)
SELECT 'VERIFICAÇÃO: Amostra de usuários' as check_type;
SELECT 
    id, 
    name, 
    email, 
    role,
    department,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- 6. Verificar se existe algum admin
SELECT 'VERIFICAÇÃO: Usuários admin' as check_type;
SELECT count(*) as total_admins 
FROM profiles 
WHERE role = 'admin';

-- 7. Testar consulta que o frontend está tentando fazer (CORRIGIDO)
SELECT 'TESTE: Simulando consulta do frontend' as check_type;
SELECT count(*) as total_profiles_found FROM profiles;

-- 8. Testar se conseguimos ordenar por name
SELECT 'TESTE: Ordenação por nome' as check_type;
SELECT name, email, role FROM profiles ORDER BY name LIMIT 3;

SELECT 'Diagnóstico concluído com sucesso!' as status;
