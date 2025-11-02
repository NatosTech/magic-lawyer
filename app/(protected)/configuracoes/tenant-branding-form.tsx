"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { Edit2, Save, X, Palette, Upload, Image as ImageIcon } from "lucide-react";

import {
  updateTenantBranding,
  type UpdateTenantBrandingInput,
} from "@/app/actions/tenant-config";

interface TenantBrandingFormProps {
  initialData: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
}

export function TenantBrandingForm({ initialData }: TenantBrandingFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    primaryColor: initialData.primaryColor || "#2563eb",
    secondaryColor: initialData.secondaryColor || "#1d4ed8",
    accentColor: initialData.accentColor || "#3b82f6",
    logoUrl: initialData.logoUrl || "",
    faviconUrl: initialData.faviconUrl || "",
  });

  useEffect(() => {
    if (!isEditing) {
      setFormData({
        primaryColor: initialData.primaryColor || "#2563eb",
        secondaryColor: initialData.secondaryColor || "#1d4ed8",
        accentColor: initialData.accentColor || "#3b82f6",
        logoUrl: initialData.logoUrl || "",
        faviconUrl: initialData.faviconUrl || "",
      });
    }
  }, [isEditing, initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatePayload: UpdateTenantBrandingInput = {};

      if (formData.primaryColor !== (initialData.primaryColor || "#2563eb")) {
        updatePayload.primaryColor = formData.primaryColor || null;
      }
      if (
        formData.secondaryColor !== (initialData.secondaryColor || "#1d4ed8")
      ) {
        updatePayload.secondaryColor = formData.secondaryColor || null;
      }
      if (formData.accentColor !== (initialData.accentColor || "#3b82f6")) {
        updatePayload.accentColor = formData.accentColor || null;
      }
      if (formData.logoUrl !== (initialData.logoUrl || "")) {
        updatePayload.logoUrl = formData.logoUrl || null;
      }
      if (formData.faviconUrl !== (initialData.faviconUrl || "")) {
        updatePayload.faviconUrl = formData.faviconUrl || null;
      }

      const result = await updateTenantBranding(updatePayload);

      if (result.success) {
        addToast({
          title: "Branding atualizado",
          description: "A identidade visual foi atualizada com sucesso.",
          color: "success",
        });
        setIsEditing(false);
        // Trigger page refresh
        window.location.reload();
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
      primaryColor: initialData.primaryColor || "#2563eb",
      secondaryColor: initialData.secondaryColor || "#1d4ed8",
      accentColor: initialData.accentColor || "#3b82f6",
      logoUrl: initialData.logoUrl || "",
      faviconUrl: initialData.faviconUrl || "",
    });
    setIsEditing(false);
  };

  return (
    <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
      <CardHeader className="flex flex-col gap-2 pb-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Identidade Visual
            </h2>
            <p className="text-sm text-default-400">
              {isEditing
                ? "Personalize cores, logo e favicon do escritório."
                : "Configurações de branding e personalização visual."}
            </p>
          </div>
          {!isEditing && (
            <Tooltip content="Editar identidade visual">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Input
              isDisabled={!isEditing}
              description="Cor primária da interface"
              label="Cor Primária"
              startContent={<Palette className="h-4 w-4 text-primary" />}
              value={formData.primaryColor}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, primaryColor: value }))
              }
            />
            {!isEditing && formData.primaryColor && (
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-8 h-8 rounded border border-white/20"
                  style={{ backgroundColor: formData.primaryColor }}
                />
                <span className="text-sm text-default-400">
                  {formData.primaryColor}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Input
              isDisabled={!isEditing}
              description="Cor secundária da interface"
              label="Cor Secundária"
              startContent={<Palette className="h-4 w-4 text-secondary" />}
              value={formData.secondaryColor}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, secondaryColor: value }))
              }
            />
            {!isEditing && formData.secondaryColor && (
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-8 h-8 rounded border border-white/20"
                  style={{ backgroundColor: formData.secondaryColor }}
                />
                <span className="text-sm text-default-400">
                  {formData.secondaryColor}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Input
              isDisabled={!isEditing}
              description="Cor de destaque para elementos especiais"
              label="Cor de Destaque"
              startContent={<Palette className="h-4 w-4 text-accent" />}
              value={formData.accentColor}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, accentColor: value }))
              }
            />
            {!isEditing && formData.accentColor && (
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-8 h-8 rounded border border-white/20"
                  style={{ backgroundColor: formData.accentColor }}
                />
                <span className="text-sm text-default-400">
                  {formData.accentColor}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Input
              isDisabled={!isEditing}
              description="URL da logo do escritório"
              label="URL da Logo"
              placeholder="https://exemplo.com/logo.png"
              startContent={<ImageIcon className="h-4 w-4 text-primary" />}
              value={formData.logoUrl}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, logoUrl: value }))
              }
            />
            {!isEditing && formData.logoUrl && (
              <div className="mt-2">
                <img
                  alt="Logo do escritório"
                  className="h-16 object-contain"
                  src={formData.logoUrl}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Input
              isDisabled={!isEditing}
              description="URL do favicon do escritório"
              label="URL do Favicon"
              placeholder="https://exemplo.com/favicon.ico"
              startContent={<ImageIcon className="h-4 w-4 text-secondary" />}
              value={formData.faviconUrl}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, faviconUrl: value }))
              }
            />
            {!isEditing && formData.faviconUrl && (
              <div className="mt-2">
                <img
                  alt="Favicon do escritório"
                  className="h-8 w-8 object-contain"
                  src={formData.faviconUrl}
                />
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              color="danger"
              radius="full"
              variant="flat"
              startContent={<X className="h-4 w-4" />}
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

