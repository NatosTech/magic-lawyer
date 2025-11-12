<div align="center">

# ⚖️ Magic Lawyer

**Sistema SaaS Completo para Gestão de Escritórios de Advocacia**

*Modernize seu escritório com uma plataforma white label, multi-tenant e totalmente integrada*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

</div>

---

## 🎯 O que é o Magic Lawyer?

O **Magic Lawyer** é uma plataforma SaaS completa e moderna desenvolvida especificamente para escritórios de advocacia. Sistema white label que permite que cada escritório tenha sua própria identidade visual, domínio personalizado e branding, enquanto utiliza uma infraestrutura compartilhada e escalável.

### 🌟 Diferenciais Principais

- ✅ **Multi-tenant White Label** - Cada escritório com identidade visual própria
- ✅ **Gestão Completa de Processos** - Controle total sobre processos jurídicos
- ✅ **Sistema de Notificações Inteligente** - Avisos automáticos de prazos e eventos
- ✅ **Integração Financeira** - Gestão de pagamentos e cobranças
- ✅ **Assinatura Digital** - Procurações e documentos com assinatura eletrônica
- ✅ **Área do Cliente** - Portal dedicado para acompanhamento de processos
- ✅ **Agenda Integrada** - Sincronização com Google Calendar
- ✅ **Base de Dados de Juízes** - Informações estratégicas sobre magistrados

---

## ✨ Funcionalidades Principais

### 📋 Gestão de Processos
- Cadastro completo de processos com todas as informações jurídicas
- Controle de prazos processuais com alertas automáticos
- Timeline de movimentações e andamentos
- Gestão de documentos vinculados
- Tarefas e diligências associadas

### 👥 Gestão de Clientes e Advogados
- Cadastro completo de clientes com documentos e histórico
- Vinculação de advogados a clientes específicos
- Perfis de acesso diferenciados (ADMIN, ADVOGADO, SECRETARIA, FINANCEIRO, CLIENTE)
- Controle granular de permissões

### 🔔 Sistema de Notificações
- Notificações em tempo real via WebSocket
- Alertas de prazos próximos (7 dias, 3 dias, 1 dia, 2 horas)
- Notificações de pagamentos e eventos financeiros
- Preferências personalizadas por usuário
- Canais múltiplos: in-app, email e push

### 💰 Módulo Financeiro
- Gestão de contratos e parcelas
- Integração com gateway de pagamento (Asaas)
- Geração de boletos e PIX automáticos
- Controle de recebimentos e inadimplência
- Relatórios financeiros

### 📅 Agenda e Eventos
- Agenda compartilhada por escritório
- Sincronização com Google Calendar
- Lembretes automáticos de eventos
- Confirmação de participação
- Calendário por advogado ou processo

### 📄 Gestão de Documentos
- Upload e organização de documentos
- Armazenamento seguro no Cloudinary
- Versionamento de documentos
- Assinatura digital de procurações
- Compartilhamento controlado

### 👨‍⚖️ Base de Dados de Juízes
- Cadastro de magistrados com informações estratégicas
- Histórico de decisões e preferências
- Sistema de favoritos
- Pesquisa avançada

### 📊 Relatórios e Dashboards
- Dashboard personalizado por perfil
- Relatórios de processos, financeiro e produtividade
- Métricas e KPIs do escritório
- Exportação de dados

---

## 🎨 White Label

Cada escritório pode personalizar completamente sua experiência:

- 🎨 **Identidade Visual** - Logo, cores e temas customizados
- 🌐 **Domínio Próprio** - Subdomínio ou domínio personalizado
- 📧 **E-mails Personalizados** - Templates de email com branding do escritório
- 🖼️ **Interface Customizada** - Layout e elementos visuais únicos

---

## 🏗️ Arquitetura Moderna

O Magic Lawyer foi construído com tecnologias modernas e escaláveis:

- **Frontend**: Next.js 14 com App Router e Server Components
- **Backend**: Server Actions e API Routes
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **UI/UX**: HeroUI + Tailwind CSS
- **Autenticação**: NextAuth.js com multi-tenant
- **Real-time**: Ably para notificações em tempo real
- **Pagamentos**: Integração com Asaas
- **Email**: Nodemailer com credenciais por tenant
- **Armazenamento**: Cloudinary para arquivos
- **Cache**: Redis para performance
- **Filas**: BullMQ para processamento assíncrono

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- Redis (para notificações e cache)
- Contas de serviços externos (Asaas, Cloudinary, etc.)

### Instalação Rápida

```bash
# Clone o repositório
git clone <repository-url>
cd magic-lawyer

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Execute o setup completo
npm run setup:dev
```

O comando `setup:dev` executa automaticamente:
- ✅ Instalação de dependências
- ✅ Configuração do banco de dados
- ✅ Aplicação do schema
- ✅ Seeds com dados de teste
- ✅ Inicialização dos serviços

### Acesso ao Sistema

Após o setup, acesse:
- **Aplicação**: http://localhost:9192
- **Prisma Studio**: `npm run prisma:studio`

---

## 📚 Documentação Completa

Para informações técnicas detalhadas, consulte nossa documentação completa:

### 📖 [Documentação Técnica](docs/README.md)

A documentação está organizada em categorias:

- 🛠️ **[Setup & Configuração](docs/setup/)** - Guias de instalação e configuração
- ✨ **[Features](docs/features/)** - Documentação de funcionalidades
- 🏗️ **[Arquitetura](docs/architecture/)** - Decisões técnicas e estrutura
- 🔧 **[Infraestrutura](docs/infrastructure/)** - Serviços externos e integrações
- 🐛 **[Correções](docs/fixes/)** - Histórico de correções
- ✅ **[Checklists](docs/checklists/)** - Listas de validação

### Navegação Rápida

- **Quero configurar o sistema** → [Setup](docs/setup/)
- **Quero entender uma funcionalidade** → [Features](docs/features/)
- **Quero entender a arquitetura** → [Architecture](docs/architecture/)
- **Quero ver comandos úteis** → Continue lendo este README

---

## 💻 Comandos Úteis

### Desenvolvimento

```bash
npm run dev              # Inicia servidor de desenvolvimento
npm run dev:with-ngrok  # Servidor + ngrok (para webhooks)
npm run dev:worker      # Worker para processar notificações
npm run stop            # Para servidor e ngrok
npm run stop:all        # Para tudo (servidor + ngrok + banco)
```

### Banco de Dados

```bash
npm run db:up           # Inicia banco de dados
npm run db:down         # Para banco de dados
npm run db:reset-dev   # Reset completo do banco
npm run prisma:studio  # Interface visual do banco
npm run prisma:seed     # Popula banco com dados de teste
```

### Testes

```bash
npm run notifications:test     # Testes unitários do domínio de notificações
npm run notifications:webhook  # Simula webhooks do Asaas
npm run notifications:smoke    # Smoke test end-to-end
npm run notifications:crons    # Executa manualmente os crons de prazos e contratos
```

---

## 🔐 Segurança e Multi-tenant

O Magic Lawyer implementa isolamento total entre escritórios (tenants):

- **Isolamento de Dados**: Cada tenant vê apenas seus próprios dados
- **Isolamento de Configurações**: Configurações independentes por escritório
- **Permissões Granulares**: Controle fino de acesso por usuário
- **Auditoria**: Registro de todas as ações importantes
- **Conformidade LGPD**: Políticas de retenção e privacidade

---

## 👥 Perfis de Usuário

O sistema suporta diferentes perfis com permissões específicas:

- **SUPER_ADMIN** - Administrador global do sistema
- **ADMIN** - Administrador do escritório (tenant)
- **ADVOGADO** - Advogado com acesso a processos e clientes
- **SECRETARIA** - Assistente administrativo
- **FINANCEIRO** - Controller financeiro
- **CLIENTE** - Cliente com acesso ao portal
- **CONVIDADO EXTERNO** - Advogado terceiro/convidado

---

## 🧪 Ambiente de Teste

O sistema vem com dados de teste pré-configurados:

### Tenant Sandra
- **Admin**: sandra@adv.br / Sandra@123
- **Cliente**: ana@sandraadv.br / Cliente@123

### Tenant Salba
- **Admin**: luciano@salbaadvocacia.com.br / Luciano@123
- **Advogado**: mariana@salbaadvocacia.com.br / Mariana@123

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Convenções de Commit

- Use português brasileiro
- Formato: `[tipo]: [descrição]`
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Exemplo: `feat: adicionar sistema de notificações push`

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🌟 Roadmap

Funcionalidades planejadas:

- [ ] App mobile (iOS e Android)
- [ ] Integração com sistemas de tribunais
- [ ] IA para análise de documentos
- [ ] Marketplace de templates
- [ ] API pública para integrações
- [ ] Sistema de workflow personalizável
- [ ] Integração oficial com Meta WhatsApp Cloud API para notificações e atendimento
- [ ] Integração direta com ClickSign para coleta de assinaturas eletrônicas

---

## 📞 Suporte

Para dúvidas, sugestões ou problemas:

- 📚 Consulte a [Documentação Completa](docs/README.md)
- 🐛 Abra uma [Issue](https://github.com/seu-usuario/magic-lawyer/issues)
- 💬 Entre em contato através do sistema (área de ajuda)

---

<div align="center">

**Desenvolvido com ❤️ para revolucionar a gestão jurídica**

*Sistema moderno, seguro e escalável para escritórios de advocacia*

</div>
