# 🎓 Sistema de Treinamento Corporativo

Sistema de gestão de treinamentos e cursos corporativos construído com Next.js, Supabase e Tailwind CSS.

## ✨ Funcionalidades

- 👥 **Gestão de Usuários**: Administradores e colaboradores
- 📚 **Gestão de Cursos**: Criação, edição e atribuição de cursos
- 🎯 **Atribuição Inteligente**: Controle granular de acesso aos cursos
- 📊 **Dashboard Analítico**: Acompanhamento de progresso e estatísticas
- 🏆 **Certificados**: Geração automática ao completar cursos
- 📱 **Interface Responsiva**: Funciona em desktop e mobile

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone [URL_DO_REPOSITORIO]
cd [NOME_DO_PROJETO]
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. **IMPORTANTE**: Execute o SQL no Supabase
Execute o conteúdo do arquivo `create-course-assignments-table.sql` no Supabase Dashboard:
1. Acesse seu projeto no Supabase Dashboard
2. Vá em "SQL Editor"
3. Copie e cole todo o conteúdo do arquivo `create-course-assignments-table.sql`
4. Execute o script

Este passo é **obrigatório** para que o sistema de atribuições funcione corretamente.

### 5. Execute o projeto
```bash
npm run dev
```

Acesse http://localhost:3000

## 🔧 Estrutura do Projeto

```
├── app/                    # App Router do Next.js
│   ├── page.tsx           # Dashboard principal
│   ├── login/             # Página de login
│   └── register/          # Página de cadastro
├── components/            # Componentes React
│   ├── admin/            # Componentes administrativos
│   ├── courses/          # Componentes de cursos
│   ├── layout/           # Layout e navegação
│   └── ui/               # Componentes de interface
├── lib/                  # Utilitários e configurações
│   ├── supabase.ts       # Cliente Supabase
│   ├── auth.ts           # Autenticação
│   ├── cache.ts          # Sistema de cache
│   └── supabase-emergency.ts # Sistema otimizado
└── styles/               # Estilos Tailwind
```

## 🎯 Como Usar

### Como Administrador
1. **Cadastre-se** com uma conta admin
2. **Crie cursos** na seção "Gerenciar Cursos"
3. **Atribua cursos** aos colaboradores em "Atribuição de Cursos"
4. **Monitore progresso** no dashboard

### Como Colaborador
1. **Faça login** com sua conta
2. **Acesse cursos** atribuídos a você
3. **Complete as aulas** e acompanhe seu progresso
4. **Receba certificados** ao finalizar

## ⚡ Otimizações Implementadas

### Performance
- ✅ Timeouts reduzidos (8s vs 15s anteriormente)
- ✅ Cache específico por usuário
- ✅ Carregamento otimizado
- ✅ Retry inteligente (2 tentativas vs 3)

### Segurança
- ✅ Controle granular de acesso a cursos
- ✅ Usuários só veem cursos atribuídos
- ✅ Row Level Security (RLS) implementado
- ✅ Políticas de segurança configuradas

### Interface
- ✅ Interface limpa e profissional
- ✅ Componentes desnecessários removidos
- ✅ UX otimizada

## 🗄️ Banco de Dados

O sistema utiliza as seguintes tabelas principais:
- `profiles` - Perfis de usuários
- `courses` - Cursos disponíveis
- `videos` - Aulas dos cursos
- `course_assignments` - Atribuições de cursos (criada pelo SQL)
- `user_progress` - Progresso dos usuários
- `certificates` - Certificados emitidos

## 🚀 Deploy

O projeto está configurado para deploy no Vercel:
1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Execute o SQL no Supabase
4. Deploy automático

## 📝 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deploy**: Vercel
- **Cache**: Sistema próprio otimizado

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se executou o SQL do arquivo `create-course-assignments-table.sql`
2. Confirme as variáveis de ambiente
3. Verifique se o Supabase está configurado corretamente

---

**Status**: ✅ Sistema otimizado e funcional
**Última atualização**: Dezembro 2024