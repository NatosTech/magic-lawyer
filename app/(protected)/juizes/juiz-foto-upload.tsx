"use client";

import { useState } from "react";
import { Avatar, Button, Spinner } from "@heroui/react";
import { Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { uploadJuizFoto, deleteJuizFoto } from "@/app/actions/juizes";
import { ImageEditorModal } from "@/components/image-editor-modal";

interface JuizFotoUploadProps {
  juizId?: string; // Opcional - se não tiver, não pode fazer upload
  currentFotoUrl?: string | null;
  juizNome: string;
  onFotoChange: (fotoUrl: string) => void;
  disabled?: boolean;
}

export function JuizFotoUpload({
  juizId,
  currentFotoUrl,
  juizNome,
  onFotoChange,
  disabled = false,
}: JuizFotoUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleSaveFoto = async (
    imageData: string | FormData | null,
    isUrl: boolean,
  ) => {
    if (!imageData) return;

    if (!juizId) {
      toast.error("Salve o juiz primeiro para fazer upload da foto");

      return;
    }

    setIsLoading(true);
    setIsEditorOpen(false);

    try {
      let result;

      if (isUrl && typeof imageData === "string") {
        // Se for URL, criar um FormData com a URL
        const formData = new FormData();

        formData.append("url", imageData);
        result = await uploadJuizFoto(formData, juizId, juizNome);
      } else if (imageData instanceof FormData) {
        // Se for FormData (arquivo original), usar diretamente
        result = await uploadJuizFoto(imageData, juizId, juizNome);
      } else if (typeof imageData === "string") {
        // Se for base64 (crop), converter para blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        const formData = new FormData();

        formData.append("file", blob, "foto-juiz.jpg");
        result = await uploadJuizFoto(formData, juizId, juizNome);
      } else {
        throw new Error("Tipo de dados inválido");
      }

      if (result.success && result.fotoUrl) {
        toast.success("Foto do juiz atualizada com sucesso!");
        onFotoChange(result.fotoUrl);
      } else {
        toast.error(result.error || "Erro ao atualizar foto");
      }
    } catch (error) {
      console.error("Erro ao salvar foto:", error);
      toast.error("Erro ao salvar foto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentFotoUrl || !juizId) return;

    setIsLoading(true);

    try {
      const result = await deleteJuizFoto(juizId, currentFotoUrl);

      if (result.success) {
        toast.success("Foto removida com sucesso!");
        onFotoChange("");
      } else {
        toast.error(result.error || "Erro ao remover foto");
      }
    } catch (error) {
      console.error("Erro ao deletar foto:", error);
      toast.error("Erro ao remover foto");
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se é uma URL externa (não pode ser deletada)
  const isExternalUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);

      return (
        !urlObj.hostname.includes("cloudinary.com") &&
        !urlObj.hostname.includes("res.cloudinary.com")
      );
    } catch {
      return false;
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4 p-4 rounded-xl bg-background/50 border border-primary/20">
        <div className="relative">
          <Avatar
            isBordered
            className="w-24 h-24"
            color="primary"
            name={juizNome}
            size="lg"
            src={currentFotoUrl || undefined}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Spinner color="white" size="sm" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            color="primary"
            isDisabled={disabled || isLoading || !juizId}
            size="sm"
            startContent={<Edit3 className="w-4 h-4" />}
            variant="bordered"
            onPress={() => setIsEditorOpen(true)}
          >
            Editar Foto
          </Button>

          {currentFotoUrl && !isExternalUrl(currentFotoUrl) && (
            <Button
              color="danger"
              isDisabled={disabled || isLoading}
              size="sm"
              startContent={<Trash2 className="w-4 h-4" />}
              variant="bordered"
              onPress={handleDelete}
            >
              Remover
            </Button>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-default-400">JPG, PNG, WebP ou URL</p>
          <p className="text-xs text-default-400">
            Máximo 5MB | Tamanho ideal: 500x500px
          </p>
          {!juizId && (
            <p className="text-xs text-warning mt-1">
              ⚠️ Salve o juiz primeiro para fazer upload
            </p>
          )}
          {currentFotoUrl && isExternalUrl(currentFotoUrl) && (
            <p className="text-xs text-warning-500 mt-1">
              ⚠️ URL externa - não pode ser removida
            </p>
          )}
        </div>
      </div>

      <ImageEditorModal
        currentImageUrl={currentFotoUrl}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveFoto}
      />
    </>
  );
}
