# Plataforma de Treinamento Corporativo

Uma plataforma moderna de treinamento corporativo construída com Next.js e Supabase.

## Funcionalidades

- 🎓 **Gestão de Cursos**: Criação e gerenciamento de cursos de treinamento
- 📚 **Módulos e Aulas**: Organização de conteúdo em módulos com vídeos
- 👥 **Gestão de Usuários**: Sistema de usuários com diferentes permissões
- 📊 **Dashboard**: Acompanhamento de progresso e estatísticas
- 🏆 **Certificados**: Geração automática de certificados
- ⏱️ **Tempo de Estudo**: Rastreamento preciso do tempo assistido

## Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deploy**: Vercel

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd plataforma-treinamento
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Configure o Supabase:
- Crie um projeto no Supabase
- Configure as variáveis no `.env.local`
- Execute as migrações do banco

5. Execute o projeto:
```bash
npm run dev
```

## Estrutura do Projeto

```
├── app/                 # Páginas da aplicação (App Router)
├── components/          # Componentes React
│   ├── admin/          # Componentes administrativos
│   ├── certificates/   # Gestão de certificados
│   ├── courses/        # Componentes de cursos
│   └── layout/         # Layout e navegação
├── lib/                # Utilitários e configurações
└── public/             # Arquivos estáticos
```

## Deploy

O projeto está configurado para deploy automático na Vercel. Conecte seu repositório e configure as variáveis de ambiente.

## Licença

Este projeto é proprietário e destinado ao uso interno da empresa.