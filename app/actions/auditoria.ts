"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

export type AuditLogEntry = {
  id: string;
  fonte: "SUPER_ADMIN" | "TENANT";
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  dadosAntigos?: any;
  dadosNovos?: any;
  changedFields?: string[];
  superAdmin?: {
    id: string;
    nome: string;
    email: string;
  } | null;
  tenant?: {
    id: string;
    nome: string;
    slug: string | null;
  } | null;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  } | null;
};

export type AuditLogSummary = {
  total: number;
  porCategoria: {
    create: number;
    update: number;
    delete: number;
    other: number;
  };
};

export type AuditLogFilters = {
  limit?: number;
  fonte?: "SUPER_ADMIN" | "TENANT";
  entidade?: string;
  acao?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
};

export type GetAuditLogsResponse = {
  success: boolean;
  data?: {
    logs: AuditLogEntry[];
    summary: AuditLogSummary;
  };
  error?: string;
};

async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const role = (session.user as any)?.role;

  if (role !== "SUPER_ADMIN") {
    throw new Error(
      "Acesso negado. Apenas Super Admins podem acessar os logs de auditoria.",
    );
  }

  return session.user.id;
}

function buildNome(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || null;
}

function categorizeAcao(acao: string) {
  const normalized = acao?.toUpperCase?.() ?? "";

  if (normalized.includes("CREATE")) {
    return "create" as const;
  }

  if (normalized.includes("UPDATE")) {
    return "update" as const;
  }

  if (normalized.includes("DELETE")) {
    return "delete" as const;
  }

  return "other" as const;
}

function buildSummary(logs: AuditLogEntry[]): AuditLogSummary {
  const summary: AuditLogSummary = {
    total: logs.length,
    porCategoria: {
      create: 0,
      update: 0,
      delete: 0,
      other: 0,
    },
  };

  for (const log of logs) {
    const categoria = categorizeAcao(log.acao);

    summary.porCategoria[categoria] += 1;
  }

  return summary;
}

function buildDateRangeFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) {
    return undefined;
  }

  const filter: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    const start = new Date(startDate);

    start.setHours(0, 0, 0, 0);
    filter.gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);

    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }

  return filter;
}

export async function getSystemAuditLogs(
  filters?: AuditLogFilters,
): Promise<GetAuditLogsResponse> {
  try {
    await ensureSuperAdmin();

    const {
      limit = 100,
      fonte,
      entidade,
      acao,
      search,
      startDate,
      endDate,
    } = filters ?? {};

    const shouldFetchSuperAdmin = fonte !== "TENANT";
    const shouldFetchTenant = fonte !== "SUPER_ADMIN";

    const dateFilter = buildDateRangeFilter(startDate, endDate);

    const [superAdminLogs, tenantLogs] = await Promise.all([
      shouldFetchSuperAdmin
        ? prisma.superAdminAuditLog.findMany({
            orderBy: { createdAt: "desc" },
            where: {
              ...(entidade ? { entidade } : {}),
              ...(acao
                ? {
                    acao: {
                      contains: acao,
                      mode: "insensitive",
                    },
                  }
                : {}),
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            include: {
              superAdmin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          })
        : [],
      shouldFetchTenant
        ? prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            where: {
              ...(entidade ? { entidade } : {}),
              ...(acao
                ? {
                    acao: {
                      contains: acao,
                      mode: "insensitive",
                    },
                  }
                : {}),
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              usuario: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          })
        : [],
    ]);

    const logs: AuditLogEntry[] = [
      ...superAdminLogs.map((log) => ({
        id: log.id,
        fonte: "SUPER_ADMIN" as const,
        acao: log.acao,
        entidade: log.entidade,
        entidadeId: log.entidadeId,
        createdAt: log.createdAt.toISOString(),
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        dadosAntigos: log.dadosAntigos ?? undefined,
        dadosNovos: log.dadosNovos ?? undefined,
        superAdmin: log.superAdmin
          ? {
              id: log.superAdmin.id,
              nome:
                buildNome(log.superAdmin.firstName, log.superAdmin.lastName) ||
                log.superAdmin.email,
              email: log.superAdmin.email,
            }
          : null,
      })),
      ...tenantLogs.map((log) => ({
        id: log.id,
        fonte: "TENANT" as const,
        acao: log.acao,
        entidade: log.entidade,
        entidadeId: log.entidadeId,
        createdAt: log.createdAt.toISOString(),
        ipAddress: log.ip,
        userAgent: log.userAgent,
        dadosAntigos: log.previousValues ?? undefined,
        dadosNovos: log.dados ?? undefined,
        changedFields: log.changedFields ?? undefined,
        tenant: log.tenant
          ? {
              id: log.tenant.id,
              nome: log.tenant.name,
              slug: log.tenant.slug,
            }
          : null,
        usuario: log.usuario
          ? {
              id: log.usuario.id,
              nome:
                buildNome(log.usuario.firstName, log.usuario.lastName) ||
                log.usuario.email ||
                "",
              email: log.usuario.email ?? "",
            }
          : null,
      })),
    ];

    let filteredLogs = logs;

    if (search && search.trim().length > 0) {
      const searchTerm = search.trim().toLowerCase();

      filteredLogs = filteredLogs.filter((log) => {
        const candidateValues = [
          log.acao,
          log.entidade,
          log.entidadeId,
          log.superAdmin?.nome,
          log.superAdmin?.email,
          log.tenant?.nome,
          log.tenant?.slug,
          log.usuario?.nome,
          log.usuario?.email,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return candidateValues.some((value) => value.includes(searchTerm));
      });
    }

    filteredLogs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const limitedLogs = filteredLogs.slice(0, limit);

    return {
      success: true,
      data: {
        logs: limitedLogs,
        summary: buildSummary(limitedLogs),
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar logs de auditoria:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao buscar logs de auditoria",
    };
  }
}

function convertLogToCsvRow(log: AuditLogEntry) {
  const row = [
    new Date(log.createdAt).toISOString(),
    log.fonte,
    log.acao,
    log.entidade,
    log.entidadeId ?? "",
    log.tenant?.nome ?? "",
    log.tenant?.slug ?? "",
    log.superAdmin?.nome ?? log.usuario?.nome ?? "",
    log.superAdmin?.email ?? log.usuario?.email ?? "",
    log.ipAddress ?? "",
    log.userAgent ?? "",
    log.changedFields?.join("|") ?? "",
    log.dadosAntigos ? JSON.stringify(log.dadosAntigos) : "",
    log.dadosNovos ? JSON.stringify(log.dadosNovos) : "",
  ];

  return row
    .map((cell) => {
      if (cell === null || cell === undefined) {
        return "";
      }

      const value = String(cell);

      if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    })
    .join(",");
}

export async function exportSystemAuditLogs(filters?: AuditLogFilters) {
  try {
    const result = await getSystemAuditLogs({
      ...filters,
      limit: filters?.limit ?? 1000,
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error ?? "Não foi possível exportar os logs",
      };
    }

    const header = [
      "createdAt",
      "fonte",
      "acao",
      "entidade",
      "entidadeId",
      "tenantNome",
      "tenantSlug",
      "usuarioNome",
      "usuarioEmail",
      "ip",
      "userAgent",
      "changedFields",
      "dadosAntigos",
      "dadosNovos",
    ].join(",");

    const rows = result.data.logs.map(convertLogToCsvRow);
    const csv = [header, ...rows].join("\n");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    return {
      success: true,
      data: csv,
      filename: `audit-logs-${timestamp}.csv`,
    };
  } catch (error) {
    logger.error("Erro ao exportar logs de auditoria:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao exportar logs de auditoria",
    };
  }
}
