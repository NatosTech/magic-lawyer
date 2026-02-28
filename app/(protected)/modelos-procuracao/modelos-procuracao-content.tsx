"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Edit,
  Eye,
  FileCheck,
  FileSignature,
  Filter,
  MoreVertical,
  Plus,
  Power,
  PowerOff,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Textarea,
} from "@heroui/react";
import { toast } from "@/lib/toast";

import {
  createModeloProcuracao,
  deleteModeloProcuracao,
  updateModeloProcuracao,
} from "@/app/actions/modelos-procuracao";
import { useAllModelosProcuracao } from "@/app/hooks/use-modelos-procuracao";
import { PeopleMetricCard, PeoplePageHeader } from "@/components/people-ui";

type ModeloProcuracaoItem = {
  id: string;
  nome: string;
  descricao?: string | null;
  conteudo: string;
  categoria?: string | null;
  ativo: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    procuracoes?: number;
  };
};

type StatusFilterKey = "all" | "ativo" | "inativo";

interface ModeloFormState {
  nome: string;
  descricao: string;
  categoria: string;
  conteudo: string;
  ativo: boolean;
}

const EMPTY_FORM: ModeloFormState = {
  nome: "",
  descricao: "",
  categoria: "",
  conteudo: "",
  ativo: true,
};
const TEMPLATE_VARIABLE_PATTERN = /{{\s*[^{}]+\s*}}/;

export default function ModelosProcuracaoContent() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState<ModeloFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ModeloFormState>(EMPTY_FORM);
  const [selectedModelo, setSelectedModelo] = useState<ModeloProcuracaoItem | null>(
    null,
  );

  const { modelos, isLoading, isError, error, mutate } = useAllModelosProcuracao();

  const modelosLista = useMemo(
    () => ((modelos || []) as ModeloProcuracaoItem[]),
    [modelos],
  );

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(
          modelosLista
            .map((modelo) => (modelo.categoria || "").trim())
            .filter((categoria) => categoria.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [modelosLista],
  );
  const categoriaSet = useMemo(() => new Set(categorias), [categorias]);

  const categoriaItems = useMemo(
    () => [
      { key: "all", label: "Todas as categorias" },
      ...categorias.map((categoria) => ({ key: categoria, label: categoria })),
    ],
    [categorias],
  );

  const statusItems = useMemo(
    () => [
      { key: "all", label: "Todos os status" },
      { key: "ativo", label: "Ativo" },
      { key: "inativo", label: "Inativo" },
    ],
    [],
  );
  const statusSet = useMemo(
    () => new Set(statusItems.map((item) => item.key)),
    [statusItems],
  );
  const selectedCategoriaKey =
    categoriaFilter === "all" || categoriaSet.has(categoriaFilter)
      ? categoriaFilter
      : "all";
  const selectedStatusKey = statusSet.has(statusFilter) ? statusFilter : "all";

  const modelosFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return modelosLista.filter((modelo) => {
      if (term) {
        const inNome = modelo.nome.toLowerCase().includes(term);
        const inDescricao = (modelo.descricao || "").toLowerCase().includes(term);
        const inCategoria = (modelo.categoria || "").toLowerCase().includes(term);
        const inConteudo = (modelo.conteudo || "").toLowerCase().includes(term);

        if (!inNome && !inDescricao && !inCategoria && !inConteudo) {
          return false;
        }
      }

      if (
        selectedCategoriaKey !== "all" &&
        modelo.categoria !== selectedCategoriaKey
      ) {
        return false;
      }

      if (selectedStatusKey === "ativo" && !modelo.ativo) {
        return false;
      }

      if (selectedStatusKey === "inativo" && modelo.ativo) {
        return false;
      }

      return true;
    });
  }, [modelosLista, searchTerm, selectedCategoriaKey, selectedStatusKey]);

  const resumo = useMemo(() => {
    const total = modelosLista.length;
    const ativos = modelosLista.filter((modelo) => modelo.ativo).length;
    const inativos = total - ativos;
    const emUso = modelosLista.filter(
      (modelo) => (modelo._count?.procuracoes || 0) > 0,
    ).length;

    return {
      total,
      ativos,
      inativos,
      emUso,
      categorias: categorias.length,
    };
  }, [modelosLista, categorias.length]);

  const temFiltrosAtivos = Boolean(
    searchTerm.trim() || categoriaFilter !== "all" || statusFilter !== "all",
  );

  const limparFiltros = () => {
    setSearchTerm("");
    setCategoriaFilter("all");
    setStatusFilter("all");
  };

  const openCreateModal = () => {
    setCreateForm(EMPTY_FORM);
    setCreateModalOpen(true);
  };

  const openViewModal = (modelo: ModeloProcuracaoItem) => {
    setSelectedModelo(modelo);
    setViewModalOpen(true);
  };

  const openEditModal = (modelo: ModeloProcuracaoItem) => {
    setSelectedModelo(modelo);
    setEditForm({
      nome: modelo.nome || "",
      descricao: modelo.descricao || "",
      categoria: modelo.categoria || "",
      conteudo: modelo.conteudo || "",
      ativo: Boolean(modelo.ativo),
    });
    setEditModalOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.nome.trim()) {
      toast.error("Informe o nome do modelo");
      return;
    }

    if (!createForm.conteudo.trim()) {
      toast.error("Informe o conteúdo do modelo");
      return;
    }
    if (TEMPLATE_VARIABLE_PATTERN.test(createForm.conteudo)) {
      toast.error(
        "Modelos de procuração não suportam variáveis dinâmicas. Remova {{...}} do conteúdo.",
      );
      return;
    }

    startTransition(async () => {
      const result = await createModeloProcuracao({
        nome: createForm.nome.trim(),
        descricao: createForm.descricao.trim() || undefined,
        categoria: createForm.categoria.trim() || undefined,
        conteudo: createForm.conteudo,
        ativo: createForm.ativo,
      });

      if (result.success) {
        toast.success("Modelo criado com sucesso!");
        setCreateModalOpen(false);
        setCreateForm(EMPTY_FORM);
        mutate();
      } else {
        toast.error(result.error || "Erro ao criar modelo");
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedModelo?.id) return;

    if (!editForm.nome.trim()) {
      toast.error("Informe o nome do modelo");
      return;
    }

    if (!editForm.conteudo.trim()) {
      toast.error("Informe o conteúdo do modelo");
      return;
    }
    if (TEMPLATE_VARIABLE_PATTERN.test(editForm.conteudo)) {
      toast.error(
        "Modelos de procuração não suportam variáveis dinâmicas. Remova {{...}} do conteúdo.",
      );
      return;
    }

    startTransition(async () => {
      const result = await updateModeloProcuracao(selectedModelo.id, {
        nome: editForm.nome.trim(),
        descricao: editForm.descricao.trim() || undefined,
        categoria: editForm.categoria.trim() || undefined,
        conteudo: editForm.conteudo,
        ativo: editForm.ativo,
      });

      if (result.success) {
        toast.success("Modelo atualizado com sucesso!");
        setEditModalOpen(false);
        setSelectedModelo(null);
        mutate();
      } else {
        toast.error(result.error || "Erro ao atualizar modelo");
      }
    });
  };

  const handleToggleStatus = async (modelo: ModeloProcuracaoItem) => {
    startTransition(async () => {
      const result = await updateModeloProcuracao(modelo.id, {
        ativo: !modelo.ativo,
      });

      if (result.success) {
        toast.success(
          !modelo.ativo ? "Modelo ativado com sucesso!" : "Modelo desativado com sucesso!",
        );
        mutate();
      } else {
        toast.error(result.error || "Erro ao alterar status do modelo");
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedModelo?.id) return;

    startTransition(async () => {
      const result = await deleteModeloProcuracao(selectedModelo.id);

      if (result.success) {
        toast.success("Modelo excluído com sucesso!");
        setDeleteModalOpen(false);
        setSelectedModelo(null);
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir modelo");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner label="Carregando modelos..." size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[1600px] p-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-danger" />
          <p className="text-danger">Erro ao carregar modelos de procuração</p>
          <p className="text-sm text-default-500">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      <PeoplePageHeader
        tag="Atividades jurídicas"
        title="Modelos de Procuração"
        description={`${modelosFiltrados.length} de ${resumo.total} modelos${temFiltrosAtivos ? " com filtros aplicados" : ""}`}
        actions={
          <>
            <div className="flex items-center rounded-xl border border-default-200 bg-content1 p-0.5">
              <Button as={Link} href="/procuracoes" size="sm" variant="light">
                Procurações
              </Button>
              <Button color="primary" size="sm" variant="solid">
                Modelos
              </Button>
            </div>
            <Button
              size="sm"
              startContent={<Filter className="h-4 w-4" />}
              variant="bordered"
              onPress={() => setMostrarFiltros((prev) => !prev)}
            >
              Filtros
            </Button>
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="h-4 w-4" />}
              onPress={openCreateModal}
            >
              Novo Modelo
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PeopleMetricCard
          helper="Biblioteca atual"
          icon={<FileSignature className="h-4 w-4" />}
          label="Total de modelos"
          tone="primary"
          value={resumo.total}
        />
        <PeopleMetricCard
          helper={`${resumo.inativos} inativo(s)`}
          icon={<Power className="h-4 w-4" />}
          label="Modelos ativos"
          tone="success"
          value={resumo.ativos}
        />
        <PeopleMetricCard
          helper="Vinculados a procurações"
          icon={<FileCheck className="h-4 w-4" />}
          label="Modelos em uso"
          tone="warning"
          value={resumo.emUso}
        />
        <PeopleMetricCard
          helper="Classificação da biblioteca"
          icon={<Tags className="h-4 w-4" />}
          label="Categorias"
          tone="secondary"
          value={resumo.categorias}
        />
      </div>

      <Card className="border border-white/10 bg-background/70">
        <CardBody className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              isClearable
              className="min-w-[260px] flex-1"
              placeholder="Buscar por nome, descrição, categoria ou conteúdo..."
              startContent={<Search className="h-4 w-4 text-default-400" />}
              value={searchTerm}
              onClear={() => setSearchTerm("")}
              onValueChange={setSearchTerm}
            />
            {temFiltrosAtivos ? (
              <Button size="sm" variant="light" onPress={limparFiltros}>
                Limpar filtros
              </Button>
            ) : null}
          </div>

          {mostrarFiltros ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select
                items={categoriaItems}
                label="Categoria"
                selectedKeys={[selectedCategoriaKey]}
                onSelectionChange={(keys) => {
                  const value = String(Array.from(keys)[0] || "all");
                  setCategoriaFilter(value);
                }}
              >
                {(item) => (
                  <SelectItem key={item.key} textValue={item.label}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>

              <Select
                items={statusItems}
                label="Status"
                selectedKeys={[selectedStatusKey]}
                onSelectionChange={(keys) => {
                  const value = String(Array.from(keys)[0] || "all") as StatusFilterKey;
                  setStatusFilter(value);
                }}
              >
                {(item) => (
                  <SelectItem key={item.key} textValue={item.label}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-background/70">
        <CardHeader className="border-b border-white/10 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">
              Biblioteca de modelos ({modelosFiltrados.length})
            </h2>
            <p className="text-sm text-default-400">
              Gerencie templates de procuração e use no cadastro de novos documentos.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-5">
          {!modelosFiltrados.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileSignature className="mb-4 h-12 w-12 text-default-400" />
              <p className="text-default-300">
                {temFiltrosAtivos
                  ? "Nenhum modelo encontrado com os filtros aplicados"
                  : "Nenhum modelo de procuração cadastrado"}
              </p>
              <p className="mt-1 text-sm text-default-500">
                {temFiltrosAtivos
                  ? "Ajuste os filtros para ampliar o resultado."
                  : "Crie seu primeiro modelo para padronizar procurações recorrentes."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {modelosFiltrados.map((modelo) => {
                const tamanhoConteudo = (modelo.conteudo || "").trim().length;

                return (
                  <Card
                    key={modelo.id}
                    className="border border-white/10 bg-background/60 transition-all duration-300 hover:border-primary/40 hover:bg-background/80"
                  >
                    <CardHeader className="items-start justify-between gap-3 p-4 pb-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                          <FileSignature className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-white">
                            {modelo.nome}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-default-400">
                            {modelo.descricao || "Sem descrição cadastrada"}
                          </p>
                        </div>
                      </div>

                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label={`Ações para ${modelo.nome}`}>
                          <DropdownItem
                            key="view"
                            startContent={<Eye className="h-4 w-4" />}
                            onPress={() => openViewModal(modelo)}
                          >
                            Ver detalhes
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<Edit className="h-4 w-4" />}
                            onPress={() => openEditModal(modelo)}
                          >
                            Editar
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
                            onPress={() => handleToggleStatus(modelo)}
                          >
                            {modelo.ativo ? "Desativar" : "Ativar"}
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash2 className="h-4 w-4" />}
                            onPress={() => {
                              setSelectedModelo(modelo);
                              setDeleteModalOpen(true);
                            }}
                          >
                            Excluir
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </CardHeader>

                    <CardBody className="space-y-4 p-4 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {modelo.categoria ? (
                          <Chip color="primary" size="sm" variant="flat">
                            {modelo.categoria}
                          </Chip>
                        ) : (
                          <Chip color="default" size="sm" variant="flat">
                            Sem categoria
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
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-default-400">
                        <div className="rounded-xl border border-white/10 bg-background/40 px-3 py-2">
                          <p className="font-medium text-default-300">Uso</p>
                          <p className="mt-1">
                            {modelo._count?.procuracoes || 0} procuração(ões)
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/40 px-3 py-2">
                          <p className="font-medium text-default-300">Conteúdo</p>
                          <p className="mt-1">{tamanhoConteudo} caracteres</p>
                        </div>
                      </div>

                      <p className="text-xs text-default-500">
                        Atualizado em{" "}
                        {new Date(modelo.updatedAt).toLocaleDateString("pt-BR")}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          startContent={<Eye className="h-4 w-4" />}
                          variant="flat"
                          onPress={() => openViewModal(modelo)}
                        >
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          startContent={<Edit className="h-4 w-4" />}
                          variant="light"
                          onPress={() => openEditModal(modelo)}
                        >
                          Editar
                        </Button>
                        <Button
                          color="primary"
                          size="sm"
                          startContent={<Plus className="h-4 w-4" />}
                          variant="light"
                          onPress={() =>
                            router.push(`/procuracoes/novo?modeloId=${modelo.id}`)
                          }
                        >
                          Usar modelo
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={createModalOpen} size="4xl" onOpenChange={setCreateModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Novo Modelo de Procuração</ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  isRequired
                  label="Nome do modelo"
                  placeholder="Ex: Procuração geral cível"
                  value={createForm.nome}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, nome: value }))
                  }
                />

                <Textarea
                  label="Descrição"
                  minRows={2}
                  placeholder="Resumo de quando usar este modelo"
                  value={createForm.descricao}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, descricao: value }))
                  }
                />

                <Input
                  label="Categoria"
                  placeholder="Ex: CÍVEL, TRABALHISTA, CRIMINAL"
                  value={createForm.categoria}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, categoria: value }))
                  }
                />

                <Textarea
                  isRequired
                  classNames={{ input: "font-mono text-sm" }}
                  label="Conteúdo do template"
                  minRows={12}
                  placeholder="Digite o texto padrão da procuração."
                  value={createForm.conteudo}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, conteudo: value }))
                  }
                />

                <Select
                  label="Status inicial"
                  selectedKeys={[createForm.ativo ? "ativo" : "inativo"]}
                  onSelectionChange={(keys) => {
                    const value = String(Array.from(keys)[0] || "ativo");
                    setCreateForm((prev) => ({ ...prev, ativo: value === "ativo" }));
                  }}
                >
                  <SelectItem key="ativo" textValue="Ativo">
                    Ativo
                  </SelectItem>
                  <SelectItem key="inativo" textValue="Inativo">
                    Inativo
                  </SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" isLoading={isPending} onPress={handleCreate}>
                  Criar modelo
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={viewModalOpen} size="4xl" onOpenChange={setViewModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Detalhes do Modelo</ModalHeader>
              <ModalBody className="gap-4">
                {selectedModelo ? (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedModelo.nome}
                      </h3>
                      <p className="text-sm text-default-400">
                        {selectedModelo.descricao || "Sem descrição"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedModelo.categoria ? (
                        <Chip color="primary" size="sm" variant="flat">
                          {selectedModelo.categoria}
                        </Chip>
                      ) : (
                        <Chip color="default" size="sm" variant="flat">
                          Sem categoria
                        </Chip>
                      )}
                      <Chip
                        color={selectedModelo.ativo ? "success" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {selectedModelo.ativo ? "Ativo" : "Inativo"}
                      </Chip>
                    </div>

                    <div className="grid gap-3 rounded-xl border border-white/10 bg-background/40 p-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-default-500">Procurações vinculadas</p>
                        <p className="text-sm font-semibold text-default-200">
                          {selectedModelo._count?.procuracoes || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Criado em</p>
                        <p className="text-sm font-semibold text-default-200">
                          {new Date(selectedModelo.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Atualizado em</p>
                        <p className="text-sm font-semibold text-default-200">
                          {new Date(selectedModelo.updatedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-default-300">Conteúdo</p>
                      <Textarea
                        isReadOnly
                        classNames={{ input: "font-mono text-xs" }}
                        minRows={12}
                        value={selectedModelo.conteudo || ""}
                      />
                    </div>
                    <p className="text-xs text-default-500">
                      Este modelo é tratado como texto estático na criação da
                      procuração.
                    </p>
                  </>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Fechar
                </Button>
                {selectedModelo ? (
                  <Button
                    color="primary"
                    startContent={<Edit className="h-4 w-4" />}
                    onPress={() => {
                      openEditModal(selectedModelo);
                      onClose();
                    }}
                  >
                    Editar modelo
                  </Button>
                ) : null}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={editModalOpen} size="4xl" onOpenChange={setEditModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Editar Modelo</ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  isRequired
                  label="Nome do modelo"
                  placeholder="Ex: Procuração geral cível"
                  value={editForm.nome}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, nome: value }))
                  }
                />

                <Textarea
                  label="Descrição"
                  minRows={2}
                  placeholder="Resumo de quando usar este modelo"
                  value={editForm.descricao}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, descricao: value }))
                  }
                />

                <Input
                  label="Categoria"
                  placeholder="Ex: CÍVEL, TRABALHISTA, CRIMINAL"
                  value={editForm.categoria}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, categoria: value }))
                  }
                />

                <Textarea
                  isRequired
                  classNames={{ input: "font-mono text-sm" }}
                  label="Conteúdo do template"
                  minRows={12}
                  placeholder="Digite o texto padrão da procuração."
                  value={editForm.conteudo}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, conteudo: value }))
                  }
                />

                <Select
                  label="Status"
                  selectedKeys={[editForm.ativo ? "ativo" : "inativo"]}
                  onSelectionChange={(keys) => {
                    const value = String(Array.from(keys)[0] || "ativo");
                    setEditForm((prev) => ({ ...prev, ativo: value === "ativo" }));
                  }}
                >
                  <SelectItem key="ativo" textValue="Ativo">
                    Ativo
                  </SelectItem>
                  <SelectItem key="inativo" textValue="Inativo">
                    Inativo
                  </SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" isLoading={isPending} onPress={handleSaveEdit}>
                  Salvar alterações
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar Exclusão</ModalHeader>
              <ModalBody>
                <p>Tem certeza que deseja excluir este modelo de procuração?</p>
                {selectedModelo ? (
                  <p className="text-sm text-default-500">
                    Modelo: <span className="font-medium">{selectedModelo.nome}</span>
                  </p>
                ) : null}
                <p className="text-sm text-danger">
                  Esta ação remove o modelo da biblioteca. Se ele estiver em uso, a
                  exclusão será bloqueada.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="danger" isLoading={isPending} onPress={handleDelete}>
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
