import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Rota interna para invalidação de cache
 * Recebe eventos e executa revalidateTag/revalidatePath
 * Fase 2: Publicar em Redis Pub/Sub
 */
export async function POST(request: Request) {
  try {
    // Verificar token de autenticação interno
    const token = request.headers.get("x-internal-token");
    const expectedToken = process.env.REALTIME_INTERNAL_TOKEN;

    if (!token || token !== expectedToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const { type, tenantId, userId } = payload;

    // Revalidar tags específicas
    if (tenantId) {
      revalidateTag(`tenant:${tenantId}`);
      revalidateTag(`tenant-subscription:${tenantId}`);
    }

    if (userId) {
      revalidateTag(`user:${userId}`);
    }

    // Revalidar paths específicos
    switch (type) {
      case "tenant-status":
        revalidatePath("/admin/tenants");
        revalidatePath("/admin/tenants/[tenantId]", "page");
        revalidatePath("/login");
        break;

      case "plan-update":
        revalidatePath("/admin/planos");
        revalidatePath("/admin/tenants");
        break;

      case "user-status":
        revalidatePath("/admin/tenants");
        revalidatePath("/admin/tenants/[tenantId]", "page");
        break;

      default:
        // Revalidar páginas principais
        revalidatePath("/");
    }

    // TODO: Fase 2 - Publicar evento no Redis/WebSocket
    // await redis.publish(`invalidation:${tenantId}`, JSON.stringify(payload));

    return NextResponse.json({
      success: true,
      revalidated: {
        tags: tenantId ? [`tenant:${tenantId}`] : [],
        paths: type ? [type] : [],
      },
    });
  } catch (error) {
    console.error("Erro ao invalidar cache:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
