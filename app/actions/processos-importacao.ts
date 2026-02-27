"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { getAdvogadoIdFromSession } from "@/app/lib/advogado-access";
import { parsePlanilhaProcessos } from "@/app/lib/processos/planilha-import";
import { checkPermission } from "@/app/actions/equipe";
import { enviarEmailPrimeiroAcesso } from "@/app/lib/first-access-email";
import logger from "@/lib/logger";
import { Prisma, ProcessoStatus } from "@/generated/prisma";

const normalizeCacheKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

function inferTipoPessoa(nome: string) {
  const normalized = normalizeCacheKey(nome);
  const juridicaTerms = [
    "LTDA",
    "S/A",
    "SA ",
    "EIRELI",
    "MEI",
    "EPP",
    "ASSOCIACAO",
    "CONDOMINIO",
    "EMPRESA",
    "COMERCIO",
    "INDUSTRIA",
    "COOPERATIVA",
    "HOSPITAL",
    "CLINICA",
  ];

  return juridicaTerms.some((term) => normalized.includes(term))
    ? "JURIDICA"
    : "FISICA";
}

function buildProcessoTitulo(classe?: string | null, autor?: string | null) {
  if (classe && autor) return `${classe} - ${autor}`;
  if (classe) return classe;
  if (autor) return `Processo ${autor}`;

  return "Processo importado via planilha";
}

function buildProcessoDescricao(fonte?: string | null, sheet?: string | null) {
  if (fonte) return `Importado da planilha (${fonte}).`;
  if (sheet) return `Importado a partir da planilha ${sheet}.`;

  return "Importado via planilha.";
}

function extractStringTags(tags: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

function buildImportTags(
  existingTags: Prisma.JsonValue | null | undefined,
  origem: string,
): Prisma.InputJsonValue {
  const uniqueTags = new Set(extractStringTags(existingTags));
  uniqueTags.add("planilha-import");
  uniqueTags.add(origem.toLowerCase());

  return Array.from(uniqueTags);
}

interface ImportProcessoCredentials {
  nome: string;
  email: string;
  statusEnvio:
    | "LINK_ENVIADO"
    | "EMAIL_NAO_CONFIGURADO"
    | "ERRO_NO_ENVIO";
}

export interface ImportProcessosResponse {
  success: boolean;
  createdProcessos: number;
  updatedProcessos: number;
  failedProcessos: number;
  createdClientes: number;
  createdUsuarios: ImportProcessoCredentials[];
  avisos: string[];
  erros?: string[];
}

export async function importarProcessosPlanilha(
  formData: FormData,
): Promise<ImportProcessosResponse> {
  const session = await getSession();

  if (!session?.user?.tenantId || !session.user.id) {
    return {
      success: false,
      createdProcessos: 0,
      updatedProcessos: 0,
      failedProcessos: 0,
      createdClientes: 0,
      createdUsuarios: [],
      avisos: [],
      erros: ["Usuário não autenticado."],
    };
  }

  const podeImportar = await checkPermission("processos", "criar");

  if (!podeImportar) {
    return {
      success: false,
      createdProcessos: 0,
      updatedProcessos: 0,
      failedProcessos: 0,
      createdClientes: 0,
      createdUsuarios: [],
      avisos: [],
      erros: ["Você não tem permissão para importar processos."],
    };
  }

  const tenantId = session.user.tenantId;
  const usuarioId = session.user.id;

  const file = formData.get("arquivo");
  const criarAcessoClientes = formData.get("criarAcessoClientes") === "true";

  if (!file || !(file instanceof File)) {
    return {
      success: false,
      createdProcessos: 0,
      updatedProcessos: 0,
      failedProcessos: 0,
      createdClientes: 0,
      createdUsuarios: [],
      avisos: [],
      erros: ["Selecione um arquivo .xls, .xlsx ou .csv para continuar."],
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      createdProcessos: 0,
      updatedProcessos: 0,
      failedProcessos: 0,
      createdClientes: 0,
      createdUsuarios: [],
      avisos: [],
      erros: ["Limite de 5MB excedido. Divida o arquivo antes de importar."],
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { registros, avisos } = parsePlanilhaProcessos(buffer, {
      fileName: file.name,
    });

    if (registros.length > 500) {
      return {
        success: false,
        createdProcessos: 0,
        updatedProcessos: 0,
        failedProcessos: 0,
        createdClientes: 0,
        createdUsuarios: [],
        avisos,
        erros: [
          "Limite máximo de 500 processos por importação. Divida o arquivo.",
        ],
      };
    }

    const advogadoSessionId = await getAdvogadoIdFromSession(session);
    const fallbackAdvogado =
      advogadoSessionId ||
      (
        await prisma.advogado.findFirst({
          where: { tenantId },
          select: { id: true },
        })
      )?.id ||
      null;

    const areas = await prisma.areaProcesso.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: "GLOBAL" }, { tenantId: null }],
      },
      select: {
        id: true,
        nome: true,
      },
    });

    const areaEntries = areas.map((area) => ({
      id: area.id,
      nome: normalizeCacheKey(area.nome),
    }));

    const clienteCache = new Map<string, { id: string; usuarioId?: string }>();
    const processoCache = new Set<string>();
    const generatedCredentials: ImportProcessoCredentials[] = [];
    const warnings = [...avisos];

    let createdProcessos = 0;
    let updatedProcessos = 0;
    let failedProcessos = 0;
    let createdClientes = 0;
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    const tenantNome = tenantData?.name || "Magic Lawyer";

    const ensureCliente = async (
      nome: string,
      email?: string,
    ): Promise<{ id: string; usuarioId?: string }> => {
      const cacheKey = normalizeCacheKey(nome);
      if (clienteCache.has(cacheKey)) {
        return clienteCache.get(cacheKey)!;
      }

      let cliente: {
        id: string;
        usuarioId: string | null;
        email: string | null;
      } | null = null;

      if (email) {
        cliente = await prisma.cliente.findFirst({
          where: {
            tenantId,
            deletedAt: null,
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            usuarioId: true,
            email: true,
          },
        });
      }

      if (!cliente) {
        cliente = await prisma.cliente.findFirst({
          where: {
            tenantId,
            deletedAt: null,
            nome: {
              equals: nome,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            usuarioId: true,
            email: true,
          },
        });
      }

      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            tenantId,
            nome,
            tipoPessoa: inferTipoPessoa(nome),
            email: email ?? null,
          },
          select: {
            id: true,
            usuarioId: true,
            email: true,
          },
        });
        createdClientes += 1;
      } else if (email && !cliente.email) {
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: { email },
        });
      }

      const sanitized = {
        id: cliente.id,
        usuarioId: cliente.usuarioId ?? undefined,
      };

      clienteCache.set(cacheKey, sanitized);

      return sanitized;
    };

    const resolveAreaId = (areaNome?: string | null) => {
      if (!areaNome) return null;
      const normalized = normalizeCacheKey(areaNome);
      const found = areaEntries.find((entry) => {
        if (!entry.nome) return false;

        return (
          entry.nome === normalized ||
          entry.nome.includes(normalized) ||
          normalized.includes(entry.nome)
        );
      });

      return found?.id ?? null;
    };

    const ensureParte = async (
      processoId: string,
      tipo: "AUTOR" | "REU",
      nome?: string | null,
      clienteId?: string | null,
    ) => {
      if (!nome) return;

      const existingParte = await prisma.processoParte.findFirst({
        where: {
          tenantId,
          processoId,
          tipoPolo: tipo,
          nome: {
            equals: nome,
            mode: "insensitive",
          },
        },
      });

      if (existingParte) return;

      await prisma.processoParte.create({
        data: {
          tenantId,
          processoId,
          tipoPolo: tipo,
          nome,
          clienteId: clienteId ?? undefined,
        },
      });
    };

    const ensureUsuarioCliente = async (
      clienteId: string,
      nome: string,
      email?: string | null,
    ) => {
      if (!email) {
        warnings.push(
          `Cliente "${nome}" não recebeu acesso porque não há e-mail informado.`,
        );
        return null;
      }

      const existingByEmail = await prisma.usuario.findFirst({
        where: {
          tenantId,
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

      if (existingByEmail) {
        await prisma.cliente.update({
          where: { id: clienteId },
          data: {
            usuarioId: existingByEmail.id,
          },
        });

        return existingByEmail.id;
      }

      const [firstName, ...rest] = nome.split(" ");
      const usuario = await prisma.usuario.create({
        data: {
          tenantId,
          email,
          firstName: firstName || nome,
          lastName: rest.join(" ") || null,
          passwordHash: null,
          role: "CLIENTE",
        },
        select: {
          id: true,
        },
      });

      await prisma.cliente.update({
        where: { id: clienteId },
        data: {
          usuarioId: usuario.id,
        },
      });

      const envioPrimeiroAcesso = await enviarEmailPrimeiroAcesso({
        userId: usuario.id,
        tenantId,
        email,
        nome,
        tenantNome,
        credentialType: "ADMIN",
      });

      if (!envioPrimeiroAcesso.success) {
        warnings.push(
          `Cliente "${nome}" criado com acesso, mas o e-mail de primeiro acesso não foi enviado automaticamente.`,
        );
      }

      generatedCredentials.push({
        nome,
        email,
        statusEnvio: envioPrimeiroAcesso.success
          ? "LINK_ENVIADO"
          : envioPrimeiroAcesso.error?.includes("Credenciais de email")
            ? "EMAIL_NAO_CONFIGURADO"
            : "ERRO_NO_ENVIO",
      });

      return usuario.id;
    };

    for (const registro of registros) {
      if (processoCache.has(registro.numero)) {
        warnings.push(
          `Processo ${registro.numero} listado mais de uma vez no arquivo.`,
        );
        failedProcessos += 1;
        continue;
      }
      processoCache.add(registro.numero);

      try {
        const clienteCacheKey = normalizeCacheKey(registro.autor);
        let cliente = await ensureCliente(registro.autor, registro.email);

        if (cliente && criarAcessoClientes && !cliente.usuarioId) {
          const usuarioCriadoId = await ensureUsuarioCliente(
            cliente.id,
            registro.autor,
            registro.email,
          );
          if (usuarioCriadoId) {
            cliente = { ...cliente, usuarioId: usuarioCriadoId };
            clienteCache.set(clienteCacheKey, cliente);
          }
        }

        const existingProcesso =
          await prisma.processo.findUnique({
            where: {
              tenantId_numero: {
                tenantId,
                numero: registro.numero,
              },
            },
            select: {
              id: true,
              numeroCnj: true,
              titulo: true,
              descricao: true,
              classeProcessual: true,
              vara: true,
              comarca: true,
              foro: true,
              areaId: true,
              advogadoResponsavelId: true,
              dataDistribuicao: true,
              tags: true,
            },
          });

        const resolvedAreaId = resolveAreaId(registro.area);
        const tagsValue = buildImportTags(existingProcesso?.tags, registro.origem);
        let processoId = existingProcesso?.id;

        if (existingProcesso) {
          const updatePayload: Prisma.ProcessoUncheckedUpdateInput = {
            tags: tagsValue,
          };

          if (!existingProcesso.numeroCnj) updatePayload.numeroCnj = registro.numero;
          if (!existingProcesso.titulo?.trim()) {
            updatePayload.titulo = buildProcessoTitulo(
              registro.classe,
              registro.autor,
            );
          }
          if (!existingProcesso.descricao?.trim()) {
            updatePayload.descricao = buildProcessoDescricao(
              registro.fonte,
              registro.sheet,
            );
          }
          if (!existingProcesso.classeProcessual?.trim() && registro.classe) {
            updatePayload.classeProcessual = registro.classe;
          }
          if (!existingProcesso.vara?.trim() && registro.vara) {
            updatePayload.vara = registro.vara;
          }
          if (!existingProcesso.comarca?.trim() && registro.comarca) {
            updatePayload.comarca = registro.comarca;
          }
          if (!existingProcesso.foro?.trim() && registro.vara) {
            updatePayload.foro = registro.vara;
          }
          if (!existingProcesso.areaId && resolvedAreaId) {
            updatePayload.areaId = resolvedAreaId;
          }
          if (!existingProcesso.advogadoResponsavelId && fallbackAdvogado) {
            updatePayload.advogadoResponsavelId = fallbackAdvogado;
          }
          if (!existingProcesso.dataDistribuicao) {
            updatePayload.dataDistribuicao = new Date();
          }

          const updated = await prisma.processo.update({
            where: { id: existingProcesso.id },
            data: updatePayload,
            select: { id: true },
          });

          processoId = updated.id;
          updatedProcessos += 1;
        } else {
          const created = await prisma.processo.create({
            data: {
              tenantId,
              numero: registro.numero,
              numeroCnj: registro.numero,
              titulo: buildProcessoTitulo(registro.classe, registro.autor),
              descricao: buildProcessoDescricao(registro.fonte, registro.sheet),
              status: ProcessoStatus.EM_ANDAMENTO,
              areaId: resolvedAreaId,
              classeProcessual: registro.classe ?? null,
              vara: registro.vara ?? null,
              comarca: registro.comarca ?? "Salvador/BA",
              foro: registro.vara ?? null,
              segredoJustica: false,
              clienteId: cliente.id,
              advogadoResponsavelId: fallbackAdvogado,
              dataDistribuicao: new Date(),
              tags: tagsValue,
            },
            select: {
              id: true,
            },
          });

          processoId = created.id;
          createdProcessos += 1;
        }

        if (!processoId) {
          failedProcessos += 1;
          warnings.push(
            `Falha ao importar o processo ${registro.numero}: ID do processo não definido.`,
          );
          continue;
        }

        await ensureParte(processoId, "AUTOR", registro.autor, cliente.id);
        await ensureParte(processoId, "REU", registro.reu ?? null);
      } catch (error) {
        logger.error("Erro ao importar processo via planilha", error);
        failedProcessos += 1;
        warnings.push(
          `Falha ao importar o processo ${registro.numero}: ${
            error instanceof Error ? error.message : "erro desconhecido"
          }`,
        );
      }
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        usuarioId,
        acao: "IMPORTACAO_PLANILHA_PROCESSOS",
        entidade: "Processo",
        dados: {
          arquivo: file.name,
          registros: registros.length,
          createdProcessos,
          updatedProcessos,
          failedProcessos,
          createdClientes,
          createdUsuarios: generatedCredentials.length,
          criarAcessoClientes,
        },
        changedFields: [],
      },
    });

    revalidatePath("/processos");

    const hasImportedData = createdProcessos + updatedProcessos > 0;

    return {
      success: hasImportedData,
      createdProcessos,
      updatedProcessos,
      failedProcessos,
      createdClientes,
      createdUsuarios: generatedCredentials,
      avisos: warnings,
      erros: hasImportedData
        ? undefined
        : [
            "Nenhum processo foi importado. Revise o arquivo e os avisos apresentados.",
          ],
    };
  } catch (error) {
    logger.error("Erro geral na importação de processos", error);

    return {
      success: false,
      createdProcessos: 0,
      updatedProcessos: 0,
      failedProcessos: 0,
      createdClientes: 0,
      createdUsuarios: [],
      avisos: [],
      erros: [
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao processar a planilha.",
      ],
    };
  }
}
