import useSWR from "swr";

import { listDadosBancarios, getDadosBancarios, getMeusDadosBancarios, getDadosBancariosAtivos, getTiposConta, getTiposContaBancaria, getTiposChavePix } from "@/app/actions/dados-bancarios";
import { getBancosDisponiveis } from "@/app/actions/bancos";

// Hook para listar dados bancários
export function useDadosBancarios(filters?: { usuarioId?: string; clienteId?: string; ativo?: boolean; principal?: boolean }) {
  const { data, error, isLoading, mutate } = useSWR(["dados-bancarios", filters], () => listDadosBancarios(filters), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    dadosBancarios: data?.data || [],
    isLoading,
    error: error,
    mutate,
  };
}

// Hook para buscar dados bancários específicos
export function useDadosBancariosById(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? ["dados-bancarios", id] : null, () => getDadosBancarios(id), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    dadosBancarios: data?.data,
    isLoading,
    error: error,
    mutate,
  };
}

// Hook para dados bancários do usuário logado
export function useMeusDadosBancarios() {
  const { data, error, isLoading, mutate } = useSWR("meus-dados-bancarios", getMeusDadosBancarios, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    dadosBancarios: data?.data || [],
    isLoading,
    error: error,
    mutate,
  };
}

// Hook para dados bancários ativos do tenant
export function useDadosBancariosAtivos() {
  const { data, error, isLoading } = useSWR("dados-bancarios-ativos", getDadosBancariosAtivos, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    dadosBancarios: data?.data || [],
    isLoading,
    error: error,
  };
}

// Hook para bancos disponíveis
export function useBancosDisponiveis() {
  const { data, error, isLoading } = useSWR("bancos-disponiveis", getBancosDisponiveis, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    bancos: data?.bancos || [],
    isLoading,
    error: error,
  };
}

// Hook para tipos de conta
export function useTiposConta() {
  const { data, error, isLoading } = useSWR("tipos-conta", getTiposConta, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    tipos: data?.data || [],
    isLoading,
    error: error,
  };
}

// Hook para tipos de conta bancária
export function useTiposContaBancaria() {
  const { data, error, isLoading } = useSWR("tipos-conta-bancaria", getTiposContaBancaria, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    tipos: data?.data || [],
    isLoading,
    error: error,
  };
}

// Hook para tipos de chave PIX
export function useTiposChavePix() {
  const { data, error, isLoading } = useSWR("tipos-chave-pix", getTiposChavePix, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    tipos: data?.data || [],
    isLoading,
    error: error,
  };
}
