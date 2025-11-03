# Configuração CI/CD (Opcional)

No momento **não estamos executando nenhuma pipeline automática**. Este documento ficou como referência caso, no futuro, seja desejado habilitar um fluxo de CI/CD (por exemplo, via GitHub Actions).

## 📋 GitHub Actions (desabilitado)

O repositório não possui workflow ativo. Caso queira ativar no futuro:

1. Crie um arquivo em `.github/workflows/*.yml` com os jobs desejados (testes, lint, etc.).
2. Configure secrets no repositório, se necessário.
3. Ajuste o fluxo conforme a infraestrutura disponível.

## 🔧 Configuração

Caso decida configurar um pipeline, lembre-se de:

- Definir variáveis/segredos no provedor (ex.: GitHub) **antes** de rodar o primeiro job.
- Documentar quais serviços externos (PostgreSQL, Redis, etc.) precisam subir no CI.
- Manter o mesmo conjunto de comandos usados localmente (`npm test`, `npm run test:e2e`, `npm run lint`).

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

Os testes unitários podem gerar relatório de cobertura localmente:

Para ver cobertura local:
```bash
npm run test:coverage
```

## 🔍 Troubleshooting

### Testes falhando

1. Verifique se todas as dependências estão instaladas
2. Garanta que serviços externos (PostgreSQL, Redis) estejam acessíveis
3. Execute os comandos de lint/testes manualmente para validar

## 📝 Notas

- Este guia é apenas uma referência; não há automação ativa neste projeto.
- Sinta-se à vontade para adaptar o fluxo se, no futuro, decidir habilitar CI/CD.
