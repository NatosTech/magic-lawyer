"use client";

import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { useMunicipiosPorEstado } from "@/hooks/use-brazil-apis";
import { type MunicipioIBGE } from "@/types/brazil";

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
  const { municipios, isLoading, error } = useMunicipiosPorEstado(estadoSelecionado);

  if (!estadoSelecionado) {
    return (
      <Select
        label={label}
        placeholder="Primeiro selecione o estado"
        selectedKeys={selectedKeys || []}
        onSelectionChange={onSelectionChange}
        isRequired={isRequired}
        isDisabled={true}
        className={className}
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
    <Select label={label} placeholder={placeholder} selectedKeys={selectedKeys || []} onSelectionChange={onSelectionChange} isRequired={isRequired} isDisabled={isDisabled} className={className}>
      {municipios?.map((municipio) => <SelectItem key={municipio.nome}>{municipio.nome}</SelectItem>)}
    </Select>
  );
}
