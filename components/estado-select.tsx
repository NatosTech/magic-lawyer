"use client";

import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { useEstadosBrasil } from "@/hooks/use-brazil-apis";
import { type EstadoIBGE } from "@/types/brazil";

interface EstadoSelectProps {
  label?: string;
  placeholder?: string;
  selectedKeys?: string[];
  onSelectionChange?: (keys: any) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function EstadoSelect({ label = "Estado", placeholder = "Selecione o estado", selectedKeys, onSelectionChange, isRequired = false, isDisabled = false, className }: EstadoSelectProps) {
  const { estados, isLoading, error } = useEstadosBrasil();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Spinner size="sm" />
        <span className="text-sm text-default-500">Carregando estados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-danger">Erro ao carregar estados</span>
      </div>
    );
  }

  return (
    <Select label={label} placeholder={placeholder} selectedKeys={selectedKeys || []} onSelectionChange={onSelectionChange} isRequired={isRequired} isDisabled={isDisabled} className={className}>
      {estados?.map((estado) => (
        <SelectItem key={estado.sigla}>
          <div className="flex items-center justify-between w-full">
            <span>{estado.nome}</span>
            <span className="text-default-400 text-sm ml-2">({estado.sigla})</span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}
