"use client";

import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";

import { useMunicipiosPorEstado } from "@/hooks/use-brazil-apis";

interface CidadeSelectProps {
  label?: string;
  placeholder?: string;
  selectedKeys?: string[];
  onSelectionChange?: (keys: any) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  estadoSelecionado?: string | null;
}

export function CidadeSelect({
  label = "Cidade",
  placeholder = "Selecione a cidade",
  selectedKeys,
  onSelectionChange,
  isRequired = false,
  isDisabled = false,
  className,
  estadoSelecionado,
}: CidadeSelectProps) {
  const { municipios, isLoading, error } = useMunicipiosPorEstado(estadoSelecionado || null);

  if (!estadoSelecionado) {
    return (
      <Select
        className={className}
        isDisabled={true}
        isRequired={isRequired}
        label={label}
        placeholder="Primeiro selecione o estado"
        selectedKeys={selectedKeys || []}
        onSelectionChange={onSelectionChange}
      >
        <SelectItem key="disabled" isDisabled>
          Selecione um estado primeiro
        </SelectItem>
      </Select>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Spinner size="sm" />
        <span className="text-sm text-default-500">Carregando cidades...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-danger">Erro ao carregar cidades</span>
      </div>
    );
  }

  return (
    <Select className={className} isDisabled={isDisabled} isRequired={isRequired} label={label} placeholder={placeholder} selectedKeys={selectedKeys || []} onSelectionChange={onSelectionChange}>
      {municipios?.map((municipio) => <SelectItem key={municipio.nome}>{municipio.nome}</SelectItem>) || []}
    </Select>
  );
}
