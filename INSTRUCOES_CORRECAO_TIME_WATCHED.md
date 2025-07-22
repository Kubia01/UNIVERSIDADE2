# 🔧 Correção do Erro: time_watched column not found

## Problema
Erro ao marcar curso como concluído: `Could not find the 'time_watched' column of 'lesson_progress' in the schema cache`

## Causa
A coluna `time_watched` não existe na tabela `lesson_progress` no banco de dados Supabase.

## ✅ Solução Implementada (Temporária)
O código foi atualizado para funcionar com ou sem a coluna `time_watched`:

1. **Fallback automático**: Se a coluna não existir, usa a duração total dos vídeos
2. **Salvamento seguro**: Tenta salvar com `time_watched`, se falhar, salva sem ela
3. **Carregamento seguro**: Verifica se a coluna existe antes de usá-la

## 🚀 Solução Definitiva (Execute no Supabase)

### Passo 1: Acesse o Supabase
1. Vá para [https://supabase.com](https://supabase.com)
2. Acesse seu projeto
3. Vá em **SQL Editor**

### Passo 2: Execute a Migração
Copie e execute o código do arquivo `migration_add_time_watched.sql`:

```sql
-- Adicionar coluna time_watched na tabela lesson_progress
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS time_watched INTEGER DEFAULT 0;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN lesson_progress.time_watched IS 'Tempo assistido em segundos da aula';
```

### Passo 3: Verificar
Execute para verificar se a coluna foi criada:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'lesson_progress' 
ORDER BY ordinal_position;
```

## 🎯 Resultado
Após executar a migração:
- ✅ Erro será resolvido
- ✅ Tempo de estudo será rastreado precisamente
- ✅ Dashboard mostrará tempo real assistido
- ✅ Funcionalidade completa de rastreamento

## 📊 Status Atual
- **Funcionalidade**: ✅ Funcionando (com fallback)
- **Precisão**: ⚠️ Usando duração total (até migração)
- **Erro**: ✅ Corrigido (não quebra mais)
- **Migração**: ⏳ Pendente (execute no Supabase)

Execute a migração no Supabase para ter a funcionalidade completa!