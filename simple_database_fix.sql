-- CORREÇÃO SIMPLES DAS POLÍTICAS QUE ESTÃO CAUSANDO ERRO 500

-- 1. Desabilitar RLS temporariamente para debug
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se seu usuário admin existe
SELECT 'Verificando usuário admin...' as status;
SELECT * FROM profiles WHERE email = 'dsinterlub@gmail.com';

-- 3. Se não existir, criar (isso deve funcionar agora sem RLS)
INSERT INTO profiles (id, name, email, role, department)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'dsinterlub@gmail.com' LIMIT 1),
  'Admin Master',
  'dsinterlub@gmail.com', 
  'admin',
  'TI'
) ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    name = 'Admin Master',
    department = 'TI';

-- 4. Verificar se foi criado
SELECT 'Usuário criado/atualizado:' as status;
SELECT * FROM profiles WHERE email = 'dsinterlub@gmail.com';

-- 5. Reabilitar RLS com políticas mais simples
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- 6. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

-- 7. Criar políticas super simples
-- Permitir tudo para usuários autenticados (temporário para debug)
CREATE POLICY "Authenticated users can do everything on profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Authenticated users can manage courses" ON courses FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view videos" ON videos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage videos" ON videos FOR ALL USING (auth.role() = 'authenticated');

-- 8. Teste final
SELECT 'Correção concluída!' as status;
SELECT 'Testando acesso...' as status;
SELECT count(*) as total_profiles FROM profiles;
SELECT count(*) as total_courses FROM courses;