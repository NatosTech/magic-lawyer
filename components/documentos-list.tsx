"use client";

import React, { useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import {
  FileText,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  FileDown,
  Paperclip,
} from "lucide-react";
import { toast } from "@/lib/toast";

import {
  useDocumentosProcuracao,
  useDeleteDocumentoProcuracao,
  getDocumentIcon,
  formatFileSize,
} from "@/app/hooks/use-documentos-procuracao";

interface DocumentosListProps {
  procuracaoId: string;
  onEdit?: (documentoId: string) => void;
  onCountChange?: (count: number) => void;
}

export default function DocumentosList({
  procuracaoId,
  onEdit,
  onCountChange,
}: DocumentosListProps) {
  const { documentos, isLoading, isError, error, refresh, mutate } =
    useDocumentosProcuracao(procuracaoId);
  const { deleteDocumento, isDeleting } = useDeleteDocumentoProcuracao();

  // Notificar mudança na contagem de documentos
  useEffect(() => {
    if (documentos && onCountChange) {
      onCountChange(documentos.length);
    }
  }, [documentos, onCountChange]);

  // Função para invalidar cache e recarregar dados
  const refreshData = () => {
    mutate();
  };

  const handleDownload = (url: string, fileName: string) => {
    try {
      // Abrir URL em nova aba para download
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Erro ao fazer download do arquivo");
    }
  };

  const handleDelete = async (documentoId: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o documento "${fileName}"?`)) {
      return;
    }

    try {
      await deleteDocumento(documentoId);
      toast.success("Documento deletado com sucesso");
      refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar documento",
      );
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Carregando documentos..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-danger mx-auto mb-4" />
        <p className="text-danger font-medium">Erro ao carregar documentos</p>
        <p className="text-default-500 text-sm mt-2">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
        <Button
          className="mt-4"
          color="primary"
          size="sm"
          variant="flat"
          onPress={() => refresh()}
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!documentos || documentos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-default-100 p-6">
            <Paperclip className="h-8 w-8 text-default-400" />
          </div>
          <div>
            <p className="text-default-700 font-medium text-lg">
              Nenhum documento anexado
            </p>
            <p className="text-default-500 text-sm mt-1">
              Faça upload de documentos para esta procuração
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-default-200">
        <div>
          <h3 className="text-lg font-semibold">Documentos Anexados</h3>
          <p className="text-sm text-default-500">
            {documentos.length} documento{documentos.length !== 1 ? "s" : ""}{" "}
            anexado{documentos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Chip color="primary" size="sm" variant="flat">
          {documentos.length}
        </Chip>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {documentos.map((documento: any) => (
            <Card
              key={documento.id}
              className="border border-default-200 hover:shadow-sm transition-shadow"
            >
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">
                      {getDocumentIcon(documento.tipo)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-default-900 truncate">
                        {documento.fileName}
                      </h4>

                      <div className="flex items-center gap-4 text-sm text-default-500 mt-1">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{formatFileSize(documento.size)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(documento.createdAt)}</span>
                        </div>
                      </div>

                      {documento.description && (
                        <p className="text-sm text-default-600 mt-2">
                          {documento.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <Chip color="primary" size="sm" variant="flat">
                          {documento.tipo.replace(/_/g, " ")}
                        </Chip>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      title="Baixar documento"
                      variant="light"
                      onPress={() =>
                        handleDownload(documento.url, documento.fileName)
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="download"
                          startContent={<FileDown className="h-4 w-4" />}
                          onPress={() =>
                            handleDownload(documento.url, documento.fileName)
                          }
                        >
                          Baixar
                        </DropdownItem>
                        {onEdit ? (
                          <DropdownItem
                            key="edit"
                            startContent={<Edit className="h-4 w-4" />}
                            onPress={() => onEdit(documento.id)}
                          >
                            Editar
                          </DropdownItem>
                        ) : null}
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<Trash2 className="h-4 w-4" />}
                          onPress={() =>
                            handleDelete(documento.id, documento.fileName)
                          }
                        >
                          Excluir
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
