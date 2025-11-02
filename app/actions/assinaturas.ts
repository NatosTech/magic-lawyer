"use server";

import type { AssinaturaPeticao } from "@/app/generated/prisma";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AssinaturaInfo extends AssinaturaPeticao {
  peticao?: {
    id: string;
    titulo: string;
    processo: {
      numero: string;
    };
  };
  usuario?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function getTenantId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou tenant não encontrado");
  }

  return session.user.tenantId;
}

async function getUserId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  return session.user.id;
}

async function getUserInfo() {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Usuário não autenticado");
  }

  return {
    id: session.user.id!,
    name: session.user.name || "Usuário",
    email: session.user.email!,
  };
}

// ============================================
// LISTAR ASSINATURAS
// ============================================

export async function listarAssinaturas(
  peticaoId: string,
): Promise<ActionResponse<AssinaturaInfo[]>> {
  try {
    const tenantId = await getTenantId();

    const assinaturas = await prisma.assinaturaPeticao.findMany({
      where: {
        peticaoId,
        tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        peticao: {
          select: {
            id: true,
            titulo: true,
            processo: {
              select: {
                numero: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: assinaturas as any,
    };
  } catch (error) {
    console.error("Erro ao listar assinaturas:", error);

    return {
      success: false,
      error: "Erro ao listar assinaturas",
    };
  }
}

// ============================================
// VERIFICAR STATUS
// ============================================

export async function verificarStatusAssinatura(
  assinaturaId: string,
): Promise<ActionResponse<AssinaturaPeticao>> {
  try {
    const tenantId = await getTenantId();

    const assinatura = await prisma.assinaturaPeticao.findFirst({
      where: {
        id: assinaturaId,
        tenantId,
      },
    });

    if (!assinatura) {
      return {
        success: false,
        error: "Assinatura não encontrada",
      };
    }

    // Verificar se expirou
    if (
      assinatura.status === "PENDENTE" &&
      assinatura.expiradaEm &&
      assinatura.expiradaEm < new Date()
    ) {
      const assinaturaAtualizada = await prisma.assinaturaPeticao.update({
        where: { id: assinaturaId },
        data: { status: "EXPIRADO" },
      });

      return {
        success: true,
        data: assinaturaAtualizada,
      };
    }

    return {
      success: true,
      data: assinatura,
    };
  } catch (error) {
    console.error("Erro ao verificar status:", error);

    return {
      success: false,
      error: "Erro ao verificar status",
    };
  }
}

// ============================================
// CANCELAR ASSINATURA
// ============================================

export async function cancelarAssinatura(
  assinaturaId: string,
): Promise<ActionResponse> {
  try {
    const tenantId = await getTenantId();

    const assinatura = await prisma.assinaturaPeticao.findFirst({
      where: {
        id: assinaturaId,
        tenantId,
        status: "PENDENTE",
      },
    });

    if (!assinatura) {
      return {
        success: false,
        error: "Assinatura não encontrada ou já processada",
      };
    }

    const assinaturaAtualizada = await prisma.assinaturaPeticao.update({
      where: { id: assinaturaId },
      data: { status: "REJEITADO" },
      include: {
        peticao: {
          include: {
            documento: {
              select: {
                id: true,
                nome: true,
                processoId: true,
                clienteId: true,
                uploadedById: true,
                tenantId: true,
              },
            },
            processo: {
              select: {
                id: true,
                numero: true,
                advogadoResponsavel: {
                  select: {
                    usuario: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Disparar notificação de documento rejeitado se houver documento vinculado
    if (assinaturaAtualizada.peticao?.documento) {
      try {
        const { DocumentNotifier } = await import(
          "@/app/lib/notifications/document-notifier"
        );

        const documento = assinaturaAtualizada.peticao.documento;

        await DocumentNotifier.notifyRejected({
          tenantId: documento.tenantId,
          documentoId: documento.id,
          nome: documento.nome,
          processoIds: documento.processoId
            ? [documento.processoId]
            : undefined,
          clienteId: documento.clienteId,
          uploaderUserId: documento.uploadedById ?? undefined,
          actorNome: "Usuário",
          motivo: "Assinatura cancelada",
        });
      } catch (error) {
        console.error(
          "[Assinaturas] Erro ao notificar rejeição de documento:",
          error,
        );
      }
    }

    revalidatePath("/peticoes");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);

    return {
      success: false,
      error: "Erro ao cancelar assinatura",
    };
  }
}

// ============================================
// VERIFICAR SE PETIÇÃO ESTÁ ASSINADA
// ============================================

export async function verificarPeticaoAssinada(
  peticaoId: string,
): Promise<ActionResponse<{ assinada: boolean; assinaturas: number }>> {
  try {
    const tenantId = await getTenantId();

    const count = await prisma.assinaturaPeticao.count({
      where: {
        peticaoId,
        tenantId,
        status: "ASSINADO",
      },
    });

    return {
      success: true,
      data: {
        assinada: count > 0,
        assinaturas: count,
      },
    };
  } catch (error) {
    console.error("Erro ao verificar petição assinada:", error);

    return {
      success: false,
      error: "Erro ao verificar petição assinada",
    };
  }
}

// ============================================
// NOTA: Implementação de assinatura digital
// será feita com APIs de terceiros (Clicksign, D4Sign, etc)
// ou certificados ICP-Brasil A1/A3
// ============================================
