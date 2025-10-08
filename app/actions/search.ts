"use server";

import type { SearchResult } from "@/components/searchbar";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

export async function searchContent(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  const session = await getSession();

  if (!session?.user?.tenantId) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  try {
    // Buscar processos
    const processos = await prisma.processo.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        OR: [
          { numero: { contains: searchTerm, mode: "insensitive" } },
          { titulo: { contains: searchTerm, mode: "insensitive" } },
          { descricao: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        numero: true,
        titulo: true,
        descricao: true,
        status: true,
        cliente: {
          select: {
            nome: true,
          },
        },
      },
    });

    processos.forEach((processo) => {
      const resumo = processo.titulo ?? processo.descricao ?? "";
      const clienteNome = processo.cliente?.nome ?? "Cliente não informado";

      results.push({
        id: `processo-${processo.id}`,
        type: "processo",
        title: processo.numero,
        description: resumo ? `${resumo} - ${clienteNome}` : clienteNome,
        href: `/processos/${processo.id}`,
        status: processo.status,
        statusColor: getStatusColor(processo.status),
      });
    });

    // Buscar clientes
    const clientes = await prisma.cliente.findMany({
      where: {
        tenantId: session.user.tenantId,
        OR: [
          { nome: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { documento: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        nome: true,
        email: true,
        tipoPessoa: true,
      },
    });

    clientes.forEach((cliente) => {
      const tipoLabel = cliente.tipoPessoa === "FISICA" ? "Pessoa Física" : "Pessoa Jurídica";
      results.push({
        id: `cliente-${cliente.id}`,
        type: "cliente",
        title: cliente.nome,
        description:
          cliente.email || tipoLabel,
        href: `/clientes/${cliente.id}`,
        status: cliente.tipoPessoa === "FISICA" ? "PF" : "PJ",
        statusColor: cliente.tipoPessoa === "FISICA" ? "primary" : "secondary",
      });
    });

    // Buscar documentos
    const documentos = await prisma.documento.findMany({
      where: {
        tenantId: session.user.tenantId,
        OR: [
          { nome: { contains: searchTerm, mode: "insensitive" } },
          { descricao: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        nome: true,
        descricao: true,
        tipo: true,
        processo: {
          select: {
            numero: true,
          },
        },
      },
    });

    documentos.forEach((documento) => {
      const descriptionParts = [
        documento.descricao?.trim() || null,
        documento.processo?.numero ? `Processo: ${documento.processo.numero}` : null,
      ].filter(Boolean) as string[];
      const description = descriptionParts.join(" - ") || "Documento cadastrado";
      results.push({
        id: `documento-${documento.id}`,
        type: "documento",
        title: documento.nome,
        description,
        href: `/documentos/${documento.id}`,
        status: documento.tipo ?? "Documento",
        statusColor: "default",
      });
    });

    // Buscar juízes
    const juizes = await prisma.juiz.findMany({
      where: {
        OR: [
          { nome: { contains: searchTerm, mode: "insensitive" } },
          { nomeCompleto: { contains: searchTerm, mode: "insensitive" } },
          { cpf: { contains: searchTerm, mode: "insensitive" } },
          { oab: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { vara: { contains: searchTerm, mode: "insensitive" } },
          { comarca: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        nome: true,
        nomeCompleto: true,
        vara: true,
        comarca: true,
        status: true,
        nivel: true,
      },
    });

    juizes.forEach((juiz) => {
      results.push({
        id: `juiz-${juiz.id}`,
        type: "juiz",
        title: juiz.nomeCompleto || juiz.nome,
        description: `${juiz.vara || "Vara não informada"} - ${juiz.comarca || "Comarca não informada"}`,
        href: `/juizes/${juiz.id}`,
        status: juiz.status,
        statusColor: juiz.status === "ATIVO" ? "success" : "default",
      });
    });

    // Buscar usuários (apenas se for admin)
    const usuarios = await prisma.usuario.findMany({
      where: {
        tenantId: session.user.tenantId,
        OR: [
          { firstName: { contains: searchTerm, mode: "insensitive" } },
          { lastName: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    usuarios.forEach((usuario) => {
      const fullName = `${usuario.firstName ?? ""} ${usuario.lastName ?? ""}`.trim();
      results.push({
        id: `usuario-${usuario.id}`,
        type: "usuario",
        title: fullName || usuario.email,
        description: usuario.email,
        href: `/equipe/${usuario.id}`,
        status: usuario.role,
        statusColor: usuario.role === "ADMIN" ? "danger" : "default",
      });
    });

    // Ordenar resultados por relevância (título que começa com o termo primeiro)
    results.sort((a, b) => {
      const aStartsWith = a.title.toLowerCase().startsWith(searchTerm);
      const bStartsWith = b.title.toLowerCase().startsWith(searchTerm);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return a.title.localeCompare(b.title);
    });

    return results.slice(0, 10); // Limitar a 10 resultados
  } catch (error) {
    console.error("Erro na busca:", error);

    return [];
  }
}

function getStatusColor(
  status: string,
): "default" | "primary" | "secondary" | "success" | "warning" | "danger" {
  switch (status?.toUpperCase()) {
    case "ATIVO":
    case "EM_ANDAMENTO":
      return "success";
    case "PENDENTE":
      return "warning";
    case "CANCELADO":
    case "ARQUIVADO":
      return "danger";
    case "CONCLUIDO":
      return "primary";
    default:
      return "default";
  }
}
