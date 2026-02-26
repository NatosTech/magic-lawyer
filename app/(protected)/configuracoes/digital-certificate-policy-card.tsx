"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Select, SelectItem } from "@heroui/react";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { Save, ShieldCheck } from "lucide-react";

import {
  updateTenantCertificatePolicy,
  type UpdateTenantCertificatePolicyInput,
} from "@/app/actions/tenant-config";
import { DigitalCertificatePolicy } from "@/generated/prisma";

const POLICY_OPTIONS = [
  {
    key: DigitalCertificatePolicy.OFFICE,
    label: "Certificado unico do escritorio",
    description:
      "Somente administradores podem subir e ativar um certificado valido para todo o escritorio.",
  },
  {
    key: DigitalCertificatePolicy.LAWYER,
    label: "Certificados por advogado",
    description:
      "Cada advogado gerencia o proprio certificado, sem um certificado central do escritorio.",
  },
  {
    key: DigitalCertificatePolicy.HYBRID,
    label: "Modo misto",
    description:
      "Permite um certificado do escritorio e certificados individuais por advogado.",
  },
];

interface DigitalCertificatePolicyCardProps {
  initialPolicy: DigitalCertificatePolicy;
}

export function DigitalCertificatePolicyCard({
  initialPolicy,
}: DigitalCertificatePolicyCardProps) {
  const router = useRouter();
  const [selectedPolicy, setSelectedPolicy] = useState(initialPolicy);
  const [savedPolicy, setSavedPolicy] = useState(initialPolicy);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = selectedPolicy !== savedPolicy;
  const helperMessage = useMemo(() => {
    if (selectedPolicy === DigitalCertificatePolicy.OFFICE) {
      return "Certificados pessoais ativos serao desativados ao salvar.";
    }

    if (selectedPolicy === DigitalCertificatePolicy.LAWYER) {
      return "Certificados do escritorio ativos serao desativados ao salvar.";
    }

    return "Nada sera desativado automaticamente no modo misto.";
  }, [selectedPolicy]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: UpdateTenantCertificatePolicyInput = {
        policy: selectedPolicy,
      };

      const result = await updateTenantCertificatePolicy(payload);

      if (!result.success) {
        throw new Error(result.error || "Erro ao salvar politica");
      }

      addToast({
        title: "Politica atualizada",
        description: "A configuracao de certificados foi salva com sucesso.",
        color: "success",
      });
      setSavedPolicy(selectedPolicy);
      router.refresh();
    } catch (error) {
      addToast({
        title: "Erro ao salvar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
      <CardHeader className="flex flex-col gap-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-default/20 p-2">
            <ShieldCheck className="h-5 w-5 text-default-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Politica de certificados digitais
            </h2>
            <p className="text-sm text-default-400">
              Defina como o escritorio deve usar certificados A1 para integracoes
              PJe.
            </p>
          </div>
        </div>
      </CardHeader>
      <Divider className="border-white/10" />
      <CardBody className="space-y-4">
        <Select
          description={helperMessage}
          label="Modelo de uso"
          selectedKeys={[selectedPolicy]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0];

            if (value && typeof value === "string") {
              setSelectedPolicy(value as DigitalCertificatePolicy);
            }
          }}
        >
          {POLICY_OPTIONS.map((option) => (
            <SelectItem
              key={option.key}
              description={option.description}
              textValue={option.label}
            >
              {option.label}
            </SelectItem>
          ))}
        </Select>

        <div className="flex justify-end">
          <Button
            color="primary"
            isDisabled={!isDirty || isSaving}
            isLoading={isSaving}
            startContent={!isSaving ? <Save className="h-4 w-4" /> : null}
            onPress={handleSave}
          >
            {isSaving ? "Salvando..." : "Salvar politica"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
