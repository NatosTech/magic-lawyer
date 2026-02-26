"use client";

import useSWR from "swr";

import { getCurrentUserAvatar } from "@/app/actions/profile";

export function useAvatar() {
  const { data, error, mutate } = useSWR("user-avatar", getCurrentUserAvatar, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0, // Não fazer polling automático
  });

  return {
    avatarUrl: data?.success ? data.avatarUrl : null,
    isLoading: !error && !data,
    isError: error,
    mutate, // Para revalidar manualmente
  };
}
