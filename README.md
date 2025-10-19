# ⚖️ Magic Lawyer - Sistema de Gestão Jurídica

Sistema SaaS multi-tenant completo para escritórios de advocacia, com integração de pagamentos, assinatura digital e gestão de processos.

## 🚀 Início Rápido

### 1. Clone e Configure
```bash
git clone <repository-url>
cd magic-lawyer
```

### 2. Setup Completo (Primeira Vez)
```bash
npm run setup:dev
```

Este comando executa tudo automaticamente:
- ✅ Instala dependências
- ✅ Inicia banco de dados
- ✅ Reseta banco (remove migrações antigas)
- ✅ Aplica schema atual
- ✅ Popula com dados de teste
- ✅ Inicia servidor de desenvolvimento
- ✅ Inicia ngrok para webhooks

### 3. Acesse o Sistema
- **Aplicação**: http://localhost:9192
- **Dashboard ngrok**: http://localhost:4040
- **Prisma Studio**: `npm run prisma:studio`

## 🧪 Teste do Fluxo de Pagamento

1. **Acesse**: http://localhost:9192/precos
2. **Clique**: "Começar Teste"
3. **Preencha**: Formulário completo
4. **Selecione**: PIX ou Boleto
5. **Clique**: "Concluir Checkout"
6. **Clique**: "🧪 Simular Pagamento Confirmado (TESTE)"

## 🔗 Configuração de Webhooks

### 1. Configure no Asaas
- **URL**: `https://SEU-NGROK-URL.ngrok-free.app/api/webhooks/asaas`
- **Eventos**: `PAYMENT_RECEIVED`, `PAYMENT_CREATED`, `SUBSCRIPTION_*`
- **Tipo**: Não sequencial

### 2. Quando ngrok mudar de URL
1. Copie nova URL do ngrok
2. Edite webhook no Asaas
3. Atualize URL
4. Salve

## 📋 Comandos Úteis

### Desenvolvimento
```bash
npm run dev                 # Servidor (para processos existentes automaticamente)
npm run dev:with-ngrok     # Servidor + ngrok (para processos existentes automaticamente)
npm run db:reset-dev       # Reset completo do banco
npm run stop               # Parar servidor e ngrok
npm run stop:all           # Parar tudo (servidor + ngrok + banco)
```

### Banco de Dados
```bash
npm run db:up              # Iniciar banco
npm run db:down            # Parar banco
npm run prisma:studio      # Interface visual
```

## 🏗️ Arquitetura

- **Frontend**: Next.js 14 + App Router
- **Backend**: Server Actions + API Routes
- **Database**: PostgreSQL + Prisma ORM
- **UI**: HeroUI + Tailwind CSS
- **Auth**: NextAuth.js
- **Payments**: Asaas API
- **Email**: Resend
- **Storage**: Cloudinary

## 📁 Estrutura

```
magic-lawyer/
├── app/                    # Next.js App Router
│   ├── (public)/          # Rotas públicas
│   ├── (protected)/       # Rotas protegidas
│   ├── api/               # API Routes
│   └── actions/           # Server Actions
├── components/            # Componentes React
├── prisma/               # Schema e seeds
├── lib/                  # Utilitários
└── docs/                 # Documentação
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:8567/magic_lawyer?schema=magiclawyer"

# NextAuth
NEXTAUTH_SECRET="seu-secret"
NEXTAUTH_URL="http://localhost:9192"

# Asaas (Pagamentos)
ASAAS_API_KEY="\$aact_hmlg_sua-api-key"
ASAAS_ENVIRONMENT="sandbox"
ASAAS_WEBHOOK_SECRET="seu-webhook-secret"

# Email
RESEND_API_KEY="re_sua-api-key"

# Encryption
ENCRYPTION_KEY="sua-chave"
```

## 👥 Credenciais de Teste

### Tenant Sandra
- **Admin**: sandra@adv.br / Sandra@123
- **Cliente**: ana@sandraadv.br / Cliente@123

### Tenant Salba
- **Admin**: luciano@salbaadvocacia.com.br / Luciano@123
- **Advogado**: mariana@salbaadvocacia.com.br / Mariana@123

## 📚 Documentação

- [Guia de Desenvolvimento](docs/DEVELOPMENT.md)
- [Configuração de Ambiente](docs/ENV_SETUP.md)
- [Estrutura do Projeto](docs/PROJECT_STRUCTURE.md)
- [Roadmap](docs/ROADMAP_COMPLETO.md)

## 🚀 Deploy

### Build para Produção
```bash
npm run build
npm run start
```

### Variáveis de Produção
- Configure todas as variáveis do `.env`
- Use API keys de produção
- Configure webhook para domínio real

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ para revolucionar a gestão jurídica**
