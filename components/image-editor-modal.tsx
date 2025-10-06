"use client";

import { useState, useRef, useCallback } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Tabs, Tab, Card, CardBody } from "@heroui/react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: string | null, isUrl: boolean) => void;
  currentImageUrl?: string | null;
}

export function ImageEditorModal({ isOpen, onClose, onSave, currentImageUrl }: ImageEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1, // Aspect ratio 1:1 (quadrado)
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione apenas arquivos de imagem.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("A imagem deve ter no máximo 5MB.");
        return;
      }

      setImageFile(file);
      setError("");
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageUrl("");
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setError("");

    if (url && isValidImageUrl(url)) {
      setPreviewUrl(url);
      setImageFile(null);
    } else if (url) {
      setError("Por favor, insira uma URL válida de imagem.");
      setPreviewUrl(null);
    } else {
      setPreviewUrl(null);
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
    } catch {
      return false;
    }
  };

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleSave = async () => {
    if (!previewUrl) {
      setError("Por favor, selecione uma imagem ou insira uma URL.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (activeTab === "url" && imageUrl) {
        // Se for URL, salvar diretamente
        onSave(imageUrl, true);
      } else if (imageFile && completedCrop && imgRef.current) {
        // Se for upload, fazer crop e salvar
        const croppedImageData = await getCroppedImg(imgRef.current, completedCrop);
        onSave(croppedImageData, false);
      } else {
        setError("Erro ao processar a imagem.");
      }
    } catch (err) {
      setError("Erro ao processar a imagem. Tente novamente.");
      console.error("Erro ao processar imagem:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setImageUrl("");
    setImageFile(null);
    setPreviewUrl(null);
    setError("");
    setActiveTab("upload");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Editar Avatar</h3>
          <p className="text-sm text-default-500">Faça upload de uma imagem ou insira uma URL</p>
        </ModalHeader>

        <ModalBody>
          <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as "upload" | "url")} className="w-full">
            <Tab key="upload" title="Upload">
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                  <Button color="primary" variant="bordered" onPress={() => fileInputRef.current?.click()} className="w-full">
                    Selecionar Imagem
                  </Button>

                  {previewUrl && (
                    <Card className="w-full max-w-md">
                      <CardBody className="p-4">
                        <div className="space-y-4">
                          <p className="text-sm text-center text-default-600">Ajuste o recorte da imagem:</p>
                          <div className="flex justify-center">
                            <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop>
                              <img ref={imgRef} alt="Preview" src={previewUrl} onLoad={onImageLoad} className="max-w-full max-h-64 object-contain" />
                            </ReactCrop>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </div>
            </Tab>

            <Tab key="url" title="URL">
              <div className="space-y-4">
                <div>
                  <Input
                    label="URL da Imagem"
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={imageUrl}
                    onChange={handleUrlChange}
                    description="Insira uma URL válida de imagem (JPG, PNG, GIF, WebP, SVG)"
                  />
                </div>

                {previewUrl && (
                  <Card className="w-full max-w-md mx-auto">
                    <CardBody className="p-4">
                      <div className="space-y-4">
                        <p className="text-sm text-center text-default-600">Preview da imagem:</p>
                        <div className="flex justify-center">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-w-full max-h-64 object-contain rounded-lg"
                            onError={() => {
                              setError("Erro ao carregar a imagem da URL.");
                              setPreviewUrl(null);
                            }}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>
          </Tabs>

          {error && <div className="text-danger text-sm text-center bg-danger-50 p-3 rounded-lg">{error}</div>}
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave} isLoading={isLoading} isDisabled={!previewUrl || !!error}>
            {isLoading ? "Salvando..." : "Salvar Avatar"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
