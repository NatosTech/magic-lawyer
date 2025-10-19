# 🚀 Guia de Desenvolvimento - Magic Lawyer

Este guia contém instruções completas para configurar e executar o projeto, incluindo integração com Asaas e webhooks.

## 📋 Pré-requisitos

### Todos os Sistemas
- **Node.js** (versão 18 ou superior)
- **npm** (versão 9 ou superior)
- **Docker** e **Docker Compose**
- **Git**
- **ngrok** (para webhooks em desenvolvimento)

### Verificar Instalações
```bash
node --version
npm --version
docker --version
docker compose version
git --version
ngrok version
```

### Instalar ngrok (se necessário)
```bash
# macOS (Homebrew)
brew install ngrok

# Windows (Chocolatey)
choco install ngrok

# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

## 🛠️ Configuração Inicial

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd magic-lawyer
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Banco de Dados
```bash
# Iniciar banco de dados
npm run db:up

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Popular banco com dados de teste
npm run prisma:seed
```

### 4. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (veja `.env.example`):
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:8567/magic_lawyer?schema=magiclawyer"

# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:9192"

# Asaas Integration (Sistema de Pagamentos)
ASAAS_API_KEY="\$aact_hmlg_sua-api-key-aqui"
ASAAS_ENVIRONMENT="sandbox"
ASAAS_WEBHOOK_SECRET="seu-webhook-secret-aqui"

# Email (Resend)
RESEND_API_KEY="re_sua-api-key-aqui"

# Encryption
ENCRYPTION_KEY="sua-chave-de-criptografia"
```

**⚠️ IMPORTANTE**: A API key do Asaas deve começar com `\$` (barra invertida + cifrão) para funcionar corretamente com o Next.js.

## 🏃‍♂️ Executando o Projeto

### 🚀 Setup Completo (Primeira Vez)
```bash
# Comando único para setup completo - MATA TUDO E RECRIA
npm run setup:dev
```

Este comando executa:
1. **MATA TODOS** os processos (next, ngrok, node)
2. Instala dependências
3. Inicia banco de dados
4. Reseta banco (remove migrações antigas)
5. Aplica schema atual
6. Popula com dados de teste
7. Inicia servidor de desenvolvimento
8. Inicia **UM ÚNICO** ngrok para webhooks

**⚠️ IMPORTANTE**: Este comando mata TODOS os processos antes de iniciar!

### 🎯 Desenvolvimento Diário
```bash
# Método universal (recomendado) - Para processos existentes automaticamente
npm run dev

# Com ngrok para webhooks - Para processos existentes automaticamente
npm run dev:with-ngrok

# Parar todos os processos
npm run stop

# Parar tudo (servidor + ngrok + banco)
npm run stop:all
```

### 🍎 macOS / Linux
```bash
npm run dev:mac
# ou
npm run dev
```

### 🪟 Windows
```bash
npm run dev:windows
# ou
npm run dev
```

### 🔄 Reset Completo (Durante Desenvolvimento)
```bash
# Reset completo do banco (remove migrações antigas)
npm run db:reset-dev
```

Este comando:
1. Para servidor e ngrok automaticamente
2. Remove pasta de migrações
3. Reseta banco de dados
4. Aplica schema atual
5. Popula com dados de teste
6. Reinicia servidor + ngrok

### 🛑 Comandos de Parada
```bash
# Parar apenas servidor e ngrok
npm run stop

# Parar tudo (servidor + ngrok + banco)
npm run stop:all

# Parar apenas banco
npm run db:down
```

## 📊 Comandos Úteis

### 🗄️ Banco de Dados
```bash
# Iniciar banco
npm run db:up

# Parar banco
npm run db:down

# Resetar banco (cuidado!)
npm run db:reset

# Abrir Prisma Studio
npm run prisma:studio

# Executar seed
npm run prisma:seed
```

### 🔧 Desenvolvimento
```bash
# Executar linting
npm run lint

# Build para produção
npm run build

# Executar em produção
npm run start

# Setup completo (primeira vez)
npm run setup

# Limpar projeto
npm run clean
```

## 🌐 Acessos

### 🏠 Aplicação
- **URL**: http://localhost:9192
- **Login**: http://localhost:9192/login
- **Preços**: http://localhost:9192/precos

### 🗄️ Banco de Dados
- **Host**: localhost:8567
- **Database**: magic_lawyer
- **User**: postgres
- **Password**: postgres

### 📊 Prisma Studio
```bash
npm run prisma:studio
# Abre em: http://localhost:5555
```

### 🔗 ngrok (Webhooks)
```bash
# Dashboard do ngrok
http://localhost:4040

# URL pública (muda a cada reinicialização)
https://xxxxx.ngrok-free.app
```

## 🔗 Configuração de Webhooks (Asaas)

### 1. Iniciar ngrok
```bash
# Terminal separado
ngrok http 9192

# Ou usar o comando integrado
npm run dev:with-ngrok
```

### 2. Configurar no Asaas
1. **Acesse**: Painel do Asaas → Integrações → Webhooks
2. **URL do Webhook**: `https://SEU-NGROK-URL.ngrok-free.app/api/webhooks/asaas`
3. **Eventos**:
   - ✅ `PAYMENT_CREATED`
   - ✅ `PAYMENT_RECEIVED` ⭐ (ESSENCIAL!)
   - ✅ `PAYMENT_OVERDUE`
   - ✅ `SUBSCRIPTION_CREATED`
   - ✅ `SUBSCRIPTION_UPDATED`
   - ✅ `SUBSCRIPTION_DELETED`
4. **Tipo de envio**: Não sequencial
5. **Salvar**

### 3. Quando o ngrok mudar de URL
**Sempre que reiniciar o ngrok, a URL muda!**

**Para atualizar no Asaas:**
1. **Copie a nova URL** do ngrok
2. **Vá para**: Asaas → Integrações → Webhooks
3. **Edite o webhook** existente
4. **Atualize a URL**: `https://NOVA-URL.ngrok-free.app/api/webhooks/asaas`
5. **Salve**

**💡 Dica**: Use o dashboard do ngrok (`http://localhost:4040`) para copiar a URL facilmente.

## 🧪 Testando o Fluxo de Pagamento

### 1. Teste Completo
1. **Acesse**: http://localhost:9192/precos
2. **Clique**: "Começar Teste" (qualquer plano)
3. **Preencha**: Formulário completo
4. **Selecione**: PIX ou Boleto
5. **Clique**: "Concluir Checkout"
6. **Clique**: "🧪 Simular Pagamento Confirmado (TESTE)"

### 2. O que deve acontecer
- ✅ Cliente criado no Asaas
- ✅ Pagamento gerado (PIX/Boleto)
- ✅ Webhook disparado
- ✅ Conta criada no sistema
- ✅ Emails enviados (confirmação + credenciais)
- ✅ Redirecionamento para página de sucesso

### 3. Verificações
- **Console do servidor**: Logs do webhook
- **Dashboard ngrok**: `http://localhost:4040` (requisições)
- **Email**: Credenciais recebidas
- **Banco de dados**: Tenant criado

### 4. Teste com Pagamento Real
1. **Faça checkout** normalmente
2. **Pague realmente** o PIX/Boleto
3. **Aguarde** o Asaas detectar (pode demorar alguns minutos)
4. **Verifique** se a conta foi criada automaticamente

## 👥 Credenciais de Teste

### 🏢 Tenant Sandra Advocacia
- **Slug**: `sandra`
- **Admin**: sandra@adv.br / Sandra@123
- **Cliente**: ana@sandraadv.br / Cliente@123

### 🏢 Tenant Salba Advocacia
- **Slug**: `salba`
- **Admin**: luciano@salbaadvocacia.com.br / Luciano@123
- **Advogado**: mariana@salbaadvocacia.com.br / Mariana@123
- **Advogado**: pedro@salbaadvocacia.com.br / Pedro@123
- **Cliente**: joao.silva@email.com / Cliente1@123

## 🐛 Solução de Problemas

### ❌ Erro: "Port 9192 already in use"
```bash
# macOS/Linux
lsof -ti:9192 | xargs kill -9

# Windows
netstat -ano | findstr :9192
taskkill /PID <PID> /F
```

### ❌ Erro: "Database connection failed"
```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar banco
npm run db:down
npm run db:up
```

### ❌ Erro: "Prisma client not generated"
```bash
npm run prisma:generate
```

### ❌ Erro no Windows: "PORT=9192 not recognized"
Use o comando universal:
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
magic-lawyer/
├── app/                    # Next.js App Router
│   ├── (public)/          # Rotas públicas
│   ├── (protected)/       # Rotas protegidas
│   └── api/               # API Routes
├── components/            # Componentes React
├── prisma/               # Schema e seeds
│   ├── seeds/
│   │   └── tenants/      # Seeds organizados por tenant
│   └── schema.prisma
├── styles/               # Estilos globais
└── types/                # Definições TypeScript
```

## 🔄 Workflow de Desenvolvimento

1. **Fazer pull das mudanças**
   ```bash
   git pull origin main
   ```

2. **Instalar novas dependências** (se houver)
   ```bash
   npm install
   ```

3. **Executar migrações** (se houver mudanças no schema)
   ```bash
   npm run prisma:migrate
   ```

4. **Iniciar desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Testar mudanças**
   - Acesse http://localhost:9192
   - Teste login com diferentes usuários
   - Verifique funcionalidades

## 🚀 Deploy

### Build para Produção
```bash
npm run build
npm run start
```

### Variáveis de Ambiente (Produção)
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://seu-dominio.com"
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique se todos os pré-requisitos estão instalados
2. Execute `npm run clean` e refaça o setup
3. Verifique os logs do Docker: `docker compose -f docker-compose.db.yml logs`
4. Consulte a documentação do Next.js e Prisma

---

**Happy Coding! 🎉**
