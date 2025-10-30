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
    const { action, notificationId } = body;

    switch (action) {
      case "migrate_all":
        console.log(
          "[API] Iniciando migração de todas as notificações legadas...",
        );
        const result =
          await NotificationMigrationService.migrateAllLegacyNotifications();

        return NextResponse.json({
          success: true,
          message: "Migração concluída",
          data: result,
        });

      case "migrate_single":
        if (!notificationId) {
          return NextResponse.json(
            {
              success: false,
              error: "notificationId é obrigatório para migrate_single",
            },
            { status: 400 },
          );
        }

        console.log(`[API] Migrando notificação ${notificationId}...`);
        await NotificationMigrationService.migrateLegacyNotification(
          notificationId,
        );

        return NextResponse.json({
          success: true,
          message: `Notificação ${notificationId} migrada com sucesso`,
        });

      case "check_migration":
        if (!notificationId) {
          return NextResponse.json(
            {
              success: false,
              error: "notificationId é obrigatório para check_migration",
            },
            { status: 400 },
          );
        }

        const isMigrated =
          await NotificationMigrationService.isNotificationMigrated(
            notificationId,
          );

        return NextResponse.json({
          success: true,
          data: { isMigrated },
        });

      default:
        return NextResponse.json(
          { success: false, error: "Ação não reconhecida" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Erro na migração:", error);

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
