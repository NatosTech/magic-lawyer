"use client";

import { useState, useEffect } from "react";
import { searchContent } from "@/app/actions/search";

import type { SearchResult } from "./search-bar";

export function useSearchResults(query: string, isOpen: boolean) {
  const [data, setData] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim() || query.length < 2) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchContent(query);
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
    if (!isOpen || !query.trim()) {
      setData(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  return {
    data,
    isLoading,
    error,
    mutate: search,
  };
}
