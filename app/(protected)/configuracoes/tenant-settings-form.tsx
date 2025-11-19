"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { Edit2, Save, X } from "lucide-react";

import {
  updateTenantBasicData,
  type UpdateTenantBasicDataInput,
} from "@/app/actions/tenant-config";

interface TenantSettingsFormProps {
  initialData: {
    name: string;
    email: string | null;
    telefone: string | null;
    razaoSocial: string | null;
    nomeFantasia: string | null;
    timezone: string;
  };
}

export function TenantSettingsForm({ initialData }: TenantSettingsFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData.name,
    email: initialData.email || "",
    telefone: initialData.telefone || "",
    razaoSocial: initialData.razaoSocial || "",
    nomeFantasia: initialData.nomeFantasia || "",
    timezone: initialData.timezone,
  });

  useEffect(() => {
    if (!isEditing) {
      setFormData({
        name: initialData.name,
        email: initialData.email || "",
        telefone: initialData.telefone || "",
        razaoSocial: initialData.razaoSocial || "",
        nomeFantasia: initialData.nomeFantasia || "",
        timezone: initialData.timezone,
      });
    }
  }, [isEditing, initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatePayload: UpdateTenantBasicDataInput = {};

      if (formData.name !== initialData.name) {
        updatePayload.name = formData.name;
      }
      if (formData.email !== (initialData.email || "")) {
        updatePayload.email = formData.email || undefined;
      }
      if (formData.telefone !== (initialData.telefone || "")) {
        updatePayload.telefone = formData.telefone || undefined;
      }
      if (formData.razaoSocial !== (initialData.razaoSocial || "")) {
        updatePayload.razaoSocial = formData.razaoSocial || undefined;
      }
      if (formData.nomeFantasia !== (initialData.nomeFantasia || "")) {
        updatePayload.nomeFantasia = formData.nomeFantasia || undefined;
      }
      if (formData.timezone !== initialData.timezone) {
        updatePayload.timezone = formData.timezone;
      }

      const result = await updateTenantBasicData(updatePayload);

      if (result.success) {
        addToast({
          title: "Configurações salvas",
          description: "Os dados do escritório foram atualizados com sucesso.",
          color: "success",
        });
        setIsEditing(false);
        // Refresh page data
        router.refresh();
      } else {
        throw new Error(result.error || "Erro ao salvar");
      }
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

  const handleCancel = () => {
    setFormData({
      name: initialData.name,
      email: initialData.email || "",
      telefone: initialData.telefone || "",
      razaoSocial: initialData.razaoSocial || "",
      nomeFantasia: initialData.nomeFantasia || "",
      timezone: initialData.timezone,
    });
    setIsEditing(false);
  };

  return (
    <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
      <CardHeader className="flex flex-col gap-2 pb-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Informações do Escritório
            </h2>
            <p className="text-sm text-default-400">
              {isEditing
                ? "Edite os dados básicos do seu escritório."
                : "Dados básicos e métricas do seu escritório."}
            </p>
          </div>
          {!isEditing && (
            <Tooltip content="Editar informações do escritório">
              <Button
                isIconOnly
                color="primary"
                radius="full"
                variant="flat"
                onPress={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <Divider className="border-white/10" />
      <CardBody className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            isRequired
            description="Nome do escritório ou empresa"
            isDisabled={!isEditing}
            label="Nome"
            value={formData.name}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, name: value }))
            }
          />

          <Input
            description="Email de contato principal"
            isDisabled={!isEditing}
            label="Email"
            type="email"
            value={formData.email}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, email: value }))
            }
          />

          <Input
            description="Telefone de contato"
            isDisabled={!isEditing}
            label="Telefone"
            value={formData.telefone}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, telefone: value }))
            }
          />

          <Input
            description="Razão social (CNPJ)"
            isDisabled={!isEditing}
            label="Razão Social"
            value={formData.razaoSocial}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, razaoSocial: value }))
            }
          />

          <Input
            description="Nome fantasia (marca)"
            isDisabled={!isEditing}
            label="Nome Fantasia"
            value={formData.nomeFantasia}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, nomeFantasia: value }))
            }
          />

          <Input
            description="Timezone para eventos e agendamentos"
            isDisabled={!isEditing}
            label="Timezone"
            value={formData.timezone}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, timezone: value }))
            }
          />
        </div>

        {isEditing && (
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              color="danger"
              radius="full"
              startContent={<X className="h-4 w-4" />}
              variant="flat"
              onPress={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={isSaving}
              radius="full"
              startContent={!isSaving ? <Save className="h-4 w-4" /> : null}
              onPress={handleSave}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
