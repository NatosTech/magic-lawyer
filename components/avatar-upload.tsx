"use client";

import { useState } from "react";
import { Avatar, Button, Spinner } from "@heroui/react";
import { Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { uploadAvatar, deleteAvatar } from "@/app/actions/profile";
import { ImageEditorModal } from "./image-editor-modal";

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

  const handleSaveAvatar = async (imageData: string | null, isUrl: boolean) => {
    if (!imageData) return;

    setIsLoading(true);
    setIsEditorOpen(false);

    try {
      let result;

      if (isUrl) {
        // Se for URL, criar um FormData com a URL
        const formData = new FormData();
        formData.append("url", imageData);
        result = await uploadAvatar(formData);
      } else {
        // Se for upload, converter base64 para blob e criar FormData
        const response = await fetch(imageData);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("file", blob, "avatar.jpg");
        result = await uploadAvatar(formData);
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
              detail: { avatarUrl: result.avatarUrl },
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
      const result = await deleteAvatar();

      if (result.success) {
        toast.success("Avatar removido com sucesso!");
        onAvatarChange("");

        // Forçar atualização da sessão para atualizar o header
        if (result.sessionUpdated) {
          await updateSession();
          // Disparar evento customizado para atualizar o header
          window.dispatchEvent(
            new CustomEvent("avatarUpdated", {
              detail: { avatarUrl: result.avatarUrl },
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

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar src={currentAvatarUrl || undefined} name={userName} size="lg" className="w-20 h-20" isBordered color="primary" />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Spinner size="sm" color="white" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" color="primary" variant="bordered" startContent={<Edit3 className="w-4 h-4" />} onPress={() => setIsEditorOpen(true)} isDisabled={disabled || isLoading}>
            Editar Avatar
          </Button>

          {currentAvatarUrl && (
            <Button size="sm" color="danger" variant="bordered" startContent={<Trash2 className="w-4 h-4" />} onPress={handleDelete} isDisabled={disabled || isLoading}>
              Remover
            </Button>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-default-400">JPG, PNG, WebP ou URL</p>
          <p className="text-xs text-default-400">Máximo 5MB</p>
        </div>
      </div>

      <ImageEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveAvatar} currentImageUrl={currentAvatarUrl} />
    </>
  );
}
