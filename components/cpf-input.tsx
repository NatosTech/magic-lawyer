"use client";

import { Input } from "@heroui/input";
import { User } from "lucide-react";
import { useState } from "react";

import { formatarCpf, validarCpf } from "@/lib/api/cpf";

interface CpfInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function CpfInput({
  label = "CPF",
  placeholder = "000.000.000-00",
  value = "",
  onChange,
  isRequired = false,
  isDisabled = false,
  className,
}: CpfInputProps) {
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCpfChange = (newValue: string) => {
    const formatted = formatarCpf(newValue);

    onChange?.(formatted);

    // Limpar erro ao digitar
    if (isInvalid) {
      setIsInvalid(false);
      setErrorMessage("");
    }
  };

  const handleBlur = () => {
    if (value && value.replace(/\D/g, "").length === 11) {
      if (!validarCpf(value)) {
        setIsInvalid(true);
        setErrorMessage("CPF inválido");
      } else {
        setIsInvalid(false);
        setErrorMessage("");
      }
    }
  };

  return (
    <Input
      className={className}
      errorMessage={errorMessage}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      label={label}
      maxLength={14}
      placeholder={placeholder}
      startContent={<User className="w-4 h-4 text-default-400" />}
      value={value}
      onBlur={handleBlur}
      onChange={(e) => handleCpfChange(e.target.value)}
    />
  );
}
