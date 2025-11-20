"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { getAdvogadoIdFromSession } from "@/app/lib/advogado-access";
import { parsePlanilhaProcessos } from "@/app/lib/processos/planilha-import";
import logger from "@/lib/logger";
import { Prisma, ProcessoStatus } from "@/app/generated/prisma";

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

interface ImportProcessoCredentials {
  nome: string;
  email: string;
  senhaGerada: string;
}

export interface ImportProcessosResponse {
  success: boolean;
  createdProcessos: number;
  updatedProcessos: number;
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
      createdClientes: 0,
      createdUsuarios: [],
      avisos: [],
      erros: ["Usuário não autenticado."],
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
        tenantId: {
          in: [tenantId, "GLOBAL"],
        },
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
    let createdClientes = 0;

    const defaultPasswordBase = "Cliente@";

    const ensureCliente = async (
      nome: string,
      email?: string,
    ): Promise<{ id: string; usuarioId?: string }> => {
      const cacheKey = normalizeCacheKey(nome);
      if (clienteCache.has(cacheKey)) {
        return clienteCache.get(cacheKey)!;
      }

      let cliente = await prisma.cliente.findFirst({
        where: {
          tenantId,
          nome: {
            equals: nome,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          usuarioId: true,
        },
      });

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
          },
        });
        createdClientes += 1;
      } else if (email && !cliente.usuarioId) {
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

      const senhaTemporaria = `${defaultPasswordBase}${Math.floor(
        1000 + Math.random() * 9000,
      )}`;
      const hashed = await bcrypt.hash(senhaTemporaria, 10);

      const [firstName, ...rest] = nome.split(" ");
      const usuario = await prisma.usuario.create({
        data: {
          tenantId,
          email,
          firstName: firstName || nome,
          lastName: rest.join(" ") || null,
          passwordHash: hashed,
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

      generatedCredentials.push({
        nome,
        email,
        senhaGerada: senhaTemporaria,
      });

      return usuario.id;
    };

    for (const registro of registros) {
      if (processoCache.has(registro.numero)) {
        warnings.push(
          `Processo ${registro.numero} listado mais de uma vez no arquivo.`,
        );
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
          });

        const tagsValue: Prisma.InputJsonValue = [
          "planilha-import",
          registro.origem.toLowerCase(),
        ];

        const processoData = {
          tenantId,
          numero: registro.numero,
          numeroCnj: registro.numero,
          titulo: registro.classe
            ? `${registro.classe} - ${registro.autor}`
            : `Processo ${registro.autor}`,
          descricao: registro.fonte
            ? `Importado da planilha (${registro.fonte}).`
            : `Importado a partir da planilha ${registro.sheet}.`,
          status: ProcessoStatus.EM_ANDAMENTO,
          areaId: resolveAreaId(registro.area),
          classeProcessual: registro.classe ?? null,
          vara: registro.vara ?? null,
          comarca: registro.comarca ?? "Salvador/BA",
          foro: registro.vara ?? null,
          segredoJustica: false,
          clienteId: cliente.id,
          advogadoResponsavelId: fallbackAdvogado,
          dataDistribuicao: existingProcesso?.dataDistribuicao ?? new Date(),
          tags: tagsValue,
        };

        const processo = await prisma.processo.upsert({
          where: {
            tenantId_numero: {
              tenantId,
              numero: registro.numero,
            },
          },
          update: processoData,
          create: processoData,
          select: {
            id: true,
          },
        });

        if (existingProcesso) {
          updatedProcessos += 1;
        } else {
          createdProcessos += 1;
        }

        await ensureParte(processo.id, "AUTOR", registro.autor, cliente.id);
        await ensureParte(processo.id, "REU", registro.reu ?? null);
      } catch (error) {
        logger.error("Erro ao importar processo via planilha", error);
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
          createdClientes,
          createdUsuarios: generatedCredentials.length,
          criarAcessoClientes,
        },
        changedFields: [],
      },
    });

    revalidatePath("/processos");

    return {
      success: true,
      createdProcessos,
      updatedProcessos,
      createdClientes,
      createdUsuarios: generatedCredentials,
      avisos: warnings,
    };
  } catch (error) {
    logger.error("Erro geral na importação de processos", error);

    return {
      success: false,
      createdProcessos: 0,
      updatedProcessos: 0,
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
