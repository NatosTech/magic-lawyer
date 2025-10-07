"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

export interface Advogado {
  id: string;
  usuarioId: string;
  oabNumero: string | null;
  oabUf: string | null;
  especialidades: string[];
  bio: string | null;
  telefone: string | null;
  whatsapp: string | null;
  comissaoPadrao: number;
  comissaoAcaoGanha: number;
  comissaoHonorarios: number;
  createdAt: Date;
  updatedAt: Date;
  usuario: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
    createdAt: Date;
    active: boolean;
  };
}

export async function getAdvogadosDoTenant(): Promise<{
  success: boolean;
  advogados?: Advogado[];
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se é admin do tenant (não SuperAdmin)
    if (user.role === "SUPER_ADMIN") {
      return { success: false, error: "Acesso negado" };
    }

    if (user.role !== "ADMIN") {
      return { success: false, error: "Acesso negado" };
    }

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Buscar advogados do tenant
    const advogadosRaw = await prisma.advogado.findMany({
      where: {
        tenantId: user.tenantId,
      },
      include: {
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            active: true,
          },
        },
      },
      orderBy: {
        usuario: {
          firstName: "asc",
        },
      },
    });

    // Converter Decimal para number para serialização
    const advogados: Advogado[] = advogadosRaw.map((advogado) => ({
      ...advogado,
      comissaoPadrao: advogado.comissaoPadrao,
      comissaoAcaoGanha: advogado.comissaoAcaoGanha,
      comissaoHonorarios: advogado.comissaoHonorarios,
    }));

    return {
      success: true,
      advogados,
    };
  } catch (error) {
    console.error("Erro ao buscar advogados:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
