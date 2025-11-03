# Configuração de Secrets e Variáveis para CI/CD

Este guia explica como configurar os secrets e variáveis de ambiente necessários para o CI/CD funcionar corretamente.

## 🔐 Secrets Obrigatórios

Estes secrets **devem** ser configurados antes do primeiro run do workflow:

### Como Configurar

1. Vá para o repositório no GitHub
2. Acesse **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret abaixo:

### Lista de Secrets

| Secret | Descrição | Exemplo | Obrigatório |
|--------|-----------|---------|-------------|
| `NEXTAUTH_SECRET` | Secret para NextAuth.js (deve ser único e seguro) | `your-random-secret-here` | ✅ Sim |
| `NEXTAUTH_URL` | URL base da aplicação | `http://localhost:3000` ou `https://seu-dominio.com` | ✅ Sim |
| `DATABASE_URL` | URL do banco de dados (opcional se usar service) | `postgresql://user:pass@host:5432/db` | ⚠️ Opcional* |
| `REDIS_URL` | URL do Redis (opcional se usar service) | `redis://localhost:6379` | ⚠️ Opcional* |

\* *O workflow usa services Docker para PostgreSQL e Redis, então estas URLs são opcionais se você quiser usar os services padrão.*

## 🧪 Secrets para Testes E2E (Opcionais mas Recomendados)

Estes secrets são necessários para os testes E2E rodarem completamente:

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `TEST_ADMIN_EMAIL` | Email do usuário admin de teste | `admin@test.com` |
| `TEST_ADMIN_PASSWORD` | Senha do usuário admin de teste | `admin123` |
| `TEST_ADVOGADO_EMAIL` | Email do usuário advogado de teste | `advogado@test.com` |
| `TEST_ADVOGADO_PASSWORD` | Senha do usuário advogado de teste | `advogado123` |
| `TEST_SECRETARIA_EMAIL` | Email do usuário secretaria de teste | `secretaria@test.com` |
| `TEST_SECRETARIA_PASSWORD` | Senha do usuário secretaria de teste | `secretaria123` |
| `TEST_FINANCEIRO_EMAIL` | Email do usuário financeiro de teste | `financeiro@test.com` |
| `TEST_FINANCEIRO_PASSWORD` | Senha do usuário financeiro de teste | `financeiro123` |
| `TEST_CLIENTE_EMAIL` | Email do usuário cliente de teste | `cliente@test.com` |
| `TEST_CLIENTE_PASSWORD` | Senha do usuário cliente de teste | `cliente123` |

## 📊 Secrets Opcionais

| Secret | Descrição | Quando Usar |
|--------|-----------|-------------|
| `CODECOV_TOKEN` | Token do Codecov | Se você quiser enviar relatórios de cobertura para o Codecov |

## ✅ Validação Automática

O workflow inclui um job `validate-env` que executa automaticamente antes dos testes para validar se os secrets estão configurados corretamente.

**Como funciona:**
- ✅ Valida variáveis obrigatórias
- ⚠️ Avisa sobre variáveis opcionais faltando
- 📊 Exibe resumo claro no log do workflow

**Executar localmente:**
```bash
node scripts/validate-ci-env.js
```

## 🔍 Monitoramento de Memória

O workflow agora inclui monitoramento automático de memória dos services Docker:

**O que é monitorado:**
- Uso de memória do PostgreSQL
- Uso de memória do Redis
- Status dos containers
- Uso de CPU

**Quando é exibido:**
- Antes dos testes unitários
- Antes dos testes E2E
- Após os testes E2E (mesmo em caso de falha)

**Limites configurados:**
- PostgreSQL: `--shm-size=256mb` (shared memory)
- Redis: `--memory 512m` com política `allkeys-lru` (remove chaves menos usadas quando limite atingido)

## 📋 Checklist de Configuração

Antes do primeiro run do workflow:

- [ ] Configurar `NEXTAUTH_SECRET` (gerar um valor seguro)
- [ ] Configurar `NEXTAUTH_URL` (URL da aplicação)
- [ ] (Opcional) Configurar credenciais de teste E2E (`TEST_*_EMAIL` e `TEST_*_PASSWORD`)
- [ ] (Opcional) Configurar `CODECOV_TOKEN` se usar Codecov
- [ ] Verificar que o job `validate-env` passa sem erros críticos

## 🛠️ Gerar Secrets Seguros

### NEXTAUTH_SECRET

```bash
# Gerar secret aleatório (Linux/Mac)
openssl rand -base64 32

# Ou usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Exemplo de Configuração Mínima

**Para começar rapidamente, apenas configure:**

1. `NEXTAUTH_SECRET`: Use o comando acima para gerar
2. `NEXTAUTH_URL`: `http://localhost:3000` (ou sua URL real)

Os demais secrets são opcionais e o workflow usará valores padrão ou funcionará sem eles.

## 🚨 Troubleshooting

### Erro: "Secret não encontrado"

**Problema:** O workflow tenta usar um secret que não existe.

**Solução:** 
- Verifique se o secret foi criado corretamente em Settings > Secrets
- Verifique se o nome do secret está exatamente correto (case-sensitive)
- O workflow usa fallbacks para alguns secrets, então nem todos são obrigatórios

### Erro: "Service não disponível"

**Problema:** PostgreSQL ou Redis não está respondendo.

**Solução:**
- Verifique os logs do service no workflow
- Verifique se os health checks estão passando
- O workflow aguarda até 5 tentativas antes de falhar

### Aviso de Memória Alta

**Problema:** Os services estão usando muita memória.

**Solução:**
- Os limites já estão configurados (`--memory 512m` para Redis)
- Se necessário, ajuste os limites no `test.yml`
- Monitore os logs de memória para identificar problemas

## 📚 Referências

- [GitHub Actions - Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Memory Limits](https://docs.docker.com/config/containers/resource_constraints/)
- [PostgreSQL Shared Memory](https://www.postgresql.org/docs/current/kernel-resources.html)

