"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Copy,
  Edit,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  Power,
  PowerOff,
  Search,
  Tags,
  Trash2,
  Variable,
  WandSparkles,
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
  Switch,
  Textarea,
} from "@heroui/react";

import { toast } from "@/lib/toast";
import {
  createModeloContrato,
  deleteModeloContrato,
  updateModeloContrato,
  type ModeloContratoFilters,
  type ModeloContratoListItem,
} from "@/app/actions/modelos-contrato";
import {
  useModelosContrato,
  useTiposModeloContrato,
} from "@/app/hooks/use-modelos-contrato";
import { PeopleMetricCard, PeoplePageHeader } from "@/components/people-ui";

type ModeloContratoTipo = {
  id: string;
  nome: string;
};

interface ModeloContratoFormState {
  nome: string;
  descricao: string;
  categoria: string;
  tipoId: string;
  conteudo: string;
  variaveis: string;
  ativo: boolean;
  publico: boolean;
}

const EMPTY_FORM: ModeloContratoFormState = {
  nome: "",
  descricao: "",
  categoria: "",
  tipoId: "",
  conteudo: "",
  variaveis: "",
  ativo: true,
  publico: false,
};

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function extractModeloVariaveis(modelo: ModeloContratoListItem): string[] {
  const nomes = new Set<string>();

  if (Array.isArray(modelo.variaveis)) {
    for (const item of modelo.variaveis) {
      if (typeof item === "string" && item.trim()) {
        nomes.add(item.trim());
      }
    }
  }

  if (modelo.conteudo) {
    const matches = modelo.conteudo.matchAll(/{{\s*([^{}]+?)\s*}}/g);

    for (const match of matches) {
      const valor = normalizeText(match[1]);

      if (valor) {
        nomes.add(valor);
      }
    }
  }

  return Array.from(nomes).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

export default function ModelosContratoContent() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<ModeloContratoFilters>({
    search: "",
    categoria: undefined,
    tipoId: undefined,
    ativo: undefined,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedModelo, setSelectedModelo] = useState<ModeloContratoListItem | null>(
    null,
  );
  const [form, setForm] = useState<ModeloContratoFormState>(EMPTY_FORM);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { modelos, isLoading, isError, error, mutate } = useModelosContrato(filtros);
  const { tipos, isLoading: isLoadingTipos } = useTiposModeloContrato();

  const modelosLista = useMemo(() => modelos || [], [modelos]);

  const categorias = useMemo(() => {
    return Array.from(
      new Set(
        modelosLista
          .map((modelo) => (modelo.categoria || "").trim())
          .filter((categoria) => categoria.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [modelosLista]);

  const tiposSelecionaveis = useMemo<ModeloContratoTipo[]>(() => {
    const tipoNomes = new Map<string, ModeloContratoTipo>();

    for (const tipo of tipos) {
      if (!tipo.id || !tipo.nome) {
        continue;
      }

      if (tipoNomes.has(tipo.id)) {
        continue;
      }

      tipoNomes.set(tipo.id, {
        id: tipo.id,
        nome: tipo.nome,
      });
    }

    return Array.from(tipoNomes.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [tipos]);

  const tipoById = useMemo(() => {
    const map = new Map<string, string>();

    for (const tipo of tiposSelecionaveis) {
      map.set(tipo.id, tipo.nome);
    }

    return map;
  }, [tiposSelecionaveis]);

  const categoriasSet = useMemo(() => new Set(categorias), [categorias]);
  const tiposSet = useMemo(
    () => new Set(tiposSelecionaveis.map((tipo) => tipo.id)),
    [tiposSelecionaveis],
  );

  const selectedFiltroCategoria = useMemo(() => {
    return filtros.categoria && categoriasSet.has(filtros.categoria)
      ? filtros.categoria
      : "all";
  }, [categoriasSet, filtros.categoria]);

  const selectedFiltroTipo = useMemo(() => {
    return filtros.tipoId && tiposSet.has(filtros.tipoId) ? filtros.tipoId : "all";
  }, [filtros.tipoId, tiposSet]);

  const selectedFiltroStatus = useMemo(() => {
    if (filtros.ativo === true) return "ativo";
    if (filtros.ativo === false) return "inativo";

    return "all";
  }, [filtros.ativo]);

  const categoriaItems = useMemo(
    () => [
      { key: "all", label: "Todas as categorias" },
      ...categorias.map((categoria) => ({ key: categoria, label: categoria })),
    ],
    [categorias],
  );

  const tipoItems = useMemo(
    () => [
      { key: "all", label: "Todos os tipos" },
      ...tiposSelecionaveis.map((tipo) => ({ key: tipo.id, label: tipo.nome })),
    ],
    [tiposSelecionaveis],
  );

  const statusItems = useMemo(
    () => [
      { key: "all", label: "Todos" },
      { key: "ativo", label: "Ativo" },
      { key: "inativo", label: "Inativo" },
    ],
    [],
  );

  const temFiltrosAtivos = useMemo(() => {
    return (
      Boolean(filtros.search?.trim()) ||
      Boolean(filtros.categoria) ||
      Boolean(filtros.tipoId) ||
      filtros.ativo !== undefined
    );
  }, [filtros]);

  const resumo = useMemo(() => {
    const total = modelosLista.length;
    const ativos = modelosLista.filter((modelo) => modelo.ativo).length;
    const inativos = total - ativos;
    const publicos = modelosLista.filter((modelo) => modelo.publico).length;
    const emUso = modelosLista.filter(
      (modelo) => (modelo._count?.contratos || 0) > 0,
    ).length;
    const totalVariaveis = modelosLista.reduce(
      (acc, modelo) => acc + extractModeloVariaveis(modelo).length,
      0,
    );

    return { total, ativos, inativos, publicos, emUso, totalVariaveis };
  }, [modelosLista]);

  const limparFiltros = () => {
    setFiltros({
      search: "",
      categoria: undefined,
      tipoId: undefined,
      ativo: undefined,
    });
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsCreateOpen(true);
  };

  const openView = (modelo: ModeloContratoListItem) => {
    setSelectedModelo(modelo);
    setIsViewOpen(true);
  };

  const openEdit = (modelo: ModeloContratoListItem) => {
    setSelectedModelo(modelo);
    setForm({
      nome: modelo.nome || "",
      descricao: modelo.descricao || "",
      categoria: modelo.categoria || "",
      tipoId: modelo.tipoId && tiposSet.has(modelo.tipoId) ? modelo.tipoId : "",
      conteudo: modelo.conteudo || "",
      variaveis: extractModeloVariaveis(modelo).join(", "),
      ativo: Boolean(modelo.ativo),
      publico: Boolean(modelo.publico),
    });
    setIsEditOpen(true);
  };

  const openDelete = (modelo: ModeloContratoListItem) => {
    setSelectedModelo(modelo);
    setIsDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do modelo.");

      return;
    }

    if (!form.conteudo.trim()) {
      toast.error("Informe o conteúdo do modelo.");

      return;
    }

    startTransition(async () => {
      const result = await createModeloContrato({
        nome: form.nome.trim(),
        descricao: normalizeText(form.descricao) || undefined,
        categoria: normalizeText(form.categoria) || undefined,
        tipoId: normalizeText(form.tipoId) || undefined,
        conteudo: form.conteudo.trim(),
        variaveis: normalizeText(form.variaveis) || undefined,
        ativo: form.ativo,
        publico: form.publico,
      });

      if (result.success) {
        toast.success("Modelo criado com sucesso.");
        setIsCreateOpen(false);
        setForm(EMPTY_FORM);
        mutate();
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao criar modelo.");
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedModelo?.id) {
      toast.error("Modelo não identificado.");

      return;
    }

    if (!form.nome.trim()) {
      toast.error("Informe o nome do modelo.");

      return;
    }

    if (!form.conteudo.trim()) {
      toast.error("Informe o conteúdo do modelo.");

      return;
    }

    startTransition(async () => {
      const result = await updateModeloContrato(selectedModelo.id, {
        nome: form.nome.trim(),
        descricao: normalizeText(form.descricao) || undefined,
        categoria: normalizeText(form.categoria) || undefined,
        tipoId: normalizeText(form.tipoId) || undefined,
        conteudo: form.conteudo.trim(),
        variaveis: normalizeText(form.variaveis) || undefined,
        ativo: form.ativo,
        publico: form.publico,
      });

      if (result.success) {
        toast.success("Modelo atualizado com sucesso.");
        setIsEditOpen(false);
        setSelectedModelo(null);
        mutate();
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao atualizar modelo.");
      }
    });
  };

  const handleToggleStatus = async (modelo: ModeloContratoListItem) => {
    startTransition(async () => {
      const result = await updateModeloContrato(modelo.id, {
        ativo: !modelo.ativo,
      });

      if (result.success) {
        toast.success(
          result.data?.ativo ? "Modelo ativado com sucesso." : "Modelo desativado.",
        );
        mutate();
      } else {
        toast.error(result.error || "Erro ao alterar status do modelo.");
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedModelo?.id) {
      return;
    }

    setDeleteLoading(true);

    try {
      const result = await deleteModeloContrato(selectedModelo.id);

      if (result.success) {
        toast.success("Modelo removido com sucesso.");
        setIsDeleteOpen(false);
        setSelectedModelo(null);
        mutate();
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao remover modelo.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyConteudo = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Conteúdo copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o conteúdo.");
    }
  };

  const selectedModeloVariaveis = useMemo(() => {
    if (!selectedModelo) {
      return [];
    }

    return extractModeloVariaveis(selectedModelo);
  }, [selectedModelo]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner label="Carregando modelos de contrato..." size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-danger" />
          <p className="text-danger">Erro ao carregar modelos de contrato.</p>
          <p className="max-w-xl text-sm text-default-500">
            {(error as Error)?.message || "Tente novamente em alguns instantes."}
          </p>
          <Button onPress={() => mutate()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      <PeoplePageHeader
        tag="Atividade jurídica"
        title="Modelos de Contrato"
        description={`Biblioteca de modelos contratuais com ${resumo.total} item(ns) cadastrados.`}
        actions={
          <>
            <div className="flex items-center gap-2 rounded-xl border border-default-200 bg-content1 p-0.5">
              <Button as={Link} href="/contratos" size="sm" variant="light">
                Contratos
              </Button>
              <Button size="sm" color="primary" variant="solid">
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
              onPress={openCreate}
            >
              Novo modelo
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <PeopleMetricCard
          helper="Biblioteca atual"
          icon={<FileText className="h-4 w-4" />}
          label="Modelos"
          tone="primary"
          value={resumo.total}
        />
        <PeopleMetricCard
          helper={`${resumo.inativos} inativos`}
          icon={<PowerOff className="h-4 w-4" />}
          label="Modelos ativos"
          tone="success"
          value={resumo.ativos}
        />
        <PeopleMetricCard
          helper="Disponíveis para equipe"
          icon={<Tags className="h-4 w-4" />}
          label="Modelos públicos"
          tone="secondary"
          value={resumo.publicos}
        />
        <PeopleMetricCard
          helper="Utilizados em contratos ativos"
          icon={<Copy className="h-4 w-4" />}
          label="Em uso"
          tone="warning"
          value={resumo.emUso}
        />
        <PeopleMetricCard
          helper="Variáveis definidas"
          icon={<Variable className="h-4 w-4" />}
          label="Variáveis"
          tone="secondary"
          value={resumo.totalVariaveis}
        />
        <PeopleMetricCard
          helper="Última atividade"
          icon={<WandSparkles className="h-4 w-4" />}
          label="Tipos vinculados"
          tone="default"
          value={tiposSelecionaveis.length}
        />
      </div>

      <Card className="border border-white/10 bg-background/70">
        <CardBody className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              isClearable
              className="min-w-[260px] flex-1"
              startContent={<Search className="h-4 w-4 text-default-400" />}
              placeholder="Buscar por nome, descrição ou categoria..."
              value={filtros.search || ""}
              onClear={() => setFiltros((prev) => ({ ...prev, search: "" }))}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, search: value }))
              }
            />
            {temFiltrosAtivos ? (
              <Button size="sm" variant="light" onPress={limparFiltros}>
                Limpar filtros
              </Button>
            ) : null}
          </div>

          {mostrarFiltros ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Select
                selectedKeys={[selectedFiltroCategoria]}
                items={categoriaItems}
                label="Categoria"
                onSelectionChange={(keys) => {
                  const value = String(Array.from(keys)[0] || "all");
                  setFiltros((prev) => ({
                    ...prev,
                    categoria: value === "all" ? undefined : value,
                  }));
                }}
              >
                {(item) => (
                  <SelectItem key={item.key} textValue={item.label}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>

              <Select
                selectedKeys={[selectedFiltroTipo]}
                items={tipoItems}
                label="Tipo"
                onSelectionChange={(keys) => {
                  const value = String(Array.from(keys)[0] || "all");
                  setFiltros((prev) => ({
                    ...prev,
                    tipoId: value === "all" ? undefined : value,
                  }));
                }}
              >
                {(item) => (
                  <SelectItem key={item.key} textValue={item.label}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>

              <Select
                selectedKeys={[selectedFiltroStatus]}
                items={statusItems}
                label="Status"
                onSelectionChange={(keys) => {
                  const value = String(Array.from(keys)[0] || "all");
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
                {(item) => (
                  <SelectItem key={item.key} textValue={item.label}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>

              <Button
                size="sm"
                variant="ghost"
                onPress={limparFiltros}
                className="h-12"
              >
                Limpar
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-background/70">
        <CardHeader className="border-b border-white/10 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">
              Biblioteca de modelos ({resumo.total})
            </h2>
            <p className="text-sm text-default-400">
              Crie, edite, ative e reutilize modelos para acelerar a emissão de
              contratos.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-5">
          {!modelosLista.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="mb-4 h-12 w-12 text-default-400" />
              <p className="text-default-300">
                Nenhum modelo encontrado para os filtros atuais.
              </p>
              <p className="mt-1 text-sm text-default-500">
                {temFiltrosAtivos
                  ? "Ajuste os filtros ou limpe a busca."
                  : "Crie seu primeiro modelo para padronizar a rotina contratual."}
              </p>
              <Button
                className="mt-4"
                color="primary"
                size="sm"
                startContent={<Plus className="h-4 w-4" />}
                onPress={openCreate}
              >
                Novo modelo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {modelosLista.map((modelo) => {
                const variaveisModelo = extractModeloVariaveis(modelo);
                const created = formatDate(modelo.createdAt);
                const updated = formatDate(modelo.updatedAt);

                return (
                  <Card
                    key={modelo.id}
                    className="border border-white/10 bg-background/60 transition-all duration-300 hover:border-primary/40 hover:bg-background/80"
                  >
                    <CardHeader className="items-start justify-between gap-3 p-4 pb-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <p className="truncate text-base font-semibold text-white">
                            {modelo.nome}
                          </p>
                        </div>
                        <p className="line-clamp-2 text-sm text-default-400">
                          {modelo.descricao || "Sem descrição"}
                        </p>
                        <p className="text-xs text-default-500">
                          Atualizado: {updated}
                        </p>
                      </div>

                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label={`Ações do modelo ${modelo.nome}`}>
                          <DropdownItem
                            key="view"
                            onPress={() => openView(modelo)}
                            startContent={<Eye className="h-4 w-4" />}
                          >
                            Ver detalhes
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            onPress={() => openEdit(modelo)}
                            startContent={<Edit className="h-4 w-4" />}
                          >
                            Editar
                          </DropdownItem>
                          <DropdownItem
                            key="status"
                            onPress={() => handleToggleStatus(modelo)}
                            startContent={
                              modelo.ativo ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )
                            }
                          >
                            {modelo.ativo ? "Desativar" : "Ativar"}
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            onPress={() => openDelete(modelo)}
                            startContent={<Trash2 className="h-4 w-4" />}
                          >
                            Excluir
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </CardHeader>

                    <CardBody className="space-y-3 p-4 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {modelo.categoria ? (
                          <Chip color="primary" size="sm" variant="flat">
                            {modelo.categoria}
                          </Chip>
                        ) : null}
                        {modelo.tipoId ? (
                          <Chip color="secondary" size="sm" variant="flat">
                            {tipoById.get(modelo.tipoId) || "Tipo do contrato"}
                          </Chip>
                        ) : null}
                        <Chip
                          color={modelo.ativo ? "success" : "default"}
                          size="sm"
                          variant="flat"
                          startContent={
                            modelo.ativo ? (
                              <Power className="h-3 w-3" />
                            ) : (
                              <PowerOff className="h-3 w-3" />
                            )
                          }
                        >
                          {modelo.ativo ? "Ativo" : "Inativo"}
                        </Chip>
                        {modelo.publico ? (
                          <Chip color="warning" size="sm" variant="flat">
                            Público
                          </Chip>
                        ) : null}
                        <Chip color="default" size="sm" variant="flat">
                          Modelo
                        </Chip>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-default-400">
                        <div className="rounded-xl border border-white/10 bg-background/40 px-3 py-2">
                          <p className="font-medium text-default-300">Usos em contratos</p>
                          <p className="mt-1 font-semibold text-sm">
                            {modelo._count?.contratos || 0}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/40 px-3 py-2">
                          <p className="font-medium text-default-300">Variáveis</p>
                          <p className="mt-1 font-semibold text-sm">
                            {variaveisModelo.length}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                        <p className="mb-2 text-xs text-default-500">Prévia</p>
                        <p className="line-clamp-3 text-sm text-default-300">
                          {modelo.conteudo || "Sem conteúdo cadastrado"}
                        </p>
                        <p className="mt-2 text-xs text-default-500">
                          Criado em {created}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          startContent={<Eye className="h-4 w-4" />}
                          variant="flat"
                          onPress={() => openView(modelo)}
                        >
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          startContent={<Edit className="h-4 w-4" />}
                          variant="light"
                          onPress={() => openEdit(modelo)}
                        >
                          Editar
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

      <Modal isOpen={isCreateOpen} size="4xl" onOpenChange={setIsCreateOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Novo modelo de contrato</ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  isRequired
                  label="Nome"
                  placeholder="Ex: Contrato de prestação de serviços"
                  value={form.nome}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, nome: value }))
                  }
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    label="Categoria"
                    placeholder="Ex: Prestação, Compra e Venda"
                    value={form.categoria}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, categoria: value }))
                    }
                  />
              <Select
                    isDisabled={isLoadingTipos}
                    label="Tipo de contrato"
                    selectedKeys={form.tipoId ? [form.tipoId] : []}
                    onSelectionChange={(keys) => {
                      const value = String(Array.from(keys)[0] || "");
                      setForm((prev) => ({
                        ...prev,
                        tipoId: tiposSet.has(value) ? value : "",
                      }));
                    }}
                    placeholder="Sem tipo selecionado"
                  >
                    {tiposSelecionaveis.map((tipo) => (
                      <SelectItem key={tipo.id} textValue={tipo.nome}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <Textarea
                  label="Descrição"
                  minRows={2}
                  placeholder="Explique quando esse modelo deve ser usado."
                  value={form.descricao}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, descricao: value }))
                  }
                />
                <Textarea
                  isRequired
                  label="Conteúdo"
                  minRows={10}
                  placeholder="Digite o texto do modelo. Use {{variavel} para campos dinâmicos."
                  value={form.conteudo}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, conteudo: value }))
                  }
                />
                <Input
                  label="Variáveis"
                  description="Opcional. Separe por vírgula ou linha (ex: nome_cliente, data_assinatura)."
                  placeholder="nome_cliente, cnpj, data_inicio"
                  value={form.variaveis}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, variaveis: value }))
                  }
                />
                <div className="flex flex-wrap gap-4">
                  <Switch
                    isSelected={form.ativo}
                    size="sm"
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, ativo: value }))
                    }
                  >
                    Modelo ativo
                  </Switch>
                  <Switch
                    isSelected={form.publico}
                    size="sm"
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, publico: value }))
                    }
                  >
                    Disponível para equipe
                  </Switch>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button color="primary" isLoading={isPending} onPress={handleCreate}>
                  Salvar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isViewOpen} size="4xl" onOpenChange={setIsViewOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Detalhes do modelo</ModalHeader>
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
                      ) : null}
                      {selectedModelo.tipoId ? (
                        <Chip color="secondary" size="sm" variant="flat">
                          {tipoById.get(selectedModelo.tipoId) || "Tipo do contrato"}
                        </Chip>
                      ) : null}
                      <Chip
                        color={selectedModelo.ativo ? "success" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {selectedModelo.ativo ? "Ativo" : "Inativo"}
                      </Chip>
                      {selectedModelo.publico ? (
                        <Chip color="warning" size="sm" variant="flat">
                          Público
                        </Chip>
                      ) : null}
                    </div>
                    <div className="grid gap-3 rounded-xl border border-white/10 bg-background/40 p-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-default-500">Contratos em uso</p>
                        <p className="text-sm font-semibold">
                          {selectedModelo._count?.contratos || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Criado em</p>
                        <p className="text-sm font-semibold">
                          {formatDate(selectedModelo.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Atualizado em</p>
                        <p className="text-sm font-semibold">
                          {formatDate(selectedModelo.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-default-300">Conteúdo</p>
                        <Button
                          size="sm"
                          startContent={<Copy className="h-4 w-4" />}
                          variant="light"
                          onPress={() => copyConteudo(selectedModelo.conteudo || "")}
                        >
                          Copiar
                        </Button>
                      </div>
                      <Textarea
                        isReadOnly
                        minRows={10}
                        value={selectedModelo.conteudo || ""}
                        classNames={{ input: "font-mono text-xs" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-default-300">
                        Variáveis definidas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedModeloVariaveis.length ? (
                          selectedModeloVariaveis.map((variavel) => (
                            <Chip key={variavel} size="sm" variant="flat">
                              {`{{${variavel}}}`}
                            </Chip>
                          ))
                        ) : (
                          <p className="text-sm text-default-500">
                            Sem variáveis declaradas.
                          </p>
                        )}
                      </div>
                    </div>
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
                      if (!selectedModelo) return;

                      setIsViewOpen(false);
                      openEdit(selectedModelo);
                    }}
                  >
                    Editar
                  </Button>
                ) : null}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} size="4xl" onOpenChange={setIsEditOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Editar modelo de contrato</ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  isRequired
                  label="Nome"
                  placeholder="Ex: Contrato de prestação de serviços"
                  value={form.nome}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, nome: value }))
                  }
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    label="Categoria"
                    placeholder="Ex: Prestação, Compra e Venda"
                    value={form.categoria}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, categoria: value }))
                    }
                  />
              <Select
                    isDisabled={isLoadingTipos}
                    label="Tipo de contrato"
                    selectedKeys={form.tipoId && tiposSet.has(form.tipoId) ? [form.tipoId] : []}
                    onSelectionChange={(keys) => {
                      const value = String(Array.from(keys)[0] || "");
                      setForm((prev) => ({
                        ...prev,
                        tipoId: tiposSet.has(value) ? value : "",
                      }));
                    }}
                    placeholder="Sem tipo selecionado"
                  >
                    {tiposSelecionaveis.map((tipo) => (
                      <SelectItem key={tipo.id} textValue={tipo.nome}>
                        {tipo.nome}
                      </SelectItem>
                      ))}
                  </Select>
                </div>
                <Textarea
                  label="Descrição"
                  minRows={2}
                  placeholder="Explique quando esse modelo deve ser usado."
                  value={form.descricao}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, descricao: value }))
                  }
                />
                <Textarea
                  isRequired
                  label="Conteúdo"
                  minRows={10}
                  placeholder="Digite o texto do modelo. Use {{variavel} para campos dinâmicos."
                  value={form.conteudo}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, conteudo: value }))
                  }
                />
                <Input
                  label="Variáveis"
                  description="Opcional. Separe por vírgula ou linha (ex: nome_cliente, data_inicio)."
                  placeholder="nome_cliente, cnpj, data_inicio"
                  value={form.variaveis}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, variaveis: value }))
                  }
                />
                <div className="flex flex-wrap gap-4">
                  <Switch
                    isSelected={form.ativo}
                    size="sm"
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, ativo: value }))
                    }
                  >
                    Modelo ativo
                  </Switch>
                  <Switch
                    isSelected={form.publico}
                    size="sm"
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, publico: value }))
                    }
                  >
                    Disponível para equipe
                  </Switch>
                </div>
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

      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar exclusão</ModalHeader>
              <ModalBody>
                <p>Deseja remover este modelo de contrato?</p>
                {selectedModelo ? (
                  <p className="text-sm text-default-500">
                    Modelo: <span className="font-medium">{selectedModelo.nome}</span>
                  </p>
                ) : null}
                <p className="text-sm text-danger">
                  Esta ação não pode ser desfeita.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  isLoading={deleteLoading}
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
