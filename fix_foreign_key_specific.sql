-- Script específico para corrigir erro: lesson_progress_user_id_fkey

-- 1. Verificar usuários existentes
SELECT 'USUÁRIOS EXISTENTES NA TABELA PROFILES:' as info;
SELECT id, name, email, role FROM profiles ORDER BY created_at;

-- 2. Verificar se a tabela lesson_progress existe
SELECT 'ESTRUTURA ATUAL DA LESSON_PROGRESS:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_progress' 
ORDER BY ordinal_position;

-- 3. Verificar constraints atuais
SELECT 'CONSTRAINTS ATUAIS:' as info;
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'lesson_progress';

-- 4. Remover a constraint problemática
ALTER TABLE lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_user_id_fkey;

-- 5. Verificar se há dados órfãos
SELECT 'VERIFICANDO DADOS ÓRFÃOS:' as info;
SELECT lp.user_id, count(*) as registros_orfaos
FROM lesson_progress lp
LEFT JOIN profiles p ON p.id = lp.user_id
WHERE p.id IS NULL
GROUP BY lp.user_id;

-- 6. Limpar dados órfãos se houver
DELETE FROM lesson_progress 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- 7. Recriar a constraint com ON DELETE CASCADE
ALTER TABLE lesson_progress 
ADD CONSTRAINT lesson_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 8. Verificar se a constraint foi criada corretamente
SELECT 'CONSTRAINT RECRIADA:' as info;
SELECT 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'lesson_progress';

-- 9. Testar inserção com um usuário existente
SELECT 'TESTE DE INSERÇÃO:' as info;

-- Pegar o primeiro usuário para teste
DO $$
DECLARE
    test_user_id uuid;
    test_lesson_id uuid := gen_random_uuid();
    test_course_id uuid := gen_random_uuid();
BEGIN
    -- Pegar um usuário existente
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Tentar inserir um registro de teste
        INSERT INTO lesson_progress (user_id, lesson_id, course_id, completed_at)
        VALUES (test_user_id, test_lesson_id, test_course_id, NOW());
        
        RAISE NOTICE 'Teste de inserção bem-sucedido para user_id: %', test_user_id;
        
        -- Remover o registro de teste
        DELETE FROM lesson_progress WHERE lesson_id = test_lesson_id;
        
        RAISE NOTICE 'Registro de teste removido com sucesso';
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 10. Verificar políticas RLS
SELECT 'POLÍTICAS RLS ATIVAS:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'lesson_progress';

SELECT '✅ Foreign key constraint corrigida!' as resultado;
SELECT 'Agora os usuários podem marcar aulas como concluídas sem erro.' as instrucao;
