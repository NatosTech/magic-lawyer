# 🏗️ Estrutura do Projeto Magic Lawyer

## 📁 **Visão Geral da Estrutura**

```
magic-lawyer/
├── 📚 docs/                          # Documentação completa
│   ├── README.md                     # Índice da documentação
│   ├── PROJECT_STRUCTURE.md          # Este arquivo
│   ├── BUSINESS_RULES.md             # Regras de negócio
│   ├── DEVELOPMENT.md                # Guia de desenvolvimento
│   ├── ENV_SETUP.md                  # Configuração de ambiente
│   ├── ADMIN_README.md               # Guia para administradores
│   ├── AI_INSTRUCTIONS.md            # Instruções para IA
│   ├── CORREÇÕES_ROTAS.md            # Correções de rotas
│   ├── AVATAR_EDITOR.md              # Sistema de avatares
│   ├── CLOUDINARY_SETUP.md           # Setup do Cloudinary
│   └── CLOUDINARY_FOLDER_STRUCTURE.md # Estrutura de pastas
│
├── 🚀 app/                           # Aplicação Next.js (App Router)
│   ├── (protected)/                  # Rotas protegidas por autenticação
│   │   ├── agenda/                   # Módulo de agenda
│   │   ├── configuracoes/            # Configurações do sistema
│   │   ├── dashboard/                # Dashboard principal
│   │   ├── documentos/               # Gestão de documentos
│   │   ├── equipe/                   # Gestão de equipe
│   │   ├── financeiro/               # Módulo financeiro
│   │   ├── help/                     # Central de ajuda
│   │   ├── juizes/                   # Base de dados de juízes
│   │   ├── processos/                # Gestão de processos
│   │   ├── relatorios/               # Relatórios e dashboards
│   │   ├── advogados/                # Lista de advogados do tenant
│   │   └── usuario/                  # Perfil do usuário
│   │       └── perfil/editar/        # Edição de perfil
│   │
│   ├── (public)/                     # Rotas públicas
│   │   ├── about/                    # Sobre o sistema
│   │   ├── blog/                     # Blog
│   │   ├── docs/                     # Documentação pública
│   │   ├── precos/                   # Página de preços
│   │   └── pricing/                  # Página de preços (EN)
│   │
│   ├── admin/                        # Área do Super Admin
│   │   ├── auditoria/                # Auditoria do sistema
│   │   ├── configuracoes/            # Configurações globais
│   │   ├── dashboard/                # Dashboard do admin
│   │   ├── financeiro/               # Financeiro global
│   │   ├── juizes/                   # Gestão de juízes
│   │   ├── pacotes/                  # Pacotes de juízes
│   │   ├── relatorios/               # Relatórios globais
│   │   ├── suporte/                  # Suporte técnico
│   │   └── tenants/                  # Gestão de tenants
│   │
│   ├── api/                          # API Routes
│   │   └── auth/                     # Autenticação (NextAuth)
│   │       └── [...nextauth]/        # Configuração NextAuth
│   │
│   ├── actions/                      # Server Actions
│   │   ├── admin.ts                  # Ações administrativas
│   │   ├── advogados.ts              # Gestão de advogados
│   │   ├── configuracoesPreco.ts     # Configurações de preço
│   │   ├── enderecos.ts              # Gestão de endereços
│   │   ├── eventos.ts                # Gestão de eventos
│   │   ├── financeiro.ts             # Ações financeiras
│   │   ├── juizes.ts                 # Gestão de juízes
│   │   ├── notifications.ts          # Notificações
│   │   ├── pacotesJuiz.ts            # Pacotes de juízes
│   │   ├── planos.ts                 # Planos de assinatura
│   │   ├── profile.ts                # Perfil do usuário
│   │   ├── search.ts                 # Busca global
│   │   ├── tickets.ts                # Sistema de tickets
│   │   └── user-self-edit.ts         # Auto-edição do usuário
│   │
│   ├── hooks/                        # Custom Hooks
│   │   ├── use-admin-navigation.ts   # Navegação do admin
│   │   ├── use-avatar.ts             # Hook do avatar
│   │   ├── use-eventos.ts            # Hook de eventos
│   │   ├── use-juizes.ts             # Hook de juízes
│   │   ├── use-notifications.ts      # Hook de notificações
│   │   ├── use-profile-navigation.ts # Navegação do perfil
│   │   └── use-user-permissions.ts   # Permissões do usuário
│   │
│   ├── lib/                          # Utilitários e serviços
│   │   ├── agenda.ts                 # Serviços de agenda
│   │   ├── auth.ts                   # Utilitários de auth
│   │   ├── clicksign.ts              # Integração ClickSign
│   │   ├── date-utils.ts             # Utilitários de data
│   │   ├── documento-assinatura.ts   # Assinatura de documentos
│   │   ├── documents.ts              # Gestão de documentos
│   │   ├── email.ts                  # Serviços de email
│   │   ├── financeiro.ts             # Serviços financeiros
│   │   ├── google-calendar.ts        # Integração Google Calendar
│   │   ├── prisma.ts                 # Cliente Prisma
│   │   ├── processos.ts              # Serviços de processos
│   │   └── tenant.ts                 # Utilitários de tenant
│   │
│   ├── generated/                    # Arquivos gerados
│   │   └── prisma/                   # Tipos gerados pelo Prisma
│   │
│   ├── login/                        # Página de login
│   ├── providers.tsx                 # Providers do React
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Página inicial
│   └── error.tsx                     # Página de erro
│
├── 🧩 components/                    # Componentes React
│   ├── admin-app-shell.tsx           # Shell do admin
│   ├── app-shell.tsx                 # Shell da aplicação
│   ├── app-sidebar.tsx               # Sidebar principal
│   ├── avatar-upload.tsx             # Upload de avatar
│   ├── breadcrumb-nav.tsx            # Navegação breadcrumb
│   ├── centralized-search-bar.tsx    # Barra de busca centralizada
│   ├── counter.tsx                   # Componente contador
│   ├── dynamic-favicon.tsx           # Favicon dinâmico
│   ├── endereco-manager.tsx          # Gerenciador de endereços
│   ├── evento-form.tsx               # Formulário de eventos
│   ├── floating-automation-badge.tsx # Badge de automação
│   ├── icons.tsx                     # Ícones customizados
│   ├── image-editor-modal.tsx        # Modal de edição de imagem
│   ├── navbar.tsx                    # Barra de navegação
│   ├── notifications/                # Componentes de notificação
│   │   └── notification-center.tsx   # Centro de notificações
│   ├── permission-guard.tsx          # Guard de permissões
│   ├── primitives.ts                 # Componentes primitivos
│   ├── profile-dashboard.tsx         # Dashboard do perfil
│   ├── public-navbar.tsx             # Navbar pública
│   ├── role-specific-info.tsx        # Info específica por role
│   ├── searchbar/                    # Componentes de busca
│   │   ├── index.ts                  # Exportações
│   │   ├── search-bar.tsx            # Barra de busca
│   │   └── use-search-results.ts     # Hook de resultados
│   ├── signinout.tsx                 # Componente de login/logout
│   ├── theme-switch.tsx              # Alternador de tema
│   ├── ui/                           # Componentes UI
│   │   ├── modal-examples.tsx        # Exemplos de modais
│   │   └── modal.tsx                 # Modal customizado
│   └── user-permissions-info.tsx     # Info de permissões
│
├── ⚙️ config/                        # Configurações
│   ├── fonts.ts                      # Configuração de fontes
│   └── site.ts                       # Configuração do site
│
├── 🗄️ prisma/                        # Banco de dados
│   ├── migrations/                   # Migrações do banco
│   │   ├── 20251005014204_initial/   # Migração inicial
│   │   ├── 20251005030013_add_pricing_system/ # Sistema de preços
│   │   ├── 20251005031524_add_pacotes_juiz_system/ # Pacotes de juízes
│   │   └── migration_lock.toml       # Lock de migração
│   ├── seeds/                        # Seeds do banco
│   │   ├── areasProcesso.js          # Áreas de processo
│   │   ├── categoriasTarefa.js       # Categorias de tarefa
│   │   ├── configuracoesPreco.js     # Configurações de preço
│   │   ├── dadosFinanceiros.js       # Dados financeiros
│   │   ├── eventos.js                # Eventos
│   │   ├── juizes.js                 # Juízes
│   │   ├── pacotesJuiz.js            # Pacotes de juízes
│   │   ├── planos.js                 # Planos
│   │   ├── superAdmin.js             # Super admin
│   │   ├── tiposContrato.js          # Tipos de contrato
│   │   └── tenants/                  # Seeds por tenant
│   │       ├── salbaAdvocacia.js     # Tenant Salba
│   │       └── tenantSandra.js       # Tenant Sandra
│   ├── schema.prisma                 # Schema do banco
│   └── seed.js                       # Script de seed
│
├── 📁 public/                        # Arquivos estáticos
│   ├── favicon.ico                   # Favicon
│   ├── next.svg                      # Logo Next.js
│   └── vercel.svg                    # Logo Vercel
│
├── 🔧 scripts/                       # Scripts utilitários
│   └── enterprise-optimizations.sql  # Otimizações enterprise
│
├── 🎨 styles/                        # Estilos
│   └── globals.css                   # Estilos globais
│
├── 📝 types/                         # Definições TypeScript
│   ├── index.ts                      # Tipos principais
│   └── next-auth.d.ts                # Tipos NextAuth
│
├── 📦 lib/                           # Utilitários globais
│   ├── upload-service.ts             # Serviço de upload
│   └── user-permissions.ts           # Permissões de usuário
│
├── 🔐 auth.ts                        # Configuração NextAuth
├── 📋 middleware.ts                  # Middleware Next.js
├── ⚙️ next.config.js                 # Configuração Next.js
├── 📦 package.json                   # Dependências
├── 🎨 tailwind.config.js             # Configuração Tailwind
├── 📝 tsconfig.json                  # Configuração TypeScript
├── 🐳 docker-compose.db.yml          # Docker para banco
└── 📋 prisma.config.ts               # Configuração Prisma
```

## 🎯 **Principais Características da Estrutura**

### **1. Organização por Funcionalidade**
- Cada módulo tem sua própria pasta
- Componentes relacionados agrupados
- Server Actions organizadas por domínio

### **2. Separação de Responsabilidades**
- **`app/`** - Lógica da aplicação e rotas
- **`components/`** - Componentes reutilizáveis
- **`lib/`** - Utilitários e serviços
- **`prisma/`** - Banco de dados e migrações

### **3. Documentação Centralizada**
- **`docs/`** - Toda documentação em um local
- Arquivos específicos para cada funcionalidade
- Guias de setup e desenvolvimento

### **4. Multi-tenant Architecture**
- Rotas protegidas por tenant
- Isolamento de dados por `tenantId`
- Permissões granulares por role

### **5. Escalabilidade**
- Estrutura preparada para crescimento
- Componentes modulares
- Server Actions para performance

## 🚀 **Próximas Expansões**

A estrutura está preparada para:
- **Módulo de Contratos** - `app/(protected)/contratos/`
- **Sistema de Tickets** - `app/(protected)/tickets/`
- **API Externa** - `app/api/external/`
- **Mobile App** - `mobile/` (futuro)

---

Esta estrutura garante **organização**, **escalabilidade** e **manutenibilidade** do projeto! 🎯
