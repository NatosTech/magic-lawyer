/**
 * Testes unitários para checkPermissions
 *
 * Cobre:
 * - Verificação de múltiplas permissões de uma vez
 * - Otimização para evitar N round-trips
 * - Retorno correto do mapa de permissões
 */

import { checkPermissions } from "@/app/actions/equipe";
import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

jest.mock("@/app/lib/prisma", () => ({
  __esModule: true,
  default: {
    usuario: {
      findFirst: jest.fn(),
    },
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

// Mock módulos de notificação que dependem de BullMQ
jest.mock("@/app/lib/notifications/notification-helper", () => ({
  NotificationHelper: {
    notifyEquipePermissionsChanged: jest.fn(),
  },
}));

describe("checkPermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve verificar múltiplas permissões de uma vez", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "user-id",
        tenantId: "tenant-id",
        role: "ADVOGADO",
      },
    });

    (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
      id: "user-id",
      tenantId: "tenant-id",
      role: "ADVOGADO",
      permissoesIndividuais: [],
      cargos: [],
    });

    const result = await checkPermissions([
      { modulo: "processos", acao: "criar" },
      { modulo: "clientes", acao: "editar" },
      { modulo: "financeiro", acao: "visualizar" },
    ]);

    expect(result).toEqual({
      "processos.criar": true, // ADVOGADO tem criar em processos
      "clientes.editar": true, // ADVOGADO tem editar em clientes
      "financeiro.visualizar": true, // ADVOGADO tem visualizar em financeiro
    });
  });

  it("deve retornar todas como true para ADMIN", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-id",
        tenantId: "tenant-id",
        role: "ADMIN",
      },
    });

    const result = await checkPermissions([
      { modulo: "processos", acao: "criar" },
      { modulo: "clientes", acao: "excluir" },
      { modulo: "financeiro", acao: "excluir" },
    ]);

    expect(result).toEqual({
      "processos.criar": true,
      "clientes.excluir": true,
      "financeiro.excluir": true,
    });

    // ADMIN não precisa verificar override/cargo
    expect(prisma.usuarioPermissaoIndividual.findFirst).not.toHaveBeenCalled();
  });

  it("deve retornar false para todas quando não há sessão", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    const result = await checkPermissions([
      { modulo: "processos", acao: "criar" },
      { modulo: "clientes", acao: "editar" },
    ]);

    expect(result).toEqual({
      "processos.criar": false,
      "clientes.editar": false,
    });
  });

  it("deve retornar todas como true para ADMIN", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-id",
        tenantId: "tenant-id",
        role: "ADMIN",
      },
    });

    (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
      id: "admin-id",
      tenantId: "tenant-id",
      role: "ADMIN",
      permissoesIndividuais: [],
      cargos: [],
    });

    const result = await checkPermissions([
      { modulo: "processos", acao: "criar" },
      { modulo: "clientes", acao: "excluir" },
      { modulo: "financeiro", acao: "excluir" },
    ]);

    expect(result).toEqual({
      "processos.criar": true,
      "clientes.excluir": true,
      "financeiro.excluir": true,
    });

    // ADMIN não precisa verificar override/cargo
    expect(prisma.usuarioPermissaoIndividual.findFirst).not.toHaveBeenCalled();
  });

  it("deve retornar false quando CLIENTE tenta ações não permitidas", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: {
        id: "client-id",
        tenantId: "tenant-id",
        role: "CLIENTE",
      },
    });

    (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
      id: "client-id",
      tenantId: "tenant-id",
      role: "CLIENTE",
      permissoesIndividuais: [],
      cargos: [],
    });

    const result = await checkPermissions([
      { modulo: "processos", acao: "criar" }, // CLIENTE não tem
      { modulo: "processos", acao: "visualizar" }, // CLIENTE tem
      { modulo: "equipe", acao: "visualizar" }, // CLIENTE não tem
    ]);

    expect(result).toEqual({
      "processos.criar": false,
      "processos.visualizar": true,
      "equipe.visualizar": false,
    });
  });
});
