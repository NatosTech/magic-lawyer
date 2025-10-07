"use client";

import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { toast } from "sonner";
import { Search, Building2 } from "lucide-react";

import { formatarCnpj, validarCnpj } from "@/lib/api/cnpj";
import { type CnpjData } from "@/types/brazil";
import { useCnpjSearch } from "@/hooks/use-brazil-apis";

interface CnpjInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onCnpjFound?: (cnpjData: CnpjData) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function CnpjInput({
  label = "CNPJ",
  placeholder = "00.000.000/0000-00",
  value = "",
  onChange,
  onCnpjFound,
  isRequired = false,
  isDisabled = false,
  className,
}: CnpjInputProps) {
  const { searchCnpj, loading, error } = useCnpjSearch();

  const handleCnpjChange = (newValue: string) => {
    const formatted = formatarCnpj(newValue);

    onChange?.(formatted);
  };

  const handleSearchCnpj = async () => {
    if (!value || !validarCnpj(value)) {
      toast.error("Digite um CNPJ válido");

      return;
    }

    const cnpjData = await searchCnpj(value);

    if (cnpjData) {
      onCnpjFound?.(cnpjData);
      toast.success("CNPJ encontrado!");
    } else if (error) {
      toast.error(error);
    } else {
      toast.error("CNPJ não encontrado");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchCnpj();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        className="flex-1"
        isDisabled={isDisabled || loading}
        isRequired={isRequired}
        label={label}
        placeholder={placeholder}
        startContent={<Building2 className="w-4 h-4 text-default-400" />}
        value={value}
        onChange={(e) => handleCnpjChange(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <Button
        className="min-w-12"
        color="primary"
        isDisabled={!value || !validarCnpj(value) || loading}
        isLoading={loading}
        variant="bordered"
        onPress={handleSearchCnpj}
      >
        {!loading && <Search className="w-4 h-4" />}
      </Button>
    </div>
  );
}
