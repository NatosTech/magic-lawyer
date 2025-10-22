"use server";

import { auth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
  const session = await auth();
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
    orderBy: [
      { nivel: 'asc' },
      { nome: 'asc' },
    ],
  });

  return cargos.map(cargo => ({
    id: cargo.id,
    nome: cargo.nome,
    descricao: cargo.descricao,
    nivel: cargo.nivel,
    ativo: cargo.ativo,
    createdAt: cargo.createdAt,
    updatedAt: cargo.updatedAt,
    usuariosCount: cargo.usuarios.length,
    permissoes: cargo.permissoes.map(permissao => ({
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
  const session = await auth();
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
        create: data.permissoes.map(permissao => ({
          tenantId: session.user.tenantId,
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

  return {
    id: cargo.id,
    nome: cargo.nome,
    descricao: cargo.descricao,
    nivel: cargo.nivel,
    ativo: cargo.ativo,
    createdAt: cargo.createdAt,
    updatedAt: cargo.updatedAt,
    usuariosCount: cargo.usuarios.length,
    permissoes: cargo.permissoes.map(permissao => ({
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
  }
): Promise<CargoData> {
  const session = await auth();
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
    data: data.permissoes.map(permissao => ({
      tenantId: session.user.tenantId,
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

  return {
    id: cargoAtualizado.id,
    nome: cargoAtualizado.nome,
    descricao: cargoAtualizado.descricao,
    nivel: cargoAtualizado.nivel,
    ativo: cargoAtualizado.ativo,
    createdAt: cargoAtualizado.createdAt,
    updatedAt: cargoAtualizado.updatedAt,
    usuariosCount: cargoAtualizado.usuarios.length,
    permissoes: cargoAtualizado.permissoes.map(permissao => ({
      id: permissao.id,
      modulo: permissao.modulo,
      acao: permissao.acao,
      permitido: permissao.permitido,
    })),
  };
}

export async function deleteCargo(cargoId: string): Promise<void> {
  const session = await auth();
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
}

// ===== GESTÃO DE USUÁRIOS DA EQUIPE =====

export async function getUsuariosEquipe(): Promise<UsuarioEquipeData[]> {
  const session = await auth();
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
    },
    orderBy: [
      { role: 'asc' },
      { firstName: 'asc' },
    ],
  });

  return usuarios.map(usuario => ({
    id: usuario.id,
    email: usuario.email,
    firstName: usuario.firstName,
    lastName: usuario.lastName,
    role: usuario.role,
    active: usuario.active,
    avatarUrl: usuario.avatarUrl,
    cargos: usuario.cargos.map(uc => ({
      id: uc.cargo.id,
      nome: uc.cargo.nome,
      descricao: uc.cargo.descricao,
      nivel: uc.cargo.nivel,
      ativo: uc.cargo.ativo,
      createdAt: uc.cargo.createdAt,
      updatedAt: uc.cargo.updatedAt,
      usuariosCount: 0, // Será calculado separadamente
      permissoes: uc.cargo.permissoes.map(permissao => ({
        id: permissao.id,
        modulo: permissao.modulo,
        acao: permissao.acao,
        permitido: permissao.permitido,
      })),
    })),
    vinculacoes: usuario.vinculacoesComoServidor.map(vinculacao => ({
      id: vinculacao.id,
      advogadoId: vinculacao.advogadoId,
      advogadoNome: `${vinculacao.advogado.usuario.firstName || ''} ${vinculacao.advogado.usuario.lastName || ''}`.trim(),
      tipo: vinculacao.tipo,
      ativo: vinculacao.ativo,
      dataInicio: vinculacao.dataInicio,
      dataFim: vinculacao.dataFim,
      observacoes: vinculacao.observacoes,
    })),
    permissoesIndividuais: usuario.permissoesIndividuais.map(permissao => ({
      id: permissao.id,
      modulo: permissao.modulo,
      acao: permissao.acao,
      permitido: permissao.permitido,
      motivo: permissao.motivo,
    })),
  }));
}

export async function atribuirCargoUsuario(
  usuarioId: string,
  cargoId: string
): Promise<void> {
  const session = await auth();
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
      acao: 'cargo_alterado',
      dadosAntigos: { cargoAnterior: 'N/A' },
      dadosNovos: { cargoNovo: cargo.nome },
      motivo: `Cargo alterado para ${cargo.nome}`,
      realizadoPor: session.user.id,
    },
  });

  revalidatePath("/equipe");
}

export async function vincularUsuarioAdvogado(
  usuarioId: string,
  advogadoId: string,
  tipo: string,
  observacoes?: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error("Apenas administradores podem vincular usuários a advogados");
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
      acao: 'vinculacao_alterada',
      dadosAntigos: { vinculacaoAnterior: 'N/A' },
      dadosNovos: { vinculacaoNova: `${tipo} vinculado ao advogado` },
      motivo: `Vinculação criada: ${tipo}`,
      realizadoPor: session.user.id,
    },
  });

  revalidatePath("/equipe");
}

export async function desvincularUsuarioAdvogado(
  vinculacaoId: string
): Promise<void> {
  const session = await auth();
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
  usuarioId?: string
): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return false;
  }

  const targetUsuarioId = usuarioId || session.user.id;

  // Admin tem todas as permissões
  if (session.user.role === UserRole.ADMIN) {
    return true;
  }

  // Verificar permissões individuais primeiro
  const permissaoIndividual = await prisma.usuarioPermissaoIndividual.findFirst({
    where: {
      tenantId: session.user.tenantId,
      usuarioId: targetUsuarioId,
      modulo: modulo,
      acao: acao,
    },
  });

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
      p => p.modulo === modulo && p.acao === acao
    );
    
    if (permissaoCargo) {
      return permissaoCargo.permitido;
    }
  }

  // Permissões padrão baseadas no role
  const rolePermissions: Record<UserRole, Record<string, string[]>> = {
    [UserRole.ADMIN]: {
      processos: ['criar', 'editar', 'excluir', 'visualizar', 'exportar'],
      clientes: ['criar', 'editar', 'excluir', 'visualizar', 'exportar'],
      advogados: ['criar', 'editar', 'excluir', 'visualizar', 'exportar'],
      financeiro: ['criar', 'editar', 'excluir', 'visualizar', 'exportar'],
      equipe: ['criar', 'editar', 'excluir', 'visualizar', 'exportar'],
      relatorios: ['criar', 'editar', 'excluir', 'visualizar', 'exportar'],
    },
    [UserRole.ADVOGADO]: {
      processos: ['criar', 'editar', 'visualizar', 'exportar'],
      clientes: ['criar', 'editar', 'visualizar', 'exportar'],
      advogados: ['visualizar'],
      financeiro: ['visualizar'],
      equipe: ['visualizar'],
      relatorios: ['visualizar', 'exportar'],
    },
    [UserRole.SECRETARIA]: {
      processos: ['criar', 'editar', 'visualizar', 'exportar'],
      clientes: ['criar', 'editar', 'visualizar', 'exportar'],
      advogados: ['visualizar'],
      financeiro: ['visualizar'],
      equipe: ['visualizar'],
      relatorios: ['visualizar', 'exportar'],
    },
    [UserRole.CLIENTE]: {
      processos: ['visualizar'],
      clientes: ['visualizar'],
      advogados: ['visualizar'],
      financeiro: ['visualizar'],
      equipe: [],
      relatorios: ['visualizar'],
    },
  };

  const userRolePermissions = rolePermissions[session.user.role];
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
  motivo?: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Error("Apenas administradores podem adicionar permissões individuais");
  }

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
      acao: 'permissao_alterada',
      dadosAntigos: { permissaoAnterior: `${modulo}.${acao}: N/A` },
      dadosNovos: { permissaoNova: `${modulo}.${acao}: ${permitido ? 'PERMITIDO' : 'NEGADO'}` },
      motivo: motivo || `Permissão ${permitido ? 'concedida' : 'negada'}`,
      realizadoPor: session.user.id,
    },
  });

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
  const session = await auth();
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
      by: ['cargoId'],
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

  const usuariosPorCargoComNome = usuariosPorCargo.map(item => {
    const cargo = cargos.find(c => c.id === item.cargoId);
    return {
      cargo: cargo?.nome || 'Cargo não encontrado',
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
