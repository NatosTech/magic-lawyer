"use client";

import { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/react";
import useSWR from "swr";
import { MapPin } from "lucide-react";
import {
  getTenantUF,
  getUFsDisponiveis,
  type getTenantUF as GetTenantUFFn,
  type getUFsDisponiveis as GetUFsDisponiveisFn,
} from "@/app/actions/portal-advogado";

interface UFSelectorProps {
  value?: string;
  onChange?: (uf: string) => void;
  label?: string;
}

// Mapeamento de siglas UF para nomes completos
const UF_LABELS: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

export function UFSelector({
  value,
  onChange,
  label = "Selecione a UF",
}: UFSelectorProps) {
  const [selectedUF, setSelectedUF] = useState<string | undefined>(value);

  // Buscar UF principal do tenant
  const { data: tenantUF, isLoading: isLoadingTenantUF } = useSWR<
    string | null,
    Error
  >("portal-advogado-tenant-uf", async () => {
    return await getTenantUF();
  });

  // Buscar todas as UFs disponíveis
  const { data: ufsDisponiveis, isLoading: isLoadingUFs } = useSWR<
    string[],
    Error
  >("portal-advogado-ufs", async () => {
    return await getUFsDisponiveis();
  });

  // Inicializar com UF do tenant quando carregar
  useEffect(() => {
    if (!selectedUF && tenantUF && !isLoadingTenantUF) {
      setSelectedUF(tenantUF);
      onChange?.(tenantUF);
    }
  }, [tenantUF, isLoadingTenantUF, selectedUF, onChange]);

  // Sincronizar com value externo
  useEffect(() => {
    if (value !== undefined && value !== selectedUF) {
      setSelectedUF(value);
    }
  }, [value]);

  const handleChange = (uf: string) => {
    setSelectedUF(uf);
    onChange?.(uf);
  };

  const isLoading = isLoadingTenantUF || isLoadingUFs;

  return (
    <Select
      label={label}
      placeholder="Selecione uma UF"
      selectedKeys={selectedUF ? [selectedUF] : []}
      onSelectionChange={(keys) => {
        const uf = Array.from(keys)[0] as string;
        if (uf) {
          handleChange(uf);
        }
      }}
      startContent={<MapPin className="w-4 h-4" />}
      isDisabled={isLoading || !ufsDisponiveis || ufsDisponiveis.length === 0}
      description={
        tenantUF && selectedUF === tenantUF
          ? "UF principal do escritório"
          : undefined
      }
    >
      {(ufsDisponiveis || []).map((uf) => (
        <SelectItem key={uf} value={uf}>
          {uf} - {UF_LABELS[uf] || uf}
        </SelectItem>
      ))}
    </Select>
  );
}

