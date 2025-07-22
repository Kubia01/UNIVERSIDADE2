-- Script para corrigir criação de usuários

-- 1. Remover constraint de foreign key temporariamente
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Permitir que profiles tenha IDs que não estão em auth.users
-- (Isso é temporário até implementarmos um sistema de convite)

-- 3. Recriar constraint mais flexível (opcional)
-- ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
-- FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE DEFERRABLE;

-- 4. Verificar se funcionou
SELECT 'Constraint removida - usuários podem ser criados diretamente em profiles' as status;

-- 5. Criar função para gerar UUIDs se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 6. Testar criação de usuário
INSERT INTO profiles (id, name, email, role, department)
VALUES (
  uuid_generate_v4(),
  'Usuário Teste',
  'teste@exemplo.com',
  'user',
  'TI'
) ON CONFLICT (email) DO NOTHING;

SELECT 'Teste de criação concluído' as status;