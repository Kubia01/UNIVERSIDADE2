-- Migração para adicionar coluna time_watched na tabela lesson_progress
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna time_watched (tempo assistido em segundos)
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS time_watched INTEGER DEFAULT 0;

-- 2. Adicionar comentário para documentar a coluna
COMMENT ON COLUMN lesson_progress.time_watched IS 'Tempo assistido em segundos da aula';

-- 3. Atualizar RLS policies se necessário (manter as existentes)
-- As policies existentes devem continuar funcionando

-- 4. Verificar se a estrutura está correta
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'lesson_progress' 
ORDER BY ordinal_position;