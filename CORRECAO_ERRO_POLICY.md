# 🚨 CORREÇÃO DO ERRO: Policy already exists

## ❌ Erro Encontrado
```
ERROR: 42710: policy "Allow all users to view profiles" for table "profiles" already exists
```

## 🔍 Causa
A política já existe no banco, mas pode estar configurada incorretamente, causando o problema no filtro.

## ✅ SOLUÇÃO PASSO A PASSO

### PASSO 1: Diagnóstico
Execute primeiro para ver o estado atual:
```sql
-- Copie e cole no SQL Editor do Supabase:
-- Arquivo: diagnostico_policies.sql
```

### PASSO 2: Correção Segura
Execute o script corrigido:
```sql
-- Copie e cole no SQL Editor do Supabase:
-- Arquivo: fix_profiles_permissions_safe.sql
```

## 🎯 DIFERENÇAS DO SCRIPT CORRIGIDO

### ✅ Melhorias:
1. **Remove a política conflitante**: `DROP POLICY IF EXISTS "Allow all users to view profiles"`
2. **Nomes únicos**: Usa `profiles_select_policy_v2` em vez de nomes genéricos
3. **Limpeza completa**: Remove TODAS as políticas antes de recriar
4. **Verificações**: Inclui testes para confirmar que funcionou

### 🔧 Políticas Criadas:
- `profiles_select_policy_v2` - Permite ver todos os perfis
- `profiles_update_own_policy` - Usuários editam próprio perfil
- `profiles_insert_own_policy` - Usuários criam próprio perfil
- `profiles_admin_*_policy` - Permissões administrativas

## 📊 VERIFICAÇÃO DE SUCESSO

### ✅ No SQL Editor - Deve mostrar:
```
✅ Script executado com sucesso! O filtro do dashboard deve funcionar agora.
```

### ✅ No Console do Navegador (F12):
```
Carregando lista de funcionários...
Usuários carregados com sucesso: 3
```

### ✅ Na Interface:
- Dropdown carrega usuários: "João Silva - HR"
- Sem mensagens de erro vermelhas

## 🛠️ SE AINDA NÃO FUNCIONAR

### Opção A: Reset Completo
```sql
-- Emergency reset (use com cuidado)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Faça seus testes
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; (reative depois)
```

### Opção B: Função RPC
```sql
-- Execute também: create_rpc_function.sql
-- Isso cria um método alternativo de acesso
```

### Opção C: Verificar Usuário Admin
```sql
-- Confirme que você é admin
SELECT email, role FROM profiles WHERE email = 'seu-email@empresa.com';

-- Se não for admin, torne-se um:
UPDATE profiles SET role = 'admin' WHERE email = 'seu-email@empresa.com';
```

## 🎉 CONFIRMAÇÃO FINAL

Execute este teste no SQL Editor:
```sql
-- Este comando deve funcionar sem erro
SELECT id, name, email, role FROM profiles ORDER BY name;
```

Se retornar usuários, o filtro do dashboard funcionará! 🚀

## 📞 PRÓXIMOS PASSOS

1. Execute `diagnostico_policies.sql` 
2. Execute `fix_profiles_permissions_safe.sql`
3. Teste o dashboard
4. Se necessário, execute `create_rpc_function.sql`
5. Recarregue a página do dashboard

