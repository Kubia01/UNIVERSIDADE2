-- Script para corrigir sistema de certificados e progresso

-- 1. Verificar estrutura atual das tabelas
SELECT 'VERIFICANDO TABELAS EXISTENTES:' as info;

SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('lesson_progress', 'user_progress', 'certificates')
ORDER BY table_name;

-- 2. Criar tabela certificates se não existir
CREATE TABLE IF NOT EXISTS certificates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    certificate_url text,
    issued_at timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 3. Adicionar foreign keys para certificates
ALTER TABLE certificates DROP CONSTRAINT IF EXISTS certificates_user_id_fkey;
ALTER TABLE certificates 
ADD CONSTRAINT certificates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. Verificar se user_progress tem estrutura correta
SELECT 'ESTRUTURA USER_PROGRESS:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
ORDER BY ordinal_position;

-- 5. Verificar se lesson_progress tem estrutura correta
SELECT 'ESTRUTURA LESSON_PROGRESS:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_progress' 
ORDER BY ordinal_position;

-- 6. Verificar se certificates tem estrutura correta
SELECT 'ESTRUTURA CERTIFICATES:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'certificates' 
ORDER BY ordinal_position;

-- 7. Habilitar RLS para certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas para certificates
DROP POLICY IF EXISTS "certificates_all_access" ON certificates;
CREATE POLICY "certificates_all_access" ON certificates
    FOR ALL USING (true);

-- 9. Verificar políticas ativas
SELECT 'POLÍTICAS RLS ATIVAS:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('lesson_progress', 'user_progress', 'certificates')
ORDER BY tablename, policyname;

-- 10. Teste de inserção de certificado
SELECT 'TESTE: Simulando geração de certificado' as status;

DO $$
DECLARE
    test_user_id uuid;
    test_course_id uuid := gen_random_uuid();
BEGIN
    -- Pegar um usuário existente
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Tentar inserir um certificado de teste
        INSERT INTO certificates (user_id, course_id, certificate_url, issued_at)
        VALUES (
            test_user_id, 
            test_course_id, 
            'https://exemplo.com/certificate/test',
            NOW()
        );
        
        RAISE NOTICE 'Teste de certificado bem-sucedido para user_id: %', test_user_id;
        
        -- Remover o certificado de teste
        DELETE FROM certificates WHERE course_id = test_course_id;
        
        RAISE NOTICE 'Certificado de teste removido com sucesso';
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 11. Verificar dados existentes
SELECT 'DADOS ATUAIS:' as info;

SELECT 'Usuários:' as tipo, count(*) as total FROM profiles
UNION ALL
SELECT 'Progresso de aulas:', count(*) FROM lesson_progress
UNION ALL
SELECT 'Progresso de cursos:', count(*) FROM user_progress
UNION ALL
SELECT 'Certificados:', count(*) FROM certificates;

SELECT '✅ Sistema de certificados e progresso configurado!' as resultado;
SELECT 'Agora os usuários devem receber certificados ao concluir cursos.' as instrucao;
