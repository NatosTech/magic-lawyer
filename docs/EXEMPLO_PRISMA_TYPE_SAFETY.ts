/**
 * EXEMPLO COMPLETO: Refatorando processos.ts com Prisma Type Safety
 * 
 * Este arquivo mostra EXATAMENTE como implementar a melhor solução
 * Side-by-side com a abordagem atual para comparação
 */

import { Prisma } from "@/app/generated/prisma";
import prisma from "@/app/lib/prisma";

// ============================================
// ❌ ABORDAGEM ATUAL (200+ linhas de tipos manuais)
// ============================================

// ANTES: Tipos definidos manualmente
export interface ProcessoDetalhadoOLD {
  id: string;
  numero: string;
  juiz: {
    id: string;
    nome: string;
    nomeCompleto: string | null;
    vara: string | null;
    comarca: string | null;
    nivel: string | null;
    status: string | null;
    especialidades: string[];
    tribunal: {
      id: string;
      nome: string;
      sigla: string | null;
      esfera: string | null;
      uf: string | null;
      siteUrl: string | null;
    } | null;
  } | null;
  tribunal: {
    id: string;
    nome: string;
    sigla: string | null;
    esfera: string | null;
    uf: string | null;
    siteUrl: string | null;
  } | null;
  // ... +150 linhas de definições manuais
}

// PROBLEMA: Query separada, pode desincronizar com o tipo acima
async function getProcessoDetalhadoOLD(id: string) {
  return await prisma.processo.findFirst({
    where: { id },
    include: {
      juiz: {
        select: {
          id: true,
          nome: true,
          nomeCompleto: true,
          vara: true,
          comarca: true,
          nivel: true,
          status: true,
          especialidades: true,
          tribunal: {
            select: {
              id: true,
              nome: true,
              sigla: true,
              esfera: true,
              uf: true,
              siteUrl: true,
            },
          },
        },
      },
      // ... resto da query
    },
  });
}

// ============================================
// ✅ MELHOR SOLUÇÃO (Type-safe, DRY, Maintainable)
// ============================================

/**
 * PASSO 1: Define a estrutura da query usando Prisma.validator
 * 
 * Vantagens:
 * - Type-safe: TypeScript valida a query
 * - Reutilizável: pode ser usado em múltiplas funções
 * - Documentação: estrutura clara e explícita
 */
const processoDetalhadoInclude = Prisma.validator<Prisma.ProcessoDefaultArgs>()({
  include: {
    // Área de atuação
    area: {
      select: {
        id: true,
        nome: true,
        slug: true,
      },
    },

    // Cliente
    cliente: {
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        tipoPessoa: true,
      },
    },

    // Advogado responsável
    advogadoResponsavel: {
      select: {
        id: true,
        oabNumero: true,
        oabUf: true,
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    },

    // Juiz (com tribunal aninhado)
    juiz: {
      select: {
        id: true,
        nome: true,
        nomeCompleto: true,
        vara: true,
        comarca: true,
        nivel: true,
        status: true,
        especialidades: true,
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            esfera: true,
            uf: true,
            siteUrl: true,
          },
        },
      },
    },

    // Tribunal direto do processo
    tribunal: {
      select: {
        id: true,
        nome: true,
        sigla: true,
        esfera: true,
        uf: true,
        siteUrl: true,
      },
    },

    // Partes do processo
    partes: {
      select: {
        id: true,
        tenantId: true,
        processoId: true,
        tipoPolo: true,
        nome: true,
        documento: true,
        email: true,
        telefone: true,
        clienteId: true,
        advogadoId: true,
        papel: true,
        observacoes: true,
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
        advogado: {
          select: {
            id: true,
            oabNumero: true,
            oabUf: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    },

    // Prazos
    prazos: {
      include: {
        responsavel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        origemMovimentacao: {
          select: {
            id: true,
            titulo: true,
            dataMovimentacao: true,
          },
        },
      },
      orderBy: {
        dataVencimento: "asc",
      },
    },

    // Procurações vinculadas
    procuracoesVinculadas: {
      include: {
        procuracao: {
          include: {
            outorgados: {
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
            assinaturas: true,
            poderes: true,
          },
        },
      },
    },

    // Contadores
    _count: {
      select: {
        documentos: true,
        eventos: true,
        movimentacoes: true,
        tarefas: true,
      },
    },
  },
});

/**
 * PASSO 2: Deriva o tipo AUTOMATICAMENTE da query
 * 
 * 🎉 Isso substitui ~200 linhas de interface manual!
 * 
 * Vantagens:
 * - Zero duplicação
 * - Sempre sincronizado com a query
 * - Atualiza automaticamente quando a query muda
 */
export type ProcessoDetalhado = Prisma.ProcessoGetPayload<typeof processoDetalhadoInclude>;

/**
 * PASSO 3: Deriva tipos para subpropriedades
 * 
 * Vantagens:
 * - Mantém consistência
 * - Reutilizável em outros lugares
 * - Type-safe
 */
export type ProcessoJuiz = NonNullable<ProcessoDetalhado["juiz"]>;
export type ProcessoTribunal = NonNullable<ProcessoDetalhado["tribunal"]>;
export type ProcessoParte = ProcessoDetalhado["partes"][number];
export type ProcessoPrazo = ProcessoDetalhado["prazos"][number];
export type ProcessoProcuracao = ProcessoDetalhado["procuracoesVinculadas"][number];

/**
 * PASSO 4: Usa na função com type-safety garantido
 * 
 * Vantagens:
 * - Não pode usar query diferente sem erro de compilação
 * - Auto-complete perfeito na IDE
 * - Refatoração segura
 */
export async function getProcessoDetalhado(
  processoId: string
): Promise<ProcessoDetalhado | null> {
  return await prisma.processo.findFirst({
    where: {
      id: processoId,
      deletedAt: null,
    },
    ...processoDetalhadoInclude, // ✅ Type-safe: tem que corresponder ao validator
  });
}

/**
 * PASSO 5: Usa em outros lugares com type-safety
 */
export async function getProcessosPorCliente(
  clienteId: string
): Promise<ProcessoDetalhado[]> {
  return await prisma.processo.findMany({
    where: {
      clienteId,
      deletedAt: null,
    },
    ...processoDetalhadoInclude, // ✅ Reutiliza a mesma estrutura
  });
}

// ============================================
// 💡 BONUS: Queries variantes (quando precisar)
// ============================================

/**
 * Às vezes você precisa de uma versão "resumida" do processo
 * sem todas as relações. É fácil criar variants:
 */
const processoResumoInclude = Prisma.validator<Prisma.ProcessoDefaultArgs>()({
  include: {
    cliente: {
      select: {
        id: true,
        nome: true,
      },
    },
    area: {
      select: {
        id: true,
        nome: true,
      },
    },
    _count: {
      select: {
        documentos: true,
        prazos: true,
      },
    },
  },
});

export type ProcessoResumo = Prisma.ProcessoGetPayload<typeof processoResumoInclude>;

export async function listarProcessos(): Promise<ProcessoResumo[]> {
  return await prisma.processo.findMany({
    ...processoResumoInclude, // Usa versão resumida (mais rápida)
  });
}

// ============================================
// 🎯 COMPARAÇÃO FINAL
// ============================================

/*
LINHAS DE CÓDIGO:

❌ ANTES:
- Interface ProcessoDetalhado: ~200 linhas
- Query getProcessoDetalhado: ~100 linhas
- Total: ~300 linhas
- Manutenção: Manual, propenso a erros

✅ DEPOIS:
- Validator processoDetalhadoInclude: ~120 linhas
- Type ProcessoDetalhado: 1 linha
- Query getProcessoDetalhado: ~10 linhas
- Total: ~130 linhas
- Manutenção: Automática, type-safe

📊 ECONOMIA: 57% menos código, infinitamente mais seguro!

TYPE SAFETY:

❌ ANTES:
- Adiciona campo na query → TypeScript não reclama
- Remove campo na query → TypeScript não reclama
- Renomeia campo → TypeScript não ajuda
- Resultado: Bugs em produção 🐛

✅ DEPOIS:
- Adiciona campo na query → Tipo atualiza automaticamente ✅
- Remove campo na query → Código usando campo dá erro de compilação 🚨
- Renomeia campo → TypeScript mostra todos os lugares para atualizar 🎯
- Resultado: Zero bugs de tipo 🎉

DEVELOPER EXPERIENCE:

❌ ANTES:
- Mudar query = mudar interface manualmente
- IDE não sabe se campo existe
- Refatoração arriscada

✅ DEPOIS:
- Mudar query = tipo atualiza sozinho
- IDE auto-complete perfeito
- Refatoração segura com "Find All References"
*/

// ============================================
// 🚀 MIGRAÇÃO GRADUAL (Sem quebrar nada)
// ============================================

/**
 * Para migrar sem quebrar o código existente:
 * 
 * 1. Adiciona os novos tipos com sufixo V2
 * 2. Cria novas funções V2
 * 3. Migra componentes um por um
 * 4. Remove versões antigas quando não houver mais uso
 */

// Novo tipo
export type ProcessoDetalhadoV2 = Prisma.ProcessoGetPayload<typeof processoDetalhadoInclude>;

// Nova função
export async function getProcessoDetalhadoV2(id: string): Promise<ProcessoDetalhadoV2 | null> {
  return await prisma.processo.findFirst({
    where: { id },
    ...processoDetalhadoInclude,
  });
}

// No componente, migra gradualmente:
// const { processo } = useProcessoDetalhadoV2(id); // ✅ Nova versão
// Depois de testar, busca e substitui todas as referências antigas

// ============================================
// 📚 RECURSOS ADICIONAIS
// ============================================

/*
Documentação oficial:
- https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
- https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety/operating-against-partial-structures-of-model-types

Patterns avançados:
- https://github.com/prisma/prisma/discussions/10928
- https://www.totaltypescript.com/books/total-typescript-essentials/deriving-types-from-values

Exemplos no mundo real:
- T3 Stack: https://create.t3.gg/
- Cal.com: https://github.com/calcom/cal.com
*/

