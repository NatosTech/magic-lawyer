import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { UserRole } from "@/app/generated/prisma";
import prisma from "@/app/lib/prisma";
import { UploadService } from "@/lib/upload-service";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ success: false, error: "Usuário não autenticado" }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Apenas administradores podem alterar avatares" }, { status: 403 });
    }

    const body = await request.json();
    const { usuarioId, file, fileName, mimeType } = body;

    if (!usuarioId || !file) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return NextResponse.json({ success: false, error: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP." }, { status: 400 });
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    const buffer = Buffer.from(file, "base64");
    if (buffer.length > maxSize) {
      return NextResponse.json({ success: false, error: "Arquivo muito grande. Máximo 5MB." }, { status: 400 });
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        tenantId: session.user.tenantId,
      },
    });

    if (!usuario) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    // Fazer upload para Cloudinary
    const uploadService = UploadService.getInstance();
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    });

    const userName = `${usuario.firstName || ""} ${usuario.lastName || ""}`.trim() || usuario.email;
    const result = await uploadService.uploadAvatar(
      buffer,
      usuario.id,
      fileName || "avatar.jpg",
      tenant?.slug ?? undefined,
      userName,
    );

    if (!result.success || !result.url) {
      return NextResponse.json({ success: false, error: result.error || "Erro no upload" }, { status: 500 });
    }

    // Atualizar avatar do usuário
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { avatarUrl: result.url },
    });

    revalidatePath("/equipe");

    return NextResponse.json({ success: true, avatarUrl: result.url });
  } catch (error) {
    console.error("Erro no upload de avatar:", error);
    return NextResponse.json({ success: false, error: "Erro ao fazer upload do avatar" }, { status: 500 });
  }
}

