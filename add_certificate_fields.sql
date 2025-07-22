-- Script para adicionar campos de nome do curso e usuário na tabela certificates

-- 1. Verificar estrutura atual da tabela certificates
SELECT 'ESTRUTURA ATUAL DA TABELA CERTIFICATES:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'certificates' 
ORDER BY ordinal_position;

-- 2. Adicionar colunas para nome do curso e usuário
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_title text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS user_name text;

-- 3. Verificar estrutura após adicionar colunas
SELECT 'ESTRUTURA APÓS ADICIONAR COLUNAS:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'certificates' 
ORDER BY ordinal_position;

-- 4. Atualizar certificados existentes com dados dos cursos e usuários
UPDATE certificates 
SET course_title = c.title
FROM courses c 
WHERE certificates.course_id = c.id 
AND certificates.course_title IS NULL;

UPDATE certificates 
SET user_name = p.name
FROM profiles p 
WHERE certificates.user_id = p.id 
AND certificates.user_name IS NULL;

-- 5. Verificar certificados existentes
SELECT 'CERTIFICADOS EXISTENTES:' as info;
SELECT 
    id,
    user_name,
    course_title,
    issued_at,
    certificate_url
FROM certificates 
ORDER BY issued_at DESC;

-- 6. Criar função para atualizar automaticamente os nomes (trigger)
CREATE OR REPLACE FUNCTION update_certificate_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Buscar nome do curso
    IF NEW.course_title IS NULL THEN
        SELECT title INTO NEW.course_title
        FROM courses 
        WHERE id = NEW.course_id;
    END IF;
    
    -- Buscar nome do usuário
    IF NEW.user_name IS NULL THEN
        SELECT name INTO NEW.user_name
        FROM profiles 
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_update_certificate_names ON certificates;
CREATE TRIGGER trigger_update_certificate_names
    BEFORE INSERT OR UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_certificate_names();

-- 8. Teste do trigger
SELECT 'TESTE: Trigger criado com sucesso!' as info;

SELECT '✅ Campos adicionados à tabela certificates!' as resultado;
SELECT 'Agora os certificados incluirão o nome do curso e do usuário.' as instrucao;
