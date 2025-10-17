import { NextRequest, NextResponse } from "next/server";

import { handleGoogleCalendarCallback } from "@/app/actions/google-calendar";
import logger from "@/lib/logger";

// Callback para processar o retorno da autorização do Google OAuth
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Verificar se houve erro na autorização
    if (error) {
      const errorDescription = searchParams.get("error_description") || error;

      logger.warn(
        `Erro na autorização Google Calendar: ${error} - ${errorDescription}`,
      );

      // Redirecionar para a agenda com erro
      const redirectUrl = new URL("/agenda", request.url);

      redirectUrl.searchParams.set("google_calendar_error", errorDescription);

      return NextResponse.redirect(redirectUrl);
    }

    // Verificar se temos o código de autorização
    if (!code || !state) {
      logger.warn("Callback Google Calendar sem código ou state");

      const redirectUrl = new URL("/agenda", request.url);

      redirectUrl.searchParams.set(
        "google_calendar_error",
        "Dados de autorização inválidos",
      );

      return NextResponse.redirect(redirectUrl);
    }

    // Extrair userId e domínio original do state
    const [userId, originalDomain] = state.split("|");
    
    logger.info(`Callback Google Calendar - userId: ${userId}, originalDomain: ${originalDomain}`);

    // Processar o callback
    const result = await handleGoogleCalendarCallback(code, userId);

    if (result.success && result.data) {
      logger.info(
        `Google Calendar conectado com sucesso para usuário ${userId}`,
      );

      // Redirecionar para o domínio original se disponível
      let redirectUrl;
      if (originalDomain && originalDomain !== "") {
        // Usar o domínio original do state
        const protocol = originalDomain.includes("localhost") ? "http" : "https";
        redirectUrl = new URL("/agenda", `${protocol}://${originalDomain}`);
      } else {
        // Fallback para o domínio atual da requisição
        const host = request.headers.get("host");
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        redirectUrl = new URL("/agenda", `${protocol}://${host}`);
      }

      redirectUrl.searchParams.set("google_calendar_success", "true");
      redirectUrl.searchParams.set(
        "calendar_name",
        result.data.calendarName || "Calendário",
      );

      return NextResponse.redirect(redirectUrl);
    } else {
      logger.error(
        `Erro ao processar callback Google Calendar: ${result.error}`,
      );

      // Redirecionar para o domínio original com erro
      let redirectUrl;
      if (originalDomain && originalDomain !== "") {
        // Usar o domínio original do state
        const protocol = originalDomain.includes("localhost") ? "http" : "https";
        redirectUrl = new URL("/agenda", `${protocol}://${originalDomain}`);
      } else {
        // Fallback para o domínio atual da requisição
        const host = request.headers.get("host");
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        redirectUrl = new URL("/agenda", `${protocol}://${host}`);
      }

      redirectUrl.searchParams.set(
        "google_calendar_error",
        result.error || "Erro desconhecido",
      );

      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    logger.error("Erro no callback do Google Calendar:", error);

    // Redirecionar para a agenda com erro
    const redirectUrl = new URL("/agenda", request.url);

    redirectUrl.searchParams.set(
      "google_calendar_error",
      "Erro interno do servidor",
    );

    return NextResponse.redirect(redirectUrl);
  }
}
