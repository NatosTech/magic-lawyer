"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

/**
 * Busca a UF principal do tenant (baseada no endereço principal)
 */
export async function getTenantUF(): Promise<string | null> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar endereço principal
  const enderecoPrincipal = await prisma.endereco.findFirst({
    where: {
      tenantId: session.user.tenantId,
      principal: true,
    },
    select: {
      estado: true,
    },
  });

  if (enderecoPrincipal?.estado) {
    return enderecoPrincipal.estado;
  }

  // Fallback: buscar o primeiro endereço se não houver principal
  const primeiroEndereco = await prisma.endereco.findFirst({
    where: {
      tenantId: session.user.tenantId,
    },
    select: {
      estado: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return primeiroEndereco?.estado || null;
}

/**
 * Lista todas as UFs onde o tenant tem processos
 */
export async function getProcessosUFs(): Promise<string[]> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar processos com tribunal
  const processos = await prisma.processo.findMany({
    where: {
      tenantId: session.user.tenantId,
      tribunalId: { not: null },
      deletedAt: null,
    },
    include: {
      tribunal: {
        select: {
          uf: true,
        },
      },
    },
  });

  // Extrair UFs únicas e válidas
  const ufs = new Set<string>();

  processos.forEach((processo) => {
    if (processo.tribunal?.uf) {
      ufs.add(processo.tribunal.uf);
    }
  });

  return Array.from(ufs).sort();
}

/**
 * Lista todos os tribunais de uma UF específica
 */
export async function getTribunaisPorUF(uf: string): Promise<
  Array<{
    id: string;
    nome: string;
    sigla: string | null;
    uf: string | null;
    siteUrl: string | null;
    esfera: string | null;
  }>
> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  const tribunais = await prisma.tribunal.findMany({
    where: {
      tenantId: session.user.tenantId,
      uf: uf,
    },
    select: {
      id: true,
      nome: true,
      sigla: true,
      uf: true,
      siteUrl: true,
      esfera: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return tribunais;
}

/**
 * Busca todas as UFs disponíveis (tenant + processos)
 */
export async function getUFsDisponiveis(): Promise<string[]> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  const [tenantUF, processosUFs] = await Promise.all([
    getTenantUF(),
    getProcessosUFs(),
  ]);

  // Combinar e remover duplicatas
  const ufs = new Set<string>();

  if (tenantUF) {
    ufs.add(tenantUF);
  }
  processosUFs.forEach((uf) => ufs.add(uf));

  return Array.from(ufs).sort();
}
