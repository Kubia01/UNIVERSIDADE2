# ✅ SOLUÇÃO: Erro Foreign Key Constraint lesson_progress

## 🚨 ERRO RELATADO
```
Erro ao salvar progresso: insert or update on table "lesson_progress" 
violates foreign key constraint "lesson_progress_user_id_fkey"
```

## 🔍 CAUSA DO PROBLEMA

### 1. **Constraint Restritiva**
A foreign key constraint `lesson_progress_user_id_fkey` está impedindo a inserção porque:
- O usuário pode não existir na tabela `profiles`
- A constraint não tem `ON DELETE CASCADE`
- Pode haver dados órfãos na tabela

### 2. **Estrutura da Tabela Incompatível**
O código estava tentando inserir campos que não existem na tabela:
- `is_completed` ❌
- `progress_percentage` ❌ 
- `time_watched` ❌

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Frontend Corrigido** (`LessonPlayer.tsx`)
```typescript
// ANTES (campos inexistentes):
const progressData = {
  user_id: user.id,
  lesson_id: lesson.id,
  course_id: course.id,
  is_completed: completed,           // ❌ Campo não existe
  progress_percentage: 100.00,       // ❌ Campo não existe
  time_watched: Math.floor(currentTime), // ❌ Campo não existe
}

// DEPOIS (estrutura correta):
const progressData = {
  user_id: user.id,
  lesson_id: lesson.id,
  course_id: course.id,
  completed_at: completed ? new Date().toISOString() : null // ✅ Campo correto
}
```

### 2. **Logs Melhorados**
- ✅ Log dos dados enviados
- ✅ Log do código do erro
- ✅ Log dos detalhes do erro

### 3. **Scripts SQL de Correção**

#### Opção A: `fix_lesson_progress_constraint.sql` (Completo)
- Recria tabelas com estrutura correta
- Remove dados órfãos
- Adiciona constraints com `ON DELETE CASCADE`

#### Opção B: `fix_foreign_key_specific.sql` (Específico)
- Corrige apenas a constraint problemática
- Mantém dados existentes
- Teste de inserção incluído

## 🚀 COMO APLICAR A CORREÇÃO

### PASSO 1: Executar Script SQL
**Escolha uma opção:**

**Opção A - Correção Completa:**
```sql
-- No SQL Editor do Supabase:
-- Copie e cole: fix_lesson_progress_constraint.sql
```

**Opção B - Correção Específica:**
```sql
-- No SQL Editor do Supabase:
-- Copie e cole: fix_foreign_key_specific.sql
```

### PASSO 2: Deploy do Código Corrigido
```bash
git add .
git commit -m "Fix: Corrigido erro de foreign key constraint em lesson_progress"
git push
```

### PASSO 3: Testar Funcionalidade
1. Faça login no sistema
2. Acesse um curso
3. Assista uma aula
4. Marque como concluída
5. Verificar se não há erro

## 📊 RESULTADO ESPERADO

### ✅ Logs de Sucesso:
```
Salvando progresso da aula: {user_id: "...", lesson_id: "...", course_id: "...", completed: true}
Progresso salvo com sucesso: [{id: "...", user_id: "...", ...}]
Aula marcada como concluída, verificando conclusão do curso...
```

### ✅ Funcionalidade:
- Usuário marca aula como concluída
- Progresso é salvo sem erro
- Interface atualiza corretamente
- Curso pode ser marcado como completo

## 🔧 ESTRUTURA CORRETA DAS TABELAS

### lesson_progress:
```sql
CREATE TABLE lesson_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    course_id uuid,
    completed_at timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);
```

### user_progress:
```sql
CREATE TABLE user_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    course_id uuid,
    progress integer DEFAULT 0,
    completed_lessons text[] DEFAULT '{}',
    started_at timestamptz DEFAULT NOW(),
    completed_at timestamptz,
    certificate_id uuid,
    UNIQUE(user_id, course_id)
);
```

## 🎯 VERIFICAÇÃO DE SUCESSO

O problema está resolvido quando:
- ✅ Usuário consegue marcar aulas como concluídas
- ✅ Sem erro de foreign key constraint
- ✅ Progresso é salvo corretamente
- ✅ Logs mostram sucesso

**Execute um dos scripts SQL e faça o deploy. O erro será resolvido!** 🚀

