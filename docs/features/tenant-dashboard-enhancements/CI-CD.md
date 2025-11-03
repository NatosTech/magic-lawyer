# Configuração CI/CD

Este documento descreve a configuração de CI/CD para execução automática de testes.

## 📋 GitHub Actions

O workflow está configurado em `.github/workflows/test.yml` e executa:

1. **Testes Unitários**
   - Rodam em cada push/PR
   - Requerem PostgreSQL e Redis como services
   - Geram relatório de cobertura

2. **Testes E2E**
   - Rodam em cada push/PR
   - Requerem build completo da aplicação
   - Geram relatórios do Playwright

3. **Lint**
   - Verifica código com ESLint

## 🔧 Configuração

### Variáveis de Ambiente no GitHub

⚠️ **IMPORTANTE:** Configure os secrets **antes do primeiro run**. Veja o guia completo em `SETUP-CI.md`.

**Secrets obrigatórios:**
- `NEXTAUTH_SECRET` - Secret para NextAuth (gerar com `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL base da aplicação

**Secrets opcionais:**
- `DATABASE_URL` - URL do banco de teste (opcional, usa service do workflow)
- `REDIS_URL` - URL do Redis (opcional, usa service do workflow)
- `TEST_*_EMAIL` e `TEST_*_PASSWORD` - Credenciais para testes E2E
- `CODECOV_TOKEN` - Token do Codecov (opcional)

### Validação Automática

O workflow inclui um job `validate-env` que valida automaticamente se os secrets estão configurados antes de rodar os testes.

### Ambiente de Testes

O workflow usa services Docker:
- PostgreSQL 15 na porta 5432
- Redis 7 na porta 6379

## 🚀 Execução Local

Para simular o CI/CD localmente:

```bash
# Executar testes unitários
npm test

# Executar testes E2E (requer servidor rodando)
npm run test:e2e

# Executar lint
npm run lint
```

## 📊 Cobertura de Código

Os testes unitários geram relatório de cobertura que é enviado para Codecov (opcional).

Para ver cobertura local:
```bash
npm run test:coverage
```

## 🔍 Troubleshooting

### Testes falhando no CI

1. Verificar se todas as dependências estão instaladas
2. Verificar se serviços (PostgreSQL, Redis) estão acessíveis
3. Verificar logs do workflow no GitHub Actions

### Testes E2E falhando

1. Verificar se o build está funcionando (`npm run build`)
2. Verificar se o servidor inicia corretamente
3. Verificar screenshots/reports gerados pelo Playwright

## 📝 Notas

- O workflow ignora testes E2E se o servidor não iniciar (fail-safe)
- Testes podem ser executados em paralelo se necessário
- Cobertura é opcional (continue-on-error: true)

