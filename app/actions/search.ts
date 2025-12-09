"use server";

import type { SearchResult } from "@/components/searchbar";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";
import logger from "@/lib/logger";
import { UserRole } from "@/app/generated/prisma";

interface SearchOptions {
  tenantId?: string | null;
}

export async function searchContent(
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  const session = await getSession();

  logger.info("[search] searchContent chamado", {
    query,
    optionsTenantId: options.tenantId,
    hasSession: !!session,
    userId: session?.user?.id,
  });

  const sessionTenantId = session?.user?.tenantId ?? options.tenantId ?? null;
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
  const requestedTenantId = options.tenantId ?? sessionTenantId;

  logger.info("[search] contexto determinado", {
    sessionTenantId,
    userRole,
    isSuperAdmin,
    requestedTenantId,
  });

  const rawQuery = query.trim();
  const searchTerm = rawQuery.toLowerCase();
  const normalizedDigits = rawQuery.replace(/\D/g, "");

  const isQueryTooShort = !query.trim() || query.length < 2;

  logger.info("[search] validação de query", {
    rawQuery,
    isQueryTooShort,
    isSuperAdmin,
    allowEmpty: isSuperAdmin,
  });

  if (isQueryTooShort && !isSuperAdmin) {
    logger.info("[search] query muito curta para usuário normal");
    return [];
  }

  // Para Super Admin: permitir busca sem tenant específico (retorna agregados)
  // Para usuários normais: obrigatório ter tenantId da sessão
  if (!isSuperAdmin) {
    if (!requestedTenantId) {
      logger.warn("[search] usuário normal sem tenantId");
      return [];
    }
    if (requestedTenantId !== sessionTenantId) {
      logger.warn("[search] tentativa de acesso a tenant diferente", {
        requestedTenantId,
        sessionTenantId,
      });
      return [];
    }
  }

  const results: SearchResult[] = [];

  try {
    // Para Super Admin: retornar apenas agregados por tenant, sem dados sensíveis
    if (isSuperAdmin) {
      logger.info("[search] modo super admin", {
        requestedTenantId,
        searchTerm,
        isAllTenants: requestedTenantId === "ALL" || !requestedTenantId,
      });

      // Se não há query ou query vazia, retornar todos os tenants (limitado)
      const whereClause: any = {};
      
      if (requestedTenantId && requestedTenantId !== "ALL") {
        whereClause.id = requestedTenantId;
      }

      // Se há query, adicionar filtro de busca
      if (searchTerm && searchTerm.length > 0) {
        whereClause.OR = [
          { name: { contains: searchTerm, mode: "insensitive" as const } },
          { slug: { contains: searchTerm, mode: "insensitive" as const } },
          { domain: { contains: searchTerm, mode: "insensitive" as const } },
        ];
      }

      const tenants = await prisma.tenant.findMany({
        where: whereClause,
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          _count: {
            select: {
              processos: true,
              clientes: true,
              documentos: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      logger.info("[search] tenants encontrados para super admin", {
        count: tenants.length,
      });

      // Fallback: se a busca não casar, mas há tenant selecionado, retorna ele
      if (
        tenants.length === 0 &&
        requestedTenantId &&
        requestedTenantId !== "ALL"
      ) {
        logger.info("[search] tentando buscar tenant específico", {
          tenantId: requestedTenantId ?? undefined,
        });

        const tenant = await prisma.tenant.findUnique({
          where: { id: requestedTenantId },
          select: {
            id: true,
            name: true,
            slug: true,
            domain: true,
            _count: {
              select: {
                processos: true,
                clientes: true,
                documentos: true,
              },
            },
          },
        });

        if (tenant) {
          tenants.push(tenant);
          logger.info("[search] tenant específico encontrado", {
            tenantName: tenant.name,
          });
        }
      }

      tenants.forEach((tenant) => {
        results.push({
          id: `tenant-${tenant.id}`,
          type: "tenant",
          title: tenant.name,
          description: tenant.domain ?? tenant.slug,
          href: `/admin/tenants/${tenant.slug}`,
          status: `${tenant._count.processos} processos · ${tenant._count.clientes} clientes`,
          statusColor: "primary",
        });
      });

      logger.info("[search] resultados super admin", {
        total: results.length,
      });

      return results.slice(0, 10);
    }

    // Buscar processos
    logger.info("[search] processos query", {
      tenantId: requestedTenantId ?? undefined,
      rawQuery,
      searchTerm,
      normalizedDigits,
    });

    const processos = await prisma.processo.findMany({
      where: {
        tenantId: requestedTenantId ?? undefined,
        deletedAt: null,
        OR: [
          { numero: { contains: searchTerm, mode: "insensitive" as const } },
          // Permitir busca por dígitos apenas (caso o formato salvo seja diferente)
          ...(normalizedDigits.length >= 4
            ? [
                {
                  numero: {
                    contains: normalizedDigits,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
          { titulo: { contains: searchTerm, mode: "insensitive" as const } },
          { descricao: { contains: searchTerm, mode: "insensitive" as const } },
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

    logger.info("[search] processos encontrados", {
      tenantId: requestedTenantId ?? undefined,
      total: processos.length,
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
        tenantId: requestedTenantId ?? undefined,
        OR: [
          { nome: { contains: searchTerm, mode: "insensitive" as const } },
          { email: { contains: searchTerm, mode: "insensitive" as const } },
          { documento: { contains: searchTerm, mode: "insensitive" as const } },
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
      const tipoLabel =
        cliente.tipoPessoa === "FISICA" ? "Pessoa Física" : "Pessoa Jurídica";

      results.push({
        id: `cliente-${cliente.id}`,
        type: "cliente",
        title: cliente.nome,
        description: cliente.email || tipoLabel,
        href: `/clientes/${cliente.id}`,
        status: cliente.tipoPessoa === "FISICA" ? "PF" : "PJ",
        statusColor: cliente.tipoPessoa === "FISICA" ? "primary" : "secondary",
      });
    });

    // Buscar documentos
    const documentos = await prisma.documento.findMany({
      where: {
        tenantId: requestedTenantId ?? undefined,
        OR: [
          { nome: { contains: searchTerm, mode: "insensitive" as const } },
          { descricao: { contains: searchTerm, mode: "insensitive" as const } },
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
        documento.processo?.numero
          ? `Processo: ${documento.processo.numero}`
          : null,
      ].filter(Boolean) as string[];
      const description =
        descriptionParts.join(" - ") || "Documento cadastrado";

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
        ...(requestedTenantId
          ? { processos: { some: { tenantId: requestedTenantId } } }
          : {}),
        OR: [
          { nome: { contains: searchTerm, mode: "insensitive" as const } },
          { nomeCompleto: { contains: searchTerm, mode: "insensitive" as const } },
          { cpf: { contains: searchTerm, mode: "insensitive" as const } },
          { oab: { contains: searchTerm, mode: "insensitive" as const } },
          { email: { contains: searchTerm, mode: "insensitive" as const } },
          { vara: { contains: searchTerm, mode: "insensitive" as const } },
          { comarca: { contains: searchTerm, mode: "insensitive" as const } },
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
        tenantId: requestedTenantId ?? undefined,
        OR: [
          { firstName: { contains: searchTerm, mode: "insensitive" as const } },
          { lastName: { contains: searchTerm, mode: "insensitive" as const } },
          { email: { contains: searchTerm, mode: "insensitive" as const } },
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
      const fullName =
        `${usuario.firstName ?? ""} ${usuario.lastName ?? ""}`.trim();

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

    if (results.length === 0) {
      logger.info("[search] Nenhum resultado", {
        query: rawQuery,
        tenant: requestedTenantId,
        userId: session?.user?.id,
        role: userRole,
        scope: "tenant-aggregated",
      });
    }

    return results.slice(0, 10); // Limitar a 10 resultados
  } catch (error) {
    logger.error("Erro na busca:", error);

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
