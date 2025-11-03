# Guia de Testes - Sistema de Permissões

## 🚀 Configuração Inicial

A stack de testes já está configurada. Para começar a usar:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (re-executa ao salvar)
npm run test:watch

# Executar com cobertura de código
npm run test:coverage

# Executar testes E2E (requer servidor rodando)
npm run test:e2e

# Executar testes E2E com UI do Playwright
npm run test:e2e:ui
```

## 📁 Estrutura de Testes

```
app/
  actions/
    __tests__/
      equipe.checkPermission.test.ts    # Testes unitários de checkPermission
      equipe.checkPermissions.test.ts   # Testes unitários de checkPermissions
      
e2e/
  permissions.spec.ts                   # Testes E2E de permissões
```

## 🧪 Executando Testes

### Testes Unitários

Os testes unitários estão prontos e podem ser executados imediatamente:

```bash
npm test
```

**Testes implementados:**
- ✅ `checkPermission` retorna true para ADMIN
- ✅ `checkPermission` respeita override individual
- ✅ `checkPermission` herda do cargo
- ✅ `checkPermission` aplica role padrão
- ✅ `checkPermission` loga recusas corretamente
- ✅ `checkPermissions` verifica múltiplas permissões

### Testes E2E

Os testes E2E requerem:
1. Servidor de desenvolvimento rodando (`npm run dev`)
2. Setup de dados de teste (usuários, cargos, permissões)
3. Funções helper para login

**Status:** Templates criados, requerem ajustes para ambiente de testes específico.

## 📊 Dashboard de Auditoria

O dashboard de auditoria está disponível em `/auditoria-permissoes` (apenas para ADMIN).

**Funcionalidades:**
- Cards de resumo (Total negadas, Últimas 24h, Módulos únicos, Usuários afetados)
- Gráficos por módulo e origem
- Tabela filtrada de recusas
- Filtros por módulo, ação e origem
- Paginação

**Acesso:**
- Apenas usuários com role `ADMIN` podem acessar
- Dados vêm de `EquipeHistorico` com ação `permissao_negada`

## 🔧 Customização

### Adicionar Novos Testes

1. **Teste unitário:** Criar arquivo em `app/**/__tests__/*.test.ts`
2. **Teste E2E:** Adicionar arquivo em `e2e/*.spec.ts`

### Configurar Ambiente de Testes

Edite `jest.config.js` para ajustar:
- Cobertura de arquivos
- Mapeamento de módulos
- Ambiente de teste

## 🚀 CI/CD

O projeto está configurado com GitHub Actions para executar testes automaticamente. Veja `CI-CD.md` para detalhes completos.

**Workflow:** `.github/workflows/test.yml`

Executa em cada push/PR:
- ✅ Testes unitários com cobertura
- ✅ Testes E2E com Playwright
- ✅ Lint com ESLint

## 📝 Próximos Passos

1. ✅ **Implementar helpers de autenticação** para testes E2E - CONCLUÍDO
2. ✅ **Criar dados de seed** específicos para testes - CONCLUÍDO
3. **Adicionar mais testes de integração** cobrindo fluxos completos
4. ✅ **Configurar CI/CD** para executar testes automaticamente - CONCLUÍDO

## 🐛 Troubleshooting

**Erro: "Cannot find module"**
- Verifique se `jest.config.js` está configurado corretamente
- Verifique imports usando `@/` alias

**Testes E2E falham**
- Certifique-se que o servidor está rodando (`npm run dev`)
- Verifique que o Playwright está instalado (`npx playwright install`)

**Mocks não funcionam**
- Verifique se os mocks estão importados antes dos módulos testados
- Use `jest.clearAllMocks()` no `beforeEach`

