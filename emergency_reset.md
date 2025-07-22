# 🚨 RESET DE EMERGÊNCIA

Se o sistema não estiver funcionando, siga estes passos:

## 1. 🔄 Reiniciar o servidor Next.js

```bash
# Parar o servidor (Ctrl+C)
# Depois reiniciar:
npm run dev
```

## 2. 🗄️ Verificar se o banco está funcionando

Execute no SQL Editor do Supabase:

```sql
-- Testar conexão básica
SELECT 'Banco funcionando' as status;

-- Verificar se seu usuário admin existe
SELECT * FROM profiles WHERE role = 'admin';

-- Se não existir, criar novamente:
INSERT INTO profiles (id, name, email, role, department)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'dsinterlub@gmail.com' LIMIT 1),
  'Admin Master',
  'dsinterlub@gmail.com', 
  'admin',
  'TI'
) ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

## 3. 🔐 Reset de login

Se não conseguir logar:

1. Vá direto para: `http://localhost:3000/login`
2. Use suas credenciais normais
3. Se der erro, limpe o cache do navegador:
   - `Ctrl+Shift+Del` → Limpar tudo
   - Ou modo anônimo/incógnito

## 4. 🐛 Se ainda tiver erro "Application error"

1. Abra o console do navegador (`F12`)
2. Veja os erros na aba Console
3. Me envie os erros que aparecem

## 5. 🔧 Reset completo (último recurso)

```bash
# Parar o servidor
# Limpar cache do Next.js
rm -rf .next
npm run dev
```

## 6. 📱 Testar funcionalidades básicas

Após conseguir logar:
- [ ] Dashboard carrega
- [ ] Consegue ver usuários (se admin)
- [ ] Consegue ver cursos
- [ ] Não há erros no console