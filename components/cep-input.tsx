"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

import { formatarCep, validarCep } from "@/lib/api/cep";
import { type CepData } from "@/types/brazil";
import { buscarCepAction } from "@/app/actions/brazil-apis";

interface CepInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onCepFound?: (cepData: CepData) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function CepInput({
  label = "CEP",
  placeholder = "00000-000",
  value = "",
  onChange,
  onCepFound,
  isRequired = false,
  isDisabled = false,
  className,
}: CepInputProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCepChange = (newValue: string) => {
    const formatted = formatarCep(newValue);

    onChange?.(formatted);

    // Busca automática quando CEP estiver completo e válido
    if (formatted && validarCep(formatted)) {
      setTimeout(() => {
        buscarCep(formatted);
      }, 500); // Pequeno delay para evitar muitas requisições
    }
  };

  const buscarCep = async (cepValue?: string) => {
    const cepToSearch = cepValue || value;

    if (!cepToSearch || !validarCep(cepToSearch)) {
      toast.error("Digite um CEP válido");

      return;
    }

    try {
      setIsLoading(true);
      const result = await buscarCepAction(cepToSearch);

      if (result.success && result.cepData) {
        onCepFound?.(result.cepData);
        toast.success("CEP encontrado!");
      } else {
        toast.error(result.error || "CEP não encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      buscarCep();
    }
  };

  return (
    <Input
      className={className}
      endContent={isLoading ? <Spinner size="sm" /> : null}
      isDisabled={isDisabled || isLoading}
      isRequired={isRequired}
      label={label}
      placeholder={placeholder}
      startContent={<MapPin className="w-4 h-4 text-default-400" />}
      value={value}
      onChange={(e) => handleCepChange(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
