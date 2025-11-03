"use server";

import { revalidatePath } from "next/cache";

import { UserRole } from "@/app/generated/prisma";
import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { NotificationHelper } from "@/app/lib/notifications/notification-helper";
import { getTenantAccessibleModules } from "@/app/lib/tenant-modules";
import { publishRealtimeEvent } from "@/app/lib/realtime/publisher";

// ===== TIPOS E INTERFACES =====

export interface CargoData {
  id: string;
  nome: string;
  descricao?: string;
  nivel: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  usuariosCount: number;
  permissoes: CargoPermissaoData[];
}

export interface CargoPermissaoData {
  id: string;
  modulo: string;
  acao: string;
  permitido: boolean;
}

export interface UsuarioEquipeData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  active: boolean;
  avatarUrl?: string;
  isExterno?: boolean; // Para advogados
  cargos: CargoData[];
  vinculacoes: UsuarioVinculacaoData[];
  permissoesIndividuais: UsuarioPermissaoIndividualData[];
}

export interface UsuarioVinculacaoData {
  id: string;
  advogadoId: string;
  advogadoNome: string;
  tipo: string;
  ativo: boolean;
  dataInicio: Date;
  dataFim?: Date;
  observacoes?: string;
}

export interface UsuarioPermissaoIndividualData {
  id: string;
  modulo: string;
  acao: string;
  permitido: boolean;
  motivo?: string;
}

// ===== CRUD DE CARGOS =====

export async function getCargos(): Promise<CargoData[]> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  const cargos = await prisma.cargo.findMany({
    where: {
      tenantId: session.user.tenantId,
    },
    include: {
      usuarios: {
        where: { ativo: true },
        select: { id: true },
      },
      permissoes: true,
    },
    orderBy: [{ nivel: "asc" }, { nome: "asc" }],
  });

  return cargos.map((cargo) => ({
    id: cargo.id,
    nome: cargo.nome,
    descricao: cargo.descricao || undefined,
    nivel: cargo.nivel,
    ativo: cargo.ativo,
    createdAt: cargo.createdAt,
    updatedAt: cargo.updatedAt,
    usuariosCount: cargo.usuarios.length,
    permissoes: cargo.permissoes.map((permissao) => ({
      id: permissao.id,
      modulo: permissao.modulo,
      acao: permissao.acao,
      permitido: permissao.permitido,
    })),
  }));
}

export async function createCargo(data: {
  nome: string;
  descricao?: string;
  nivel: number;
  permissoes: { modulo: string; acao: string; permitido: boolean }[];
}): Promise<CargoData> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error("Apenas administradores podem criar cargos");
  }

  const cargo = await prisma.cargo.create({
    data: {
      tenantId: session.user.tenantId,
      nome: data.nome,
      descricao: data.descricao,
      nivel: data.nivel,
      permissoes: {
        create: data.permissoes.map((permissao) => ({
          tenantId: session.user.tenantId!,
          modulo: permissao.modulo,
          acao: permissao.acao,
          permitido: permissao.permitido,
        })),
      },
    },
    include: {
      usuarios: {
        where: { ativo: true },
        select: { id: true },
      },
      permissoes: true,
    },
  });

  revalidatePath("/equipe");

  // Publicar evento realtime
  publishRealtimeEvent("cargo-update", {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    payload: {
      cargoId: cargo.id,
      action: "created",
      cargo: {
        id: cargo.id,
        nome: cargo.nome,
        nivel: cargo.nivel,
        ativo: cargo.ativo,
      },
      changedBy: session.user.id!,
    },
  }).catch((error) => {
    console.error("[realtime] Falha ao publicar evento cargo-update", error);
  });

  return {
    id: cargo.id,
    nome: cargo.nome,
    descricao: cargo.descricao || undefined,
    nivel: cargo.nivel,
    ativo: cargo.ativo,
    createdAt: cargo.createdAt,
    updatedAt: cargo.updatedAt,
    usuariosCount: cargo.usuarios?.length || 0,
    permissoes: cargo.permissoes?.map((permissao) => ({
      id: permissao.id,
      modulo: permissao.modulo,
      acao: permissao.acao,
      permitido: permissao.permitido,
    })),
  };
}

export async function updateCargo(
  cargoId: string,
  data: {
    nome: string;
    descricao?: string;
    nivel: number;
    ativo: boolean;
    permissoes: { modulo: string; acao: string; permitido: boolean }[];
  },
): Promise<CargoData> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error("Apenas administradores podem editar cargos");
  }

  // Atualizar cargo
  const cargo = await prisma.cargo.update({
    where: {
      id: cargoId,
      tenantId: session.user.tenantId,
    },
    data: {
      nome: data.nome,
      descricao: data.descricao,
      nivel: data.nivel,
      ativo: data.ativo,
    },
  });

  // Atualizar permissões
  await prisma.cargoPermissao.deleteMany({
    where: {
      cargoId: cargoId,
      tenantId: session.user.tenantId,
    },
  });

  await prisma.cargoPermissao.createMany({
    data: data.permissoes.map((permissao) => ({
      tenantId: session.user.tenantId!,
      cargoId: cargoId,
      modulo: permissao.modulo,
      acao: permissao.acao,
      permitido: permissao.permitido,
    })),
  });

  revalidatePath("/equipe");

  // Retornar cargo atualizado
  const cargoAtualizado = await prisma.cargo.findUnique({
    where: { id: cargoId },
    include: {
      usuarios: {
        where: { ativo: true },
        select: { id: true },
      },
      permissoes: true,
    },
  });

  if (!cargoAtualizado) {
    throw new Error("Cargo não encontrado");
  }

  // Publicar evento realtime
  publishRealtimeEvent("cargo-update", {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    payload: {
      cargoId: cargoAtualizado.id,
      action: "updated",
      cargo: {
        id: cargoAtualizado.id,
        nome: cargoAtualizado.nome,
        nivel: cargoAtualizado.nivel,
        ativo: cargoAtualizado.ativo,
      },
      changedBy: session.user.id!,
    },
  }).catch((error) => {
    console.error("[realtime] Falha ao publicar evento cargo-update", error);
  });

  return {
    id: cargoAtualizado.id,
    nome: cargoAtualizado.nome,
    descricao: cargoAtualizado.descricao || undefined,
    nivel: cargoAtualizado.nivel,
    ativo: cargoAtualizado.ativo,
    createdAt: cargoAtualizado.createdAt,
    updatedAt: cargoAtualizado.updatedAt,
    usuariosCount: cargoAtualizado.usuarios?.length || 0,
    permissoes: cargoAtualizado.permissoes?.map((permissao) => ({
      id: permissao.id,
      modulo: permissao.modulo,
      acao: permissao.acao,
      permitido: permissao.permitido,
    })),
  };
}

export async function deleteCargo(cargoId: string): Promise<void> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error("Apenas administradores podem excluir cargos");
  }

  // Verificar se há usuários vinculados ao cargo
  const usuariosVinculados = await prisma.usuarioCargo.count({
    where: {
      cargoId: cargoId,
      tenantId: session.user.tenantId,
      ativo: true,
    },
  });

  if (usuariosVinculados > 0) {
    throw new Error("Não é possível excluir cargo com usuários vinculados");
  }

  await prisma.cargo.delete({
    where: {
      id: cargoId,
      tenantId: session.user.tenantId,
    },
  });

  revalidatePath("/equipe");

  // Publicar evento realtime
  publishRealtimeEvent("cargo-update", {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    payload: {
      cargoId: cargoId,
      action: "deleted",
      changedBy: session.user.id!,
    },
  }).catch((error) => {
    console.error("[realtime] Falha ao publicar evento cargo-update", error);
  });
}

// ===== GESTÃO DE USUÁRIOS DA EQUIPE =====

export async function getUsuariosEquipe(): Promise<UsuarioEquipeData[]> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  const usuarios = await prisma.usuario.findMany({
    where: {
      tenantId: session.user.tenantId,
    },
    include: {
      cargos: {
        where: { ativo: true },
        include: {
          cargo: {
            include: {
              permissoes: true,
            },
          },
        },
      },
      vinculacoesComoServidor: {
        where: { ativo: true },
        include: {
          advogado: {
            include: {
              usuario: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      permissoesIndividuais: true,
      advogado: {
        select: {
          isExterno: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
  });

  return usuarios.map((usuario) => ({
    id: usuario.id,
    email: usuario.email,
    firstName: usuario.firstName || undefined,
    lastName: usuario.lastName || undefined,
    role: usuario.role,
    active: usuario.active,
    avatarUrl: usuario.avatarUrl || undefined,
    isExterno: usuario.advogado?.isExterno,
    cargos: usuario.cargos.map((uc) => ({
      id: uc.cargo.id,
      nome: uc.cargo.nome,
      descricao: uc.cargo.descricao || undefined,
      nivel: uc.cargo.nivel,
      ativo: uc.cargo.ativo,
      createdAt: uc.cargo.createdAt,
      updatedAt: uc.cargo.updatedAt,
      usuariosCount: 0, // Será calculado separadamente
      permissoes: uc.cargo.permissoes.map((permissao) => ({
        id: permissao.id,
        modulo: permissao.modulo,
        acao: permissao.acao,
        permitido: permissao.permitido,
      })),
    })),
    vinculacoes: usuario.vinculacoesComoServidor.map((vinculacao) => ({
      id: vinculacao.id,
      advogadoId: vinculacao.advogadoId,
      advogadoNome:
        `${vinculacao.advogado.usuario.firstName || ""} ${vinculacao.advogado.usuario.lastName || ""}`.trim(),
      tipo: vinculacao.tipo,
      ativo: vinculacao.ativo,
      dataInicio: vinculacao.dataInicio,
      dataFim: vinculacao.dataFim || undefined,
      observacoes: vinculacao.observacoes || undefined,
    })),
    permissoesIndividuais: usuario.permissoesIndividuais.map((permissao) => ({
      id: permissao.id,
      modulo: permissao.modulo,
      acao: permissao.acao,
      permitido: permissao.permitido,
      motivo: permissao.motivo || undefined,
    })),
  }));
}

export async function atribuirCargoUsuario(
  usuarioId: string,
  cargoId: string,
): Promise<void> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error("Apenas administradores podem atribuir cargos");
  }

  // Verificar se o cargo existe
  const cargo = await prisma.cargo.findFirst({
    where: {
      id: cargoId,
      tenantId: session.user.tenantId,
      ativo: true,
    },
  });

  if (!cargo) {
    throw new Error("Cargo não encontrado");
  }

  // Verificar se o usuário existe
  const usuario = await prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      tenantId: session.user.tenantId,
    },
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado");
  }

  // Desativar cargo atual se existir
  await prisma.usuarioCargo.updateMany({
    where: {
      usuarioId: usuarioId,
      tenantId: session.user.tenantId,
      ativo: true,
    },
    data: {
      ativo: false,
      dataFim: new Date(),
    },
  });

  // Atribuir novo cargo
  await prisma.usuarioCargo.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: usuarioId,
      cargoId: cargoId,
      ativo: true,
      dataInicio: new Date(),
    },
  });

  // Registrar no histórico
  await prisma.equipeHistorico.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: usuarioId,
      acao: "cargo_alterado",
      dadosAntigos: { cargoAnterior: "N/A" },
      dadosNovos: { cargoNovo: cargo.nome },
      motivo: `Cargo alterado para ${cargo.nome}`,
      realizadoPor: session.user.id!,
    },
  });

  revalidatePath("/equipe");
}

export async function vincularUsuarioAdvogado(
  usuarioId: string,
  advogadoId: string,
  tipo: string,
  observacoes?: string,
): Promise<void> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error(
      "Apenas administradores podem vincular usuários a advogados",
    );
  }

  // Verificar se a vinculação já existe
  const vinculacaoExistente = await prisma.usuarioVinculacao.findFirst({
    where: {
      usuarioId: usuarioId,
      advogadoId: advogadoId,
      tenantId: session.user.tenantId,
      ativo: true,
    },
  });

  if (vinculacaoExistente) {
    throw new Error("Usuário já está vinculado a este advogado");
  }

  // Criar vinculação
  await prisma.usuarioVinculacao.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: usuarioId,
      advogadoId: advogadoId,
      tipo: tipo,
      ativo: true,
      dataInicio: new Date(),
      observacoes: observacoes,
    },
  });

  // Registrar no histórico
  await prisma.equipeHistorico.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: usuarioId,
      acao: "vinculacao_alterada",
      dadosAntigos: { vinculacaoAnterior: "N/A" },
      dadosNovos: { vinculacaoNova: `${tipo} vinculado ao advogado` },
      motivo: `Vinculação criada: ${tipo}`,
      realizadoPor: session.user.id!,
    },
  });

  revalidatePath("/equipe");
}

export async function desvincularUsuarioAdvogado(
  vinculacaoId: string,
): Promise<void> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error("Apenas administradores podem desvincular usuários");
  }

  // Desativar vinculação
  await prisma.usuarioVinculacao.update({
    where: {
      id: vinculacaoId,
      tenantId: session.user.tenantId,
    },
    data: {
      ativo: false,
      dataFim: new Date(),
    },
  });

  revalidatePath("/equipe");
}

// ===== SISTEMA DE PERMISSÕES =====

export async function verificarPermissao(
  modulo: string,
  acao: string,
  usuarioId?: string,
): Promise<boolean> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    return false;
  }

  const targetUsuarioId = usuarioId || session.user.id;

  // Admin tem todas as permissões
  if (session.user.role === UserRole.ADMIN) {
    return true;
  }

  // Verificar permissões individuais primeiro
  const permissaoIndividual = await prisma.usuarioPermissaoIndividual.findFirst(
    {
      where: {
        tenantId: session.user.tenantId,
        usuarioId: targetUsuarioId,
        modulo: modulo,
        acao: acao,
      },
    },
  );

  if (permissaoIndividual) {
    return permissaoIndividual.permitido;
  }

  // Verificar permissões do cargo
  const usuarioCargo = await prisma.usuarioCargo.findFirst({
    where: {
      tenantId: session.user.tenantId,
      usuarioId: targetUsuarioId,
      ativo: true,
    },
    include: {
      cargo: {
        include: {
          permissoes: true,
        },
      },
    },
  });

  if (usuarioCargo?.cargo) {
    const permissaoCargo = usuarioCargo.cargo.permissoes.find(
      (p) => p.modulo === modulo && p.acao === acao,
    );

    if (permissaoCargo) {
      return permissaoCargo.permitido;
    }
  }

  // Permissões padrão baseadas no role
  const rolePermissions: Record<UserRole, Record<string, string[]>> = {
    [UserRole.ADMIN]: {
      processos: ["criar", "editar", "excluir", "visualizar", "exportar"],
      clientes: ["criar", "editar", "excluir", "visualizar", "exportar"],
      advogados: ["criar", "editar", "excluir", "visualizar", "exportar"],
      financeiro: ["criar", "editar", "excluir", "visualizar", "exportar"],
      equipe: ["criar", "editar", "excluir", "visualizar", "exportar"],
      relatorios: ["criar", "editar", "excluir", "visualizar", "exportar"],
    },
    [UserRole.FINANCEIRO]: {
      processos: ["visualizar"],
      clientes: ["visualizar"],
      advogados: ["visualizar"],
      financeiro: ["criar", "editar", "excluir", "visualizar", "exportar"],
      equipe: ["visualizar"],
      relatorios: ["visualizar", "exportar"],
    },
    [UserRole.SUPER_ADMIN]: {
      processos: ["criar", "editar", "excluir", "visualizar", "exportar"],
      clientes: ["criar", "editar", "excluir", "visualizar", "exportar"],
      advogados: ["criar", "editar", "excluir", "visualizar", "exportar"],
      financeiro: ["criar", "editar", "excluir", "visualizar", "exportar"],
      equipe: ["criar", "editar", "excluir", "visualizar", "exportar"],
      relatorios: ["criar", "editar", "excluir", "visualizar", "exportar"],
    },
    [UserRole.ADVOGADO]: {
      processos: ["criar", "editar", "visualizar", "exportar"],
      clientes: ["criar", "editar", "visualizar", "exportar"],
      advogados: ["visualizar"],
      financeiro: ["visualizar"],
      equipe: ["visualizar"],
      relatorios: ["visualizar", "exportar"],
    },
    [UserRole.SECRETARIA]: {
      processos: ["criar", "editar", "visualizar", "exportar"],
      clientes: ["criar", "editar", "visualizar", "exportar"],
      advogados: ["visualizar"],
      financeiro: ["visualizar"],
      equipe: ["visualizar"],
      relatorios: ["visualizar", "exportar"],
    },
    [UserRole.CLIENTE]: {
      processos: ["visualizar"],
      clientes: ["visualizar"],
      advogados: ["visualizar"],
      financeiro: ["visualizar"],
      equipe: [],
      relatorios: ["visualizar"],
    },
  };

  const userRolePermissions = rolePermissions[session.user.role! as UserRole];

  if (userRolePermissions[modulo]?.includes(acao)) {
    return true;
  }

  return false;
}

export async function adicionarPermissaoIndividual(
  usuarioId: string,
  modulo: string,
  acao: string,
  permitido: boolean,
  motivo?: string,
): Promise<void> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error(
      "Apenas administradores podem adicionar permissões individuais",
    );
  }

  const actor = session.user as any;
  const actorName =
    `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim() ||
    actor.email ||
    actor.id;

  const existingPermission = await prisma.usuarioPermissaoIndividual.findUnique(
    {
      where: {
        tenantId_usuarioId_modulo_acao: {
          tenantId: session.user.tenantId,
          usuarioId: usuarioId,
          modulo: modulo,
          acao: acao,
        },
      },
    },
  );

  await prisma.usuarioPermissaoIndividual.upsert({
    where: {
      tenantId_usuarioId_modulo_acao: {
        tenantId: session.user.tenantId,
        usuarioId: usuarioId,
        modulo: modulo,
        acao: acao,
      },
    },
    update: {
      permitido: permitido,
      motivo: motivo,
    },
    create: {
      tenantId: session.user.tenantId,
      usuarioId: usuarioId,
      modulo: modulo,
      acao: acao,
      permitido: permitido,
      motivo: motivo,
    },
  });

  // Registrar no histórico
  await prisma.equipeHistorico.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: usuarioId,
      acao: "permissao_alterada",
      dadosAntigos: { permissaoAnterior: `${modulo}.${acao}: N/A` },
      dadosNovos: {
        permissaoNova: `${modulo}.${acao}: ${permitido ? "PERMITIDO" : "NEGADO"}`,
      },
      motivo: motivo || `Permissão ${permitido ? "concedida" : "negada"}`,
      realizadoPor: session.user.id!,
    },
  });

  try {
    const targetUser = await prisma.usuario.findFirst({
      where: { id: usuarioId, tenantId: session.user.tenantId },
      select: { firstName: true, lastName: true, email: true },
    });

    const admins = await prisma.usuario.findMany({
      where: {
        tenantId: session.user.tenantId,
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

    const recipients = new Set<string>();

    if (usuarioId !== session.user.id) {
      recipients.add(usuarioId);
    }

    admins.forEach(({ id }) => {
      if (id !== usuarioId) {
        recipients.add(id);
      }
    });

    if (recipients.size && targetUser) {
      const permissaoLabel = `${modulo}.${acao}`;
      const oldPermissions = existingPermission
        ? [
            `${permissaoLabel}: ${existingPermission.permitido ? "PERMITIDO" : "NEGADO"}`,
          ]
        : [];
      const newPermissions = [
        `${permissaoLabel}: ${permitido ? "PERMITIDO" : "NEGADO"}`,
      ];

      const targetUserName =
        `${targetUser.firstName ?? ""} ${targetUser.lastName ?? ""}`.trim() ||
        targetUser.email ||
        usuarioId;

      await Promise.all(
        Array.from(recipients).map((id) =>
          NotificationHelper.notifyEquipePermissionsChanged(
            session.user.tenantId!,
            id,
            {
              usuarioId,
              nome: targetUserName,
              permissoesAntigas: oldPermissions,
              permissoesNovas: newPermissions,
              alteradoPor: actorName,
            },
          ),
        ),
      );
    }
  } catch (error) {
    console.warn(
      "Falha ao emitir notificações de equipe.permissions_changed",
      error,
    );
  }

  revalidatePath("/equipe");
}

// ===== DASHBOARD DE EQUIPE =====

export async function getDashboardEquipe(): Promise<{
  totalUsuarios: number;
  totalCargos: number;
  usuariosPorCargo: { cargo: string; count: number }[];
  vinculacoesAtivas: number;
  permissoesIndividuais: number;
}> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  const [
    totalUsuarios,
    totalCargos,
    usuariosPorCargo,
    vinculacoesAtivas,
    permissoesIndividuais,
  ] = await Promise.all([
    prisma.usuario.count({
      where: { tenantId: session.user.tenantId },
    }),
    prisma.cargo.count({
      where: { tenantId: session.user.tenantId, ativo: true },
    }),
    prisma.usuarioCargo.groupBy({
      by: ["cargoId"],
      where: {
        tenantId: session.user.tenantId,
        ativo: true,
      },
      _count: { cargoId: true },
    }),
    prisma.usuarioVinculacao.count({
      where: {
        tenantId: session.user.tenantId,
        ativo: true,
      },
    }),
    prisma.usuarioPermissaoIndividual.count({
      where: { tenantId: session.user.tenantId },
    }),
  ]);

  // Buscar nomes dos cargos
  const cargos = await prisma.cargo.findMany({
    where: { tenantId: session.user.tenantId },
    select: { id: true, nome: true },
  });

  const usuariosPorCargoComNome = usuariosPorCargo.map((item) => {
    const cargo = cargos.find((c) => c.id === item.cargoId);

    return {
      cargo: cargo?.nome || "Cargo não encontrado",
      count: item._count.cargoId,
    };
  });

  return {
    totalUsuarios,
    totalCargos,
    usuariosPorCargo: usuariosPorCargoComNome,
    vinculacoesAtivas,
    permissoesIndividuais,
  };
}

// ===== MÓDULOS DO TENANT =====

export interface ModuloInfo {
  slug: string;
  nome: string;
  descricao?: string;
}

/**
 * Lista os módulos acessíveis para o tenant logado com detalhes completos
 * Reutiliza a lógica resiliente de getTenantAccessibleModules para garantir
 * fallbacks corretos e evitar duplicação de código
 */
export async function listModulosPorTenant(): Promise<ModuloInfo[]> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  const tenantId = session.user.tenantId;

  // 1. Obter slugs de módulos acessíveis usando a lógica resiliente existente
  const moduleSlugs = await getTenantAccessibleModules(tenantId);

  if (moduleSlugs.length === 0) {
    return [];
  }

  // 2. Buscar detalhes completos dos módulos a partir dos slugs
  const modulos = await prisma.modulo.findMany({
    where: {
      slug: {
        in: moduleSlugs,
      },
      ativo: true,
    },
    select: {
      slug: true,
      nome: true,
      descricao: true,
      ordem: true,
    },
    orderBy: { ordem: "asc" },
  });

  // 3. Ordenar manualmente de acordo com a ordem de moduleSlugs (fallback)
  const moduleMap = new Map(modulos.map((m) => [m.slug, m]));

  const orderedModulos = moduleSlugs
    .map((slug) => moduleMap.get(slug))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  // 4. Retornar no formato esperado
  return orderedModulos.map((m) => ({
    slug: m.slug,
    nome: m.nome,
    descricao: m.descricao || undefined,
  }));
}

/**
 * Atualiza dados de um usuário da equipe do tenant
 */
export async function updateUsuarioEquipe(
  usuarioId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    active?: boolean;
  },
): Promise<UsuarioEquipeData> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error("Apenas administradores podem editar usuários");
  }

  // Verificar se o usuário existe e pertence ao tenant
  const usuario = await prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      tenantId: session.user.tenantId,
    },
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado");
  }

  // Construir updateData apenas com campos definidos
  const updateData: Record<string, unknown> = {};

  if (data.firstName !== undefined && data.firstName !== usuario.firstName) {
    updateData.firstName = data.firstName;
  }

  if (data.lastName !== undefined && data.lastName !== usuario.lastName) {
    updateData.lastName = data.lastName;
  }

  // Validar email único se está sendo alterado
  if (data.email !== undefined && data.email !== usuario.email) {
    const existingUser = await prisma.usuario.findFirst({
      where: {
        email: data.email,
        tenantId: session.user.tenantId,
        id: { not: usuarioId },
      },
    });

    if (existingUser) {
      throw new Error("Este email já está em uso por outro usuário");
    }

    updateData.email = data.email;
  }

  if (data.phone !== undefined && data.phone !== usuario.phone) {
    updateData.phone = data.phone;
  }

  if (data.active !== undefined && data.active !== usuario.active) {
    updateData.active = data.active;
  }

  // Só atualizar se houver mudanças
  if (Object.keys(updateData).length > 0) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: updateData,
    });

    // Registrar no histórico
    await prisma.equipeHistorico.create({
      data: {
        tenantId: session.user.tenantId,
        usuarioId: usuarioId,
        acao: "dados_alterados",
        dadosAntigos: {
          firstName: usuario.firstName,
          lastName: usuario.lastName,
          email: usuario.email,
          phone: usuario.phone,
          active: usuario.active,
        },
        dadosNovos: updateData,
        motivo: "Dados do usuário atualizados pelo admin",
        realizadoPor: session.user.id!,
      },
    });
  }

  revalidatePath("/equipe");

  // Retornar usuário atualizado
  const usuarios = await getUsuariosEquipe();

  const updatedUser = usuarios.find((u) => u.id === usuarioId);

  if (!updatedUser) {
    throw new Error("Erro ao recuperar usuário atualizado");
  }

  // Publicar evento realtime
  publishRealtimeEvent("usuario-update", {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    payload: {
      usuarioId: updatedUser.id,
      action: "updated",
      usuario: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        active: updatedUser.active,
      },
      changedBy: session.user.id!,
    },
  }).catch((error) => {
    console.error("[realtime] Falha ao publicar evento usuario-update", error);
  });

  return updatedUser;
}
