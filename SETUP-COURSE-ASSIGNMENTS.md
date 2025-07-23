# 📋 Configuração da Tabela de Atribuição de Cursos

A nova funcionalidade de **Atribuição de Cursos** permite que administradores controlem quais cursos cada usuário pode acessar. Para usar esta funcionalidade, é necessário criar a tabela `course_assignments` no banco de dados Supabase.

## 🚀 Opção 1: Script Automático (Recomendado)

Execute o script de instalação no terminal:

```bash
node setup-course-assignments.js
```

Se o script não funcionar, use a **Opção 2** abaixo.

## 🔧 Opção 2: Criação Manual no Supabase Dashboard

1. **Acesse o Supabase Dashboard**: https://supabase.com/dashboard
2. **Vá para seu projeto** e clique em **"SQL Editor"**
3. **Cole e execute o SQL abaixo**:

```sql
-- Criar tabela de atribuições de cursos
CREATE TABLE IF NOT EXISTS course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicatas
  UNIQUE(user_id, course_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_course_assignments_user_id ON course_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id ON course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_assigned_by ON course_assignments(assigned_by);

-- Habilitar Row Level Security
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem suas próprias atribuições
CREATE POLICY "Users can view their own course assignments" ON course_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- Política para admins gerenciarem todas as atribuições
CREATE POLICY "Admins can manage all course assignments" ON course_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_course_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_course_assignments_updated_at ON course_assignments;
CREATE TRIGGER trigger_update_course_assignments_updated_at
  BEFORE UPDATE ON course_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_assignments_updated_at();
```

## ✅ Como Usar a Funcionalidade

Após criar a tabela:

1. **Faça login como administrador**
2. **Acesse a aba "Atribuição de Cursos"** no menu lateral
3. **Selecione um usuário** na lista à esquerda
4. **Atribua cursos** clicando no botão **"+"** ao lado dos cursos disponíveis
5. **Remova cursos** clicando no botão **"×"** ao lado dos cursos atribuídos

## 🔒 Controle de Acesso

- **Administradores**: Podem ver e gerenciar todas as atribuições
- **Usuários**: Podem ver apenas suas próprias atribuições
- **Segurança**: Row Level Security (RLS) garante que cada usuário só acesse seus dados

## 🎯 Funcionalidades

- ✅ **Interface intuitiva** com busca de usuários
- ✅ **Atribuição/remoção** de cursos em tempo real
- ✅ **Controle granular** por usuário
- ✅ **Histórico de atribuições** com data e responsável
- ✅ **Prevenção de duplicatas** automática
- ✅ **Performance otimizada** com índices

## 🐛 Solução de Problemas

### Erro: "Tabela course_assignments não existe"
- Execute o SQL da **Opção 2** no Supabase Dashboard

### Erro: "Permission denied"
- Verifique se você está logado como administrador
- Confirme que o campo `role` no perfil do usuário está definido como `'admin'`

### Erro: "RLS policy violation"
- Verifique se as políticas de segurança foram criadas corretamente
- Reexecute o SQL da **Opção 2** para recriar as políticas

## 📊 Estrutura da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único da atribuição |
| `user_id` | UUID | ID do usuário que recebeu o curso |
| `course_id` | UUID | ID do curso atribuído |
| `assigned_by` | UUID | ID do admin que fez a atribuição |
| `assigned_at` | TIMESTAMP | Data/hora da atribuição |
| `created_at` | TIMESTAMP | Data/hora de criação do registro |
| `updated_at` | TIMESTAMP | Data/hora da última atualização |

---

🎉 **Pronto!** Agora você pode controlar o acesso aos cursos de forma granular para cada usuário do sistema.