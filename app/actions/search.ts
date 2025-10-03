"use server";

import { prisma } from "@/app/lib/prisma";
import type { SearchResult } from "@/components/searchbar";

export async function searchContent(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  try {
    // Buscar processos
    const processos = await prisma.processo.findMany({
      where: {
        OR: [{ numero: { contains: searchTerm, mode: "insensitive" } }, { assunto: { contains: searchTerm, mode: "insensitive" } }, { observacoes: { contains: searchTerm, mode: "insensitive" } }],
      },
      take: 5,
      select: {
        id: true,
        numero: true,
        assunto: true,
        status: true,
        cliente: {
          select: {
            nome: true,
          },
        },
      },
    });

    processos.forEach((processo) => {
      results.push({
        id: `processo-${processo.id}`,
        type: "processo",
        title: processo.numero,
        description: `${processo.assunto} - ${processo.cliente.nome}`,
        href: `/processos/${processo.id}`,
        status: processo.status,
        statusColor: getStatusColor(processo.status),
      });
    });

    // Buscar clientes
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nome: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { cpf: { contains: searchTerm, mode: "insensitive" } },
          { cnpj: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
      },
    });

    clientes.forEach((cliente) => {
      results.push({
        id: `cliente-${cliente.id}`,
        type: "cliente",
        title: cliente.nome,
        description: cliente.email || `${cliente.tipo === "PESSOA_FISICA" ? "Pessoa Física" : "Pessoa Jurídica"}`,
        href: `/clientes/${cliente.id}`,
        status: cliente.tipo === "PESSOA_FISICA" ? "PF" : "PJ",
        statusColor: cliente.tipo === "PESSOA_FISICA" ? "primary" : "secondary",
      });
    });

    // Buscar documentos
    const documentos = await prisma.documento.findMany({
      where: {
        OR: [{ titulo: { contains: searchTerm, mode: "insensitive" } }, { descricao: { contains: searchTerm, mode: "insensitive" } }, { nomeArquivo: { contains: searchTerm, mode: "insensitive" } }],
      },
      take: 5,
      select: {
        id: true,
        titulo: true,
        nomeArquivo: true,
        tipo: true,
        processo: {
          select: {
            numero: true,
          },
        },
      },
    });

    documentos.forEach((documento) => {
      results.push({
        id: `documento-${documento.id}`,
        type: "documento",
        title: documento.titulo,
        description: `${documento.nomeArquivo} - Processo: ${documento.processo.numero}`,
        href: `/documentos/${documento.id}`,
        status: documento.tipo,
        statusColor: "default",
      });
    });

    // Buscar usuários (apenas se for admin)
    const usuarios = await prisma.usuario.findMany({
      where: {
        OR: [{ nome: { contains: searchTerm, mode: "insensitive" } }, { email: { contains: searchTerm, mode: "insensitive" } }],
      },
      take: 3,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
    });

    usuarios.forEach((usuario) => {
      results.push({
        id: `usuario-${usuario.id}`,
        type: "usuario",
        title: usuario.nome,
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

function getStatusColor(status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" {
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
