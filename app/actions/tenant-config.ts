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
