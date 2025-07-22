-- TESTE BÁSICO para verificar se o filtro do dashboard vai funcionar

-- 1. Verificar se temos usuários
SELECT 'TESTE 1: Contagem de usuários' as teste;
SELECT count(*) as total FROM profiles;

-- 2. Verificar se conseguimos listar usuários (consulta do frontend)
SELECT 'TESTE 2: Listagem de usuários' as teste;
SELECT id, name, email, department, role FROM profiles ORDER BY name;

-- 3. Verificar políticas ativas
SELECT 'TESTE 3: Políticas ativas' as teste;
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- 4. Verificar se RLS está ativo
SELECT 'TESTE 4: Status RLS' as teste;
SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Se todos os testes passaram, o dashboard deve funcionar!
SELECT 'RESULTADO: Se você vê usuários acima, o filtro funcionará!' as resultado;
