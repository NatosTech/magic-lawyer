"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  Divider,
} from "@heroui/react";
import {
  UploadIcon,
  FileIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  DownloadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useComprovantesPagamento, useComprovantesActions, type ComprovantePagamento } from "@/app/hooks/use-comprovantes-pagamento";

interface ComprovantePagamentoUploadProps {
  parcelaId: string;
  readonly?: boolean;
  maxSize?: number; // em MB
  acceptedTypes?: string[];
}

export function ComprovantePagamentoUpload({
  parcelaId,
  readonly = false,
  maxSize = 10, // 10MB por padrão
  acceptedTypes = ["image/jpeg", "image/png", "application/pdf"],
}: ComprovantePagamentoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Usar hooks para gerenciar comprovantes
  const { comprovantes, isLoading } = useComprovantesPagamento(parcelaId);
  const { uploadComprovante, deleteComprovante, downloadComprovante } = useComprovantesActions(parcelaId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo permitido: ${maxSize}MB`);
      return;
    }

    // Validar tipo
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use JPG, PNG ou PDF");
      return;
    }

    setSelectedFile(file);
    
    // Criar preview para imagens
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    
    setModalOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadComprovante(selectedFile);
      
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      if (result.success) {
        toast.success("Comprovante enviado com sucesso!");
        setModalOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(result.error || "Erro ao enviar comprovante");
      }
    } catch (error) {
      toast.error("Erro ao enviar comprovante");
      console.error("Erro no upload:", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (comprovanteId: string) => {
    try {
      const result = await deleteComprovante(comprovanteId);
      if (result.success) {
        toast.success("Comprovante removido");
      } else {
        toast.error(result.error || "Erro ao remover comprovante");
      }
    } catch (error) {
      toast.error("Erro ao remover comprovante");
    }
  };

  const handleDownload = async (comprovanteId: string) => {
    try {
      const result = await downloadComprovante(comprovanteId);
      if (!result.success) {
        toast.error(result.error || "Erro ao baixar comprovante");
      }
    } catch (error) {
      toast.error("Erro ao baixar comprovante");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado":
        return "success";
      case "rejeitado":
        return "danger";
      default:
        return "warning";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aprovado":
        return "Aprovado";
      case "rejeitado":
        return "Rejeitado";
      default:
        return "Pendente";
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <FileIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Comprovante de Pagamento</h3>
          </div>
          {comprovantes.length > 0 && (
            <Chip color="primary" size="sm" variant="flat">
              {comprovantes.length} arquivo{comprovantes.length !== 1 ? "s" : ""}
            </Chip>
          )}
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {!readonly && (
            <div className="text-center py-6 border-2 border-dashed border-default-300 rounded-lg">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <UploadIcon className="h-12 w-12 text-default-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">Enviar Comprovante</h4>
              <p className="text-sm text-default-500 mb-4">
                Faça upload do comprovante de pagamento desta parcela
              </p>
              <p className="text-xs text-default-400 mb-4">
                Formatos aceitos: JPG, PNG, PDF • Máximo: {maxSize}MB
              </p>
              
              <Button
                color="primary"
                variant="flat"
                startContent={<UploadIcon className="h-4 w-4" />}
                onPress={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Selecionar Arquivo
              </Button>
            </div>
          )}

          {/* Lista de Comprovantes */}
          {comprovantes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Comprovantes Enviados</h4>
              {comprovantes.map((comprovante) => (
                <div
                  key={comprovante.id}
                  className="flex items-center justify-between p-3 border border-default-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-8 w-8 text-default-400" />
                    <div>
                      <p className="text-sm font-medium">{comprovante.nome}</p>
                      <div className="flex items-center space-x-2 text-xs text-default-500">
                        <span>{formatFileSize(comprovante.tamanho)}</span>
                        <span>•</span>
                        <span>{new Date(comprovante.dataUpload).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Chip
                      color={getStatusColor(comprovante.status)}
                      size="sm"
                      variant="flat"
                      startContent={
                        comprovante.status === "aprovado" ? (
                          <CheckCircleIcon className="h-3 w-3" />
                        ) : comprovante.status === "rejeitado" ? (
                          <XCircleIcon className="h-3 w-3" />
                        ) : null
                      }
                    >
                      {getStatusLabel(comprovante.status)}
                    </Chip>

                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => window.open(comprovante.url, "_blank")}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>

                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleDownload(comprovante.id)}
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>

                    {!readonly && (
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => handleDelete(comprovante.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {comprovantes.length === 0 && !readonly && (
            <div className="text-center py-4">
              <p className="text-default-500">Nenhum comprovante enviado</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Preview e Upload */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center space-x-2">
              <FileIcon className="h-5 w-5" />
              <span>Confirmar Upload</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedFile && (
              <div className="space-y-4">
                {/* Preview da Imagem */}
                {previewUrl && (
                  <div className="text-center">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg border border-default-200"
                    />
                  </div>
                )}

                {/* Informações do Arquivo */}
                <div className="bg-default-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Nome:</span>
                      <p className="text-default-600">{selectedFile.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tamanho:</span>
                      <p className="text-default-600">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span>
                      <p className="text-default-600">{selectedFile.type}</p>
                    </div>
                    <div>
                      <span className="font-medium">Última modificação:</span>
                      <p className="text-default-600">
                        {new Date(selectedFile.lastModified).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress do Upload */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Enviando arquivo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} color="primary" />
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setModalOpen(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleUpload}
              isLoading={uploading}
              disabled={!selectedFile || uploading}
            >
              {uploading ? "Enviando..." : "Confirmar Upload"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
