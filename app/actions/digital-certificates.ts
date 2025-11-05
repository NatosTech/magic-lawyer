"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";

import { getServerSession } from "next-auth";

import prisma from "@/app/lib/prisma";
import {
  DigitalCertificateLogAction,
  DigitalCertificateType,
} from "@/app/generated/prisma";
import {
  decryptBuffer,
  decryptToString,
  encryptBuffer,
  encryptString,
} from "@/lib/certificate-crypto";
import logger from "@/lib/logger";
import { authOptions } from "@/auth";

const MAX_CERTIFICATE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

interface UploadCertificateParams {
  fileBuffer: Buffer;
  password: string;
  label?: string;
  validUntil?: Date | null;
  activate?: boolean;
  tipo?: DigitalCertificateType;
}

async function requireActionContext() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId || !session.user.id) {
    throw new Error("Não autorizado");
  }

  return {
    tenantId: session.user.tenantId,
    userId: session.user.id,
  };
}

function sanitizeCertificate(cert: {
  id: string;
  tenantId: string;
  responsavelUsuarioId: string | null;
  label: string | null;
  tipo: DigitalCertificateType;
  isActive: boolean;
  validUntil: Date | null;
  lastValidatedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  responsavelUsuario?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}) {
  return {
    id: cert.id,
    tenantId: cert.tenantId,
    responsavelUsuarioId: cert.responsavelUsuarioId,
    label: cert.label,
    tipo: cert.tipo,
    isActive: cert.isActive,
    validUntil: cert.validUntil,
    lastValidatedAt: cert.lastValidatedAt,
    lastUsedAt: cert.lastUsedAt,
    createdAt: cert.createdAt,
    updatedAt: cert.updatedAt,
    responsavelUsuario: cert.responsavelUsuario
      ? {
          id: cert.responsavelUsuario.id,
          firstName: cert.responsavelUsuario.firstName,
          lastName: cert.responsavelUsuario.lastName,
          email: cert.responsavelUsuario.email,
        }
      : null,
  };
}

export async function uploadDigitalCertificate({
  fileBuffer,
  password,
  label,
  validUntil,
  activate = true,
  tipo = DigitalCertificateType.PJE,
}: UploadCertificateParams) {
  const { tenantId, userId } = await requireActionContext();

  if (!fileBuffer?.length) {
    throw new Error("Arquivo do certificado não foi enviado");
  }

  if (fileBuffer.byteLength > MAX_CERTIFICATE_SIZE_BYTES) {
    throw new Error("Certificado excede o limite de 2MB");
  }

  if (!password || password.trim().length === 0) {
    throw new Error("A senha do certificado é obrigatória");
  }

  try {
    const certificateEncryption = encryptBuffer(fileBuffer);
    const passwordEncryption = encryptString(password);

    const result = await prisma.$transaction(async (tx) => {
      if (activate) {
        const activeCertificates = await tx.digitalCertificate.findMany({
          where: {
            tenantId,
            tipo,
            isActive: true,
          },
        });

        if (activeCertificates.length > 0) {
          const activeIds = activeCertificates.map((item) => item.id);

          await tx.digitalCertificate.updateMany({
            where: {
              id: {
                in: activeIds,
              },
            },
            data: {
              isActive: false,
            },
          });

          await tx.digitalCertificateLog.createMany({
            data: activeIds.map((certificateId) => ({
              tenantId,
              digitalCertificateId: certificateId,
              action: DigitalCertificateLogAction.DISABLED,
              actorId: userId,
              message:
                "Desativado automaticamente ao subir novo certificado.",
            })),
          });
        }
      }

      const created = await tx.digitalCertificate.create({
        data: {
          tenantId,
          responsavelUsuarioId: userId,
          label,
          tipo,
          encryptedData: certificateEncryption.encrypted,
          encryptedPassword: passwordEncryption.encrypted,
          iv: certificateEncryption.iv,
          passwordIv: passwordEncryption.iv,
          isActive: activate,
          validUntil: validUntil ?? null,
          logs: {
            create: [
              {
                tenantId,
                action: DigitalCertificateLogAction.CREATED,
                actorId: userId,
                message: "Certificado adicionado pelo usuário.",
              },
              ...(activate
                ? [
                    {
                      tenantId,
                      action: DigitalCertificateLogAction.ENABLED,
                      actorId: userId,
                      message: "Certificado ativado para integrações PJe.",
                    },
                  ]
                : []),
            ],
          },
        },
        include: {
          responsavelUsuario: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return created;
    });

    revalidatePath("/configuracoes/certificados");

    return {
      success: true,
      certificate: sanitizeCertificate(result),
    };
  } catch (error) {
    logger.error(
      { error, tenantId, userId },
      "Falha ao salvar certificado digital",
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao salvar certificado",
    };
  }
}

export async function listDigitalCertificates(tenantId: string) {
  if (!tenantId) {
    throw new Error("tenantId é obrigatório");
  }

  const certificates = await prisma.digitalCertificate.findMany({
    where: {
      tenantId,
    },
    orderBy: [
      {
        isActive: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      tenantId: true,
      responsavelUsuarioId: true,
      label: true,
      tipo: true,
      isActive: true,
      validUntil: true,
      lastValidatedAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
      responsavelUsuario: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return certificates.map(sanitizeCertificate);
}

export async function listMyDigitalCertificates() {
  const { tenantId, userId } = await requireActionContext();

  // Verificar se o usuário é advogado
  const advogado = await prisma.advogado.findFirst({
    where: {
      usuarioId: userId,
      tenantId,
    },
    select: { id: true },
  });

  if (!advogado) {
    return [];
  }

  // Buscar certificados do advogado atual
  const certificates = await prisma.digitalCertificate.findMany({
    where: {
      tenantId,
      responsavelUsuarioId: userId,
    },
    orderBy: [
      {
        isActive: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      tenantId: true,
      responsavelUsuarioId: true,
      label: true,
      tipo: true,
      isActive: true,
      validUntil: true,
      lastValidatedAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
      responsavelUsuario: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return certificates.map((cert) => {
    const sanitized = sanitizeCertificate(cert);
    return {
      ...sanitized,
      validUntil: cert.validUntil?.toISOString() ?? null,
      lastValidatedAt: cert.lastValidatedAt?.toISOString() ?? null,
      lastUsedAt: cert.lastUsedAt?.toISOString() ?? null,
      createdAt: cert.createdAt.toISOString(),
      updatedAt: cert.updatedAt.toISOString(),
    };
  });
}

export async function deactivateDigitalCertificate({
  certificateId,
}: {
  certificateId: string;
}) {
  const { tenantId, userId } = await requireActionContext();

  if (!certificateId) {
    throw new Error("certificateId é obrigatório");
  }

  try {
    const updated = await prisma.digitalCertificate.update({
      where: {
        id: certificateId,
        tenantId,
      },
      data: {
        isActive: false,
        logs: {
          create: {
            tenantId,
            action: DigitalCertificateLogAction.DISABLED,
            actorId: userId,
            message: "Certificado desativado manualmente.",
          },
        },
      },
      select: {
        id: true,
        isActive: true,
        updatedAt: true,
      },
    });

    revalidatePath("/configuracoes/certificados");

    return { success: true, certificate: updated };
  } catch (error) {
    logger.error(
      { error, tenantId, certificateId, userId },
      "Falha ao desativar certificado digital",
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao desativar certificado",
    };
  }
}

export async function activateDigitalCertificate({
  certificateId,
}: {
  certificateId: string;
}) {
  const { tenantId, userId } = await requireActionContext();

  if (!certificateId) {
    throw new Error("certificateId é obrigatório");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const certificate = await tx.digitalCertificate.findFirst({
        where: {
          id: certificateId,
          tenantId,
        },
        select: {
          id: true,
          tipo: true,
        },
      });

      if (!certificate) {
        throw new Error("Certificado não encontrado");
      }

      // Desativar outros certificados do mesmo tipo
      const activeIds = await tx.digitalCertificate.findMany({
        where: {
          tenantId,
          tipo: certificate.tipo,
          isActive: true,
          id: {
            not: certificateId,
          },
        },
        select: { id: true },
      });

      if (activeIds.length > 0) {
        const ids = activeIds.map((item) => item.id);

        await tx.digitalCertificate.updateMany({
          where: { id: { in: ids } },
          data: { isActive: false },
        });

        await tx.digitalCertificateLog.createMany({
          data: ids.map((id) => ({
            tenantId,
            digitalCertificateId: id,
            action: DigitalCertificateLogAction.DISABLED,
            actorId: userId,
            message: "Desativado ao ativar outro certificado.",
          })),
        });
      }

      const updated = await tx.digitalCertificate.update({
        where: {
          id: certificateId,
        },
        data: {
          isActive: true,
          logs: {
            create: {
              tenantId,
              action: DigitalCertificateLogAction.ENABLED,
              actorId: userId,
              message: "Certificado ativado manualmente.",
            },
          },
        },
        select: {
          id: true,
          isActive: true,
          updatedAt: true,
        },
      });

      return updated;
    });

    revalidatePath("/configuracoes/certificados");

    return { success: true, certificate: result };
  } catch (error) {
    logger.error(
      { error, tenantId, certificateId, userId },
      "Falha ao ativar certificado digital",
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao ativar certificado",
    };
  }
}

export async function listDigitalCertificateLogs({
  certificateId,
  cursor,
  take = 20,
}: {
  certificateId: string;
  cursor?: string;
  take?: number;
}) {
  const { tenantId } = await requireActionContext();

  if (!certificateId) {
    throw new Error("certificateId é obrigatório");
  }

  const logs = await prisma.digitalCertificateLog.findMany({
    where: {
      tenantId,
      digitalCertificateId: certificateId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: take + 1,
    ...(cursor
      ? {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }
      : {}),
    include: {
      actor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const hasNextPage = logs.length > take;
  const items = hasNextPage ? logs.slice(0, -1) : logs;
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : undefined;

  const sanitized = items.map((log) => ({
    id: log.id,
    action: log.action,
    message: log.message,
    createdAt: log.createdAt,
    actor: log.actor
      ? {
          id: log.actor.id,
          firstName: log.actor.firstName,
          lastName: log.actor.lastName,
          email: log.actor.email,
        }
      : null,
  }));

  return {
    items: sanitized,
    nextCursor,
  };
}

export async function testDigitalCertificate({
  certificateId,
}: {
  certificateId: string;
}) {
  const { tenantId, userId } = await requireActionContext();

  if (!certificateId) {
    throw new Error("certificateId é obrigatório");
  }

  const certificate = await prisma.digitalCertificate.findFirst({
    where: {
      id: certificateId,
      tenantId,
    },
    select: {
      encryptedData: true,
      iv: true,
      encryptedPassword: true,
      passwordIv: true,
      tipo: true,
    },
  });

  if (!certificate) {
    return {
      success: false,
      error: "Certificado não encontrado",
    };
  }

  try {
    const certificateBuffer = decryptBuffer(
      Buffer.from(certificate.encryptedData),
      Buffer.from(certificate.iv),
    );
    const password = decryptToString(
      Buffer.from(certificate.encryptedPassword),
      Buffer.from(certificate.passwordIv),
    );

    // Validação básica com Node crypto
    try {
      crypto.createPrivateKey({
        key: certificateBuffer,
        format: "der",
        type: "pkcs12",
        passphrase: password,
      });
    } catch (cryptoError) {
      throw new Error(
        `Falha ao importar certificado PKCS#12: ${
          cryptoError instanceof Error ? cryptoError.message : "erro desconhecido"
        }`,
      );
    }

    await prisma.digitalCertificate.update({
      where: {
        id: certificateId,
      },
      data: {
        lastValidatedAt: new Date(),
      },
      include: {
        logs: true,
      },
    });

    await prisma.digitalCertificateLog.create({
      data: {
        tenantId,
        digitalCertificateId: certificateId,
        action: DigitalCertificateLogAction.TESTED,
        actorId: userId,
        message: `Teste de carga concluído (${certificate.tipo}).`,
      },
    });

    return {
      success: true,
      message: "Certificado validado com sucesso.",
    };
  } catch (error) {
    logger.error(
      { error, tenantId, certificateId, userId },
      "Falha ao testar certificado digital",
    );

    await prisma.digitalCertificate.update({
      where: { id: certificateId },
      data: {},
    });

    await prisma.digitalCertificateLog.create({
      data: {
        tenantId,
        digitalCertificateId: certificateId,
        action: DigitalCertificateLogAction.TESTED,
        actorId: userId,
        message: `Teste falhou: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      },
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao testar certificado",
    };
  }
}

export async function uploadDigitalCertificateFromForm(
  formData: FormData,
) {
  const { tenantId, userId } = await requireActionContext();

  const file = formData.get("certificate") as File | null;
  const password = formData.get("password") as string | null;
  const label = formData.get("label") as string | null;
  const validUntilStr = formData.get("validUntil") as string | null;
  const activateStr = formData.get("activate") as string | null;
  const tipo = (formData.get("tipo") as string) || "PJE";

  if (!file) {
    return {
      success: false,
      error: "Arquivo do certificado não foi enviado",
    };
  }

  if (!password || password.trim().length === 0) {
    return {
      success: false,
      error: "A senha do certificado é obrigatória",
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const validUntil = validUntilStr
      ? new Date(validUntilStr)
      : null;

    const activate = activateStr !== "false";

    return await uploadDigitalCertificate({
      fileBuffer,
      password,
      label: label || undefined,
      validUntil,
      activate,
      tipo: tipo as DigitalCertificateType,
    });
  } catch (error) {
    logger.error(
      { error, tenantId, userId },
      "Falha ao processar upload de certificado via formulário",
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao processar certificado",
    };
  }
}
