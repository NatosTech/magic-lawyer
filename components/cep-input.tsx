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

export function CepInput({ label = "CEP", placeholder = "00000-000", value = "", onChange, onCepFound, isRequired = false, isDisabled = false, className }: CepInputProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCepChange = (newValue: string) => {
    const formatted = formatarCep(newValue);
    onChange?.(formatted);
  };

  const buscarCep = async () => {
    console.log("🔍 Buscando CEP:", value);
    
    if (!value || !validarCep(value)) {
      console.log("❌ CEP inválido:", value);
      toast.error("Digite um CEP válido");
      return;
    }

    try {
      setIsLoading(true);
      console.log("⏳ Fazendo requisição para:", value);
      const result = await buscarCepAction(value);
      
      console.log("📦 Resultado:", result);
      
      if (result.success && result.cepData) {
        onCepFound?.(result.cepData);
        toast.success("CEP encontrado!");
      } else {
        toast.error(result.error || "CEP não encontrado");
      }
    } catch (error) {
      console.error("💥 Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("⌨️ Tecla pressionada:", e.key);
    
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      console.log("🚀 Executando busca do CEP");
      buscarCep();
    }
  };

  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => handleCepChange(e.target.value)}
      onKeyDown={handleKeyDown}
      isRequired={isRequired}
      isDisabled={isDisabled || isLoading}
      startContent={<MapPin className="w-4 h-4 text-default-400" />}
      endContent={isLoading ? <Spinner size="sm" /> : null}
      className={className}
    />
  );
}
