"use server";

import { randomBytes } from "crypto";

import { revalidatePath } from "next/cache";

import { UserRole } from "@/generated/prisma";
import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { sendConviteEmail } from "@/app/lib/email-convite";
import { NotificationHelper } from "@/app/lib/notifications/notification-helper";

export interface ConviteEquipeData {
  id: string;
  email: string;
  nome?: string;
  cargoId?: string;
  role: UserRole;
  status: string;
  expiraEm: Date;
  aceitoEm?: Date;
  rejeitadoEm?: Date;
  observacoes?: string;
  enviadoPor: string;
  createdAt: Date;
  updatedAt: Date;
  token?: string;
  cargo?: {
    id: string;
    nome: string;
    nivel: number;
  };
  enviadoPorUsuario?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface CreateConviteData {
  email: string;
  nome?: string;
  cargoId?: string;
  role: UserRole;
  observacoes?: string;
}

export interface UpdateConviteData {
  email?: string;
  nome?: string;
  cargoId?: string;
  role?: UserRole;
  observacoes?: string;
}

const EQUIPE_CONVITE_ALLOWED_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.SECRETARIA,
  UserRole.FINANCEIRO,
]);

function assertConvitesEquipeAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado");
  }

  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.SUPER_ADMIN
  ) {
    throw new Error("Apenas administradores podem gerenciar convites");
  }

  return session;
}

// Buscar todos os convites do tenant
export async function getConvitesEquipe(): Promise<ConviteEquipeData[]> {
  const session = assertConvitesEquipeAdmin(await getSession());

  const convites = await prisma.equipeConvite.findMany({
    where: {
      tenantId: session.user.tenantId,
    },
    include: {
      cargo: {
        select: {
          id: true,
          nome: true,
          nivel: true,
        },
      },
      enviadoPorUsuario: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return convites.map((convite) => ({
    id: convite.id,
    email: convite.email,
    nome: convite.nome || undefined,
    cargoId: convite.cargoId || undefined,
    role: convite.role,
    status: convite.status,
    expiraEm: convite.expiraEm,
    aceitoEm: convite.aceitoEm || undefined,
    rejeitadoEm: convite.rejeitadoEm || undefined,
    observacoes: convite.observacoes || undefined,
    enviadoPor: convite.enviadoPor,
    createdAt: convite.createdAt,
    updatedAt: convite.updatedAt,
    cargo: convite.cargo
      ? {
          id: convite.cargo.id,
          nome: convite.cargo.nome,
          nivel: convite.cargo.nivel,
        }
      : undefined,
    enviadoPorUsuario: convite.enviadoPorUsuario
      ? {
          id: convite.enviadoPorUsuario.id,
          firstName: convite.enviadoPorUsuario.firstName || undefined,
          lastName: convite.enviadoPorUsuario.lastName || undefined,
          email: convite.enviadoPorUsuario.email,
        }
      : undefined,
  }));
}

// Criar novo convite
export async function createConviteEquipe(
  data: CreateConviteData,
): Promise<ConviteEquipeData> {
  const session = assertConvitesEquipeAdmin(await getSession());
  const tenantId = session.user.tenantId!;

  if (!EQUIPE_CONVITE_ALLOWED_ROLES.has(data.role)) {
    throw new Error("Role não permitido para convites de equipe");
  }

  const normalizedEmail = data.email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email inválido");
  }

  if (data.cargoId) {
    const cargo = await prisma.cargo.findFirst({
      where: {
        id: data.cargoId,
        tenantId,
        ativo: true,
      },
      select: { id: true },
    });

    if (!cargo) {
      throw new Error("Cargo inválido ou inativo");
    }
  }

  // Verificar se já existe um usuário com este email no tenant
  const existingUser = await prisma.usuario.findFirst({
    where: {
      tenantId,
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error("Já existe um usuário com este email no escritório");
  }

  // Fluxo compatível com @@unique([tenantId, email]):
  // - pendente: bloqueia duplicidade
  // - aceito: bloqueia novo convite
  // - rejeitado/expirado: reaproveita registro e reabre como pendente
  const existingConvite = await prisma.equipeConvite.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: normalizedEmail,
      },
    },
  });

  if (existingConvite?.status === "pendente") {
    throw new Error("Já existe um convite pendente para este email");
  }

  if (existingConvite?.status === "aceito") {
    throw new Error("Este convite já foi aceito anteriormente");
  }

  // Gerar token único
  const token = randomBytes(32).toString("hex");

  // Definir expiração (7 dias)
  const expiraEm = new Date();

  expiraEm.setDate(expiraEm.getDate() + 7);

  const conviteData = {
    email: normalizedEmail,
    nome: data.nome?.trim() || null,
    cargoId: data.cargoId || null,
    role: data.role,
    token,
    expiraEm,
    observacoes: data.observacoes?.trim() || null,
    enviadoPor: session.user.id!,
    status: "pendente",
    aceitoEm: null,
    rejeitadoEm: null,
  };

  const convite = existingConvite
    ? await prisma.equipeConvite.update({
        where: {
          id: existingConvite.id,
        },
        data: {
          ...conviteData,
          updatedAt: new Date(),
        },
        include: {
          cargo: {
            select: {
              id: true,
              nome: true,
              nivel: true,
            },
          },
          enviadoPorUsuario: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })
    : await prisma.equipeConvite.create({
        data: {
          tenantId,
          ...conviteData,
        },
        include: {
          cargo: {
            select: {
              id: true,
              nome: true,
              nivel: true,
            },
          },
          enviadoPorUsuario: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

  // Enviar email de convite
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (tenant) {
      await sendConviteEmail(tenantId, {
        email: convite.email,
        nome: convite.nome || undefined,
        nomeEscritorio: tenant.name,
        token: convite.token,
        expiraEm: convite.expiraEm,
        observacoes: convite.observacoes || undefined,
        cargo: convite.cargo?.nome || undefined,
        role: convite.role,
      });
    }
  } catch (error) {
    console.error("Erro ao enviar email de convite:", error);
    // Não falhar a criação do convite se o email falhar
  }

  revalidatePath("/equipe");

  try {
    const actor = session.user as any;
    const actorName =
      `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim() ||
      actor.email ||
      actor.id;

    const destinatarios = await prisma.usuario.findMany({
      where: {
        tenantId,
        active: true,
        role: {
          in: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SECRETARIA],
        },
        id: {
          not: session.user.id,
        },
      },
      select: { id: true },
    });

    await Promise.all(
      destinatarios.map(({ id }) =>
        NotificationHelper.notifyEquipeUserInvited(tenantId, id, {
          conviteId: convite.id,
          email: convite.email,
          nome: convite.nome || undefined,
          cargo: convite.cargo?.nome || undefined,
          enviadoPor: actorName,
        }),
      ),
    );
  } catch (error) {
    console.warn("Falha ao emitir notificações de equipe.user_invited", error);
  }

  return {
    id: convite.id,
    email: convite.email,
    nome: convite.nome || undefined,
    cargoId: convite.cargoId || undefined,
    role: convite.role,
    status: convite.status,
    expiraEm: convite.expiraEm,
    aceitoEm: convite.aceitoEm || undefined,
    rejeitadoEm: convite.rejeitadoEm || undefined,
    observacoes: convite.observacoes || undefined,
    enviadoPor: convite.enviadoPor,
    createdAt: convite.createdAt,
    updatedAt: convite.updatedAt,
    cargo: convite.cargo
      ? {
          id: convite.cargo.id,
          nome: convite.cargo.nome,
          nivel: convite.cargo.nivel,
        }
      : undefined,
    enviadoPorUsuario: convite.enviadoPorUsuario
      ? {
          id: convite.enviadoPorUsuario.id,
          firstName: convite.enviadoPorUsuario.firstName || undefined,
          lastName: convite.enviadoPorUsuario.lastName || undefined,
          email: convite.enviadoPorUsuario.email,
        }
      : undefined,
  };
}

// Reenviar convite
export async function resendConviteEquipe(
  conviteId: string,
): Promise<ConviteEquipeData> {
  const session = assertConvitesEquipeAdmin(await getSession());

  const convite = await prisma.equipeConvite.findFirst({
    where: {
      id: conviteId,
      tenantId: session.user.tenantId,
    },
  });

  if (!convite) {
    throw new Error("Convite não encontrado");
  }

  if (convite.status !== "pendente") {
    throw new Error("Apenas convites pendentes podem ser reenviados");
  }

  // Gerar novo token e estender expiração
  const newToken = randomBytes(32).toString("hex");
  const expiraEm = new Date();

  expiraEm.setDate(expiraEm.getDate() + 7);

  const updatedConvite = await prisma.equipeConvite.update({
    where: {
      id: conviteId,
    },
    data: {
      token: newToken,
      expiraEm,
      updatedAt: new Date(),
    },
    include: {
      cargo: {
        select: {
          id: true,
          nome: true,
          nivel: true,
        },
      },
      enviadoPorUsuario: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Reenviar email de convite
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    });

    if (tenant) {
      await sendConviteEmail(session.user.tenantId!, {
        email: updatedConvite.email,
        nome: updatedConvite.nome || undefined,
        nomeEscritorio: tenant.name,
        token: updatedConvite.token,
        expiraEm: updatedConvite.expiraEm,
        observacoes: updatedConvite.observacoes || undefined,
        cargo: updatedConvite.cargo?.nome || undefined,
        role: updatedConvite.role,
      });
    }
  } catch (error) {
    console.error("Erro ao reenviar email de convite:", error);
    // Não falhar o reenvio se o email falhar
  }

  revalidatePath("/equipe");

  return {
    id: updatedConvite.id,
    email: updatedConvite.email,
    nome: updatedConvite.nome || undefined,
    cargoId: updatedConvite.cargoId || undefined,
    role: updatedConvite.role,
    status: updatedConvite.status,
    expiraEm: updatedConvite.expiraEm,
    aceitoEm: updatedConvite.aceitoEm || undefined,
    rejeitadoEm: updatedConvite.rejeitadoEm || undefined,
    observacoes: updatedConvite.observacoes || undefined,
    enviadoPor: updatedConvite.enviadoPor,
    createdAt: updatedConvite.createdAt,
    updatedAt: updatedConvite.updatedAt,
    cargo: updatedConvite.cargo
      ? {
          id: updatedConvite.cargo.id,
          nome: updatedConvite.cargo.nome,
          nivel: updatedConvite.cargo.nivel,
        }
      : undefined,
    enviadoPorUsuario: updatedConvite.enviadoPorUsuario
      ? {
          id: updatedConvite.enviadoPorUsuario.id,
          firstName: updatedConvite.enviadoPorUsuario.firstName || undefined,
          lastName: updatedConvite.enviadoPorUsuario.lastName || undefined,
          email: updatedConvite.enviadoPorUsuario.email,
        }
      : undefined,
  };
}

// Cancelar convite
export async function cancelConviteEquipe(conviteId: string): Promise<void> {
  const session = assertConvitesEquipeAdmin(await getSession());

  const convite = await prisma.equipeConvite.findFirst({
    where: {
      id: conviteId,
      tenantId: session.user.tenantId,
    },
  });

  if (!convite) {
    throw new Error("Convite não encontrado");
  }

  if (convite.status !== "pendente") {
    throw new Error("Apenas convites pendentes podem ser cancelados");
  }

  await prisma.equipeConvite.update({
    where: {
      id: conviteId,
    },
    data: {
      status: "rejeitado",
      rejeitadoEm: new Date(),
      updatedAt: new Date(),
    },
  });

  revalidatePath("/equipe");
}

// Buscar convite por token (para página de aceitação)
export async function getConviteByToken(
  token: string,
): Promise<ConviteEquipeData | null> {
  const convite = await prisma.equipeConvite.findUnique({
    where: {
      token,
    },
    include: {
      cargo: {
        select: {
          id: true,
          nome: true,
          nivel: true,
        },
      },
      enviadoPorUsuario: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!convite) {
    return null;
  }

  // Verificar se o convite expirou
  if (convite.expiraEm < new Date() && convite.status === "pendente") {
    await prisma.equipeConvite.update({
      where: {
        id: convite.id,
      },
      data: {
        status: "expirado",
        updatedAt: new Date(),
      },
    });

    return null;
  }

  return {
    id: convite.id,
    email: convite.email,
    nome: convite.nome || undefined,
    cargoId: convite.cargoId || undefined,
    role: convite.role,
    status: convite.status,
    expiraEm: convite.expiraEm,
    aceitoEm: convite.aceitoEm || undefined,
    rejeitadoEm: convite.rejeitadoEm || undefined,
    observacoes: convite.observacoes || undefined,
    enviadoPor: convite.enviadoPor,
    createdAt: convite.createdAt,
    updatedAt: convite.updatedAt,
    cargo: convite.cargo
      ? {
          id: convite.cargo.id,
          nome: convite.cargo.nome,
          nivel: convite.cargo.nivel,
        }
      : undefined,
    enviadoPorUsuario: convite.enviadoPorUsuario
      ? {
          id: convite.enviadoPorUsuario.id,
          firstName: convite.enviadoPorUsuario.firstName || undefined,
          lastName: convite.enviadoPorUsuario.lastName || undefined,
          email: convite.enviadoPorUsuario.email,
        }
      : undefined,
  };
}

// Aceitar convite
export async function acceptConviteEquipe(
  token: string,
  userData: {
    firstName: string;
    lastName: string;
    password: string;
  },
): Promise<void> {
  const convite = await prisma.equipeConvite.findUnique({
    where: {
      token,
    },
  });

  if (!convite) {
    throw new Error("Convite não encontrado");
  }

  if (convite.status !== "pendente") {
    throw new Error("Convite já foi processado");
  }

  if (convite.expiraEm < new Date()) {
    throw new Error("Convite expirado");
  }

  // Verificar se já existe um usuário com este email
  const existingUser = await prisma.usuario.findFirst({
    where: {
      tenantId: convite.tenantId,
      email: convite.email,
    },
  });

  if (existingUser) {
    throw new Error("Já existe um usuário com este email");
  }

  // Criar usuário
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(userData.password, 12);

  const novoUsuario = await prisma.usuario.create({
    data: {
      tenantId: convite.tenantId,
      email: convite.email,
      passwordHash,
      role: convite.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
      active: true,
    },
  });

  // Atribuir cargo se especificado
  if (convite.cargoId) {
    await prisma.usuarioCargo.create({
      data: {
        tenantId: convite.tenantId,
        usuarioId: novoUsuario.id,
        cargoId: convite.cargoId!,
        ativo: true,
        dataInicio: new Date(),
      },
    });
  }

  let cargoNome: string | undefined;

  if (convite.cargoId) {
    const cargo = await prisma.cargo.findFirst({
      where: {
        id: convite.cargoId,
        tenantId: convite.tenantId,
      },
      select: { nome: true },
    });

    cargoNome = cargo?.nome || undefined;
  }

  // Marcar convite como aceito
  await prisma.equipeConvite.update({
    where: {
      id: convite.id,
    },
    data: {
      status: "aceito",
      aceitoEm: new Date(),
      updatedAt: new Date(),
    },
  });

  const novoUsuarioNome =
    `${novoUsuario.firstName ?? ""} ${novoUsuario.lastName ?? ""}`.trim() ||
    novoUsuario.email;

  try {
    const destinatarios = await prisma.usuario.findMany({
      where: {
        tenantId: convite.tenantId,
        active: true,
        role: {
          in: [UserRole.ADMIN, UserRole.SECRETARIA, UserRole.SUPER_ADMIN],
        },
        id: {
          not: novoUsuario.id,
        },
      },
      select: { id: true },
    });

    await Promise.all(
      destinatarios.map(({ id }) =>
        NotificationHelper.notifyEquipeUserJoined(convite.tenantId, id, {
          usuarioId: novoUsuario.id,
          nome: novoUsuarioNome,
          email: novoUsuario.email,
          cargo: cargoNome,
        }),
      ),
    );
  } catch (error) {
    console.warn("Falha ao emitir notificações de equipe.user_joined", error);
  }
}

// Rejeitar convite
export async function rejectConviteEquipe(token: string): Promise<void> {
  const convite = await prisma.equipeConvite.findUnique({
    where: {
      token,
    },
  });

  if (!convite) {
    throw new Error("Convite não encontrado");
  }

  if (convite.status !== "pendente") {
    throw new Error("Convite já foi processado");
  }

  await prisma.equipeConvite.update({
    where: {
      id: convite.id,
    },
    data: {
      status: "rejeitado",
      rejeitadoEm: new Date(),
      updatedAt: new Date(),
    },
  });
}

// Dashboard de convites
export async function getDashboardConvites(): Promise<{
  total: number;
  pendentes: number;
  aceitos: number;
  rejeitados: number;
  expirados: number;
}> {
  const session = assertConvitesEquipeAdmin(await getSession());

  const [total, pendentes, aceitos, rejeitados, expirados] = await Promise.all([
    prisma.equipeConvite.count({
      where: {
        tenantId: session.user.tenantId,
      },
    }),
    prisma.equipeConvite.count({
      where: {
        tenantId: session.user.tenantId,
        status: "pendente",
      },
    }),
    prisma.equipeConvite.count({
      where: {
        tenantId: session.user.tenantId,
        status: "aceito",
      },
    }),
    prisma.equipeConvite.count({
      where: {
        tenantId: session.user.tenantId,
        status: "rejeitado",
      },
    }),
    prisma.equipeConvite.count({
      where: {
        tenantId: session.user.tenantId,
        status: "expirado",
      },
    }),
  ]);

  return {
    total,
    pendentes,
    aceitos,
    rejeitados,
    expirados,
  };
}
