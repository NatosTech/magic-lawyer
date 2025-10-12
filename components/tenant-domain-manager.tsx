"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { addToast } from "@heroui/toast";
import { EditIcon, CheckIcon, CloseIcon } from "@/components/icons";

import { updateTenantDomain, validateDomain } from "@/app/actions/tenant-domains";

interface TenantDomainManagerProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain?: string | null;
    status: string;
  };
  onUpdate?: () => void;
}

export function TenantDomainManager({ tenant, onUpdate }: TenantDomainManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [domain, setDomain] = useState(tenant.domain || "");
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Validar domínio antes de salvar
      const validationResult = await validateDomain(domain, tenant.id);

      if (!validationResult.valid) {
        setValidation(validationResult);
        setIsLoading(false);
        return;
      }

      await updateTenantDomain(tenant.id, domain || null);

      addToast({
        title: "Domínio atualizado",
        description: `O domínio do tenant ${tenant.name} foi atualizado com sucesso.`,
        color: "success",
      });

      setIsModalOpen(false);
      setValidation(null);
      onUpdate?.();
    } catch (error) {
      addToast({
        title: "Erro ao atualizar domínio",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDomain(tenant.domain || "");
    setValidation(null);
    setIsModalOpen(false);
  };

  const handleDomainChange = async (value: string) => {
    setDomain(value);

    if (value && value !== tenant.domain) {
      // Validar em tempo real
      const validationResult = await validateDomain(value, tenant.id);
      setValidation(validationResult);
    } else {
      setValidation(null);
    }
  };

  const getDomainStatus = () => {
    if (!tenant.domain) {
      return (
        <Chip color="default" variant="flat">
          Sem domínio
        </Chip>
      );
    }

    if (tenant.domain.includes("vercel.app")) {
      return (
        <Chip color="primary" variant="flat">
          Vercel
        </Chip>
      );
    }

    return (
      <Chip color="success" variant="flat">
        Customizado
      </Chip>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Domínio</h3>
            <p className="text-sm text-gray-600">Configure o domínio personalizado para este tenant</p>
          </div>
          <Button size="sm" variant="flat" onPress={() => setIsModalOpen(true)} startContent={<EditIcon />}>
            Editar
          </Button>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status</p>
                {getDomainStatus()}
              </div>
              <div>
                <p className="font-medium">Domínio Atual</p>
                <p className="text-sm text-gray-600">{tenant.domain || "Nenhum configurado"}</p>
              </div>
            </div>

            {tenant.domain && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">URLs de Acesso:</p>
                <div className="space-y-1 text-sm">
                  <p>• {tenant.domain}</p>
                  <p>• {tenant.slug}.magiclawyer.vercel.app</p>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCancel} size="md">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">Configurar Domínio - {tenant.name}</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Configure um domínio personalizado para este tenant. Deixe em branco para usar apenas o subdomínio da Vercel.</p>
              </div>

              <Input
                label="Domínio"
                placeholder="exemplo.com.br"
                value={domain}
                onValueChange={handleDomainChange}
                description="Domínio personalizado (opcional)"
                endContent={validation && (validation.valid ? <CheckIcon className="text-green-500" /> : <CloseIcon className="text-red-500" />)}
                color={validation ? (validation.valid ? "success" : "danger") : "default"}
                errorMessage={validation?.message}
              />

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium mb-2">URLs que funcionarão:</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• {tenant.slug}.magiclawyer.vercel.app (sempre funciona)</p>
                  {domain && <p>• {domain} (após configuração DNS)</p>}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleCancel}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={isLoading} isDisabled={validation !== null && !validation.valid}>
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
