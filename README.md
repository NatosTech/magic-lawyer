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