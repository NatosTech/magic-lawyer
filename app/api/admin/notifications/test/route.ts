import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/app/lib/notifications/notification-service";

export async function POST(request: NextRequest) {
  // Verificar se está em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Endpoint disponível apenas em desenvolvimento" }, { status: 403 });
  }

  // Verificar token de admin interno
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.INTERNAL_ADMIN_TOKEN;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ success: false, error: "Token de autorização inválido" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validar dados de entrada
    if (!body.type || !body.tenantId || !body.userId) {
      return NextResponse.json({ success: false, error: "Campos obrigatórios: type, tenantId, userId" }, { status: 400 });
    }

    // Limitar tipos de teste permitidos
    const allowedTestTypes = ["test.notification", "test.email", "test.whatsapp", "test.legacy", "test.simple"];
    if (!allowedTestTypes.includes(body.type)) {
      return NextResponse.json({ success: false, error: "Tipo de teste não permitido" }, { status: 400 });
    }

    // Publicar notificação
    await NotificationService.publishNotification({
      type: body.type,
      tenantId: body.tenantId,
      userId: body.userId,
      payload: body.payload || {},
      urgency: body.urgency || "MEDIUM",
      channels: body.channels || ["REALTIME"],
    });

    return NextResponse.json({
      success: true,
      message: "Notificação de teste adicionada à fila com sucesso",
      data: {
        type: body.type,
        tenantId: body.tenantId,
        userId: body.userId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao publicar notificação:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 });
  }
}
