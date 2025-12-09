"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

export type TenantOption = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
};

export type TenantOptionsResponse = {
  success: boolean;
  data?: TenantOption[];
  error?: string;
};

export async function getTenantOptions(): Promise<TenantOptionsResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return {
      success: false,
      error: "Acesso não autorizado para listar tenants",
    };
  }

  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: tenants,
    };
  } catch (error) {
    logger.error("Erro ao buscar tenants para seleção:", error);

    return {
      success: false,
      error: "Erro interno ao buscar tenants",
    };
  }
}
