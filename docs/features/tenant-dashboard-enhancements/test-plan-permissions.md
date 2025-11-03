# Plano de Testes - Sistema de Permissões

Este documento descreve o plano de testes para o sistema de permissões consolidado (override → cargo → role).

## 📋 Estrutura de Testes Recomendada

### Setup Inicial

**Framework sugerido:** Jest + Testing Library (já comum em projetos Next.js)

**Dependências necessárias:**
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/user-event": "^14.5.0"
  }
}
```

**Configuração em `jest.config.js`:**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

## 🧪 Testes Unitários

### 1. Testes de `checkPermission`

**Arquivo:** `app/actions/__tests__/equipe.checkPermission.test.ts`

```typescript
import { checkPermission } from '@/app/actions/equipe';
import prisma from '@/app/lib/prisma';
import { getSession } from '@/app/lib/auth';

jest.mock('@/app/lib/prisma');
jest.mock('@/app/lib/auth');

describe('checkPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar true para ADMIN independente do módulo', async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'admin-id',
        tenantId: 'tenant-id',
        role: 'ADMIN',
      },
    });

    const result = await checkPermission('processos', 'criar');
    expect(result).toBe(true);
  });

  it('deve respeitar override individual quando permitido', async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-id',
        tenantId: 'tenant-id',
        role: 'ADVOGADO',
      },
    });

    (prisma.usuarioPermissaoIndividual.findFirst as jest.Mock).mockResolvedValue({
      permitido: true,
    });

    const result = await checkPermission('processos', 'criar');
    expect(result).toBe(true);
  });

  it('deve respeitar override individual quando negado e logar recusa', async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-id',
        tenantId: 'tenant-id',
        role: 'ADVOGADO',
      },
    });

    (prisma.usuarioPermissaoIndividual.findFirst as jest.Mock).mockResolvedValue({
      permitido: false,
    });

    const result = await checkPermission('processos', 'criar');
    expect(result).toBe(false);
    
    // Verificar se logou no EquipeHistorico
    expect(prisma.equipeHistorico.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          acao: 'permissao_negada',
        }),
      })
    );
  });

  it('deve herdar permissão do cargo quando não há override', async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-id',
        tenantId: 'tenant-id',
        role: 'ADVOGADO',
      },
    });

    (prisma.usuarioPermissaoIndividual.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.usuarioCargo.findFirst as jest.Mock).mockResolvedValue({
      cargo: {
        id: 'cargo-id',
        permissoes: [
          { modulo: 'processos', acao: 'criar', permitido: true },
        ],
      },
    });

    const result = await checkPermission('processos', 'criar');
    expect(result).toBe(true);
  });

  it('deve aplicar permissão padrão do role quando não há override nem cargo', async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-id',
        tenantId: 'tenant-id',
        role: 'ADVOGADO',
      },
    });

    (prisma.usuarioPermissaoIndividual.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.usuarioCargo.findFirst as jest.Mock).mockResolvedValue(null);

    // ADVOGADO tem 'criar' em processos por padrão
    const result = await checkPermission('processos', 'criar');
    expect(result).toBe(true);
  });

  it('deve retornar false e logar quando role padrão nega', async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-id',
        tenantId: 'tenant-id',
        role: 'CLIENTE',
      },
    });

    (prisma.usuarioPermissaoIndividual.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.usuarioCargo.findFirst as jest.Mock).mockResolvedValue(null);

    // CLIENTE não tem 'criar' em processos por padrão
    const result = await checkPermission('processos', 'criar');
    expect(result).toBe(false);
    
    expect(prisma.equipeHistorico.create).toHaveBeenCalled();
  });
});
```

### 2. Testes de `checkPermissions`

**Arquivo:** `app/actions/__tests__/equipe.checkPermissions.test.ts`

```typescript
import { checkPermissions } from '@/app/actions/equipe';

describe('checkPermissions', () => {
  it('deve verificar múltiplas permissões de uma vez', async () => {
    // Setup mocks similar aos testes acima
    
    const result = await checkPermissions([
      { modulo: 'processos', acao: 'criar' },
      { modulo: 'clientes', acao: 'editar' },
      { modulo: 'financeiro', acao: 'visualizar' },
    ]);

    expect(result).toEqual({
      'processos.criar': true,
      'clientes.editar': true,
      'financeiro.visualizar': true,
    });
  });

  it('deve retornar false para ADMIN quando verifica outro usuário sem permissão', async () => {
    // Teste de segurança
  });
});
```

## 🔗 Testes de Integração

### Arquivo: `app/actions/__tests__/equipe.integration.test.ts`

```typescript
import { createCargo, createUsuarioCargo, checkPermission } from '@/app/actions/equipe';
import prisma from '@/app/lib/prisma';

describe('Fluxo Completo de Permissões', () => {
  let tenantId: string;
  let userId: string;
  let cargoId: string;

  beforeEach(async () => {
    // Setup: criar tenant, usuário, cargo
  });

  afterEach(async () => {
    // Cleanup
  });

  it('deve verificar precedência: override > cargo > role', async () => {
    // 1. Criar cargo com permissão negada
    const cargo = await createCargo({
      nome: 'Cargo Teste',
      permissoes: [{ modulo: 'processos', acao: 'criar', permitido: false }],
    });

    // 2. Vincular usuário ao cargo
    await createUsuarioCargo(userId, cargo.id);

    // 3. Verificar - deve negar (cargo)
    let result = await checkPermission('processos', 'criar');
    expect(result).toBe(false);

    // 4. Criar override permitindo
    await adicionarPermissaoIndividual(userId, 'processos', 'criar', true);

    // 5. Verificar - deve permitir (override sobrescreve cargo)
    result = await checkPermission('processos', 'criar');
    expect(result).toBe(true);
  });

  it('deve atualizar permissões quando cargo é modificado', async () => {
    // Testar que mudanças no cargo refletem nas permissões
  });

  it('deve registrar histórico de recusas corretamente', async () => {
    // Verificar se EquipeHistorico recebe logs corretos
    const historico = await prisma.equipeHistorico.findMany({
      where: {
        usuarioId,
        acao: 'permissao_negada',
      },
    });

    expect(historico.length).toBeGreaterThan(0);
  });
});
```

## 🌐 Testes E2E

### Arquivo: `e2e/permissions.spec.ts`

Usando Playwright ou Cypress:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sistema de Permissões', () => {
  test('usuário sem permissão não vê botão de criar processo', async ({ page }) => {
    // 1. Login como usuário sem permissão
    await page.goto('/login');
    await page.fill('input[name="email"]', 'usuario-sem-permissao@test.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    // 2. Navegar para processos
    await page.goto('/processos');

    // 3. Verificar que botão não existe
    const botaoCriar = page.locator('button:has-text("Criar Processo")');
    await expect(botaoCriar).not.toBeVisible();
  });

  test('permissões atualizam em tempo real quando cargo muda', async ({ page, context }) => {
    // 1. Login como admin
    await loginAsAdmin(page);

    // 2. Abrir duas abas (simular dois usuários)
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // 3. Page1: Remover permissão do cargo
    await page1.goto('/equipe');
    await removePermissaoCargo('processos', 'criar');

    // 4. Page2: Verificar que permissão foi atualizada
    await page2.goto('/processos');
    await expect(page2.locator('button:has-text("Criar")')).not.toBeVisible();
  });

  test('logs de recusa aparecem no histórico de equipe', async ({ page }) => {
    // 1. Login como admin
    await loginAsAdmin(page);

    // 2. Tentar ação sem permissão (via API direta)
    await page.evaluate(async () => {
      await fetch('/api/processos', { method: 'POST', ... });
    });

    // 3. Verificar histórico
    await page.goto('/equipe');
    await expect(page.locator('text=permissao_negada')).toBeVisible();
  });
});
```

## 📊 Métricas e Auditoria

### Testes de Logging

```typescript
describe('Auditoria de Permissões', () => {
  it('deve logar recusa no logger estruturado', async () => {
    const loggerSpy = jest.spyOn(logger, 'warn');
    
    await checkPermission('processos', 'criar'); // Sem permissão
    
    expect(loggerSpy).toHaveBeenCalledWith(
      '[PERMISSION_DENIED]',
      expect.objectContaining({
        modulo: 'processos',
        acao: 'criar',
        origem: 'role',
      })
    );
  });

  it('deve criar registro no EquipeHistorico', async () => {
    await checkPermission('processos', 'criar'); // Sem permissão
    
    const historico = await prisma.equipeHistorico.findFirst({
      where: {
        acao: 'permissao_negada',
      },
    });

    expect(historico).toBeTruthy();
    expect(historico?.dadosNovos).toMatchObject({
      modulo: 'processos',
      acao: 'criar',
    });
  });
});
```

## 🚀 Como Executar

### Configurar scripts no `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

### Executar:

```bash
# Testes unitários
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage

# Testes E2E
npm run test:e2e
```

## 📝 Checklist de Cobertura

- [ ] `checkPermission` retorna true para ADMIN
- [ ] `checkPermission` respeita override individual (permitido)
- [ ] `checkPermission` respeita override individual (negado) e loga
- [ ] `checkPermission` herda do cargo quando não há override
- [ ] `checkPermission` aplica role padrão quando não há override nem cargo
- [ ] `checkPermission` loga recusa quando role padrão nega
- [ ] `checkPermissions` verifica múltiplas permissões corretamente
- [ ] Precedência override → cargo → role funciona corretamente
- [ ] Logging registra no EquipeHistorico
- [ ] Logging registra no logger estruturado
- [ ] Hooks `usePermissionCheck` atualizam em tempo real
- [ ] Hooks `usePermissionsCheck` atualizam em tempo real
- [ ] UI oculta botões/ações quando sem permissão
- [ ] Recusas aparecem no histórico de equipe

## 🎯 Próximos Passos

1. **Configurar estrutura de testes** (Jest + Testing Library)
2. **Criar mocks para Prisma e getSession**
3. **Implementar testes unitários** (`checkPermission`, `checkPermissions`)
4. **Implementar testes de integração** (fluxo completo)
5. **Implementar testes E2E** (comportamento no browser)
6. **Adicionar testes de logging/auditoria**
7. **Executar testes manualmente** usando scripts npm (`npm test`, `npm run test:e2e`)

