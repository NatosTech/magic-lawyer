"use client";

import { Autocomplete, AutocompleteItem } from "@heroui/react";
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
  const { municipios, isLoading, error } = useMunicipiosPorEstado(
    estadoSelecionado || null,
  );
  const listaMunicipios = municipios ?? [];
  const municipioItems = listaMunicipios.map((municipio) => ({
    key: municipio.nome,
    label: municipio.nome,
    data: municipio,
  }));
  const municipioKeySet = new Set(municipioItems.map((item) => item.key));
  const normalizedSelectedKeys = new Set(
    (selectedKeys ?? []).filter(
      (key): key is string => typeof key === "string" && municipioKeySet.has(key),
    ),
  );
  const selectedKey =
    normalizedSelectedKeys.size > 0
      ? Array.from(normalizedSelectedKeys)[0]
      : null;

  if (!estadoSelecionado) {
    const placeholderItems = [{ key: "placeholder", label: "Selecione um estado primeiro" }];

    return (
      <Autocomplete
        allowsCustomValue={false}
        className={className}
        isDisabled
        isRequired={isRequired}
        label={label}
        placeholder="Primeiro selecione o estado"
        isClearable={false}
        items={placeholderItems}
        selectedKey={undefined}
      >
        {(item) => (
          <AutocompleteItem key={item.key} textValue={item.label}>
            {item.label}
          </AutocompleteItem>
        )}
      </Autocomplete>
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
    <Autocomplete
      allowsCustomValue={false}
      className={className}
      items={municipioItems}
      isDisabled={isDisabled}
      isRequired={isRequired}
      label={label}
      placeholder={placeholder}
      isClearable={!isRequired}
      selectedKey={selectedKey ?? undefined}
      onSelectionChange={(key) => {
        if (!onSelectionChange) return;
        if (key) {
          onSelectionChange(new Set([key]));
        } else {
          onSelectionChange(new Set());
        }
      }}
      listboxProps={{ emptyContent: "Nenhuma cidade encontrada" }}
    >
      {(item) => (
        <AutocompleteItem key={item.key} textValue={item.label}>
          {item.label}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
