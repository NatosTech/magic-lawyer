"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Skeleton } from "@heroui/react";
import { Plus, RefreshCw, Pencil, Trash2, FileText, File } from "lucide-react";
import { toast } from "sonner";

import {
  listTiposContrato,
  createTipoContrato,
  updateTipoContrato,
  deleteTipoContrato,
} from "@/app/actions/tipos-contrato";
import { title } from "@/components/primitives";

export default function TiposContratoPage() {
  const [tipoSelecionado, setTipoSelecionado] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    descricao: "",
    ordem: 0,
  });
  const [salvando, setSalvando] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    data: tiposData,
    isLoading,
    mutate,
  } = useSWR("tipos-contrato-list", () => listTiposContrato());

  const tipos = useMemo(
    () => (tiposData?.success ? tiposData.tipos : []),
    [tiposData],
  );

  const handleOpenNovo = useCallback(() => {
    setTipoSelecionado(null);
    setFormData({ nome: "", slug: "", descricao: "", ordem: 0 });
    onOpen();
  }, [onOpen]);

  const handleOpenEditar = useCallback(
    (tipo: any) => {
      setTipoSelecionado(tipo);
      setFormData({
        nome: tipo.nome,
        slug: tipo.slug,
        descricao: tipo.descricao || "",
        ordem: tipo.ordem || 0,
      });
      onOpen();
    },
    [onOpen],
  );

  const handleSalvar = useCallback(async () => {
    if (!formData.nome.trim() || !formData.slug.trim()) {
      toast.error("Nome e slug são obrigatórios");

      return;
    }

    setSalvando(true);

    try {
      const payload = {
        nome: formData.nome,
        slug: formData.slug,
        descricao: formData.descricao || null,
        ordem: formData.ordem,
      };

      const result = tipoSelecionado
        ? await updateTipoContrato(tipoSelecionado.id, payload)
        : await createTipoContrato(payload);

      if (result.success) {
        toast.success(
          tipoSelecionado
            ? "Tipo atualizado com sucesso!"
            : "Tipo criado com sucesso!",
        );
        mutate();
        onClose();
      } else {
        toast.error(result.error || "Erro ao salvar tipo");
      }
    } catch (error) {
      toast.error("Erro ao salvar tipo");
    } finally {
      setSalvando(false);
    }
  }, [formData, tipoSelecionado, mutate, onClose]);

  const handleExcluir = useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir este tipo?")) return;

      const result = await deleteTipoContrato(id);

      if (result.success) {
        toast.success("Tipo excluído com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir tipo");
      }
    },
    [mutate],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title()}>Tipos de Contrato</h1>
          <p className="text-default-500">
            Gerencie os tipos de contrato do escritório
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="default"
            startContent={<RefreshCw size={18} />}
            variant="flat"
            onPress={() => mutate()}
          >
            Atualizar
          </Button>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            onPress={handleOpenNovo}
          >
            Novo Tipo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardBody>
                  <Skeleton className="h-20 w-full rounded-lg" />
                </CardBody>
              </Card>
            ))
          : tipos &&
            tipos.map((tipo: any) => (
              <Card key={tipo.id}>
                <CardBody>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <FileText className="mt-1 text-primary" size={20} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{tipo.nome}</h3>
                        <p className="text-xs text-default-400">
                          Slug: {tipo.slug}
                        </p>
                      </div>
                    </div>
                    <Chip
                      color={tipo.ativo ? "success" : "default"}
                      size="sm"
                      variant="flat"
                    >
                      {tipo.ativo ? "Ativo" : "Inativo"}
                    </Chip>
                  </div>

                  {tipo.descricao && (
                    <p className="text-sm text-default-500 mb-3">
                      {tipo.descricao}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-xs text-default-400">
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {tipo._count?.contratos || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <File size={12} />
                        {tipo._count?.modelos || 0} modelo(s)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() => handleOpenEditar(tipo)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="flat"
                        onPress={() => handleExcluir(tipo.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
      </div>

      <Modal isOpen={isOpen} size="lg" onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {tipoSelecionado ? "Editar Tipo" : "Novo Tipo"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Nome"
                placeholder="Ex: Honorários Advocatícios"
                value={formData.nome}
                onChange={(e) => {
                  const nome = e.target.value;

                  setFormData({
                    ...formData,
                    nome,
                    slug: tipoSelecionado
                      ? formData.slug
                      : nome
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]+/g, "-"),
                  });
                }}
              />

              <Input
                isRequired
                label="Slug"
                placeholder="honorarios-advocaticios"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
              />

              <Textarea
                label="Descrição"
                minRows={3}
                placeholder="Descrição opcional"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
              />

              <Input
                label="Ordem"
                placeholder="0"
                type="number"
                value={formData.ordem.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ordem: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={salvando} onPress={handleSalvar}>
              {tipoSelecionado ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
