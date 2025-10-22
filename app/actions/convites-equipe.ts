"use server";

import { randomBytes } from "crypto";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { sendConviteEmail } from "@/app/lib/email-convite";

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

// Buscar todos os convites do tenant
export async function getConvitesEquipe(): Promise<ConviteEquipeData[]> {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

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
    nome: convite.nome,
    cargoId: convite.cargoId,
    role: convite.role,
    status: convite.status,
    expiraEm: convite.expiraEm,
    aceitoEm: convite.aceitoEm,
    rejeitadoEm: convite.rejeitadoEm,
    observacoes: convite.observacoes,
    enviadoPor: convite.enviadoPor,
    createdAt: convite.createdAt,
    updatedAt: convite.updatedAt,
    cargo: convite.cargo,
    enviadoPorUsuario: convite.enviadoPorUsuario,
  }));
}

// Criar novo convite
export async function createConviteEquipe(
  data: CreateConviteData,
): Promise<ConviteEquipeData> {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  // Verificar se já existe um convite pendente para este email
  const existingConvite = await prisma.equipeConvite.findFirst({
    where: {
      tenantId: session.user.tenantId,
      email: data.email,
      status: "pendente",
    },
  });

  if (existingConvite) {
    throw new Error("Já existe um convite pendente para este email");
  }

  // Verificar se já existe um usuário com este email no tenant
  const existingUser = await prisma.usuario.findFirst({
    where: {
      tenantId: session.user.tenantId,
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("Já existe um usuário com este email no escritório");
  }

  // Gerar token único
  const token = randomBytes(32).toString("hex");

  // Definir expiração (7 dias)
  const expiraEm = new Date();

  expiraEm.setDate(expiraEm.getDate() + 7);

  const convite = await prisma.equipeConvite.create({
    data: {
      tenantId: session.user.tenantId,
      email: data.email,
      nome: data.nome,
      cargoId: data.cargoId,
      role: data.role,
      token,
      expiraEm,
      observacoes: data.observacoes,
      enviadoPor: session.user.id,
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
      where: { id: session.user.tenantId },
      select: { name: true },
    });

    if (tenant) {
      await sendConviteEmail({
        email: convite.email,
        nome: convite.nome,
        nomeEscritorio: tenant.name,
        token: convite.token,
        expiraEm: convite.expiraEm,
        observacoes: convite.observacoes,
        cargo: convite.cargo?.nome,
        role: convite.role,
      });
    }
  } catch (error) {
    console.error("Erro ao enviar email de convite:", error);
    // Não falhar a criação do convite se o email falhar
  }

  revalidatePath("/equipe");

  return {
    id: convite.id,
    email: convite.email,
    nome: convite.nome,
    cargoId: convite.cargoId,
    role: convite.role,
    status: convite.status,
    expiraEm: convite.expiraEm,
    aceitoEm: convite.aceitoEm,
    rejeitadoEm: convite.rejeitadoEm,
    observacoes: convite.observacoes,
    enviadoPor: convite.enviadoPor,
    createdAt: convite.createdAt,
    updatedAt: convite.updatedAt,
    cargo: convite.cargo,
    enviadoPorUsuario: convite.enviadoPorUsuario,
  };
}

// Reenviar convite
export async function resendConviteEquipe(
  conviteId: string,
): Promise<ConviteEquipeData> {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

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
      await sendConviteEmail({
        email: updatedConvite.email,
        nome: updatedConvite.nome,
        nomeEscritorio: tenant.name,
        token: updatedConvite.token,
        expiraEm: updatedConvite.expiraEm,
        observacoes: updatedConvite.observacoes,
        cargo: updatedConvite.cargo?.nome,
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
    nome: updatedConvite.nome,
    cargoId: updatedConvite.cargoId,
    role: updatedConvite.role,
    status: updatedConvite.status,
    expiraEm: updatedConvite.expiraEm,
    aceitoEm: updatedConvite.aceitoEm,
    rejeitadoEm: updatedConvite.rejeitadoEm,
    observacoes: updatedConvite.observacoes,
    enviadoPor: updatedConvite.enviadoPor,
    createdAt: updatedConvite.createdAt,
    updatedAt: updatedConvite.updatedAt,
    cargo: updatedConvite.cargo,
    enviadoPorUsuario: updatedConvite.enviadoPorUsuario,
  };
}

// Cancelar convite
export async function cancelConviteEquipe(conviteId: string): Promise<void> {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

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
    nome: convite.nome,
    cargoId: convite.cargoId,
    role: convite.role,
    status: convite.status,
    expiraEm: convite.expiraEm,
    aceitoEm: convite.aceitoEm,
    rejeitadoEm: convite.rejeitadoEm,
    observacoes: convite.observacoes,
    enviadoPor: convite.enviadoPor,
    createdAt: convite.createdAt,
    updatedAt: convite.updatedAt,
    cargo: convite.cargo,
    enviadoPorUsuario: convite.enviadoPorUsuario,
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
        cargoId: convite.cargoId,
        ativo: true,
        dataInicio: new Date(),
      },
    });
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
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

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
