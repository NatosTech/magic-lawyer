"use server";

import { promises as fs } from "fs";
import { createHash } from "crypto";
import path from "path";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";
import { ActionResponse } from "@/types/action-response";

// ==================== TIPOS ====================
export type DetectedModule = {
  slug: string;
  nome: string;
  descricao: string;
  categoria: string;
  icone: string;
  ordem: number;
  ativo: boolean;
  rotas: string[];
};

export type AutoDetectResponse = ActionResponse<{
  detectedModules: DetectedModule[];
  created: number;
  updated: number;
  removed: number;
  total: number;
  totalRoutes: number;
}>;

// ==================== CONFIGURAÇÕES ====================
const PROTECTED_FOLDER = path.join(process.cwd(), "app", "(protected)");

// Mapeamento de categorias por módulo
const MODULE_CATEGORIES: Record<string, string> = {
  // Core
  dashboard: "Core",
  processos: "Core",
  clientes: "Core",
  advogados: "Core",
  equipe: "Core",
  relatorios: "Core",

  // Produtividade
  agenda: "Produtividade",
  documentos: "Produtividade",
  tarefas: "Produtividade",
  diligencias: "Produtividade",
  andamentos: "Produtividade",

  // Financeiro
  financeiro: "Financeiro",
  contratos: "Financeiro",
  honorarios: "Financeiro",
  parcelas: "Financeiro",
  "dados-bancarios": "Financeiro",

  // Documentos
  peticoes: "Documentos",
  procuracoes: "Documentos",
  "modelos-peticao": "Documentos",
  "modelos-procuracao": "Documentos",

  // Jurídico
  causas: "Jurídico",
  juizes: "Jurídico",
  "regimes-prazo": "Jurídico",

  // Sistema
  configuracoes: "Sistema",
  usuario: "Sistema",
  help: "Sistema",

  // Teste
  "teste-modulo": "Sistema",
};

// Mapeamento de ícones por categoria
const CATEGORY_ICONS: Record<string, string> = {
  Core: "ShieldIcon",
  Produtividade: "ZapIcon",
  Financeiro: "DollarSignIcon",
  Documentos: "FileTextIcon",
  Jurídico: "ScaleIcon",
  Sistema: "SettingsIcon",
};

// Mapeamento de descrições por módulo
const MODULE_DESCRIPTIONS: Record<string, string> = {
  dashboard: "Painel principal com visão geral do escritório",
  processos: "Gestão completa de processos jurídicos",
  clientes: "Cadastro e gestão de clientes",
  advogados: "Gestão de advogados e profissionais",
  equipe: "Gestão de equipe e permissões",
  agenda: "Calendário e gestão de compromissos",
  documentos: "Upload e gestão de documentos",
  tarefas: "Sistema de tarefas e lembretes",
  diligencias: "Gestão de diligências processuais",
  andamentos: "Acompanhamento de andamentos",
  financeiro: "Gestão financeira completa",
  contratos: "Criação e gestão de contratos",
  honorarios: "Cálculo e controle de honorários",
  parcelas: "Sistema de parcelas e pagamentos",
  "dados-bancarios": "Gestão de dados bancários",
  peticoes: "Criação e gestão de petições",
  procuracoes: "Gestão de procurações",
  "modelos-peticao": "Modelos de petições",
  "modelos-procuracao": "Modelos de procurações",
  causas: "Tipos de causas e áreas do direito",
  juizes: "Base de dados de juízes",
  "regimes-prazo": "Regimes de prazo processual",
  relatorios: "Relatórios e exportações",
  configuracoes: "Configurações do escritório",
  usuario: "Perfil e configurações do usuário",
  help: "Central de ajuda e suporte",
  "teste-modulo": "Módulo de teste para validação do sistema",
};

// Mapeamento de ordem por categoria
const CATEGORY_ORDER: Record<string, number> = {
  Core: 1,
  Produtividade: 2,
  Financeiro: 3,
  Documentos: 4,
  Jurídico: 5,
  Sistema: 6,
};

// ==================== FUNÇÕES AUXILIARES ====================
async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "SUPER_ADMIN") {
    throw new Error("Não autorizado: Apenas SuperAdmin pode realizar esta ação.");
  }

  return session.user;
}

function formatModuleName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getModuleRoutes(slug: string): string[] {
  // ⚠️ IMPORTANTE: Rotas agora são gerenciadas COMPLETAMENTE pelo banco de dados
  // Esta função retorna apenas a rota base do módulo
  // As rotas específicas devem ser cadastradas via interface de administração (/admin/modulos)
  // Isso permite flexibilidade total e configuração dinâmica em tempo real

  return [`/${slug}`];
}

type ScanProtectedModulesResult = {
  detectedModules: DetectedModule[];
  moduleSlugs: string[];
  filesystemHash: string;
  totalRoutes: number;
};

async function scanProtectedModules(): Promise<ScanProtectedModulesResult> {
  let moduleDirs: string[] = [];

  try {
    // Tentar ler o diretório (funciona em desenvolvimento local)
    const items = await fs.readdir(PROTECTED_FOLDER, { withFileTypes: true });

    moduleDirs = items
      .filter((item) => item.isDirectory())
      .map((item) => item.name)
      .filter((name) => !name.startsWith(".") && name !== "layout.tsx")
      .sort();
  } catch (error) {
    // Fallback: usar lista estática quando filesystem não está disponível (Vercel produção)
    logger.warn("Filesystem não acessível, usando lista estática de módulos:", error instanceof Error ? error.message : String(error));
    
    // Lista estática baseada nos módulos conhecidos do sistema
    moduleDirs = [
      "dashboard",
      "processos", 
      "clientes",
      "advogados",
      "equipe",
      "agenda",
      "documentos",
      "tarefas",
      "diligencias",
      "andamentos",
      "financeiro",
      "contratos",
      "honorarios",
      "parcelas",
      "dados-bancarios",
      "peticoes",
      "procuracoes",
      "modelos-peticao",
      "modelos-procuracao",
      "causas",
      "juizes",
      "regimes-prazo",
      "relatorios",
      "configuracoes",
      "usuario",
      "help"
    ].sort();
  }

  const detectedModules: DetectedModule[] = moduleDirs.map((slug, index) => {
    const categoria = MODULE_CATEGORIES[slug] || "Sistema";
    const icone = CATEGORY_ICONS[categoria] || "PuzzleIcon";
    const descricao = MODULE_DESCRIPTIONS[slug] || `Módulo ${formatModuleName(slug)}`;
    const rotas = getModuleRoutes(slug);

    return {
      slug,
      nome: formatModuleName(slug),
      descricao,
      categoria,
      icone,
      ordem: (CATEGORY_ORDER[categoria] || 99) * 100 + index,
      ativo: true,
      rotas,
    };
  });

  const hashSource = JSON.stringify(
    detectedModules.map((module) => ({
      slug: module.slug,
      rotas: module.rotas,
    }))
  );

  const filesystemHash = createHash("sha256").update(hashSource).digest("hex");

  const totalRoutes = detectedModules.reduce((acc, module) => acc + module.rotas.length, 0);

  return {
    detectedModules,
    moduleSlugs: moduleDirs,
    filesystemHash,
    totalRoutes,
  };
}

// ==================== DETECÇÃO AUTOMÁTICA ====================
export async function autoDetectModules(): Promise<AutoDetectResponse> {
  try {
    const user = await checkSuperAdmin();

    logger.info(`Iniciando detecção automática de módulos por ${user.email}`);

    const { detectedModules, moduleSlugs, filesystemHash, totalRoutes } = await scanProtectedModules();

    logger.info(`Módulos detectados no código: ${moduleSlugs.join(", ")}`);

    // Buscar módulos existentes no banco
    const existingModules = await prisma.modulo.findMany({
      select: { id: true, slug: true, categoriaId: true },
    });

    const detectedSlugs = new Set(detectedModules.map((m) => m.slug));

    let created = 0;
    let updated = 0;
    let removed = 0;

    // Criar/Atualizar módulos detectados
    for (const module of detectedModules) {
      const existing = existingModules.find((m) => m.slug === module.slug);

      if (existing) {
        // Buscar categoria por nome
        const categoria = await prisma.moduloCategoria.findFirst({
          where: { nome: module.categoria },
        });

        // Atualizar módulo existente (preservar categoria se já foi atribuída)
        await prisma.modulo.update({
          where: { id: existing.id },
          data: {
            nome: module.nome,
            descricao: module.descricao,
            // Só define categoria se não tiver uma atribuída manualmente
            categoriaId: existing.categoriaId || categoria?.id || null,
            icone: module.icone,
            ordem: module.ordem,
            ativo: module.ativo,
          },
        });
        updated++;
      } else {
        // Buscar categoria por nome
        const categoria = await prisma.moduloCategoria.findFirst({
          where: { nome: module.categoria },
        });

        // Criar novo módulo
        await prisma.modulo.create({
          data: {
            slug: module.slug,
            nome: module.nome,
            descricao: module.descricao,
            categoriaId: categoria?.id || null,
            icone: module.icone,
            ordem: module.ordem,
            ativo: module.ativo,
          },
        });
        created++;
      }

      // Criar/Atualizar rotas do módulo
      await syncModuleRoutes(module.slug, module.rotas);
    }

    // Remover módulos que não existem mais no código
    const modulesToRemove = existingModules.filter((m) => !detectedSlugs.has(m.slug));

    for (const module of modulesToRemove) {
      // Verificar se está sendo usado por planos
      const planUsage = await prisma.planoModulo.count({
        where: { moduloId: module.id },
      });

      if (planUsage === 0) {
        // Remover rotas primeiro
        await prisma.moduloRota.deleteMany({
          where: { moduloId: module.id },
        });

        // Remover módulo
        await prisma.modulo.delete({
          where: { id: module.id },
        });

        removed++;
        logger.info(`Módulo removido: ${module.slug} (não existe mais no código)`);
      } else {
        logger.warn(`Módulo ${module.slug} não pode ser removido pois está sendo usado por ${planUsage} plano(s)`);
      }
    }

    logger.info(`Detecção automática concluída: ${created} criados, ${updated} atualizados, ${removed} removidos`);

    // Registrar execução no banco
    await prisma.moduleDetectionLog.create({
      data: {
        detectedAt: new Date(),
        totalModules: detectedModules.length,
        totalRoutes,
        created,
        updated,
        removed,
        filesystemHash,
      },
    });

    // 3. Limpar cache do module-map dinâmico
    try {
      const { clearModuleMapCache } = await import("../lib/module-map");

      clearModuleMapCache();
      logger.info("✅ Cache do module-map limpo automaticamente");
    } catch (error) {
      logger.warn("⚠️ Erro ao limpar cache do module-map:", error instanceof Error ? error.message : String(error));
    }

    // Forçar revalidação de todas as páginas relacionadas
    revalidatePath("/admin/modulos");
    revalidatePath("/admin/planos");

    return {
      success: true,
      data: {
        detectedModules,
        created,
        updated,
        removed,
        total: detectedModules.length,
        totalRoutes,
      },
    };
  } catch (error: any) {
    logger.error("Erro na detecção automática de módulos:", error);

    return {
      success: false,
      error: error.message || "Erro na detecção automática de módulos",
    };
  }
}

// ==================== SINCRONIZAÇÃO DE ROTAS ====================
async function syncModuleRoutes(slug: string, routes: string[]): Promise<void> {
  try {
    // Buscar módulo
    const modulo = await prisma.modulo.findUnique({
      where: { slug },
    });

    if (!modulo) return;

    // Buscar rotas existentes
    const existingRoutes = await prisma.moduloRota.findMany({
      where: { moduloId: modulo.id },
    });

    const existingRoutePaths = new Set(existingRoutes.map((r) => r.rota));
    const newRoutePaths = new Set(routes);

    // Adicionar novas rotas
    const routesToAdd = routes.filter((route) => !existingRoutePaths.has(route));

    for (const route of routesToAdd) {
      await prisma.moduloRota.create({
        data: {
          moduloId: modulo.id,
          rota: route,
          descricao: `Rota para ${slug}`,
          ativo: true,
        },
      });
    }

    // Remover rotas que não existem mais
    const routesToRemove = existingRoutes.filter((r) => !newRoutePaths.has(r.rota));

    for (const route of routesToRemove) {
      await prisma.moduloRota.delete({
        where: { id: route.id },
      });
    }
  } catch (error) {
    logger.error(`Erro ao sincronizar rotas do módulo ${slug}:`, error);
  }
}

// ==================== STATUS DA DETECÇÃO ====================
export async function getAutoDetectStatus(): Promise<
  ActionResponse<{
    lastDetection: Date | null;
    totalModules: number;
    totalRoutes: number;
    needsSync: boolean;
    filesystemModules: number;
    filesystemRoutes: number;
    lastRunSummary: {
      created: number;
      updated: number;
      removed: number;
    } | null;
  }>
> {
  try {
    await checkSuperAdmin();

    const [totalModules, totalRoutes, latestDetection] = await Promise.all([
      prisma.modulo.count(),
      prisma.moduloRota.count(),
      prisma.moduleDetectionLog.findFirst({
        orderBy: { detectedAt: "desc" },
      }),
    ]);

    let scanResult: ScanProtectedModulesResult;
    let needsSync = false;

    try {
      scanResult = await scanProtectedModules();
      needsSync = !latestDetection || latestDetection.filesystemHash !== scanResult.filesystemHash;
    } catch (error) {
      // Se não conseguir escanear, assumir que não precisa de sync
      logger.warn("Erro ao escanear módulos para status:", error instanceof Error ? error.message : String(error));
      scanResult = {
        detectedModules: [],
        moduleSlugs: [],
        filesystemHash: "fallback",
        totalRoutes: 0,
      };
      needsSync = false;
    }

    return {
      success: true,
      data: {
        lastDetection: latestDetection?.detectedAt ?? null,
        totalModules,
        totalRoutes,
        needsSync,
        filesystemModules: scanResult.detectedModules.length,
        filesystemRoutes: scanResult.totalRoutes,
        lastRunSummary: latestDetection
          ? {
              created: latestDetection.created,
              updated: latestDetection.updated,
              removed: latestDetection.removed,
            }
          : null,
      },
    };
  } catch (error: any) {
    logger.error("Erro ao obter status da detecção automática:", error);

    return {
      success: false,
      error: error.message || "Erro ao obter status da detecção automática",
    };
  }
}
