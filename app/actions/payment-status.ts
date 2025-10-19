"use server";

import prisma from "@/app/lib/prisma";

export async function getPaymentStatus(checkoutId: string) {
  try {
    // Buscar checkout session
    const checkoutSession = await prisma.checkoutSession.findFirst({
      where: {
        id: checkoutId,
      },
    });

    if (!checkoutSession) {
      return {
        success: false,
        error: "Sessão de checkout não encontrada",
      };
    }

    // Se já foi confirmado, buscar dados da conta criada
    if (checkoutSession.status === "CONFIRMED") {
      const tenant = await prisma.tenant.findFirst({
        where: {
          documento: checkoutSession.dadosCheckout.documento,
        },
        include: {
          subscriptions: {
            where: {
              status: "ATIVA",
            },
            include: {
              plano: true,
            },
          },
        },
      });

      return {
        success: true,
        status: "CONFIRMED",
        checkoutSession,
        tenant,
      };
    }

    // Buscar dados do pagamento no Asaas (simulado por enquanto)
    const paymentStatus = checkoutSession.asaasPaymentId ? "PENDING" : "CREATED";

    return {
      success: true,
      status: paymentStatus,
      checkoutSession,
      tenant: null,
    };
  } catch (error) {
    console.error("Erro ao buscar status do pagamento:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
