"use client";

import type { SearchResult } from "./search-bar";

import { useState, useEffect } from "react";

import { searchContent } from "@/app/actions/search";

export function useSearchResults(
  query: string,
  isOpen: boolean,
  tenantId?: string | null,
  options?: {
    allowEmptyQuery?: boolean;
  },
) {
  const [data, setData] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowEmptyQuery = options?.allowEmptyQuery ?? false;
  const minQueryLength = allowEmptyQuery ? 0 : 2;
  const normalizedQueryLength = query.trim().length;

  // Para super admin, permitir "ALL" ou qualquer tenantId válido
  // Para usuários normais, tenantId não pode ser vazio
  const isValidTenantContext = 
    tenantId === undefined || // Não especificado (usuário normal usa do session)
    tenantId === null || // Null é válido para super admin sem tenant selecionado
    tenantId === "ALL" || // "ALL" é válido para super admin
    tenantId !== ""; // Qualquer string não vazia é válida

  const search = async () => {
    if (
      normalizedQueryLength < minQueryLength ||
      !isValidTenantContext
    ) {
      setData(null);

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchContent(query, {
        tenantId: tenantId ?? undefined,
      });

      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na busca");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (
      !isOpen ||
      normalizedQueryLength < minQueryLength ||
      !isValidTenantContext
    ) {
      setData(null);
      setError(null);

      return;
    }

    const timeoutId = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen, tenantId, minQueryLength, normalizedQueryLength]);

  return {
    data,
    isLoading,
    error,
    mutate: search,
  };
}
