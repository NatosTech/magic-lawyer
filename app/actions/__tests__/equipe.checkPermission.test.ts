/**
 * Testes unitários para checkPermission
 *
 * Cobre:
 * - ADMIN tem todas as permissões
 * - Override individual (permitido e negado)
 * - Permissão do cargo
 * - Permissão padrão do role
 * - Logging de recusas
 */

import { checkPermission } from "@/app/actions/equipe";
import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

// Mock dos módulos
jest.mock("@/app/lib/prisma", () => ({
  __esModule: true,
  default: {
    usuarioPermissaoIndividual: {
      findFirst: jest.fn(),
    },
    usuarioCargo: {
      findFirst: jest.fn(),
    },
    equipeHistorico: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/app/lib/auth", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock módulos de notificação que dependem de BullMQ
jest.mock("@/app/lib/notifications/notification-helper", () => ({
  NotificationHelper: {
    notifyEquipePermissionsChanged: jest.fn(),
  },
}));

describe("checkPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar true para ADMIN independente do módulo", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-id",
        tenantId: "tenant-id",
        role: "ADMIN",
      },
    });

    const result = await checkPermission("processos", "criar");

    expect(result).toBe(true);
    expect(prisma.usuarioPermissaoIndividual.findFirst).not.toHaveBeenCalled();
  });

  it("deve respeitar override individual quando permitido", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "user-id",
        tenantId: "tenant-id",
        role: "ADVOGADO",
      },
    });

    (
      prisma.usuarioPermissaoIndividual.findFirst as jest.Mock
    ).mockResolvedValue({
      permitido: true,
    });

    const result = await checkPermission("processos", "criar");

    expect(result).toBe(true);
    expect(prisma.usuarioPermissaoIndividual.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "tenant-id",
          usuarioId: "user-id",
          modulo: "processos",
          acao: "criar",
        },
      }),
    );
  });

  it("deve respeitar override individual quando negado e logar recusa", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "user-id",
        tenantId: "tenant-id",
        role: "ADVOGADO",
      },
    });

    (
      prisma.usuarioPermissaoIndividual.findFirst as jest.Mock
    ).mockResolvedValue({
      permitido: false,
    });

    (prisma.equipeHistorico.create as jest.Mock).mockResolvedValue({});

    const result = await checkPermission("processos", "criar");

    expect(result).toBe(false);

    // Aguardar async logging
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verificar se logou no EquipeHistorico
    expect(prisma.equipeHistorico.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          acao: "permissao_negada",
          dadosNovos: expect.objectContaining({
            modulo: "processos",
            acao: "criar",
            origem: "override",
          }),
        }),
      }),
    );
  });

  it("deve herdar permissão do cargo quando não há override", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "user-id",
        tenantId: "tenant-id",
        role: "ADVOGADO",
      },
    });

    (
      prisma.usuarioPermissaoIndividual.findFirst as jest.Mock
    ).mockResolvedValue(null);

    (prisma.usuarioCargo.findFirst as jest.Mock).mockResolvedValue({
      cargo: {
        id: "cargo-id",
        permissoes: [{ modulo: "processos", acao: "criar", permitido: true }],
      },
    });

    const result = await checkPermission("processos", "criar");

    expect(result).toBe(true);
    expect(prisma.usuarioCargo.findFirst).toHaveBeenCalled();
  });

  it("deve aplicar permissão padrão do role quando não há override nem cargo", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "user-id",
        tenantId: "tenant-id",
        role: "ADVOGADO",
      },
    });

    (
      prisma.usuarioPermissaoIndividual.findFirst as jest.Mock
    ).mockResolvedValue(null);
    (prisma.usuarioCargo.findFirst as jest.Mock).mockResolvedValue(null);

    // ADVOGADO tem 'criar' em processos por padrão
    const result = await checkPermission("processos", "criar");

    expect(result).toBe(true);
  });

  it("deve retornar false e logar quando role padrão nega", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "user-id",
        tenantId: "tenant-id",
        role: "CLIENTE",
      },
    });

    (
      prisma.usuarioPermissaoIndividual.findFirst as jest.Mock
    ).mockResolvedValue(null);
    (prisma.usuarioCargo.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.equipeHistorico.create as jest.Mock).mockResolvedValue({});

    // CLIENTE não tem 'criar' em processos por padrão
    const result = await checkPermission("processos", "criar");

    expect(result).toBe(false);

    // Aguardar async logging
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(prisma.equipeHistorico.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          acao: "permissao_negada",
          dadosNovos: expect.objectContaining({
            modulo: "processos",
            acao: "criar",
            origem: "role",
          }),
        }),
      }),
    );
  });

  it("deve retornar false quando não há sessão", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    const result = await checkPermission("processos", "criar");

    expect(result).toBe(false);
  });
});
