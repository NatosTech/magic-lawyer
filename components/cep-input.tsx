"use client";

import { useEffect } from "react";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { formatarCep, validarCep } from "@/lib/api/cep";
import { type CepData } from "@/types/brazil";
import { useCep } from "@/hooks/use-brazil-apis";

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

export function CepInput({ label = "CEP", placeholder = "00000-000", value = "", onChange, onCepFound, isRequired = false, isDisabled = false, className }: CepInputProps) {
  const { cepData, isLoading, error } = useCep(value);

  const handleCepChange = (newValue: string) => {
    const formatted = formatarCep(newValue);
    onChange?.(formatted);
  };

  // Chamar onCepFound quando os dados chegarem via SWR
  useEffect(() => {
    if (cepData && validarCep(value)) {
      onCepFound?.(cepData);
      toast.success("CEP encontrado!");
    }
  }, [cepData, value]); // Removido onCepFound das dependências

  // Mostrar erro se houver
  useEffect(() => {
    if (error && validarCep(value)) {
      toast.error("CEP não encontrado");
    }
  }, [error, value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      if (!value || !validarCep(value)) {
        toast.error("Digite um CEP válido");
        return;
      }
      // SWR já faz a busca automaticamente quando o valor muda
    }
  };

  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => handleCepChange(e.target.value)}
      onKeyPress={handleKeyPress}
      isRequired={isRequired}
      isDisabled={isDisabled || isLoading}
      startContent={<MapPin className="w-4 h-4 text-default-400" />}
      endContent={isLoading ? <Spinner size="sm" /> : null}
      className={className}
    />
  );
}
