import useSWR from "swr";
import { useSession } from "next-auth/react";

import {
  listDadosBancarios,
  getDadosBancarios,
  getMeusDadosBancarios,
  getDadosBancariosAtivos,
  getTiposConta,
  getTiposContaBancaria,
  getTiposChavePix,
} from "@/app/actions/dados-bancarios";
import { getBancosDisponiveis } from "@/app/actions/bancos";

// Hook para listar dados bancários
export function useDadosBancarios(filters?: {
  usuarioId?: string;
  clienteId?: string;
  ativo?: boolean;
  principal?: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    ["dados-bancarios", filters],
    () => listDadosBancarios(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    dadosBancarios: data?.data || [],
    isLoading,
    error: error,
    mutate,
  };
}

// Hook para buscar dados bancários específicos
export function useDadosBancariosById(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["dados-bancarios", id] : null,
    () => getDadosBancarios(id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    dadosBancarios: data?.data,
    isLoading,
    error: error,
    mutate,
  };
}

// Hook para dados bancários do usuário logado
export function useMeusDadosBancarios() {
  const { data: session } = useSession();
  const { data, error, isLoading, mutate } = useSWR(
    session?.user?.id ? ["meus-dados-bancarios", session.user.id] : null,
    getMeusDadosBancarios,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 0, // Desabilitar cache
      shouldRetryOnError: false,
    },
  );

  return {
    dadosBancarios: data?.success ? data.data : [],
    isLoading,
    error: error,
    mutate,
  };
}

// Hook para dados bancários ativos do tenant
export function useDadosBancariosAtivos() {
  const { data, error, isLoading } = useSWR(
    "dados-bancarios-ativos",
    getDadosBancariosAtivos,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    dadosBancarios: data?.data || [],
    isLoading,
    error: error,
  };
}

// Hook para bancos disponíveis
export function useBancosDisponiveis(enabled = true) {
  const { data, error, isLoading } = useSWR(
    enabled ? "bancos-disponiveis" : null,
    getBancosDisponiveis,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    bancos: data?.bancos || [],
    isLoading,
    error: error,
  };
}

// Hook para tipos de conta
export function useTiposConta(enabled = true) {
  const { data, error, isLoading } = useSWR(
    enabled ? "tipos-conta" : null,
    getTiposConta,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    tipos: data?.data || [],
    isLoading,
    error: error,
  };
}

// Hook para tipos de conta bancária
export function useTiposContaBancaria(enabled = true) {
  const { data, error, isLoading } = useSWR(
    enabled ? "tipos-conta-bancaria" : null,
    getTiposContaBancaria,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    tipos: data?.data || [],
    isLoading,
    error: error,
  };
}

// Hook para tipos de chave PIX
export function useTiposChavePix(enabled = true) {
  const { data, error, isLoading } = useSWR(
    enabled ? "tipos-chave-pix" : null,
    getTiposChavePix,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    tipos: data?.data || [],
    isLoading,
    error: error,
  };
}
