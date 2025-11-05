import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";
import { getTenantAccessibleModules } from "@/app/lib/tenant-modules";
import { getModuleRouteMap } from "@/app/lib/module-map";
import logger from "@/lib/logger";

export interface TenantConfigData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    email: string | null;
    telefone: string | null;
    documento: string | null;
    razaoSocial: string | null;
    nomeFantasia: string | null;
    timezone: string;
    status: string;
    statusReason: string | null;
    statusChangedAt: string | null;
    sessionVersion: number;
    planRevision: number;
    createdAt: string;
    updatedAt: string;
  };
  branding: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
  } | null;
  subscription: {
    id: string | null;
    status: string | null;
    planId: string | null;
    planName: string | null;
    valorMensal: number | null;
    valorAnual: number | null;
    moeda: string | null;
    planRevision: number;
    trialEndsAt: string | null;
    renovaEm: string | null;
    planoVersao: {
      id: string;
      numero: number;
      status: string;
      titulo: string | null;
      descricao: string | null;
      publicadoEm: string | null;
    } | null;
  } | null;
  modules: {
    accessible: string[];
    allAvailable: string[];
    moduleDetails: Array<{
      slug: string;
      name: string;
      description: string;
      accessible: boolean;
      routes: string[];
    }>;
  };
  metrics: {
    usuarios: number;
    processos: number;
    clientes: number;
    contratos: number;
  };
  digitalCertificates: Array<{
    id: string;
    tenantId: string;
    responsavelUsuarioId: string | null;
    label: string | null;
    tipo: string;
    isActive: boolean;
    validUntil: string | null;
    lastValidatedAt: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
    responsavelUsuario: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  }>;
}

// Converter campos Decimal para number
function decimalToNullableNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);

    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

// Mapear nomes dos módulos para exibição
const MODULE_NAMES: Record<string, { name: string; description: string }> = {
  "dashboard-geral": {
    name: "Dashboard Geral",
    description: "Visão geral do escritório com métricas e indicadores",
  },
  "processos-gerais": {
    name: "Gestão de Processos",
    description: "Criação, edição e acompanhamento de processos judiciais",
  },
  "clientes-gerais": {
    name: "Gestão de Clientes",
    description: "Cadastro e gerenciamento de clientes e suas informações",
  },
  "agenda-compromissos": {
    name: "Agenda e Compromissos",
    description: "Calendário de eventos, audiências e reuniões",
  },
  "documentos-gerais": {
    name: "Documentos Gerais",
    description: "Upload, organização e gestão de documentos",
  },
  "modelos-documentos": {
    name: "Modelos de Documentos",
    description: "Templates de petições, contratos e procurações",
  },
  "tarefas-kanban": {
    name: "Tarefas e Kanban",
    description: "Gestão de tarefas com visualização em quadro",
  },
  "financeiro-completo": {
    name: "Módulo Financeiro",
    description: "Controle de honorários, parcelas e recebimentos",
  },
  "gestao-equipe": {
    name: "Gestão de Equipe",
    description: "Administração de usuários, advogados e permissões",
  },
  "relatorios-basicos": {
    name: "Relatórios Básicos",
    description: "Geração de relatórios e exportação de dados",
  },
  "contratos-honorarios": {
    name: "Contratos e Honorários",
    description: "Criação e gestão de contratos de honorários",
  },
  procuracoes: {
    name: "Procurações",
    description: "Gestão de procurações e representações",
  },
  "comissoes-advogados": {
    name: "Comissões de Advogados",
    description: "Controle de comissões e participações",
  },
  "notificacoes-avancadas": {
    name: "Notificações Avançadas",
    description: "Sistema de alertas e notificações personalizadas",
  },
  "integracoes-externas": {
    name: "Integrações Externas",
    description: "APIs e integrações com sistemas terceiros",
  },
  "analytics-avancado": {
    name: "Analytics Avançado",
    description: "Métricas detalhadas e business intelligence",
  },
};

export async function getTenantConfigData(): Promise<{
  success: boolean;
  data?: TenantConfigData;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Buscar dados do tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branding: true,
        subscription: {
          include: {
            plano: true,
            planoVersao: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
            processos: true,
            clientes: true,
            contratos: true,
          },
        },
      },
    });

    if (!tenant) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Buscar módulos acessíveis
    const accessibleModules = await getTenantAccessibleModules(tenantId);
    const moduleRouteMap = await getModuleRouteMap();
    const allAvailableModules = Object.keys(moduleRouteMap);

    // Criar detalhes dos módulos
    const moduleDetails = allAvailableModules.map((slug) => ({
      slug,
      name: MODULE_NAMES[slug]?.name || slug,
      description: MODULE_NAMES[slug]?.description || "Módulo do sistema",
      accessible: accessibleModules.includes(slug),
      routes: moduleRouteMap[slug] || [],
    }));

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

    const data: TenantConfigData = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        email: tenant.email,
        telefone: tenant.telefone,
        documento: tenant.documento,
        razaoSocial: tenant.razaoSocial,
        nomeFantasia: tenant.nomeFantasia,
        timezone: tenant.timezone,
        status: tenant.status,
        statusReason: tenant.statusReason,
        statusChangedAt: tenant.statusChangedAt?.toISOString() ?? null,
        sessionVersion: tenant.sessionVersion,
        planRevision: tenant.planRevision,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
      },
      branding: tenant.branding
        ? {
            primaryColor: tenant.branding.primaryColor,
            secondaryColor: tenant.branding.secondaryColor,
            accentColor: tenant.branding.accentColor,
            logoUrl: tenant.branding.logoUrl,
            faviconUrl: tenant.branding.faviconUrl,
          }
        : null,
      subscription: tenant.subscription
        ? {
            id: tenant.subscription.id,
            status: tenant.subscription.status,
            planId: tenant.subscription.planoId,
            planName: tenant.subscription.plano?.nome ?? null,
            valorMensal: decimalToNullableNumber(
              tenant.subscription.plano?.valorMensal,
            ),
            valorAnual: decimalToNullableNumber(
              tenant.subscription.plano?.valorAnual,
            ),
            moeda: tenant.subscription.plano?.moeda ?? null,
            planRevision: tenant.subscription.planRevision,
            trialEndsAt: tenant.subscription.trialEndsAt?.toISOString() ?? null,
            renovaEm: tenant.subscription.renovaEm?.toISOString() ?? null,
            planoVersao: tenant.subscription.planoVersao
              ? {
                  id: tenant.subscription.planoVersao.id,
                  numero: tenant.subscription.planoVersao.numero,
                  status: tenant.subscription.planoVersao.status,
                  titulo: tenant.subscription.planoVersao.titulo,
                  descricao: tenant.subscription.planoVersao.descricao,
                  publicadoEm:
                    tenant.subscription.planoVersao.publicadoEm?.toISOString() ??
                    null,
                }
              : null,
          }
        : null,
      modules: {
        accessible: accessibleModules,
        allAvailable: allAvailableModules,
        moduleDetails,
      },
      metrics: {
        usuarios: tenant._count.usuarios,
        processos: tenant._count.processos,
        clientes: tenant._count.clientes,
        contratos: tenant._count.contratos,
      },
      digitalCertificates: certificates.map((cert) => ({
        id: cert.id,
        tenantId: cert.tenantId,
        responsavelUsuarioId: cert.responsavelUsuarioId,
        label: cert.label,
        tipo: cert.tipo,
        isActive: cert.isActive,
        validUntil: cert.validUntil?.toISOString() ?? null,
        lastValidatedAt: cert.lastValidatedAt?.toISOString() ?? null,
        lastUsedAt: cert.lastUsedAt?.toISOString() ?? null,
        createdAt: cert.createdAt.toISOString(),
        updatedAt: cert.updatedAt.toISOString(),
        responsavelUsuario: cert.responsavelUsuario
          ? {
              id: cert.responsavelUsuario.id,
              firstName: cert.responsavelUsuario.firstName,
              lastName: cert.responsavelUsuario.lastName,
              email: cert.responsavelUsuario.email,
            }
          : null,
      })),
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error("Erro ao buscar dados de configuração do tenant:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// ===== INTERFACES DE EDIÇÃO =====

export interface UpdateTenantBasicDataInput {
  name?: string;
  email?: string;
  telefone?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  timezone?: string;
}

export interface UpdateTenantBrandingInput {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

// ===== ACTIONS DE EDIÇÃO =====

/**
 * Atualiza dados básicos do tenant (nome, email, telefone, etc.)
 */
export async function updateTenantBasicData(
  data: UpdateTenantBasicDataInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Validar permissões
    const role = (session.user as any)?.role as string;

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Apenas administradores podem editar essas configurações",
      };
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.telefone !== undefined)
      updateData.telefone = data.telefone?.trim() || null;
    if (data.razaoSocial !== undefined)
      updateData.razaoSocial = data.razaoSocial?.trim() || null;
    if (data.nomeFantasia !== undefined)
      updateData.nomeFantasia = data.nomeFantasia?.trim() || null;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;

    // Só atualizar se houver mudanças
    if (Object.keys(updateData).length > 0) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
      });

      // Incrementar sessionVersion para forçar refresh
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { sessionVersion: { increment: 1 } },
      });
    }

    logger.info(`Tenant ${tenantId} atualizado por ${session.user.email}`);

    return { success: true };
  } catch (error) {
    logger.error("Erro ao atualizar dados básicos do tenant:", error);

    return {
      success: false,
      error: "Erro interno ao salvar configurações",
    };
  }
}

/**
 * Atualiza branding do tenant (cores, logo, favicon)
 */
export async function updateTenantBranding(
  data: UpdateTenantBrandingInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Validar permissões
    const role = (session.user as any)?.role as string;

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Apenas administradores podem editar o branding",
      };
    }

    // Construir updateData apenas com campos definidos
    const updateData: Record<string, unknown> = {};

    if (data.primaryColor !== undefined)
      updateData.primaryColor = data.primaryColor;
    if (data.secondaryColor !== undefined)
      updateData.secondaryColor = data.secondaryColor;
    if (data.accentColor !== undefined)
      updateData.accentColor = data.accentColor;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.faviconUrl !== undefined) updateData.faviconUrl = data.faviconUrl;

    // Só atualizar se houver mudanças
    if (Object.keys(updateData).length > 0) {
      await prisma.tenantBranding.upsert({
        where: { tenantId },
        update: updateData,
        create: {
          tenantId,
          primaryColor: data.primaryColor ?? "#2563eb",
          secondaryColor: data.secondaryColor ?? "#1d4ed8",
          accentColor: data.accentColor ?? "#3b82f6",
          logoUrl: data.logoUrl ?? null,
          faviconUrl: data.faviconUrl ?? null,
        },
      });

      // Incrementar sessionVersion para forçar refresh
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { sessionVersion: { increment: 1 } },
      });
    }

    logger.info(
      `Branding do tenant ${tenantId} atualizado por ${session.user.email}`,
    );

    return { success: true };
  } catch (error) {
    logger.error("Erro ao atualizar branding do tenant:", error);

    return {
      success: false,
      error: "Erro interno ao salvar branding",
    };
  }
}
