"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function testSession() {
  try {
    console.log("🔍 [testSession] Testando sessão...");
    const session = await getServerSession(authOptions);
    console.log("👤 [testSession] Sessão completa:", session);
    console.log("👤 [testSession] User:", session?.user);
    console.log("👤 [testSession] User ID:", session?.user?.id);
    console.log("👤 [testSession] Tenant ID:", session?.user?.tenantId);
    
    return {
      success: true,
      session: {
        userId: session?.user?.id,
        tenantId: session?.user?.tenantId,
        email: session?.user?.email,
        role: session?.user?.role,
      }
    };
  } catch (error) {
    console.error("💥 [testSession] Erro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}
