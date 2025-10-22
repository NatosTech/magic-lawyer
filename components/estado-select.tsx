"use client";

import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { Spinner } from "@heroui/spinner";

import { useEstadosBrasil } from "@/hooks/use-brazil-apis";

interface EstadoSelectProps {
  label?: string;
  placeholder?: string;
  selectedKeys?: string[];
  onSelectionChange?: (keys: any) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function EstadoSelect({
  label = "Estado",
  placeholder = "Selecione o estado",
  selectedKeys,
  onSelectionChange,
  isRequired = false,
  isDisabled = false,
  className,
}: EstadoSelectProps) {
  const { estados, isLoading, error } = useEstadosBrasil();
  const listaEstados = estados ?? [];
  const estadoItems = listaEstados.map((estado) => ({
    key: estado.sigla,
    label: `${estado.nome} (${estado.sigla})`,
    data: estado,
  }));
  const estadoKeySet = new Set(estadoItems.map((item) => item.key));
  const normalizedSelectedKeys = new Set(
    (selectedKeys ?? []).filter(
      (key): key is string => typeof key === "string" && estadoKeySet.has(key),
    ),
  );

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

  const selectedKey =
    normalizedSelectedKeys.size > 0
      ? Array.from(normalizedSelectedKeys)[0]
      : null;

  return (
    <Autocomplete
      allowsCustomValue={false}
      className={className}
      isClearable={!isRequired}
      isDisabled={isDisabled}
      isRequired={isRequired}
      items={estadoItems}
      label={label}
      listboxProps={{ emptyContent: "Nenhum estado encontrado" }}
      placeholder={placeholder}
      selectedKey={selectedKey ?? undefined}
      onSelectionChange={(key) => {
        if (!onSelectionChange) return;
        if (key) {
          onSelectionChange(new Set([key]));
        } else {
          onSelectionChange(new Set());
        }
      }}
    >
      {(item) => (
        <AutocompleteItem key={item.key} textValue={item.label}>
          {item.label}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
