/**
 * Helpers para setup de dados de teste via API
 *
 * Use estes helpers nos testes E2E para criar dados através da API route /api/test/setup
 */

import { APIRequestContext } from "@playwright/test";

/**
 * Criar tenant de teste via API
 */
export async function createTestTenant(
  request: APIRequestContext,
  data?: { nome?: string; slug?: string },
): Promise<string> {
  const response = await request.post("/api/test/setup", {
    data: {
      action: "createTenant",
      data: {
        nome: data?.nome || "Test Tenant",
        slug: data?.slug || `test-tenant-${Date.now()}`,
      },
    },
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(`Falha ao criar tenant: ${result.error}`);
  }

  return result.tenant.id;
}

/**
 * Criar usuário de teste via API
 */
export async function createTestUser(
  request: APIRequestContext,
  data: {
    tenantId: string;
    email: string;
    password: string;
    role: "ADMIN" | "ADVOGADO" | "SECRETARIA" | "FINANCEIRO" | "CLIENTE";
    firstName?: string;
    lastName?: string;
  },
): Promise<string> {
  const response = await request.post("/api/test/setup", {
    data: {
      action: "createUser",
      data,
    },
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(`Falha ao criar usuário: ${result.error}`);
  }

  return result.user.id;
}

/**
 * Criar cargo de teste via API
 */
export async function createTestCargo(
  request: APIRequestContext,
  data: {
    tenantId: string;
    nome: string;
    permissoes?: Array<{ modulo: string; acao: string; permitido: boolean }>;
  },
): Promise<string> {
  const response = await request.post("/api/test/setup", {
    data: {
      action: "createCargo",
      data,
    },
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(`Falha ao criar cargo: ${result.error}`);
  }

  return result.cargo.id;
}

/**
 * Limpar dados de teste via API
 */
export async function cleanupTestData(
  request: APIRequestContext,
  tenantId: string,
): Promise<void> {
  const response = await request.post("/api/test/setup", {
    data: {
      action: "cleanup",
      data: { tenantId },
    },
  });

  const result = await response.json();

  if (!result.success) {
    console.warn(`Falha ao limpar dados: ${result.error}`);
  }
}
