"use server";

import { getEstadosBrasilCached } from "@/lib/api/brazil-states";
import { getMunicipiosPorSiglaEstado } from "@/lib/api/brazil-municipios";
import { buscarCepCached } from "@/lib/api/cep";
import { buscarCnpjCached } from "@/lib/api/cnpj";
import {
  type EstadoIBGE,
  type MunicipioIBGE,
  type CepData,
  type CnpjData,
} from "@/types/brazil";
import logger from "@/lib/logger";

/**
 * Server Action para buscar estados do Brasil
 */
export async function getEstadosBrasilAction(): Promise<{
  success: boolean;
  estados?: EstadoIBGE[];
  error?: string;
}> {
  try {
    const estados = await getEstadosBrasilCached();

    return {
      success: true,
      estados,
    };
  } catch (error) {
    logger.error("Erro ao buscar estados:", error);

    return {
      success: false,
      error: "Erro ao buscar estados do Brasil",
    };
  }
}

/**
 * Server Action para buscar dados do CEP
 */
export async function buscarCepAction(cep: string): Promise<{
  success: boolean;
  cepData?: CepData;
  error?: string;
}> {
  try {
    if (!cep || cep.replace(/\D/g, "").length !== 8) {
      return {
        success: false,
        error: "CEP deve ter 8 dígitos",
      };
    }

    const cepData = await buscarCepCached(cep);

    if (!cepData) {
      return {
        success: false,
        error: "CEP não encontrado",
      };
    }

    return {
      success: true,
      cepData,
    };
  } catch (error) {
    logger.error("Erro ao buscar CEP:", error);

    return {
      success: false,
      error: "Erro ao buscar CEP",
    };
  }
}

/**
 * Server Action para buscar municípios por estado
 */
export async function getMunicipiosPorEstadoAction(
  siglaEstado: string,
): Promise<{
  success: boolean;
  municipios?: MunicipioIBGE[];
  error?: string;
}> {
  try {
    if (!siglaEstado || siglaEstado.length !== 2) {
      return {
        success: false,
        error: "Sigla do estado deve ter 2 caracteres",
      };
    }

    const municipios = await getMunicipiosPorSiglaEstado(siglaEstado);

    return {
      success: true,
      municipios,
    };
  } catch (error) {
    logger.error("Erro ao buscar municípios:", error);

    return {
      success: false,
      error: "Erro ao buscar municípios do estado",
    };
  }
}

/**
 * Server Action para buscar dados do CNPJ
 */
export async function buscarCnpjAction(cnpj: string): Promise<{
  success: boolean;
  cnpjData?: CnpjData;
  error?: string;
}> {
  try {
    if (!cnpj || cnpj.replace(/\D/g, "").length !== 14) {
      return {
        success: false,
        error: "CNPJ deve ter 14 dígitos",
      };
    }

    const cnpjData = await buscarCnpjCached(cnpj);

    if (!cnpjData) {
      return {
        success: false,
        error: "CNPJ não encontrado",
      };
    }

    return {
      success: true,
      cnpjData,
    };
  } catch (error) {
    logger.error("Erro ao buscar CNPJ:", error);

    return {
      success: false,
      error: "Erro ao buscar CNPJ",
    };
  }
}
