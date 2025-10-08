"use client";

import { useState } from "react";
import { Avatar, Button, Spinner } from "@heroui/react";
import { Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { ImageEditorModal } from "./image-editor-modal";

import { uploadAvatar, deleteAvatar } from "@/app/actions/profile";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarChange: (avatarUrl: string) => void;
  disabled?: boolean;
}

export function AvatarUpload({ currentAvatarUrl, userName, onAvatarChange, disabled = false }: AvatarUploadProps) {
  const { update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleSaveAvatar = async (imageData: string | FormData | null, isUrl: boolean) => {
    if (!imageData) return;

    setIsLoading(true);
    setIsEditorOpen(false);

    try {
      let result;

      if (isUrl && typeof imageData === "string") {
        // Se for URL, criar um FormData com a URL
        const formData = new FormData();

        formData.append("url", imageData);
        result = await uploadAvatar(formData);
      } else if (imageData instanceof FormData) {
        // Se for FormData (arquivo original), usar diretamente
        result = await uploadAvatar(imageData);
      } else if (typeof imageData === "string") {
        // Se for base64 (crop), converter para blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        const formData = new FormData();

        formData.append("file", blob, "avatar.jpg");
        result = await uploadAvatar(formData);
      } else {
        throw new Error("Tipo de dados inválido");
      }

      if (result.success) {
        toast.success("Avatar atualizado com sucesso!");
        onAvatarChange(result.avatarUrl || "");

        // Forçar atualização da sessão para atualizar o header
        if (result.sessionUpdated) {
          await updateSession();
          // Disparar evento customizado para atualizar o header
          window.dispatchEvent(
            new CustomEvent("avatarUpdated", {
              detail: { avatarUrl: "" },
            })
          );
        }
      } else {
        toast.error(result.error || "Erro ao atualizar avatar");
      }
    } catch (error) {
      console.error("Erro ao salvar avatar:", error);
      toast.error("Erro ao salvar avatar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl) return;

    setIsLoading(true);

    try {
      const result = await deleteAvatar(currentAvatarUrl);

      if (result.success) {
        toast.success("Avatar removido com sucesso!");
        onAvatarChange("");

        // Forçar atualização da sessão para atualizar o header
        if (result.sessionUpdated) {
          await updateSession();
          // Disparar evento customizado para atualizar o header
          window.dispatchEvent(
            new CustomEvent("avatarUpdated", {
              detail: { avatarUrl: "" },
            })
          );
        }
      } else {
        toast.error(result.error || "Erro ao remover avatar");
      }
    } catch (error) {
      console.error("Erro ao deletar avatar:", error);
      toast.error("Erro ao remover avatar");
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se é uma URL externa (não pode ser deletada)
  const isExternalUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);

      return !urlObj.hostname.includes("cloudinary.com") && !urlObj.hostname.includes("res.cloudinary.com");
    } catch {
      return false;
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar isBordered className="w-20 h-20" color="primary" name={userName} size="lg" src={currentAvatarUrl || undefined} />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Spinner color="white" size="sm" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button color="primary" isDisabled={disabled || isLoading} size="sm" startContent={<Edit3 className="w-4 h-4" />} variant="bordered" onPress={() => setIsEditorOpen(true)}>
            Editar Avatar
          </Button>

          {currentAvatarUrl && !isExternalUrl(currentAvatarUrl) && (
            <Button color="danger" isDisabled={disabled || isLoading} size="sm" startContent={<Trash2 className="w-4 h-4" />} variant="bordered" onPress={handleDelete}>
              Remover
            </Button>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-default-400">JPG, PNG, WebP ou URL</p>
          <p className="text-xs text-default-400">Máximo 5MB</p>
          {currentAvatarUrl && isExternalUrl(currentAvatarUrl) && <p className="text-xs text-warning-500 mt-1">⚠️ URL externa - não pode ser removida</p>}
        </div>
      </div>

      <ImageEditorModal currentImageUrl={currentAvatarUrl} isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveAvatar} />
    </>
  );
}
