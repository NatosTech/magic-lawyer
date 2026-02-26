"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Power,
  PowerOff,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { title, subtitle } from "@/components/primitives";
import {
  useModelosPeticao,
  useCategoriasModeloPeticao,
  useTiposModeloPeticao,
} from "@/app/hooks/use-modelos-peticao";
import {
  deleteModeloPeticao,
  duplicateModeloPeticao,
  toggleModeloPeticaoStatus,
  type ModeloPeticaoFilters,
} from "@/app/actions/modelos-peticao";

export default function ModelosPeticaoPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [filtros, setFiltros] = useState<ModeloPeticaoFilters>({
    search: "",
    categoria: undefined,
    tipo: undefined,
    ativo: undefined,
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Modal de confirmação de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modeloToDelete, setModeloToDelete] = useState<string | null>(null);

  // Hooks
  const { modelos, isLoading, isError, error, mutate } =
    useModelosPeticao(filtros);
  const { categorias } = useCategoriasModeloPeticao();
  const { tipos } = useTiposModeloPeticao();

  const handleDuplicate = async (id: string) => {
    startTransition(async () => {
      const result = await duplicateModeloPeticao(id);

      if (result.success) {
        toast.success("Modelo duplicado com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao duplicar modelo");
      }
    });
  };

  const handleToggleStatus = async (id: string) => {
    startTransition(async () => {
      const result = await toggleModeloPeticaoStatus(id);

      if (result.success) {
        toast.success(
          result.data?.ativo
            ? "Modelo ativado com sucesso!"
            : "Modelo desativado com sucesso!",
        );
        mutate();
      } else {
        toast.error(result.error || "Erro ao alterar status do modelo");
      }
    });
  };

  const handleDelete = async () => {
    if (!modeloToDelete) return;

    startTransition(async () => {
      const result = await deleteModeloPeticao(modeloToDelete);

      if (result.success) {
        toast.success("Modelo excluído com sucesso!");
        setDeleteModalOpen(false);
        setModeloToDelete(null);
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir modelo");
      }
    });
  };

  const limparFiltros = () => {
    setFiltros({
      search: "",
      categoria: undefined,
      tipo: undefined,
      ativo: undefined,
    });
  };

  const temFiltrosAtivos =
    filtros.search ||
    filtros.categoria ||
    filtros.tipo ||
    filtros.ativo !== undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner label="Carregando modelos..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-danger">Erro ao carregar modelos de petição</p>
        <p className="text-sm text-default-500">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>
            Modelos de Petição
          </h1>
          <p className={subtitle({ fullWidth: true })}>
            {modelos?.length || 0} modelos cadastrados
            {temFiltrosAtivos && " (filtrados)"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            startContent={<Filter className="h-4 w-4" />}
            variant="bordered"
            onPress={() => setMostrarFiltros(!mostrarFiltros)}
          >
            Filtros
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => router.push("/modelos-peticao/novo")}
          >
            Novo Modelo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar por nome ou descrição..."
                startContent={<Search className="h-4 w-4 text-default-400" />}
                value={filtros.search}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, search: value }))
                }
              />

              <Select
                placeholder="Categoria"
                selectedKeys={filtros.categoria ? [filtros.categoria] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string | undefined;

                  setFiltros((prev) => ({ ...prev, categoria: value }));
                }}
              >
                {categorias.map((cat) => (
                  <SelectItem key={cat} textValue={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </Select>

              <Select
                placeholder="Tipo"
                selectedKeys={filtros.tipo ? [filtros.tipo] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string | undefined;

                  setFiltros((prev) => ({ ...prev, tipo: value }));
                }}
              >
                {tipos.map((tipo) => (
                  <SelectItem key={tipo} textValue={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </Select>

              <Select
                placeholder="Status"
                selectedKeys={
                  filtros.ativo !== undefined
                    ? [filtros.ativo ? "ativo" : "inativo"]
                    : []
                }
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string | undefined;

                  setFiltros((prev) => ({
                    ...prev,
                    ativo:
                      value === "ativo"
                        ? true
                        : value === "inativo"
                          ? false
                          : undefined,
                  }));
                }}
              >
                <SelectItem key="ativo" textValue="Ativo">
                  Ativo
                </SelectItem>
                <SelectItem key="inativo" textValue="Inativo">
                  Inativo
                </SelectItem>
              </Select>
            </div>

            {temFiltrosAtivos && (
              <div className="flex justify-end">
                <Button size="sm" variant="light" onPress={limparFiltros}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Lista de Modelos */}
      {!modelos || modelos.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-default-400 mb-4" />
            <p className="text-default-500">
              {temFiltrosAtivos
                ? "Nenhum modelo encontrado com os filtros aplicados"
                : "Nenhum modelo de petição cadastrado"}
            </p>
            {temFiltrosAtivos && (
              <Button
                className="mt-4"
                size="sm"
                variant="light"
                onPress={limparFiltros}
              >
                Limpar Filtros
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modelos.map((modelo) => (
            <Card key={modelo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{modelo.nome}</h3>
                    {modelo.descricao && (
                      <p className="text-sm text-default-500 line-clamp-2 mt-1">
                        {modelo.descricao}
                      </p>
                    )}
                  </div>
                </div>

                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="view"
                      startContent={<Eye className="h-4 w-4" />}
                      onPress={() =>
                        router.push(`/modelos-peticao/${modelo.id}`)
                      }
                    >
                      Ver Detalhes
                    </DropdownItem>
                    <DropdownItem
                      key="edit"
                      startContent={<Edit className="h-4 w-4" />}
                      onPress={() =>
                        router.push(`/modelos-peticao/${modelo.id}/editar`)
                      }
                    >
                      Editar
                    </DropdownItem>
                    <DropdownItem
                      key="duplicate"
                      startContent={<Copy className="h-4 w-4" />}
                      onPress={() => handleDuplicate(modelo.id)}
                    >
                      Duplicar
                    </DropdownItem>
                    <DropdownItem
                      key="toggle"
                      startContent={
                        modelo.ativo ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )
                      }
                      onPress={() => handleToggleStatus(modelo.id)}
                    >
                      {modelo.ativo ? "Desativar" : "Ativar"}
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={<Trash2 className="h-4 w-4" />}
                      onPress={() => {
                        setModeloToDelete(modelo.id);
                        setDeleteModalOpen(true);
                      }}
                    >
                      Excluir
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </CardHeader>

              <CardBody className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  {modelo.categoria && (
                    <Chip color="primary" size="sm" variant="flat">
                      {modelo.categoria}
                    </Chip>
                  )}
                  {modelo.tipo && (
                    <Chip color="secondary" size="sm" variant="flat">
                      {modelo.tipo}
                    </Chip>
                  )}
                  <Chip
                    color={modelo.ativo ? "success" : "default"}
                    size="sm"
                    startContent={
                      modelo.ativo ? (
                        <Power className="h-3 w-3" />
                      ) : (
                        <PowerOff className="h-3 w-3" />
                      )
                    }
                    variant="flat"
                  >
                    {modelo.ativo ? "Ativo" : "Inativo"}
                  </Chip>
                  {modelo.publico && (
                    <Chip color="warning" size="sm" variant="flat">
                      Público
                    </Chip>
                  )}
                </div>

                {modelo._count && modelo._count.peticoes > 0 && (
                  <div className="flex items-center gap-2 text-sm text-default-500">
                    <FileCheck className="h-4 w-4" />
                    <span>
                      {modelo._count.peticoes}{" "}
                      {modelo._count.peticoes === 1 ? "petição" : "petições"}
                    </span>
                  </div>
                )}

                <div className="text-xs text-default-400">
                  Atualizado em{" "}
                  {new Date(modelo.updatedAt).toLocaleDateString("pt-BR")}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Modal isOpen={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar Exclusão</ModalHeader>
              <ModalBody>
                <p>Tem certeza que deseja excluir este modelo de petição?</p>
                <p className="text-sm text-danger">
                  Esta ação não pode ser desfeita. O modelo será removido
                  permanentemente.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  isLoading={isPending}
                  onPress={handleDelete}
                >
                  Excluir
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
