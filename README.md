# 🏛️ Magic Lawyer - Sistema para Escritório de Advocacia (SaaS White Label)

Este projeto tem como objetivo o desenvolvimento de um sistema moderno, escalável e white label para escritórios de advocacia. A proposta é criar uma plataforma centralizada que organize e facilite a gestão de clientes, processos, diligências, documentos e informações internas, oferecendo acesso controlado para diferentes perfis de usuários: advogados, equipe administrativa, financeiro, secretariado e clientes.

## 🚀 Início Rápido

Para começar a desenvolver, consulte o **[Guia de Desenvolvimento](DEVELOPMENT.md)** que contém instruções específicas para Windows, macOS e Linux.

### Comando Universal
```bash
npm run dev
```
Este comando funciona em todos os sistemas operacionais.

## 📋 Credenciais de Teste

### 🏢 Tenant Sandra Advocacia
- **URL**: http://localhost:9192/login
- **Slug**: `sandra`
- **Admin**: sandra@adv.br / Sandra@123

### 🏢 Tenant Salba Advocacia  
- **URL**: http://localhost:9192/login
- **Slug**: `salba`
- **Admin**: luciano@salbaadvocacia.com.br / Luciano@123

Stack e Tecnologia
	•	Next.js: base para o front e back com server actions e SSR/ISR.
	•	Prisma + PostgreSQL: camada de dados robusta e escalável.
	•	HeroUI + Tailwind: interface moderna e responsiva.
	•	Templates pagos premium (quando fizer sentido) para acelerar desenvolvimento sem abrir mão da personalização.
	•	White label nativo: suporte a logotipos, cores, textos e domínios customizados por escritório.
  •	SWR para dados client-side: preferimos hooks de busca declarativos e cacheados em vez de `useEffect` imperativo para sincronizar estados com APIs.

Estrutura Multi-Tenant

O sistema será multi-tenant desde o início.
	•	Banco único com coluna tenant_id em todas as tabelas, garantindo isolamento lógico e baixo custo.
	•	Organização por domínio/subdomínio: ex. sandra.adv.br ou app.sandra.adv.br.
	•	Temas personalizados: logotipo, cores, e-mails e branding por escritório.
	•	Caso seja necessário isolamento avançado, será possível migrar um cliente para um schema ou banco separado sem comprometer a arquitetura.

Funcionalidades-Chave
	•	Gestão de Usuários e Perfis de Acesso: controle diferenciado para advogado, secretário, assistente, financeiro e cliente.
	•	Gestão de Advogados e Clientes: cada advogado terá seus clientes, processos, diligências e autos vinculados.
	•	Área do Cliente: acompanhamento online de processos e atualizações.
	•	Cadastro de Juízes e Informações Relevantes: central de dados úteis sobre magistrados para consulta estratégica.
	•	Portal White Label: cada escritório terá identidade visual própria, mas rodando na mesma infraestrutura.

Monetização e Assinaturas

O sistema será comercializado como SaaS (Software as a Service):
	1.	Assinaturas mensais/anuais com planos baseados em usuários, processos ou funcionalidades.
	2.	Planos premium: relatórios avançados, integrações externas, estatísticas de prazos e resultados.
	3.	Customizações pagas sob demanda para escritórios maiores.

Controle de assinaturas será centralizado:
	•	Integração com plataformas de pagamento (Stripe, Pagarme ou similar).
	•	Webhooks para atualizar status de assinatura, emitir faturas e bloquear acesso em caso de inadimplência.
	•	Painel administrativo para o dono do escritório gerenciar assinatura, pagamentos e upgrades.

Estratégia de Crescimento
	•	White label desde o início para escalar rapidamente para novos clientes.
	•	Onboarding automatizado: cada novo escritório poderá criar sua conta, configurar branding e iniciar sua assinatura em poucos minutos.
	•	Métricas de negócio: número de escritórios, receita recorrente, churn, utilização por módulo.
	•	Evitar bloqueios de crescimento:
	•	sempre trabalhar com tenant_id,
	•	nunca criar lógicas fixas por cliente,
	•	manter integração flexível com provedores de e-mail, storage e pagamentos.

## Diretrizes para dados client-side

- Preferimos **SWR** (`swr` package) para toda leitura mutável em componentes client-side. Ele oferece cache automático por tenant, revalidação inteligente e evita duplicar requisições.
- Evitamos ao máximo o uso de `useEffect` para sincronizar dados externos; a abordagem declarativa do SWR reduz efeitos colaterais e torna o fluxo multi-tenant mais previsível.
- Quando houver necessidade de estados derivados, priorize hooks compostos sobre efeitos imperativos ou listeners globais.

## Prisma & Banco de Dados

- Toda a configuração do Prisma agora vive em `prisma.config.ts`. Esse arquivo aponta para `./prisma/schema.prisma` e registra o comando de seed, eliminando a necessidade do bloco `prisma` no `package.json`.
- A entidade `Tenant` ganhou uma relação `TenantEndereco`, permitindo cadastrar múltiplas sedes/filiais com tipagem (`TipoEndereco`) em vez de um JSON genérico.
- As seeds criam automaticamente a banca "Sandra Advocacia" com três endereços (São Paulo, Rio e Recife), três advogados (Sandra, Ricardo e Fernanda) e três clientes (Marcos, Ana e Inova Tech) distribuídos em processos e procurações diferentes.
- Para sincronizar o schema com o banco local utilize:

```bash
npx prisma migrate dev
```

- Após aplicar migrações, popular os dados de exemplo (incluindo o tenant "Sandra Advocacia") com:

```bash
npx prisma db seed
```

- Como o `prisma.config.ts` controla o carregamento, garanta que as variáveis de ambiente (`DATABASE_URL`, etc.) estejam ativas no shell antes de executar os comandos (ex.: `export $(grep -v "^#" .env | xargs)` em bash/zsh).

## Containerização com Docker

Este projeto suporta build e execução via Docker e Docker Compose.

### Pré requisitos
- Docker 24 ou superior
- Docker Compose v2

### Dockerfile
Um Dockerfile multi stage já foi preparado na raiz do projeto. Ele faz:
- instalação de dependências
- prisma generate
- build de produção do Next.js
- execução com next start na porta 3000

### Build da imagem
```bash
docker build -t magic-lawyer:latest .
```

### Executar somente a imagem
```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@localhost:5432/magic_lawyer?schema=public" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="defina_um_valor_seguro" \
  magic-lawyer:latest
```

### Usando docker compose
Crie um arquivo docker-compose.yml na raiz com o conteúdo abaixo.
```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: magiclawyer_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: magic_lawyer
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: magiclawyer_app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://<SEU_USUARIO>:<SUA_SENHA>@db:5432/magic_lawyer?schema=public
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: defina_um_valor_seguro
    # Se desejar usar .env local, habilite a linha abaixo
    # env_file:
    #   - .env

volumes:
  pgdata:
```

### Inicialização com Compose
Suba os serviços.
```bash
docker compose up -d --build
```

Aguarde o banco ficar saudável e então rode migrações do Prisma.
```bash
docker compose exec app npx prisma migrate deploy
```

Se houver script de seed, rode.
```bash
docker compose exec app npm run seed
```

Acesse a aplicação em http://localhost:3000

### Parar e remover
```bash
docker compose down
```

Para limpar os dados do Postgres.
```bash
docker compose down -v
```

### Variáveis de ambiente importantes
- DATABASE_URL: URL do Postgres. No Compose já aponta para o serviço db.
- NEXTAUTH_URL: URL pública da aplicação.
- NEXTAUTH_SECRET: segredo usado pelo NextAuth. Use um valor forte.

> **Nota sobre portas**  
> Dentro do `DATABASE_URL` a porta usada deve ser sempre a porta **interna do container (5432)**, pois os serviços se comunicam pela rede interna do Docker.  
> Se for acessar o Postgres pelo host (ex: DBeaver ou psql), utilize a porta externa definida no `docker-compose.yml` (ex: 8567).

### Dicas
- Adicione um arquivo .dockerignore para acelerar o build.
- Não comite arquivos .env. Prefira variáveis de ambiente ou env_file local.
- Em produção use um serviço gerenciado de Postgres ou um volume com backup.

## Autenticação com Auth.js (NextAuth v5)

Este projeto utiliza Auth.js (NextAuth) v5 com App Router.

- Rota de auth: `app/api/auth/[...nextauth]/route.ts`
- Config central: `auth.ts`
- Página de login: `/login`

Variáveis necessárias:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<valor-seguro>
```

No dev, gere um segredo com:

```
node -e "console.log(crypto.randomUUID())"
```

Após configurar `.env`, suba o app:

```
npm run dev
```

## Documentos pessoais e por processo

O sistema permite que um cliente tenha documentos pessoais (ex: RG, CPF, comprovantes gerais) acessíveis em todos os seus processos e, ao mesmo tempo, que um mesmo documento seja vinculado a múltiplos processos específicos.

- Documentos pessoais: `Documento` com `clienteId` (sem processo). Ficam visíveis em todos os processos do cliente.
- Documentos por processo (legado): `Documento.processoId`.
- Documentos em múltiplos processos (novo): pivot `ProcessoDocumento` que relaciona `documentoId` e `processoId` (M:N), com `tenantId` e metadados opcionais (`tag`, `nota`).

Consulta unificada:
- Use o helper `getDocumentosDoProcesso(processoId)` em `app/lib/documents.ts` para obter: documentos diretos do processo (legado e M:N) + documentos pessoais do cliente, sem duplicação.

Modelos principais:
- `Documento`: metadados do arquivo e relacionamentos com cliente/processo/movimentação/contrato.
- `ProcessoDocumento`: nova tabela pivot para vincular um documento a vários processos.

## 🆕 Novas Funcionalidades Implementadas

### 📅 Sistema de Agenda Integrado

O sistema agora inclui um módulo completo de agenda com as seguintes funcionalidades:

#### **Agenda Local**
- Criação, edição e exclusão de eventos
- Tipos de eventos: Audiência, Reunião, Consulta, Prazo, Lembrete, Outro
- Status de eventos: Agendado, Confirmado, Cancelado, Realizado, Adiado
- Recorrência de eventos (Diária, Semanal, Mensal, Anual)
- Lembretes por email configuráveis
- Vinculação com processos e clientes

#### **Integração com Google Calendar**
- Sincronização bidirecional com Google Calendar
- OAuth2 para autenticação segura
- Criação automática de eventos no Google Calendar
- Atualização e exclusão sincronizadas
- Suporte a múltiplos calendários

#### **Notificações por Email**
- Lembretes automáticos de eventos
- Notificações de novos eventos para participantes
- Templates de email personalizados
- Configuração de lembretes em minutos

### 📝 Assinatura Digital de Documentos

Sistema completo de assinatura digital integrado com ClickSign:

#### **Funcionalidades**
- Envio de documentos para assinatura
- Autenticação por email
- Controle de status (Pendente, Assinado, Rejeitado, Expirado, Cancelado)
- Notificações automáticas por email
- Download de documentos assinados
- Reenvio de links de assinatura
- Controle de expiração

#### **Integração ClickSign**
- API completa do ClickSign
- Suporte a sandbox e produção
- Gerenciamento de signatários
- Rastreamento de status em tempo real

### 💰 Organização Financeira Avançada

Sistema financeiro com visões diferenciadas para cada tipo de usuário:

#### **Visão do Cliente**
- Total devido, pago e pendente
- Próximos vencimentos
- Histórico de pagamentos
- Faturas vencidas e pendentes
- Contratos ativos

#### **Visão do Advogado**
- Total a receber e recebido
- Clientes e processos ativos
- Próximos recebimentos
- Performance financeira
- Contratos sob responsabilidade

#### **Visão do Escritório**
- Receita total, pendente e recebida
- Métricas de crescimento
- Ticket médio por cliente
- Análise de inadimplência
- Relatórios financeiros detalhados

#### **Automações Financeiras**
- Lembretes de vencimento automáticos
- Notificações de pagamento
- Relatórios por período
- Análise de performance

### 📧 Sistema de Email (Nodemailer)

Configuração completa de envio de emails:

#### **Configuração SMTP**
- Suporte a Gmail, Outlook e outros provedores
- Configuração via variáveis de ambiente
- Verificação de conexão
- Templates de email personalizados

#### **Templates Disponíveis**
- Notificação de novo evento
- Lembrete de evento
- Documento para assinatura
- Notificações financeiras
- Lembretes de vencimento

### 🗄️ Schema do Banco de Dados Atualizado

Novos modelos adicionados ao Prisma:

#### **Evento**
```prisma
model Evento {
  id                    String           @id @default(cuid())
  tenantId              String
  titulo                String
  descricao             String?
  tipo                  EventoTipo       @default(REUNIAO)
  status                EventoStatus     @default(AGENDADO)
  dataInicio            DateTime
  dataFim               DateTime
  local                 String?
  participantes         String[]
  processoId            String?
  clienteId             String?
  advogadoResponsavelId String?
  criadoPorId           String?
  recorrencia           EventoRecorrencia @default(NENHUMA)
  recorrenciaFim        DateTime?
  googleEventId         String?
  googleCalendarId      String?
  lembreteMinutos       Int?
  observacoes           String?
  // ... relacionamentos
}
```

#### **DocumentoAssinatura**
```prisma
model DocumentoAssinatura {
  id                    String                    @id @default(cuid())
  tenantId              String
  documentoId           String
  processoId            String?
  clienteId             String
  advogadoResponsavelId String?
  titulo                String
  descricao             String?
  status                DocumentoAssinaturaStatus @default(PENDENTE)
  urlDocumento          String
  urlAssinado           String?
  clicksignDocumentId   String?
  clicksignSignerId     String?
  dataEnvio             DateTime?
  dataAssinatura        DateTime?
  dataExpiracao         DateTime?
  observacoes           String?
  criadoPorId           String?
  // ... relacionamentos
}
```

### 🔧 Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=seu-email@gmail.com

# Google Calendar
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:9192/api/auth/google/callback

# ClickSign
CLICKSIGN_API_BASE=https://sandbox.clicksign.com/api/v1
CLICKSIGN_ACCESS_TOKEN=seu-access-token
```

### 📱 Interface do Usuário

#### **Página de Agenda**
- Visualização de eventos do dia
- Lista de próximos eventos
- Integração com Google Calendar (em desenvolvimento)
- Criação rápida de eventos
- Filtros por tipo e status

#### **Navegação Atualizada**
- Novo item "Agenda" no menu lateral
- Ícone de calendário personalizado
- Integração com o sistema de navegação existente

### 🚀 Próximos Passos

1. **Implementar APIs REST** para as funcionalidades de agenda e assinatura
2. **Criar componentes React** para formulários de eventos e assinatura
3. **Implementar webhooks** do ClickSign para atualizações em tempo real
4. **Adicionar calendário visual** com integração ao Google Calendar
5. **Criar relatórios financeiros** com gráficos e exportação
6. **Implementar notificações push** para eventos e lembretes