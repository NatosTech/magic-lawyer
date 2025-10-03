# 🚀 Guia de Desenvolvimento - Magic Lawyer

Este guia contém instruções específicas para configurar e executar o projeto em diferentes sistemas operacionais.

## 📋 Pré-requisitos

### Todos os Sistemas
- **Node.js** (versão 18 ou superior)
- **npm** (versão 9 ou superior)
- **Docker** e **Docker Compose**
- **Git**

### Verificar Instalações
```bash
node --version
npm --version
docker --version
docker compose version
git --version
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
Crie um arquivo `.env.local` na raiz do projeto:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/magic_lawyer?schema=public"
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:9192"
```

## 🏃‍♂️ Executando o Projeto

### 🎯 Método Universal (Recomendado)
```bash
npm run dev
```
Este comando funciona em **todos os sistemas operacionais** graças ao `cross-env`.

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

### 🗄️ Banco de Dados
- **Host**: localhost:5432
- **Database**: magic_lawyer
- **User**: postgres
- **Password**: postgres

### 📊 Prisma Studio
```bash
npm run prisma:studio
# Abre em: http://localhost:5555
```

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
