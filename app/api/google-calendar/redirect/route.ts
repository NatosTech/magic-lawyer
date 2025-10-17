import { NextRequest, NextResponse } from "next/server";

// Endpoint para redirecionar OAuth do Google baseado no domínio atual
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Obter o domínio atual do cabeçalho Host
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "https";

    // Construir a URL base do domínio atual
    const baseUrl = `${protocol}://${host}`;
    const redirectUrl = `${baseUrl}/api/google-calendar/callback`;

    // Adicionar os parâmetros da query string
    const callbackUrl = new URL(redirectUrl);

    if (code) callbackUrl.searchParams.set("code", code);
    if (state) callbackUrl.searchParams.set("state", state);
    if (error) callbackUrl.searchParams.set("error", error);

    // Redirecionar para o callback do domínio atual
    return NextResponse.redirect(callbackUrl);
  } catch (error) {
    console.error("Erro no redirecionamento OAuth:", error);

    // Fallback: redirecionar para o domínio principal
    const fallbackUrl = new URL(
      "https://magiclawyer.vercel.app/api/google-calendar/callback",
    );
    const { searchParams } = new URL(request.url);

    if (searchParams.get("code"))
      fallbackUrl.searchParams.set("code", searchParams.get("code")!);
    if (searchParams.get("state"))
      fallbackUrl.searchParams.set("state", searchParams.get("state")!);
    if (searchParams.get("error"))
      fallbackUrl.searchParams.set("error", searchParams.get("error")!);

    return NextResponse.redirect(fallbackUrl);
  }
}
