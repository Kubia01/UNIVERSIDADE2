# Correção do Filtro de Usuários no Dashboard

## 🔍 Problema Identificado

O filtro de colaboradores no dashboard não estava carregando os nomes dos usuários cadastrados. O problema estava relacionado às políticas de Row Level Security (RLS) do Supabase na tabela `profiles`.

## 🚨 Causa Raiz

A política RLS `"Users can view own profile"` estava impedindo que usuários administradores vissem outros perfis, mesmo tendo a política `"Admins can view all profiles"` configurada. Isso criava um conflito que impedia o carregamento da lista de usuários.

## ✅ Solução Implementada

### 1. **Correção das Políticas RLS**
Arquivo: `fix_dashboard_filter.sql`

- Removida a política restritiva `"Users can view own profile"`
- Implementada política mais permissiva `"Users can view all profiles"` com `USING (true)`
- Mantidas as políticas de UPDATE e INSERT para segurança

### 2. **Melhorias no Frontend**
Arquivo: `app/page.tsx`

- ✅ Adicionados logs de debug para identificar problemas
- ✅ Melhor tratamento de erros na consulta de usuários  
- ✅ Interface mais informativa no dropdown:
  - Mostra "Carregando usuários..." quando vazio
  - Exibe mensagem de erro quando há problemas de permissão
  - Desabilita o dropdown quando não há dados

### 3. **Logs de Debug Adicionados**
- Console.log para rastrear carregamento de usuários
- Logs de erro detalhados para facilitar debugging
- Informações sobre quantidade de usuários carregados

## 📋 Como Aplicar a Correção

### 1. **Executar o Script SQL**
```sql
-- Executar no SQL Editor do Supabase
-- Arquivo: fix_dashboard_filter.sql
```

### 2. **Verificar se Funcionou**
1. Faça login como admin
2. Vá para o Dashboard
3. Verifique se o dropdown "Filtrar por colaborador" mostra os usuários
4. Abra o console do navegador (F12) para ver os logs

## 🔧 Comandos de Verificação

### No Supabase SQL Editor:
```sql
-- Verificar políticas aplicadas
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Testar consulta de usuários
SELECT id, name, email, department, role 
FROM profiles 
ORDER BY name;
```

## 📊 Resultado Esperado

Após aplicar a correção:
- ✅ O dropdown carrega todos os usuários cadastrados
- ✅ Admins podem filtrar o dashboard por colaborador específico
- ✅ Interface mostra feedback adequado durante carregamento
- ✅ Mensagens de erro informativas quando há problemas

## 🔒 Segurança

A solução mantém a segurança adequada:
- Usuários só podem atualizar seus próprios perfis
- Usuários só podem inserir seus próprios perfis  
- Admins mantêm todas as permissões administrativas
- A visualização de perfis é liberada para facilitar funcionalidades do sistema

## 🐛 Troubleshooting

Se o problema persistir:

1. **Verificar logs no console do navegador**
2. **Confirmar se o usuário tem role='admin'**
3. **Executar novamente o script SQL**
4. **Verificar se há outros usuários cadastrados na tabela profiles**

