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

import { listCategoriasTarefa, createCategoriaTarefa, updateCategoriaTarefa, deleteCategoriaTarefa } from "@/app/actions/categorias-tarefa";
import { title } from "@/components/primitives";

const CORES_PADRAO = [
  { nome: "Azul", hex: "#3B82F6" },
  { nome: "Verde", hex: "#10B981" },
  { nome: "Vermelho", hex: "#EF4444" },
  { nome: "Amarelo", hex: "#F59E0B" },
  { nome: "Roxo", hex: "#8B5CF6" },
  { nome: "Rosa", hex: "#EC4899" },
  { nome: "Cinza", hex: "#6B7280" },
];

export default function CategoriasTarefaPage() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    descricao: "",
    corHex: "#3B82F6",
    ordem: 0,
  });
  const [salvando, setSalvando] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: categoriasData, isLoading, mutate } = useSWR("categorias-tarefa-list", () => listCategoriasTarefa());

  const categorias = useMemo(() => (categoriasData?.success ? categoriasData.categorias : []), [categoriasData]);

  const handleOpenNova = useCallback(() => {
    setCategoriaSelecionada(null);
    setFormData({
      nome: "",
      slug: "",
      descricao: "",
      corHex: "#3B82F6",
      ordem: 0,
    });
    onOpen();
  }, [onOpen]);

  const handleOpenEditar = useCallback(
    (categoria: any) => {
      setCategoriaSelecionada(categoria);
      setFormData({
        nome: categoria.nome,
        slug: categoria.slug,
        descricao: categoria.descricao || "",
        corHex: categoria.corHex || "#3B82F6",
        ordem: categoria.ordem || 0,
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
        corHex: formData.corHex,
        ordem: formData.ordem,
      };

      const result = categoriaSelecionada ? await updateCategoriaTarefa(categoriaSelecionada.id, payload) : await createCategoriaTarefa(payload);

      if (result.success) {
        toast.success(categoriaSelecionada ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!");
        mutate();
        onClose();
      } else {
        toast.error(result.error || "Erro ao salvar categoria");
      }
    } catch (error) {
      toast.error("Erro ao salvar categoria");
    } finally {
      setSalvando(false);
    }
  }, [formData, categoriaSelecionada, mutate, onClose]);

  const handleExcluir = useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

      const result = await deleteCategoriaTarefa(id);

      if (result.success) {
        toast.success("Categoria excluída com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir categoria");
      }
    },
    [mutate]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title()}>Categorias de Tarefa</h1>
          <p className="text-default-500">Gerencie as categorias para organizar suas tarefas</p>
        </div>
        <div className="flex gap-2">
          <Button color="default" variant="flat" startContent={<RefreshCw size={18} />} onPress={() => mutate()}>
            Atualizar
          </Button>
          <Button color="primary" startContent={<Plus size={18} />} onPress={handleOpenNova}>
            Nova Categoria
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
          : categorias.map((categoria: any) => (
              <Card key={categoria.id}>
                <CardBody>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="w-4 h-4 rounded-full mt-1" style={{ backgroundColor: categoria.corHex }} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{categoria.nome}</h3>
                        <p className="text-xs text-default-400">Slug: {categoria.slug}</p>
                      </div>
                    </div>
                    <Chip size="sm" color={categoria.ativo ? "success" : "default"} variant="flat">
                      {categoria.ativo ? "Ativo" : "Inativo"}
                    </Chip>
                  </div>

                  {categoria.descricao && <p className="text-sm text-default-500 mb-3">{categoria.descricao}</p>}

                  <div className="flex justify-between items-center text-xs text-default-400">
                    <span>{categoria._count?.tarefas || 0} tarefa(s)</span>
                    <div className="flex gap-2">
                      <Button isIconOnly size="sm" variant="flat" onPress={() => handleOpenEditar(categoria)}>
                        <Pencil size={14} />
                      </Button>
                      <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => handleExcluir(categoria.id)}>
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
          <ModalHeader>{categoriaSelecionada ? "Editar Categoria" : "Nova Categoria"}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nome"
                placeholder="Ex: Urgente"
                value={formData.nome}
                onChange={(e) => {
                  const nome = e.target.value;
                  setFormData({
                    ...formData,
                    nome,
                    slug: categoriaSelecionada
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

              <Input label="Slug" placeholder="urgente" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} isRequired />

              <Textarea label="Descrição" placeholder="Descrição opcional" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} minRows={3} />

              <div>
                <p className="text-sm mb-2">Cor</p>
                <div className="flex gap-2 flex-wrap">
                  {CORES_PADRAO.map((cor) => (
                    <button
                      key={cor.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, corHex: cor.hex })}
                      className={`w-10 h-10 rounded-full border-2 ${formData.corHex === cor.hex ? "border-primary scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: cor.hex }}
                      title={cor.nome}
                    />
                  ))}
                </div>
              </div>

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
              {categoriaSelecionada ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
