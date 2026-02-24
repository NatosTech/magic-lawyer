"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { UserRole } from "@/generated/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

export interface SearchStatsOptions {
  tenantId?: string | null;
}

export interface SearchStatsPayload {
  processos: number;
  clientes: number;
  documentos: number;
  meusProcessos: number | null;
}

export interface SearchStatsResponse {
  success: boolean;
  data?: SearchStatsPayload;
  error?: string;
}

export async function getSearchStats(
  options: SearchStatsOptions = {},
): Promise<SearchStatsResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { success: false, error: "Sessão não encontrada" };
  }

  const userRole = (session.user as any)?.role as UserRole | undefined;
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
  const sessionTenantId = session.user.tenantId ?? null;
  const requestedTenantId = options.tenantId ?? null;

  // Usuários comuns não podem trocar de tenant
  if (
    !isSuperAdmin &&
    requestedTenantId &&
    requestedTenantId !== sessionTenantId
  ) {
    return { success: false, error: "Tenant inválido para este usuário" };
  }

  const isAllTenants = isSuperAdmin && requestedTenantId === "ALL";
  const tenantId = isAllTenants ? null : isSuperAdmin ? requestedTenantId : sessionTenantId;

  if (!tenantId && !isAllTenants) {
    return { success: false, error: "Tenant não informado" };
  }

  try {
    const [processos, clientes, documentos, advogado] = await Promise.all([
      prisma.processo.count({
        where: {
          deletedAt: null,
          ...(tenantId ? { tenantId } : {}),
        },
      }),
      prisma.cliente.count({
        where: tenantId ? { tenantId } : {},
      }),
      prisma.documento.count({
        where: tenantId ? { tenantId } : {},
      }),
      isSuperAdmin
        ? null
        : prisma.advogado.findUnique({
            where: { usuarioId: session.user.id },
            select: { id: true },
          }),
    ]);

    const meusProcessos =
      advogado?.id != null
        ? await prisma.processo.count({
            where: {
              tenantId: tenantId ?? sessionTenantId ?? undefined,
              deletedAt: null,
              advogadoResponsavelId: advogado.id,
            },
          })
        : null;

    return {
      success: true,
      data: {
        processos,
        clientes,
        documentos,
        meusProcessos,
      },
    };
  } catch (error) {
    logger.error("Erro ao obter estatísticas da busca", error);

    return {
      success: false,
      error: "Erro interno ao calcular estatísticas da busca",
    };
  }
}
