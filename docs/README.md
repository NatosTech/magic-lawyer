# 📚 Magic Lawyer - Documentação

Bem-vindo à documentação completa do **Magic Lawyer** - Sistema de Gestão Jurídica.

## 📋 Índice da Documentação

### 🚀 **Configuração e Setup**
- [**README.md**](./README.md) - Documentação principal do projeto
- [**ENV_SETUP.md**](./ENV_SETUP.md) - Configuração de variáveis de ambiente
- [**DEVELOPMENT.md**](./DEVELOPMENT.md) - Guia de desenvolvimento

### 🏗️ **Arquitetura e Estrutura**
- [**BUSINESS_RULES.md**](./BUSINESS_RULES.md) - Regras de negócio do sistema
- [**CORREÇÕES_ROTAS.md**](./CORREÇÕES_ROTAS.md) - Correções de rotas implementadas

### 🔧 **Funcionalidades Técnicas**
- [**AVATAR_EDITOR.md**](./AVATAR_EDITOR.md) - Sistema de edição de avatares
- [**CLOUDINARY_SETUP.md**](./CLOUDINARY_SETUP.md) - Configuração do Cloudinary
- [**CLOUDINARY_FOLDER_STRUCTURE.md**](./CLOUDINARY_FOLDER_STRUCTURE.md) - Estrutura de pastas no Cloudinary
- [**CLOUDINARY_ORGANIZATION.md**](./CLOUDINARY_ORGANIZATION.md) - Organização completa de arquivos
- [**PROJECT_STRUCTURE.md**](./PROJECT_STRUCTURE.md) - Estrutura detalhada do projeto

### 👥 **Administração**
- [**ADMIN_README.md**](./ADMIN_README.md) - Guia para administradores
- [**AI_INSTRUCTIONS.md**](./AI_INSTRUCTIONS.md) - Instruções para IA

## 🎯 **Visão Geral do Sistema**

O **Magic Lawyer** é um sistema completo de gestão jurídica que oferece:

- **Multi-tenant** - Suporte a múltiplos escritórios
- **Gestão de usuários** - Admin, Advogado, Secretaria, Cliente
- **Processos jurídicos** - Controle completo de processos
- **Documentos** - Upload e organização de documentos
- **Financeiro** - Gestão de pagamentos e faturas
- **Agenda** - Sistema de eventos e compromissos
- **Relatórios** - Dashboards e relatórios personalizados

## 🏛️ **Arquitetura do Sistema**

### **Frontend**
- **Next.js 14** com App Router
- **HeroUI** para componentes
- **Tailwind CSS** para estilização
- **TypeScript** para tipagem

### **Backend**
- **Next.js Server Actions** para API
- **Prisma ORM** para banco de dados
- **PostgreSQL** com multi-schema
- **NextAuth.js** para autenticação

### **Infraestrutura**
- **Cloudinary** para armazenamento de arquivos
- **Vercel** para deploy
- **Docker** para desenvolvimento local

## 📁 **Estrutura de Pastas**

```
magic-lawyer/
├── docs/                    # 📚 Documentação completa
├── app/                     # 🚀 Aplicação Next.js
├── components/              # 🧩 Componentes React
├── lib/                     # 🔧 Utilitários e serviços
├── prisma/                  # 🗄️ Schema e migrações
├── public/                  # 📁 Arquivos estáticos
├── styles/                  # 🎨 Estilos globais
└── types/                   # 📝 Definições TypeScript
```

## 🔐 **Segurança**

- **Isolamento por tenant** - Dados completamente separados
- **Autenticação robusta** - NextAuth.js com JWT
- **Autorização granular** - Permissões por role
- **Validação de dados** - Server Actions com validação

## 🚀 **Próximos Passos**

1. **Módulo de Contratos** - Gestão de contratos
2. **Sistema de Tickets** - Suporte ao cliente
3. **Relatórios Avançados** - Dashboards personalizados
4. **API Externa** - Integração com sistemas terceiros
5. **Mobile App** - Aplicativo móvel

## 📞 **Suporte**

Para dúvidas ou suporte, consulte a documentação específica ou entre em contato com a equipe de desenvolvimento.

---

**Magic Lawyer** - Transformando a gestão jurídica com tecnologia! ⚖️✨