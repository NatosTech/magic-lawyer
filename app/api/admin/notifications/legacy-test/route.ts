import { NextRequest, NextResponse } from "next/server";

import { NotificationMigrationService } from "@/app/lib/notifications/notification-migration";

export async function POST(request: NextRequest) {
  // Verificar se está em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        success: false,
        error: "Endpoint disponível apenas em desenvolvimento",
      },
      { status: 403 },
    );
  }

  // Verificar token de admin interno
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.INTERNAL_ADMIN_TOKEN;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { success: false, error: "Token de autorização inválido" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create_legacy":
        const notificationId =
          await NotificationMigrationService.createLegacyNotification({
            tenantId: body.tenantId || "test-tenant",
            titulo: body.titulo || "Teste Sistema Legado",
            mensagem: body.mensagem || "Notificação de teste do sistema legado",
            tipo: body.tipo || "SISTEMA",
            prioridade: body.prioridade || "MEDIA",
            canais: body.canais || ["IN_APP"],
            userIds: body.userIds || ["test-user"],
            dados: body.dados,
            referenciaTipo: body.referenciaTipo,
            referenciaId: body.referenciaId,
          });

        return NextResponse.json({
          success: true,
          message: "Notificação legada criada com sucesso",
          data: { notificationId },
        });

      case "test_mapping":
        // Testar mapeamento de tipos
        const testData = {
          tenantId: "test-tenant",
          titulo: "Teste Mapeamento",
          mensagem: "Teste de mapeamento de tipos",
          tipo: "SISTEMA",
          prioridade: "MEDIA",
          canais: ["IN_APP"],
          userIds: ["test-user"],
        };

        const result =
          await NotificationMigrationService.createLegacyNotification(testData);

        return NextResponse.json({
          success: true,
          message: "Mapeamento testado com sucesso",
          data: { notificationId: result },
        });

      default:
        return NextResponse.json(
          { success: false, error: "Ação não reconhecida" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Erro no teste do sistema legado:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
