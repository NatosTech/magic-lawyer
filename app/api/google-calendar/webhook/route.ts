import { NextRequest, NextResponse } from "next/server";

import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

// Webhook para receber notificações do Google Calendar
export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma notificação do Google Calendar
    const headers = request.headers;
    const channelId = headers.get("x-goog-channel-id");
    const channelToken = headers.get("x-goog-channel-token");
    const resourceId = headers.get("x-goog-resource-id");
    const resourceState = headers.get("x-goog-resource-state");
    const resourceUri = headers.get("x-goog-resource-uri");

    if (!channelId || !resourceState) {
      logger.warn("Webhook do Google Calendar recebido sem dados válidos");

      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 },
      );
    }

    logger.info(`Webhook Google Calendar: ${resourceState} - ${channelId}`);

    // Verificar se o token corresponde a um usuário válido
    const usuario = await prisma.usuario.findFirst({
      where: {
        googleCalendarTokens: {
          path: ["channel_token"],
          equals: channelToken,
        } as any,
      },
      select: {
        id: true,
        tenantId: true,
        googleCalendarTokens: true,
        googleCalendarId: true,
      },
    });

    if (!usuario) {
      logger.warn(
        `Webhook Google Calendar: Usuário não encontrado para token ${channelToken}`,
      );

      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Processar diferentes tipos de notificação
    switch (resourceState) {
      case "sync":
        // Notificação de sincronização inicial
        logger.info(`Sincronização inicial para usuário ${usuario.id}`);
        break;

      case "exists":
        // Verificação de que o canal ainda existe
        logger.info(`Canal ativo para usuário ${usuario.id}`);
        break;

      case "not_exists":
        // Canal não existe mais - remover webhook
        logger.info(`Canal removido para usuário ${usuario.id}`);
        await handleChannelRemoved(usuario.id);
        break;

      default:
        logger.warn(`Estado de webhook não reconhecido: ${resourceState}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erro no webhook do Google Calendar:", error);

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// Handler para quando o canal é removido
async function handleChannelRemoved(userId: string) {
  try {
    // Marcar que o usuário precisa reconfigurar a sincronização
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        googleCalendarSyncEnabled: false,
        // Manter connected = true para que o usuário possa reativar
      },
    });

    logger.info(
      `Sincronização desabilitada para usuário ${userId} devido a canal removido`,
    );
  } catch (error) {
    logger.error(
      `Erro ao processar remoção de canal para usuário ${userId}:`,
      error,
    );
  }
}

// GET para verificação do webhook (Google às vezes faz GET para verificar se o endpoint existe)
export async function GET(request: NextRequest) {
  const channelId = request.headers.get("x-goog-channel-id");
  const resourceState = request.headers.get("x-goog-resource-state");

  if (channelId && resourceState === "sync") {
    logger.info(`Webhook GET verificação: ${channelId}`);

    return NextResponse.json({ success: true, message: "Webhook ativo" });
  }

  return NextResponse.json({
    success: true,
    message: "Webhook Google Calendar",
  });
}
