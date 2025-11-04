import { Page } from "@playwright/test";

/**
 * Helper para fazer login no sistema
 */
export async function loginAsUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");

  // Preencher formulário de login
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);

  // Clicar em submit
  await page.click(
    'button[type="submit"], button:has-text("Entrar"), button:has-text("Login")',
  );

  // Aguardar redirecionamento (não deve estar mais em /login)
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 10000,
  });
}

/**
 * Helper para fazer login como ADMIN
 * Assume que existe um usuário ADMIN com email e senha padrão
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@test.com";
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || "admin123";

  await loginAsUser(page, adminEmail, adminPassword);
}

/**
 * Helper para fazer login como usuário específico por role
 */
export async function loginAsRole(
  page: Page,
  role: "ADMIN" | "ADVOGADO" | "SECRETARIA" | "FINANCEIRO" | "CLIENTE",
): Promise<void> {
  const roleEmails: Record<string, string> = {
    ADMIN: process.env.TEST_ADMIN_EMAIL || "admin@test.com",
    ADVOGADO: process.env.TEST_ADVOGADO_EMAIL || "advogado@test.com",
    SECRETARIA: process.env.TEST_SECRETARIA_EMAIL || "secretaria@test.com",
    FINANCEIRO: process.env.TEST_FINANCEIRO_EMAIL || "financeiro@test.com",
    CLIENTE: process.env.TEST_CLIENTE_EMAIL || "cliente@test.com",
  };

  const rolePasswords: Record<string, string> = {
    ADMIN: process.env.TEST_ADMIN_PASSWORD || "admin123",
    ADVOGADO: process.env.TEST_ADVOGADO_PASSWORD || "advogado123",
    SECRETARIA: process.env.TEST_SECRETARIA_PASSWORD || "secretaria123",
    FINANCEIRO: process.env.TEST_FINANCEIRO_PASSWORD || "financeiro123",
    CLIENTE: process.env.TEST_CLIENTE_PASSWORD || "cliente123",
  };

  await loginAsUser(page, roleEmails[role], rolePasswords[role]);
}

/**
 * Helper para fazer logout
 */
export async function logout(page: Page): Promise<void> {
  // Tentar encontrar botão de logout (pode estar em menu dropdown)
  const logoutButton = page.locator(
    'button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout"]',
  );

  if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL((url) => url.pathname.includes("/login"), {
      timeout: 5000,
    });
  } else {
    // Se não encontrar botão, navegar diretamente para logout
    await page.goto("/api/auth/signout");
    await page.waitForURL((url) => url.pathname.includes("/login"), {
      timeout: 5000,
    });
  }
}
