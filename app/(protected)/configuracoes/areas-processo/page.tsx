"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { Skeleton } from "@heroui/react";
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { listAreasProcesso, createAreaProcesso, updateAreaProcesso, deleteAreaProcesso } from "@/app/actions/areas-processo";
import { title } from "@/components/primitives";

export default function AreasProcessoPage() {
  const [areaSelecionada, setAreaSelecionada] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    descricao: "",
    ordem: 0,
  });
  const [salvando, setSalvando] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: areasData, isLoading, mutate } = useSWR("areas-processo", () => listAreasProcesso());

  const areas = useMemo(() => (areasData?.success ? areasData.areas : []), [areasData]);

  const handleOpenNova = useCallback(() => {
    setAreaSelecionada(null);
    setFormData({ nome: "", slug: "", descricao: "", ordem: 0 });
    onOpen();
  }, [onOpen]);

  const handleOpenEditar = useCallback(
    (area: any) => {
      setAreaSelecionada(area);
      setFormData({
        nome: area.nome,
        slug: area.slug,
        descricao: area.descricao || "",
        ordem: area.ordem || 0,
      });
      onOpen();
    },
    [onOpen]
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

      const result = areaSelecionada ? await updateAreaProcesso(areaSelecionada.id, payload) : await createAreaProcesso(payload);

      if (result.success) {
        toast.success(areaSelecionada ? "Área atualizada com sucesso!" : "Área criada com sucesso!");
        mutate();
        onClose();
      } else {
        toast.error(result.error || "Erro ao salvar área");
      }
    } catch (error) {
      toast.error("Erro ao salvar área");
    } finally {
      setSalvando(false);
    }
  }, [formData, areaSelecionada, mutate, onClose]);

  const handleExcluir = useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir esta área?")) return;

      const result = await deleteAreaProcesso(id);

      if (result.success) {
        toast.success("Área excluída com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir área");
      }
    },
    [mutate]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title()}>Áreas de Processo</h1>
          <p className="text-default-500">Gerencie as áreas de atuação dos processos</p>
        </div>
        <div className="flex gap-2">
          <Button color="default" variant="flat" startContent={<RefreshCw size={18} />} onPress={() => mutate()}>
            Atualizar
          </Button>
          <Button color="primary" startContent={<Plus size={18} />} onPress={handleOpenNova}>
            Nova Área
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
          : areas && areas.map((area: any) => (
              <Card key={area.id}>
                <CardBody>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{area.nome}</h3>
                      <p className="text-xs text-default-400">Slug: {area.slug}</p>
                    </div>
                    <Chip size="sm" color={area.ativo ? "success" : "default"} variant="flat">
                      {area.ativo ? "Ativo" : "Inativo"}
                    </Chip>
                  </div>

                  {area.descricao && <p className="text-sm text-default-500 mb-3">{area.descricao}</p>}

                  <div className="flex justify-between items-center text-xs text-default-400">
                    <span>{area._count?.processos || 0} processo(s)</span>
                    <div className="flex gap-2">
                      <Button isIconOnly size="sm" variant="flat" onPress={() => handleOpenEditar(area)}>
                        <Pencil size={14} />
                      </Button>
                      <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => handleExcluir(area.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>{areaSelecionada ? "Editar Área" : "Nova Área"}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nome"
                placeholder="Ex: Direito Civil"
                value={formData.nome}
                onChange={(e) => {
                  const nome = e.target.value;
                  setFormData({
                    ...formData,
                    nome,
                    slug: areaSelecionada
                      ? formData.slug
                      : nome
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]+/g, "-"),
                  });
                }}
                isRequired
              />

              <Input label="Slug" placeholder="direito-civil" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} isRequired />

              <Textarea label="Descrição" placeholder="Descrição opcional" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} minRows={3} />

              <Input
                type="number"
                label="Ordem"
                placeholder="0"
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
            <Button color="primary" onPress={handleSalvar} isLoading={salvando}>
              {areaSelecionada ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
