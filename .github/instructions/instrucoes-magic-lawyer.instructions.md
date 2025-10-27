---
applyTo: '**'
---
Instrução e Apresentação do Projeto – Sistema para Escritório de Advocacia (SaaS White Label)

## Idioma e Comunicação
- **IMPORTANTE**: Todas as mensagens de commit devem ser escritas em PORTUGUÊS BRASILEIRO
- Use verbos no infinitivo: "adicionar", "corrigir", "implementar", "refatorar"
- Seja claro e conciso nas descrições
- Exemplos de mensagens: "adicionar sistema de upload de avatares", "corrigir vazamento de dados entre tenants", "implementar módulo de contratos"

Este projeto tem como objetivo o desenvolvimento de um sistema moderno, escalável e white label para escritórios de advocacia. A proposta é criar uma plataforma centralizada que organize e facilite a gestão de clientes, processos, diligências, documentos e informações internas, oferecendo acesso controlado para diferentes perfis de usuários: advogados, equipe administrativa, financeiro, secretariado e clientes.

Stack e Tecnologia
	•	Next.js: base para o front e back com server actions e SSR/ISR.
	•	Prisma + PostgreSQL: camada de dados robusta e escalável.
	•	HeroUI + Tailwind: interface moderna e responsiva.
	•	Templates pagos premium (quando fizer sentido) para acelerar desenvolvimento sem abrir mão da personalização.
	•	White label nativo: suporte a logotipos, cores, textos e domínios customizados por escritório.
  •	SWR como primeira opção para leitura client-side: evitamos `useEffect` para sincronizar dados remotos, preferindo hooks declarativos com cache multi-tenant.

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
- execução com next start na porta 9192

### Build da imagem
```bash
docker build -t magic-lawyer:latest .
```

### Executar somente a imagem
```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@localhost:5432/magic_lawyer?schema=public" \
  -e NEXTAUTH_URL="http://localhost:9192" \
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
      NEXTAUTH_URL: http://localhost:9192
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

Acesse a aplicação em http://localhost:9192

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

## Pontos de Atenção

Este projeto é multi-tenant, white label e lida com dados sensíveis (LGPD). Para evitar vazamentos, regressões ou gargalos, siga estes pontos de atenção.

### Multi-tenant e isolamento de dados
- Sempre incluir `tenant_id` em todas as tabelas e consultas. Use middlewares/helpers para garantir `where: { tenantId }` em TODAS as operações (read/write/aggregate/count).
- Unicidade por tenant: defina `@@unique([tenantId, campo])` (ex.: e-mail único por tenant) e índices `@@index([tenantId, ...])` para colunas de busca.
- Derivação de tenant por domínio/subdomínio. Validar status (ativo/suspenso) antes de autorizar o acesso.
- Evitar lógicas “hardcoded” por cliente. Prefira flags/configurações por tenant.
- Auditoria mínima: `createdAt`, `updatedAt`, `createdById`, `updatedById` e, quando fizer sentido, `deletedAt` (soft delete) por tenant.

### Autenticação e sessões
- Projeto utiliza Auth.js (NextAuth) v4 estável. Não misturar APIs de versões diferentes.
- JWT deve carregar apenas o essencial: `user.id`, `user.tenantId`, `user.role`. Evite payloads grandes.
- Cookies: `Secure`, `HttpOnly`, `SameSite=Lax/Strict` em produção; prefira prefixos `__Secure-` quando sob HTTPS.
- Proteger rotas do App Router com `getServerSession` e checagem explícita de `tenantId` e papel (RBAC).
- Ao trocar de domínio/tenant, forçar novo login para evitar “session bleed”.

### Documentos e visibilidade
- Modelo: `Documento` (metadados) + pivot `ProcessoDocumento` (M:N). Suporta documentos pessoais do cliente (`clienteId`) e vínculo a múltiplos processos.
- Controle de audiência:
  - `Documento.origem`: `CLIENTE` | `ESCRITORIO` | `SISTEMA`.
  - `Documento.visivelParaCliente` e `Documento.visivelParaEquipe` (defaults seguros: cliente vê só o que for explicitamente liberado).
  - `ProcessoDocumento.visivelParaCliente?` como override específico para um processo.
- Regra prática: por padrão, documentos do escritório NÃO são visíveis ao cliente até liberação explícita.
- Uploads: usar URLs pré-assinadas (ex.: S3), validação de tipo/tamanho, normalização de nomes (sem PII), e antivírus (quando aplicável).
- Toda listagem/consulta deve filtrar por `tenantId` e por audiência (cliente/equipe) para evitar vazamentos acidentais.

### Prisma e migrações
- Em desenvolvimento: `prisma migrate dev` para criar/aplicar novas migrações e regenerar o client.
- Em deploy/CI: `prisma migrate deploy`. Nunca rodar `migrate dev` em produção.
- Não editar migrações já aplicadas; crie uma nova migração para cada mudança.
- Índices: adicionar para FKs e campos de filtro frequentes. Use `citext` para e-mail quando necessário (unicidade case-insensitive).
- Seeds idempotentes, particionados por tenant quando fizer sentido.

### Segurança e LGPD
- Senhas com `bcrypt` (custo adequado). Nunca logar dados sensíveis.
- PII em repouso: considerar criptografia/campo sensível quando aplicável.
- Políticas de retenção, exportação e deleção sob demanda (direitos do titular).
- RBAC por módulo/ação; princípio do menor privilégio.
- Rate limiting e proteção contra brute force. Avalie CSRF em rotas sensíveis quando usar credenciais.

### Performance e operações
- Paginação consistente (cursor/limit) em todas as listagens.
- Evitar N+1 com `include/select` bem definidos. Monitorar queries lentas.
- Offload de tarefas pesadas para filas (parse de PDFs, OCR, notificações).
- Cache leve por tenant (quando aplicável) com invalidação explícita.
- Em componentes client-side, priorize SWR ou server actions; evite `useEffect` para buscar dados e manipular estados assíncronos manualmente.

### Docker/Infra
- Em Compose, serviços se comunicam via rede interna: `DATABASE_URL` deve usar a porta interna 5432 do Postgres.
- Nunca comitar `.env`; usar `env_file` local ou secrets do provedor.
- Healthchecks, backups e políticas de restauração testadas.

### Observabilidade
- Logs estruturados com `tenantId`, `userId`, correlação de requisições.
- Métricas de negócio (processos criados, documentos anexados, acessos de clientes) por tenant.
- Alertas para falhas de webhooks e de upload/storage.

### Billing e integrações
- Webhooks assinados, idempotentes e com reentrega. Log de eventos por tenant.
- Grace period e bloqueio de acesso por inadimplência configuráveis por plano.

### White label e branding
- Tema por tenant (logo, cores, textos) e e-mails transacionais com branding.
- Domínios customizados com configuração segura (TLS, CNAME) e isolamento de cookies por domínio.


SOBRE

Instrução e Apresentação do Projeto – Sistema para Escritório de Advocacia (SaaS White Label)

Este projeto tem como objetivo o desenvolvimento de um sistema moderno, escalável e white label para escritórios de advocacia. A proposta é criar uma plataforma centralizada que organize e facilite a gestão de clientes, processos, diligências, documentos e informações internas, oferecendo acesso controlado para diferentes perfis de usuários: advogados, equipe administrativa, financeiro, secretariado e clientes.

Stack e Tecnologia
	•	Next.js: base para o front e back com server actions e SSR/ISR.
	•	Prisma + PostgreSQL: camada de dados robusta e escalável.
	•	HeroUI + Tailwind: interface moderna e responsiva.
	•	Templates pagos premium (quando fizer sentido) para acelerar desenvolvimento sem abrir mão da personalização.
	•	White label nativo: suporte a logotipos, cores, textos e domínios customizados por escritório.

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
- execução com next start na porta 9192

### Build da imagem
```bash
docker build -t magic-lawyer:latest .
```

### Executar somente a imagem
```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@localhost:5432/magic_lawyer?schema=public" \
  -e NEXTAUTH_URL="http://localhost:9192" \
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
      NEXTAUTH_URL: http://localhost:9192
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

Acesse a aplicação em http://localhost:9192

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
NEXTAUTH_URL=http://localhost:9192
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