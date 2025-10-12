"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Tooltip } from "@heroui/tooltip";
import { Skeleton } from "@heroui/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Checkbox } from "@heroui/checkbox";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import {
  FolderPlus,
  RefreshCw,
  UploadCloud,
  Trash2,
  Pencil,
  Folder,
  FileText,
  Users,
  Search,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  type DocumentExplorerData,
  type DocumentExplorerCliente,
  type DocumentExplorerProcess,
  type DocumentExplorerFile,
  type DocumentExplorerContrato,
  type DocumentExplorerCatalogoCausa,
  createExplorerFolder,
  deleteExplorerFile,
  deleteExplorerFolder,
  getDocumentExplorerData,
  renameExplorerFolder,
  uploadDocumentoExplorer,
} from "@/app/actions/documentos-explorer";
import { title } from "@/components/primitives";

interface DocumentosContentProps {
  initialData: DocumentExplorerData | null;
  initialError?: string;
}

interface ExplorerTreeNode {
  id: string;
  name: string;
  relativeSegments: string[];
  children: ExplorerTreeNode[];
  files: DocumentExplorerFile[];
}

const ROOT_SEGMENT_KEY = "";

interface UploadOptionsState {
  causaId: string | null;
  processoIds: string[];
  contratoIds: string[];
  visivelParaCliente: boolean;
  description: string;
}

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function getRelativeSegmentsFromPath(
  path: string,
  tenantSlug: string,
): string[] {
  const segments = path.split("/").filter(Boolean);

  if (segments[0] === "magiclawyer") {
    segments.shift();
  }

  if (segments[0] === tenantSlug) {
    segments.shift();
  }

  return segments;
}

function computeBaseSegmentsForProcess(
  data: DocumentExplorerData,
  cliente: DocumentExplorerCliente,
  processo: DocumentExplorerProcess,
): string[] {
  if (processo.folderTree) {
    return getRelativeSegmentsFromPath(
      processo.folderTree.path,
      data.tenantSlug,
    );
  }

  const clienteSegment = `${sanitizeSegment(cliente.nome)}-${cliente.id}`;
  const processoSegment = `${sanitizeSegment(processo.numero)}-${processo.id}`;

  return ["clientes", clienteSegment, "processos", processoSegment];
}

function computeBaseSegmentsForCliente(
  data: DocumentExplorerData,
  cliente: DocumentExplorerCliente,
): string[] {
  if (cliente.documentosGeraisTree) {
    return getRelativeSegmentsFromPath(
      cliente.documentosGeraisTree.path,
      data.tenantSlug,
    );
  }

  const clienteSegment = `${sanitizeSegment(cliente.nome)}-${cliente.id}`;

  return ["clientes", clienteSegment, "documentos"];
}

function getRelativeDocSegments(
  doc: DocumentExplorerFile,
  baseSegments: string[],
): string[] {
  if (!doc.folderSegments?.length) return [];

  const segments = [...doc.folderSegments];

  if (baseSegments.length) {
    const prefix = segments.slice(0, baseSegments.length);
    const matchesPrefix = baseSegments.every(
      (segment, index) => segment === prefix[index],
    );

    if (matchesPrefix) {
      return segments.slice(baseSegments.length);
    }
  }

  return segments;
}

function ensureNode(
  map: Map<string, ExplorerTreeNode>,
  relativeSegments: string[],
): ExplorerTreeNode {
  const key = relativeSegments.join("/");

  if (map.has(key)) {
    return map.get(key)!;
  }

  const node: ExplorerTreeNode = {
    id: key,
    name: relativeSegments.length
      ? relativeSegments[relativeSegments.length - 1]
      : "Pasta principal",
    relativeSegments,
    children: [],
    files: [],
  };

  map.set(key, node);

  if (relativeSegments.length > 0) {
    const parentSegments = relativeSegments.slice(0, -1);
    const parentNode = ensureNode(map, parentSegments);

    if (!parentNode.children.some((child) => child.id === key)) {
      parentNode.children.push(node);
    }
  }

  return node;
}

function buildExplorerTree(
  data: DocumentExplorerData,
  cliente: DocumentExplorerCliente,
  processo: DocumentExplorerProcess | null,
): ExplorerTreeNode {
  const map = new Map<string, ExplorerTreeNode>();
  const baseSegments = processo
    ? computeBaseSegmentsForProcess(data, cliente, processo)
    : computeBaseSegmentsForCliente(data, cliente);

  ensureNode(map, []);

  const folderTree = processo
    ? processo.folderTree
    : cliente.documentosGeraisTree;

  const visit = (current: typeof folderTree) => {
    if (!current) return;

    const relativeSegments = getRelativeSegmentsFromPath(
      current.path,
      data.tenantSlug,
    ).slice(baseSegments.length);

    ensureNode(map, relativeSegments);

    for (const child of current.children) {
      visit(child);
    }
  };

  if (folderTree) {
    visit(folderTree);
  }

  const documentos = processo ? processo.documentos : cliente.documentosGerais;

  for (const documento of documentos) {
    const relative = getRelativeDocSegments(documento, baseSegments);
    const node = ensureNode(map, relative);

    node.files.push(documento);
  }

  for (const node of Array.from(map.values())) {
    node.children.sort((a: ExplorerTreeNode, b: ExplorerTreeNode) =>
      a.name.localeCompare(b.name),
    );
    node.files.sort((a: DocumentExplorerFile, b: DocumentExplorerFile) =>
      a.nome.localeCompare(b.nome),
    );
  }

  return map.get(ROOT_SEGMENT_KEY)!;
}

function formatBytes(size: number | null | undefined): string {
  if (!size || Number.isNaN(size)) return "—";
  if (size === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(size) / Math.log(1024));
  const value = size / Math.pow(1024, index);

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(date: string | undefined): string {
  if (!date) return "—";
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentosContent({
  initialData,
  initialError,
}: DocumentosContentProps) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    initialData?.clientes[0]?.id ?? null,
  );
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(
    initialData?.clientes[0]?.processos[0]?.id ?? null,
  );
  const [selectedFolderSegments, setSelectedFolderSegments] = useState<
    string[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadOptions, setUploadOptions] = useState<UploadOptionsState>({
    causaId: null,
    processoIds: [],
    contratoIds: [],
    visivelParaCliente: true,
    description: "",
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    "documentos-explorer",
    async () => {
      const result = await getDocumentExplorerData();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar documentos");
      }

      return result.data ?? null;
    },
    {
      fallbackData: initialData ?? undefined,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  useEffect(() => {
    if (!data) return;

    if (
      !selectedClienteId ||
      !data.clientes.some((cliente) => cliente.id === selectedClienteId)
    ) {
      const firstCliente = data.clientes[0];

      setSelectedClienteId(firstCliente ? firstCliente.id : null);
      setSelectedProcessoId(firstCliente?.processos[0]?.id ?? null);
      setSelectedFolderSegments([]);

      return;
    }

    const cliente = data.clientes.find((item) => item.id === selectedClienteId);

    if (!cliente) return;

    if (
      selectedProcessoId &&
      !cliente.processos.some((processo) => processo.id === selectedProcessoId)
    ) {
      setSelectedProcessoId(cliente.processos[0]?.id ?? null);
      setSelectedFolderSegments([]);
    }
  }, [data, selectedClienteId, selectedProcessoId]);

  const selectedCliente = useMemo(() => {
    if (!data || !selectedClienteId) return null;

    return (
      data.clientes.find((cliente) => cliente.id === selectedClienteId) ?? null
    );
  }, [data, selectedClienteId]);

  const selectedProcesso = useMemo(() => {
    if (!selectedCliente || !selectedProcessoId) return null;

    return (
      selectedCliente.processos.find(
        (processo) => processo.id === selectedProcessoId,
      ) ?? null
    );
  }, [selectedCliente, selectedProcessoId]);

  const tree = useMemo(() => {
    if (!data || !selectedCliente) return null;

    return buildExplorerTree(data, selectedCliente, selectedProcesso);
  }, [data, selectedCliente, selectedProcesso]);

  const filesInCurrentFolder = useMemo(() => {
    if (!tree) return [] as DocumentExplorerFile[];

    const key = selectedFolderSegments.join("/");

    const findNode = (node: ExplorerTreeNode): ExplorerTreeNode | null => {
      if (node.id === key) return node;

      for (const child of node.children) {
        const found = findNode(child);

        if (found) return found;
      }

      return null;
    };

    const node = findNode(tree);

    return node?.files ?? [];
  }, [tree, selectedFolderSegments]);

  const handleSelectCliente = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    const cliente = data?.clientes.find((item) => item.id === clienteId);

    setSelectedProcessoId(cliente?.processos[0]?.id ?? null);
    setSelectedFolderSegments([]);
  };

  const handleSelectProcesso = (processoId: string | null) => {
    setSelectedProcessoId(processoId);
    setSelectedFolderSegments([]);
  };

  const handleSelectFolder = (segments: string[]) => {
    setSelectedFolderSegments(segments);
  };

  const handleCreateFolder = useCallback(async () => {
    if (!selectedCliente || !selectedProcesso) {
      toast.error("Selecione um processo para criar pastas");

      return;
    }

    const nome = prompt("Nome da nova pasta");

    if (!nome) return;

    const result = await createExplorerFolder({
      clienteId: selectedCliente.id,
      processoId: selectedProcesso.id,
      parentSegments: selectedFolderSegments,
      nomePasta: nome,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao criar pasta");

      return;
    }

    toast.success("Pasta criada com sucesso");
    await mutate();
  }, [selectedCliente, selectedProcesso, selectedFolderSegments, mutate]);

  const handleRenameFolder = useCallback(async () => {
    if (!selectedCliente || !selectedProcesso) {
      toast.error("Selecione um processo para renomear pastas");

      return;
    }

    if (!selectedFolderSegments.length) {
      toast.message("Selecione a pasta que deseja renomear");

      return;
    }

    const currentName =
      selectedFolderSegments[selectedFolderSegments.length - 1];
    const novoNome = prompt("Novo nome da pasta", currentName);

    if (!novoNome || novoNome === currentName) return;

    const result = await renameExplorerFolder({
      clienteId: selectedCliente.id,
      processoId: selectedProcesso.id,
      currentSegments: selectedFolderSegments,
      novoNome,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao renomear pasta");

      return;
    }

    toast.success("Pasta renomeada");
    setSelectedFolderSegments((prev) => {
      const updated = [...prev];

      updated[updated.length - 1] = sanitizeSegment(novoNome);

      return updated;
    });
    await mutate();
  }, [selectedCliente, selectedProcesso, selectedFolderSegments, mutate]);

  const handleDeleteFolder = useCallback(async () => {
    if (!selectedCliente || !selectedProcesso) {
      toast.error("Selecione um processo");

      return;
    }

    if (!selectedFolderSegments.length) {
      toast.message("Selecione uma pasta para excluir");

      return;
    }

    const confirmDelete = confirm(
      "Deseja realmente excluir esta pasta e todos os arquivos dentro dela?",
    );

    if (!confirmDelete) return;

    const result = await deleteExplorerFolder({
      clienteId: selectedCliente.id,
      processoId: selectedProcesso.id,
      targetSegments: selectedFolderSegments,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao excluir pasta");

      return;
    }

    toast.success("Pasta excluída");
    setSelectedFolderSegments([]);
    await mutate();
  }, [selectedCliente, selectedProcesso, selectedFolderSegments, mutate]);

  const openUploadModalForFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;

      if (!selectedCliente) {
        toast.error("Selecione um cliente para anexar documentos");

        return;
      }

      const defaultProcesso =
        selectedProcesso ?? selectedCliente.processos[0] ?? null;
      const defaultCausaId = defaultProcesso?.causas?.[0]?.id ?? null;
      const relacionados = selectedCliente.contratos?.filter((contrato: any) =>
        defaultProcesso ? contrato.processoId === defaultProcesso.id : false,
      );

      setUploadOptions({
        causaId: defaultCausaId,
        processoIds: defaultProcesso ? [defaultProcesso.id] : [],
        contratoIds:
          relacionados && relacionados.length ? [relacionados[0].id] : [],
        visivelParaCliente: true,
        description: "",
      });

      setPendingFiles(files);
      setIsUploadModalOpen(true);
    },
    [selectedCliente, selectedProcesso],
  );

  const handleUploadModalClose = useCallback(() => {
    if (isUploading) return;

    setIsUploadModalOpen(false);
    setPendingFiles(null);
  }, [isUploading]);

  const performUpload = useCallback(async () => {
    if (!pendingFiles || !pendingFiles.length) {
      toast.error("Nenhum arquivo selecionado");

      return;
    }

    if (!selectedCliente) {
      toast.error("Selecione um cliente");

      return;
    }

    setIsUploading(true);

    try {
      for (const file of Array.from(pendingFiles)) {
        const formData = new FormData();

        formData.append("file", file);

        uploadOptions.processoIds.forEach((processoId) =>
          formData.append("processoIds", processoId),
        );
        uploadOptions.contratoIds.forEach((contratoId) =>
          formData.append("contratoIds", contratoId),
        );

        if (uploadOptions.causaId) {
          formData.append("causaId", uploadOptions.causaId);
        }

        const response = await uploadDocumentoExplorer(
          selectedCliente.id,
          uploadOptions.processoIds[0] ?? null,
          formData,
          {
            folderSegments: selectedFolderSegments,
            description: uploadOptions.description || undefined,
            visivelParaCliente: uploadOptions.visivelParaCliente,
          },
        );

        if (!response.success) {
          throw new Error(response.error || `Erro ao enviar ${file.name}`);
        }
      }

      toast.success("Upload concluído");
      setPendingFiles(null);
      setIsUploadModalOpen(false);
      await mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar documentos",
      );
    } finally {
      setIsUploading(false);
    }
  }, [
    pendingFiles,
    selectedCliente,
    uploadOptions,
    selectedFolderSegments,
    mutate,
  ]);

  const handleUpload = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;

      openUploadModalForFiles(files);
    },
    [openUploadModalForFiles],
  );

  const handleDeleteFile = useCallback(
    async (documento: DocumentExplorerFile) => {
      const confirmDelete = confirm(`Remover o arquivo "${documento.nome}"?`);

      if (!confirmDelete) return;

      const result = await deleteExplorerFile({
        documentoId: documento.documentoId,
        versaoId: documento.versaoId,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao remover arquivo");

        return;
      }

      toast.success("Arquivo removido");
      await mutate();
    },
    [mutate],
  );

  const filteredClientes = useMemo(() => {
    if (!data) return [] as DocumentExplorerCliente[];

    if (!searchTerm) return data.clientes;

    return data.clientes.filter((cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  const canConfirmUpload = Boolean(
    pendingFiles?.length &&
      (uploadOptions.processoIds.length > 0 ||
        uploadOptions.contratoIds.length > 0),
  );

  const fileCount = pendingFiles?.length ?? 0;

  const displayError = error?.message ?? initialError;

  if (!data && isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-12">
        <ExplorerSkeleton />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-12">
        <Card className="border border-danger/20 bg-danger/10">
          <CardBody className="flex flex-col gap-3 text-danger-100">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Erro ao carregar documentos</span>
            </div>
            <p className="text-sm text-danger-200/80">
              {displayError ||
                "Não foi possível recuperar a biblioteca de documentos."}
            </p>
            <div>
              <Button
                color="danger"
                startContent={<RefreshCw className="h-4 w-4" />}
                onPress={() => mutate()}
              >
                Tentar novamente
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 py-10 px-4 sm:px-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                Documentos
              </p>
              <h1 className={title({ size: "lg", color: "blue" })}>
                Biblioteca organizada por cliente e processo
              </h1>
              <p className="text-sm text-default-400">
                Arraste arquivos, organize em pastas e mantenha o escritório
                sincronizado com o Cloudinary.
              </p>
            </div>
            <Button
              color="primary"
              isLoading={isValidating}
              radius="full"
              startContent={<RefreshCw className="h-4 w-4" />}
              variant="flat"
              onPress={() => mutate()}
            >
              Atualizar
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-primary/30 bg-primary/10">
              <CardBody className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-primary/70">
                  Clientes
                </span>
                <span className="text-2xl font-semibold text-primary-200">
                  {data.totals.clientes}
                </span>
              </CardBody>
            </Card>
            <Card className="border border-success/30 bg-success/10">
              <CardBody className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-success/70">
                  Processos
                </span>
                <span className="text-2xl font-semibold text-success-200">
                  {data.totals.processos}
                </span>
              </CardBody>
            </Card>
            <Card className="border border-secondary/30 bg-secondary/10">
              <CardBody className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-secondary/70">
                  Documentos
                </span>
                <span className="text-2xl font-semibold text-secondary-200">
                  {data.totals.documentos}
                </span>
              </CardBody>
            </Card>
            <Card className="border border-warning/30 bg-warning/10">
              <CardBody className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-warning/70">
                  Arquivos
                </span>
                <span className="text-2xl font-semibold text-warning-200">
                  {data.totals.arquivos}
                </span>
              </CardBody>
            </Card>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="border border-default-100/40 bg-default-50/10">
            <CardHeader className="flex items-center gap-2 border-b border-default-100/20 pb-4">
              <Users className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-default-100">
                  Clientes
                </p>
                <p className="text-xs text-default-400">
                  {filteredClientes.length} registros
                </p>
              </div>
            </CardHeader>
            <Divider className="border-default-100/20" />
            <CardBody className="flex flex-col gap-4">
              <Input
                aria-label="Buscar cliente"
                placeholder="Buscar cliente..."
                startContent={<Search className="h-4 w-4 text-default-400" />}
                value={searchTerm}
                variant="bordered"
                onValueChange={setSearchTerm}
              />
              <div
                className="flex flex-col gap-2 overflow-y-auto pr-1"
                style={{ maxHeight: "520px" }}
              >
                {filteredClientes.map((cliente) => {
                  const isActive = cliente.id === selectedClienteId;

                  return (
                    <button
                      key={cliente.id}
                      className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-left transition ${isActive ? "border-primary/40 bg-primary/10" : "border-default-100/10 bg-default-100/5 hover:border-default-100/30"}`}
                      onClick={() => handleSelectCliente(cliente.id)}
                    >
                      <span className="text-sm font-medium text-default-100">
                        {cliente.nome}
                      </span>
                      <span className="text-xs text-default-400">
                        {cliente.counts.processos} processos ·{" "}
                        {cliente.counts.arquivos} arquivos
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border border-default-100/40 bg-default-50/10">
              <CardHeader className="flex items-center justify-between gap-2 border-b border-default-100/20 pb-4">
                <div>
                  <p className="text-sm font-semibold text-default-100">
                    Processos
                  </p>
                  <p className="text-xs text-default-400">
                    {selectedCliente?.processos.length ?? 0} associados ao
                    cliente
                  </p>
                </div>
                {selectedCliente && (
                  <Chip color="primary" size="sm" variant="flat">
                    {selectedCliente.counts.arquivos} arquivos
                  </Chip>
                )}
              </CardHeader>
              <CardBody className="flex flex-col gap-2">
                {selectedCliente?.processos.length ? (
                  selectedCliente.processos.map((processo) => {
                    const isActive = processo.id === selectedProcessoId;

                    return (
                      <button
                        key={processo.id}
                        className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-left transition ${isActive ? "border-primary/40 bg-primary/10" : "border-default-100/10 bg-default-100/5 hover:border-default-100/30"}`}
                        onClick={() => handleSelectProcesso(processo.id)}
                      >
                        <span className="text-sm font-medium text-default-100">
                          {processo.numero}
                        </span>
                        <span className="text-xs text-default-400 line-clamp-1">
                          {processo.titulo || "Sem título"}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-default-500">
                          <span>{processo.counts.arquivos} arquivos</span>
                          <span>•</span>
                          <span>{processo.status}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center py-6 text-sm text-default-400">
                    Nenhum processo vinculado
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="border border-default-100/40 bg-default-50/10">
              <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-default-100/20 pb-4">
                <div>
                  <p className="text-sm font-semibold text-default-100">
                    Explorador de arquivos
                  </p>
                  <p className="text-xs text-default-400">
                    {selectedProcesso
                      ? "Pastas do processo"
                      : "Documentos gerais do cliente"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Button
                    color="primary"
                    size="sm"
                    startContent={<FolderPlus className="h-3.5 w-3.5" />}
                    variant="flat"
                    onPress={handleCreateFolder}
                  >
                    Nova pasta
                  </Button>
                  <Tooltip content="Renomear pasta selecionada">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={handleRenameFolder}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Excluir pasta selecionada">
                    <Button
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={handleDeleteFolder}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardBody>
                {!selectedCliente ? (
                  <div className="flex items-center justify-center py-20 text-sm text-default-400">
                    Selecione um cliente para visualizar documentos
                  </div>
                ) : !tree ? (
                  <div className="flex items-center justify-center py-20 text-sm text-default-400">
                    Nenhuma estrutura encontrada
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="rounded-xl border border-default-100/20 bg-default-100/5 p-3">
                      <FolderTree
                        root={tree}
                        selectedPath={selectedFolderSegments}
                        onSelectFolder={handleSelectFolder}
                      />
                    </div>

                    <div className="rounded-xl border border-default-100/20 bg-default-100/5">
                      <div className="flex items-center justify-between border-b border-default-100/10 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-default-100">
                          <Folder className="h-4 w-4 text-primary" />
                          {selectedFolderSegments.length
                            ? selectedFolderSegments[
                                selectedFolderSegments.length - 1
                              ]
                            : "Pasta principal"}
                        </div>
                        <Button
                          color="primary"
                          isLoading={isUploading}
                          size="sm"
                          startContent={<UploadCloud className="h-3.5 w-3.5" />}
                          variant="flat"
                          onPress={() => {
                            if (isUploading) return;

                            const input = document.createElement("input");

                            input.type = "file";
                            input.multiple = true;
                            input.onchange = () => {
                              handleUpload(input.files);
                              input.value = "";
                            };
                            input.click();
                          }}
                        >
                          Enviar arquivos
                        </Button>
                      </div>

                      <div
                        className={`mx-4 my-4 flex min-h-[160px] flex-col gap-3 rounded-lg border-2 border-dashed border-default-100/30 p-4 text-sm text-default-400 ${isUploading ? "opacity-60" : ""}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (isUploading) return;
                          handleUpload(event.dataTransfer.files);
                        }}
                      >
                        <div className="flex items-center justify-center gap-2 text-default-300">
                          <UploadCloud className="h-4 w-4" />
                          Arraste arquivos aqui ou clique em enviar
                        </div>
                        {filesInCurrentFolder.length ? (
                          <div className="space-y-2">
                            {filesInCurrentFolder.map((arquivo) => (
                              <div
                                key={`${arquivo.documentoId}-${arquivo.versaoId ?? "v1"}`}
                                className="flex items-center justify-between gap-3 rounded-lg border border-default-100/10 bg-default-100/5 px-3 py-2"
                              >
                                <div className="flex flex-1 items-center gap-3">
                                  <FileText className="h-4 w-4 text-default-300" />
                                  <div>
                                    <p className="text-sm font-medium text-default-100">
                                      {arquivo.nome}
                                    </p>
                                    <p className="text-xs text-default-400">
                                      {formatBytes(arquivo.tamanhoBytes)} ·{" "}
                                      {formatDate(arquivo.uploadedAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    as="a"
                                    href={arquivo.url}
                                    rel="noopener noreferrer"
                                    size="sm"
                                    target="_blank"
                                    variant="light"
                                  >
                                    Abrir
                                  </Button>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleDeleteFile(arquivo)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-1 items-center justify-center text-xs text-default-400">
                            Nenhum arquivo nesta pasta
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        <footer className="flex items-center justify-between rounded-xl border border-default-100/20 bg-default-100/5 px-4 py-3 text-xs text-default-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary/80" />
            <span>
              Estrutura sincronizada em{" "}
              {data.generatedAt ? formatDate(data.generatedAt) : "--"}
            </span>
          </div>
          <span>
            Cloudinary folder base:{" "}
            <code className="text-default-300">
              magiclawyer/{data.tenantSlug}
            </code>
          </span>
        </footer>
      </section>

      <UploadOptionsModal
        canConfirm={canConfirmUpload}
        causas={data?.catalogos.causas ?? []}
        cliente={selectedCliente ?? null}
        contratos={selectedCliente?.contratos ?? []}
        fileCount={fileCount}
        isOpen={isUploadModalOpen}
        isSubmitting={isUploading}
        processos={selectedCliente?.processos ?? []}
        setUploadOptions={setUploadOptions}
        uploadOptions={uploadOptions}
        onClose={handleUploadModalClose}
        onConfirm={performUpload}
      />
    </>
  );
}

interface FolderTreeProps {
  root: ExplorerTreeNode;
  selectedPath: string[];
  onSelectFolder: (segments: string[]) => void;
}

function FolderTree({ root, selectedPath, onSelectFolder }: FolderTreeProps) {
  const renderNode = (node: ExplorerTreeNode) => {
    const isRoot = node.relativeSegments.length === 0;
    const isActive = node.id === selectedPath.join("/");

    return (
      <div key={node.id} className="ml-2 border-l border-default-100/10 pl-3">
        {!isRoot && (
          <button
            className={`mb-1 flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-sm transition ${isActive ? "bg-primary/15 text-primary-100" : "text-default-300 hover:bg-default-100/10"}`}
            onClick={() => onSelectFolder(node.relativeSegments)}
          >
            <span className="flex items-center gap-2">
              <Folder className="h-3.5 w-3.5" />
              {node.name || "pasta"}
            </span>
            {node.files.length > 0 && (
              <Chip color="primary" size="sm" variant="flat">
                {node.files.length}
              </Chip>
            )}
          </button>
        )}
        {node.children.map((child) => renderNode(child))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition ${selectedPath.length === 0 ? "bg-primary/20 text-primary-100" : "text-default-200 hover:bg-default-100/10"}`}
        onClick={() => onSelectFolder([])}
      >
        <span className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Pasta principal
        </span>
        {root.files.length > 0 && (
          <Chip color="primary" size="sm" variant="flat">
            {root.files.length}
          </Chip>
        )}
      </button>
      {root.children.map((child) => renderNode(child))}
    </div>
  );
}

function ExplorerSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32 rounded-lg" isLoaded={false} />
          <Skeleton className="h-6 w-72 rounded-lg" isLoaded={false} />
          <Skeleton className="h-3 w-60 rounded-lg" isLoaded={false} />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" isLoaded={false} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="border border-default-100/20 bg-default-50/10"
          >
            <CardBody className="space-y-3">
              <Skeleton className="h-3 w-20 rounded-lg" isLoaded={false} />
              <Skeleton className="h-8 w-16 rounded-lg" isLoaded={false} />
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="border border-default-100/20 bg-default-50/10">
          <CardBody className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" isLoaded={false} />
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-12 w-full rounded-xl"
                isLoaded={false}
              />
            ))}
          </CardBody>
        </Card>
        <Card className="border border-default-100/20 bg-default-50/10">
          <CardBody className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" isLoaded={false} />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-20 w-full rounded-xl"
                isLoaded={false}
              />
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

interface UploadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  canConfirm: boolean;
  fileCount: number;
  cliente: DocumentExplorerCliente | null;
  processos: DocumentExplorerProcess[];
  contratos: DocumentExplorerContrato[];
  causas: DocumentExplorerCatalogoCausa[];
  uploadOptions: UploadOptionsState;
  setUploadOptions: React.Dispatch<React.SetStateAction<UploadOptionsState>>;
}

function UploadOptionsModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  canConfirm,
  fileCount,
  cliente,
  processos,
  contratos,
  causas,
  uploadOptions,
  setUploadOptions,
}: UploadOptionsModalProps) {
  const handleToggleProcesso = (processoId: string, selected: boolean) => {
    setUploadOptions((prev) => {
      const next = new Set(prev.processoIds);

      if (selected) {
        next.add(processoId);
      } else {
        next.delete(processoId);
      }

      return {
        ...prev,
        processoIds: Array.from(next),
      };
    });
  };

  const handleToggleContrato = (contratoId: string, selected: boolean) => {
    setUploadOptions((prev) => {
      const next = new Set(prev.contratoIds);

      if (selected) {
        next.add(contratoId);
      } else {
        next.delete(contratoId);
      }

      return {
        ...prev,
        contratoIds: Array.from(next),
      };
    });
  };

  const causaKeys = uploadOptions.causaId ? [uploadOptions.causaId] : [];

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onClose();
        }
      }}
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-default-900">
                Configurar upload
              </h3>
              <p className="text-sm text-default-500">
                {fileCount} arquivo{fileCount === 1 ? "" : "s"} selecionado
              </p>
            </ModalHeader>
            <ModalBody className="space-y-4">
              {!cliente ? (
                <p className="text-sm text-default-500">
                  Selecione um cliente para vincular os documentos.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Select
                      label="Causa"
                      placeholder="Opcional"
                      selectedKeys={causaKeys}
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        setUploadOptions((prev) => ({
                          ...prev,
                          causaId: value && value !== "__none" ? value : null,
                        }));
                      }}
                    >
                      {[
                        <SelectItem key="__none">
                          Sem causa específica
                        </SelectItem>,
                        ...causas.map((causa) => (
                          <SelectItem key={causa.id}>
                            {causa.nome}
                            {causa.codigoCnj ? ` · ${causa.codigoCnj}` : ""}
                          </SelectItem>
                        )),
                      ]}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-default-600">
                      Processos vinculados
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {processos.length ? (
                        processos.map((processo) => (
                          <Checkbox
                            key={processo.id}
                            isSelected={uploadOptions.processoIds.includes(
                              processo.id,
                            )}
                            onValueChange={(selected) =>
                              handleToggleProcesso(processo.id, selected)
                            }
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-default-600">
                                {processo.numero}
                              </span>
                              <span className="text-xs text-default-400">
                                {processo.titulo || "Sem título"}
                              </span>
                            </div>
                          </Checkbox>
                        ))
                      ) : (
                        <p className="text-xs text-default-500">
                          Nenhum processo disponível para este cliente.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-default-600">
                      Contratos relacionados
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {contratos.length ? (
                        contratos.map((contrato) => (
                          <Checkbox
                            key={contrato.id}
                            isSelected={uploadOptions.contratoIds.includes(
                              contrato.id,
                            )}
                            onValueChange={(selected) =>
                              handleToggleContrato(contrato.id, selected)
                            }
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-default-600">
                                {contrato.titulo}
                              </span>
                              {contrato.processoId && (
                                <span className="text-xs text-default-400">
                                  Vinculado ao processo {contrato.processoId}
                                </span>
                              )}
                            </div>
                          </Checkbox>
                        ))
                      ) : (
                        <p className="text-xs text-default-500">
                          Nenhum contrato vinculado ao cliente.
                        </p>
                      )}
                    </div>
                  </div>

                  <Textarea
                    label="Descrição"
                    placeholder="Observações internas sobre este documento"
                    value={uploadOptions.description}
                    onValueChange={(value) =>
                      setUploadOptions((prev) => ({
                        ...prev,
                        description: value,
                      }))
                    }
                  />

                  <Switch
                    isSelected={uploadOptions.visivelParaCliente}
                    onValueChange={(selected) =>
                      setUploadOptions((prev) => ({
                        ...prev,
                        visivelParaCliente: selected,
                      }))
                    }
                  >
                    Permitir visualização pelo cliente
                  </Switch>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                disabled={isSubmitting}
                variant="light"
                onPress={() => {
                  if (isSubmitting) return;

                  close();
                  onClose();
                }}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                isDisabled={!canConfirm || !cliente || isSubmitting}
                isLoading={isSubmitting}
                onPress={onConfirm}
              >
                Confirmar upload
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
