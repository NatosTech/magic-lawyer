"use client";

import { useMemo, useState, useCallback, useEffect, ReactNode } from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Tooltip } from "@heroui/tooltip";
import { Skeleton, Select, SelectItem } from "@heroui/react";
import { Badge } from "@heroui/badge";
import { Slider } from "@heroui/slider";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Checkbox } from "@heroui/checkbox";
import { Switch } from "@heroui/switch";
import { DateRangeInput } from "@/components/ui/date-range-input";

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
  Filter,
  ChevronDown,
  Files,
  Layers,
  Briefcase,
  RotateCcw,
  XCircle,
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  Calendar,
  Info,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

import {
  type DocumentExplorerData,
  type DocumentExplorerCliente,
  type DocumentExplorerProcess,
  type DocumentExplorerFile,
  type DocumentExplorerContrato,
  type DocumentExplorerCatalogoCausa,
  type DocumentExplorerClienteSummary,
  createExplorerFolder,
  deleteExplorerFile,
  deleteExplorerFolder,
  getDocumentExplorerData,
  renameExplorerFolder,
  uploadDocumentoExplorer,
} from "@/app/actions/documentos-explorer";
import { title } from "@/components/primitives";
import { fadeInUp } from "@/components/ui/motion-presets";

interface DocumentosContentProps {
  initialData: DocumentExplorerData | null;
  initialClientes: DocumentExplorerClienteSummary[];
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

type OrigemFiltro = "TODOS" | "CLIENTE" | "ESCRITORIO" | "SISTEMA";
type VisibilidadeFiltro = "TODOS" | "CLIENTE" | "EQUIPE";

interface FiltrosState {
  busca: string;
  origem: OrigemFiltro;
  visibilidade: VisibilidadeFiltro;
  dataUpload: { start: string | null; end: string | null } | null;
  tamanhoKB: number[]; // [min, max]
}

interface FilterSectionProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}

const FilterSection = ({
  title,
  description,
  icon: Icon,
  children,
}: FilterSectionProps) => (
  <section className="space-y-3 rounded-2xl border border-default-200/70 bg-default-50/70 p-4">
    <div className="flex items-start gap-2">
      {Icon ? <Icon className="h-4 w-4 text-default-400" /> : null}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-default-400">
          {title}
        </p>
        {description ? (
          <p className="text-xs text-default-500">{description}</p>
        ) : null}
      </div>
    </div>
    {children}
  </section>
);

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
  initialClientes,
  initialError,
}: DocumentosContentProps) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    initialClientes[0]?.id ?? null,
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
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({
    busca: "",
    origem: "TODOS",
    visibilidade: "TODOS",
    dataUpload: null,
    tamanhoKB: [0, 512000],
  });
  const [isLoadingCliente, setIsLoadingCliente] = useState(false);
  const [previousClienteId, setPreviousClienteId] = useState<string | null>(
    initialClientes[0]?.id ?? null,
  );

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    selectedClienteId ? ["documentos-explorer", selectedClienteId] : null,
    async ([, clienteId]) => {
      setIsLoadingCliente(true);
      try {
        const result = await getDocumentExplorerData(clienteId);

        if (!result.success) {
          throw new Error(result.error || "Erro ao carregar documentos");
        }

        return result.data ?? null;
      } finally {
        setIsLoadingCliente(false);
      }
    },
    {
      fallbackData: initialData ?? undefined,
      revalidateOnFocus: false,
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
      setPreviousClienteId(firstCliente ? firstCliente.id : null);

      return;
    }

    const cliente = data.clientes.find((item) => item.id === selectedClienteId);

    if (!cliente) return;

    // Quando os dados terminam de carregar, atualiza o previousClienteId
    if (isLoadingCliente === false && selectedClienteId !== previousClienteId) {
      setPreviousClienteId(selectedClienteId);
    }

    // Se não há processo selecionado, seleciona o primeiro
    if (!selectedProcessoId && cliente.processos.length > 0) {
      setSelectedProcessoId(cliente.processos[0].id);
      setSelectedFolderSegments([]);
    }

    if (
      selectedProcessoId &&
      !cliente.processos.some((processo) => processo.id === selectedProcessoId)
    ) {
      setSelectedProcessoId(cliente.processos[0]?.id ?? null);
      setSelectedFolderSegments([]);
    }
  }, [data, selectedClienteId, selectedProcessoId, isLoadingCliente, previousClienteId]);

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

    const files = node?.files ?? [];

    return files.filter((arquivo) => {
      const nomeMatch = filtros.busca
        ? arquivo.nome.toLowerCase().includes(filtros.busca.toLowerCase())
        : true;

      const origemMatch =
        filtros.origem === "TODOS" || arquivo.metadata?.origem === filtros.origem;

      const visMatch =
        filtros.visibilidade === "TODOS" ||
        (filtros.visibilidade === "CLIENTE" && arquivo.visivelParaCliente) ||
        (filtros.visibilidade === "EQUIPE" && !arquivo.visivelParaCliente);

      const tamanhoMatch =
        arquivo.tamanhoBytes == null
          ? true
          : arquivo.tamanhoBytes / 1024 >= filtros.tamanhoKB[0] &&
            arquivo.tamanhoBytes / 1024 <= filtros.tamanhoKB[1];

      const dataMatch = (() => {
        if (!filtros.dataUpload || (!filtros.dataUpload.start && !filtros.dataUpload.end))
          return true;

        const uploaded = arquivo.uploadedAt ? new Date(arquivo.uploadedAt) : null;
        if (!uploaded) return true;
        const start = filtros.dataUpload.start ? new Date(filtros.dataUpload.start) : null;
        const end = filtros.dataUpload.end ? new Date(filtros.dataUpload.end) : null;

        if (start && uploaded < start) return false;
        if (end) {
          // incluir fim do dia selecionado
          end.setHours(23, 59, 59, 999);
          if (uploaded > end) return false;
        }
        return true;
      })();

      return nomeMatch && origemMatch && visMatch && tamanhoMatch && dataMatch;
    });
  }, [tree, selectedFolderSegments, filtros]);

  const handleSelectCliente = (clienteId: string) => {
    if (clienteId === selectedClienteId) return;
    
    setPreviousClienteId(selectedClienteId);
    setSelectedClienteId(clienteId);
    setSelectedProcessoId(null);
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
    if (!searchTerm) return initialClientes;

    return initialClientes.filter((cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [initialClientes, searchTerm]);

  const canConfirmUpload = Boolean(
    pendingFiles?.length &&
      (uploadOptions.processoIds.length > 0 ||
        uploadOptions.contratoIds.length > 0),
  );

  const fileCount = pendingFiles?.length ?? 0;

  const displayError = error?.message ?? initialError;

  const hasActiveFilters = useMemo(() => {
    return (
      filtros.busca !== "" ||
      filtros.origem !== "TODOS" ||
      filtros.visibilidade !== "TODOS" ||
      filtros.dataUpload !== null ||
      filtros.tamanhoKB[0] !== 0 ||
      filtros.tamanhoKB[1] !== 512000
    );
  }, [filtros]);

  const clearFilters = () => {
    setFiltros({
      busca: "",
      origem: "TODOS",
      visibilidade: "TODOS",
      dataUpload: null,
      tamanhoKB: [0, 512000],
    });
  };

  if (!selectedClienteId) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-12">
        <Card className="border border-default-100/20 bg-default-100/5">
          <CardBody className="flex flex-col gap-3">
            <p className="text-sm text-default-300">
              Selecione um cliente na lista para ver documentos e processos.
            </p>
          </CardBody>
        </Card>
      </section>
    );
  }

  if (!data && isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 py-12">
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
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Hero */}
      <motion.div animate="visible" initial="hidden" variants={fadeInUp}>
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-900 via-blue-900/90 to-indigo-800 text-white shadow-2xl">
          <CardBody className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Biblioteca de Documentos
                </h1>
                <p className="text-white/80">
                  Organize por cliente e processo, sincronize com Cloudinary e aplique filtros avançados rapidamente.
                </p>
              </div>
              <Button
                color="secondary"
                isLoading={isValidating}
                radius="full"
                startContent={<RefreshCw className="h-4 w-4" />}
                variant="flat"
                onPress={() => mutate()}
              >
                Atualizar
              </Button>
            </div>
          </CardBody>
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </Card>
      </motion.div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card Total de Clientes */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-indigo-900/30 border-blue-300 dark:border-blue-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="text-white" size={24} />
                </div>
                <Badge color="success" content="+" variant="shadow">
                  <TrendingUp
                    className="text-blue-600 dark:text-blue-400"
                    size={20}
                  />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Total de Clientes
                </p>
                <p className="text-4xl font-bold text-blue-800 dark:text-blue-200">
                  {initialClientes.length}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Carteira de clientes
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card Processos */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 via-green-100 to-teal-200 dark:from-green-900/30 dark:via-emerald-800/20 dark:to-teal-900/30 border-green-300 dark:border-green-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="text-white" size={24} />
                </div>
                <Badge color="success" content="✓" variant="shadow">
                  <Activity
                    className="text-green-600 dark:text-green-400"
                    size={20}
                  />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                  Processos
                </p>
                <p className="text-4xl font-bold text-green-800 dark:text-green-200">
                  {selectedCliente?.processos.length ?? 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Associados ao cliente
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card Documentos */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 via-violet-100 to-purple-200 dark:from-purple-900/30 dark:via-violet-800/20 dark:to-purple-900/30 border-purple-300 dark:border-purple-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="text-white" size={24} />
                </div>
                <Badge color="secondary" content="📄" variant="shadow">
                  <FileText
                    className="text-purple-600 dark:text-purple-400"
                    size={20}
                  />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Documentos
                </p>
                <p className="text-4xl font-bold text-purple-800 dark:text-purple-200">
                  {selectedCliente?.counts.documentos ?? 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Total de documentos
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card Arquivos */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 via-orange-100 to-amber-200 dark:from-amber-900/30 dark:via-orange-800/20 dark:to-amber-900/30 border-amber-300 dark:border-amber-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Files className="text-white" size={24} />
                </div>
                <Badge color="warning" content="📁" variant="shadow">
                  <Files
                    className="text-amber-600 dark:text-amber-400"
                    size={20}
                  />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                  Arquivos
                </p>
                <p className="text-4xl font-bold text-amber-800 dark:text-amber-200">
                  {selectedCliente?.counts.arquivos ?? 0}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Total de arquivos
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Filtros Avançados Melhorados */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-lg border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Filtros Inteligentes
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Encontre exatamente o documento que precisa
                  </p>
                </div>
                {hasActiveFilters && (
                  <motion.div
                    animate={{ scale: 1 }}
                    initial={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Badge
                      color="primary"
                      content={
                        [
                          filtros.busca,
                          filtros.origem !== "TODOS",
                          filtros.visibilidade !== "TODOS",
                          filtros.dataUpload !== null,
                          filtros.tamanhoKB[0] !== 0 || filtros.tamanhoKB[1] !== 512000,
                        ].filter(Boolean).length
                      }
                      size="lg"
                      variant="shadow"
                    >
                      <Chip
                        className="font-semibold"
                        color="primary"
                        size="lg"
                        variant="flat"
                      >
                        {
                          [
                            filtros.busca,
                            filtros.origem !== "TODOS",
                            filtros.visibilidade !== "TODOS",
                            filtros.dataUpload !== null,
                            filtros.tamanhoKB[0] !== 0 || filtros.tamanhoKB[1] !== 512000,
                          ].filter(Boolean).length
                        }{" "}
                        filtro(s) ativo(s)
                      </Chip>
                    </Badge>
                  </motion.div>
                )}
              </div>
              <div className="flex gap-2">
                <Tooltip color="warning" content="Limpar todos os filtros">
                  <Button
                    className="hover:scale-105 transition-transform"
                    color="warning"
                    isDisabled={!hasActiveFilters}
                    size="sm"
                    startContent={<RotateCcw className="w-4 h-4" />}
                    variant="light"
                    onPress={clearFilters}
                  >
                    Limpar
                  </Button>
                </Tooltip>
                <Tooltip
                  color="primary"
                  content={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                >
                  <Button
                    className="hover:scale-105 transition-transform"
                    color="primary"
                    size="sm"
                    startContent={
                      showFilters ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Filter className="w-4 h-4" />
                      )
                    }
                    variant="light"
                    onPress={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? "Ocultar" : "Mostrar"}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FilterSection
                      icon={Search}
                      title="Busca e identificação"
                      description="Busque por nome, origem e visibilidade dos documentos."
                    >
                      <div className="space-y-3">
                        <Input
                          label="Busca"
                          placeholder="Nome ou descrição"
                          startContent={<Search className="h-4 w-4 text-default-400" />}
                          value={filtros.busca}
                          variant="bordered"
                          onValueChange={(value) =>
                            setFiltros((prev) => ({ ...prev, busca: value }))
                          }
                        />
                        <Select
                          label="Origem"
                          selectedKeys={[filtros.origem]}
                          onSelectionChange={(keys) => {
                            const [value] = Array.from(keys) as OrigemFiltro[];
                            setFiltros((prev) => ({ ...prev, origem: value }));
                          }}
                        >
                          <SelectItem key="TODOS" textValue="Todas">Todas</SelectItem>
                          <SelectItem key="CLIENTE" textValue="Cliente">Cliente</SelectItem>
                          <SelectItem key="ESCRITORIO" textValue="Escritório">Escritório</SelectItem>
                          <SelectItem key="SISTEMA" textValue="Sistema">Sistema</SelectItem>
                        </Select>
                        <Select
                          label="Visível para"
                          selectedKeys={[filtros.visibilidade]}
                          onSelectionChange={(keys) => {
                            const [value] = Array.from(keys) as VisibilidadeFiltro[];
                            setFiltros((prev) => ({ ...prev, visibilidade: value }));
                          }}
                        >
                          <SelectItem key="TODOS" textValue="Todos">Todos</SelectItem>
                          <SelectItem key="CLIENTE" textValue="Cliente">Cliente</SelectItem>
                          <SelectItem key="EQUIPE" textValue="Somente equipe">Somente equipe</SelectItem>
                        </Select>
                      </div>
                    </FilterSection>

                    <FilterSection
                      icon={Calendar}
                      title="Data e período"
                      description="Filtre por data de upload dos documentos."
                    >
                      <div className="space-y-3">
                        <DateRangeInput
                          label="Data de upload"
                          startValue={filtros.dataUpload?.start ?? ""}
                          endValue={filtros.dataUpload?.end ?? ""}
                          visibleMonths={1}
                          onRangeChange={({ start, end }) => {
                            if (!start || !end) {
                              setFiltros((prev) => ({
                                ...prev,
                                dataUpload: { start: null, end: null },
                              }));
                              return;
                            }
                            setFiltros((prev) => ({
                              ...prev,
                              dataUpload: {
                                start,
                                end,
                              },
                            }));
                          }}
                        />
                      </div>
                    </FilterSection>

                    <FilterSection
                      icon={Files}
                      title="Tamanho do arquivo"
                      description="Filtre documentos por tamanho em KB."
                    >
                      <div className="space-y-3">
                        <Slider
                          label="Tamanho (KB)"
                          maxValue={512000}
                          minValue={0}
                          step={1024}
                          value={filtros.tamanhoKB}
                          onChange={(value) =>
                            setFiltros((prev) => ({
                              ...prev,
                              tamanhoKB: Array.isArray(value) ? value : [0, 512000],
                            }))
                          }
                        />
                        <div className="flex items-center justify-between text-xs text-default-500">
                          <span>{filtros.tamanhoKB[0]} KB</span>
                          <span>{filtros.tamanhoKB[1]} KB</span>
                        </div>
                      </div>
                    </FilterSection>
                  </div>

                  {/* Resumo dos Filtros Ativos */}
                  {hasActiveFilters && (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                      initial={{ opacity: 0, y: 10 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Filtros Aplicados
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {filtros.busca && (
                          <Chip color="primary" size="sm" variant="flat">
                            Busca: "{filtros.busca}"
                          </Chip>
                        )}
                        {filtros.origem !== "TODOS" && (
                          <Chip color="success" size="sm" variant="flat">
                            Origem: {filtros.origem}
                          </Chip>
                        )}
                        {filtros.visibilidade !== "TODOS" && (
                          <Chip color="warning" size="sm" variant="flat">
                            Visibilidade: {filtros.visibilidade}
                          </Chip>
                        )}
                        {filtros.dataUpload && (
                          <Chip color="secondary" size="sm" variant="flat">
                            Data: {filtros.dataUpload.start ? new Date(filtros.dataUpload.start).toLocaleDateString("pt-BR") : ""} - {filtros.dataUpload.end ? new Date(filtros.dataUpload.end).toLocaleDateString("pt-BR") : ""}
                          </Chip>
                        )}
                        {(filtros.tamanhoKB[0] !== 0 || filtros.tamanhoKB[1] !== 512000) && (
                          <Chip color="default" size="sm" variant="flat">
                            Tamanho: {filtros.tamanhoKB[0]} KB - {filtros.tamanhoKB[1]} KB
                          </Chip>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardBody>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="shadow-xl border-2 border-slate-200 dark:border-slate-700">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Clientes
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {filteredClientes.length} cliente(s) encontrado(s)
                  </p>
                </div>
              </div>
            </CardHeader>
            <Divider className="border-slate-200 dark:border-slate-700" />
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
                <AnimatePresence mode="popLayout">
                  {filteredClientes.map((cliente) => {
                    const isActive = cliente.id === selectedClienteId;

                    return (
                      <motion.button
                        key={cliente.id}
                        type="button"
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className={`group relative flex flex-col gap-1 overflow-hidden rounded-xl border-2 px-3 py-3 text-left transition min-h-[64px] ${isActive ? "border-primary/50 bg-primary/10 shadow-md" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/30 hover:shadow-lg"}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectCliente(cliente.id);
                        }}
                      >
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                          {cliente.nome}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {cliente.processos} processos
                        </span>
                        <span className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-slate-100/0 to-transparent opacity-0 transition group-hover:opacity-100" />
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="shadow-xl border-2 border-slate-200 dark:border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Processos
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {selectedCliente?.processos.length ?? 0} associados ao cliente
                      </p>
                    </div>
                  </div>
                  {selectedCliente && (
                    <Badge
                      color="primary"
                      content={selectedCliente.counts.arquivos}
                      size="lg"
                      variant="shadow"
                    >
                      <Target
                        className="text-emerald-600 dark:text-emerald-400"
                        size={20}
                      />
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Divider className="border-slate-200 dark:border-slate-700" />
              <CardBody className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                  {isLoadingCliente && selectedClienteId !== previousClienteId ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className="h-20 w-full rounded-xl"
                          isLoaded={false}
                        />
                      ))}
                    </div>
                  ) : selectedCliente?.processos.length ? (
                    selectedCliente.processos.map((processo) => {
                      const isActive = processo.id === selectedProcessoId;

                      return (
                        <motion.button
                          key={processo.id}
                          type="button"
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className={`flex flex-col gap-1 rounded-xl border-2 px-3 py-2 text-left transition min-h-[72px] ${isActive ? "border-primary/50 bg-primary/10 shadow-md" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/30 hover:shadow-lg"}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectProcesso(processo.id);
                          }}
                        >
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {processo.numero}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                            {processo.titulo || "Sem título"}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{processo.counts.arquivos} arquivos</span>
                            <span>•</span>
                            <span>{processo.status}</span>
                          </div>
                        </motion.button>
                      );
                    })
                  ) : (
                    <motion.div
                      key="no-processos"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center py-6 text-sm text-slate-400"
                    >
                      Nenhum processo vinculado
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="shadow-xl border-2 border-slate-200 dark:border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                      <Folder className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Explorador de arquivos
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {selectedProcesso
                          ? "Pastas do processo"
                          : "Documentos gerais do cliente"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                </div>
              </CardHeader>
              <Divider className="border-slate-200 dark:border-slate-700" />
              <CardBody className="space-y-4">
                {!selectedCliente ? (
                  <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                    Selecione um cliente para visualizar documentos
                  </div>
                ) : isLoadingCliente && selectedClienteId !== previousClienteId ? (
                  <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                    {/* Skeleton da árvore de pastas */}
                    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full rounded-lg" isLoaded={false} />
                        {Array.from({ length: 4 }).map((_, index) => (
                          <Skeleton
                            key={index}
                            className="h-8 w-full rounded-lg ml-4"
                            isLoaded={false}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Skeleton da área de arquivos */}
                    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                        <Skeleton className="h-6 w-32 rounded-lg" isLoaded={false} />
                        <Skeleton className="h-9 w-28 rounded-lg" isLoaded={false} />
                      </div>
                      <div className="mx-4 my-4 space-y-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <Skeleton
                            key={index}
                            className="h-16 w-full rounded-lg"
                            isLoaded={false}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : !tree ? (
                  <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                    Nenhuma estrutura encontrada
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                      <FolderTree
                        root={tree}
                        selectedPath={selectedFolderSegments}
                        onSelectFolder={handleSelectFolder}
                      />
                    </div>

                    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
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
                        className={`mx-4 my-4 flex min-h-[160px] flex-col gap-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-500 ${isUploading ? "opacity-60" : ""}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (isUploading) return;
                          handleUpload(event.dataTransfer.files);
                        }}
                      >
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                          <UploadCloud className="h-4 w-4" />
                          Arraste arquivos aqui ou clique em enviar
                        </div>
                        {filesInCurrentFolder.length ? (
                          <div className="space-y-2">
                            {filesInCurrentFolder.map((arquivo) => (
                              <div
                                key={`${arquivo.documentoId}-${arquivo.versaoId ?? "v1"}`}
                                className="flex items-center justify-between gap-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 hover:border-primary/30 hover:shadow-md transition-all"
                              >
                                <div className="flex flex-1 items-center gap-3">
                                  <FileText className="h-4 w-4 text-slate-400" />
                                  <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                      {arquivo.nome}
                                    </p>
                                    <p className="text-xs text-slate-500">
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
                          <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
                            Nenhum arquivo nesta pasta
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="shadow-lg border-2 border-slate-200 dark:border-slate-700">
          <CardBody className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Sparkles className="h-4 w-4 text-primary/80" />
              <span>
                Estrutura sincronizada em{" "}
                {data.generatedAt ? formatDate(data.generatedAt) : "--"}
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Cloudinary folder base:{" "}
              <code className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                magiclawyer/{data.tenantSlug}
              </code>
            </span>
          </CardBody>
        </Card>
      </motion.div>

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
    </div>
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
      <div key={node.id} className="ml-2 border-l border-slate-300 dark:border-slate-600 pl-3">
        {!isRoot && (
          <button
            className={`mb-1 flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-sm transition ${isActive ? "bg-primary/15 text-primary-100 border-2 border-primary/30" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-transparent"}`}
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
        className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition border-2 ${selectedPath.length === 0 ? "bg-primary/20 text-primary-100 border-primary/30" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent"}`}
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
                        <SelectItem key="__none" textValue="Sem causa específica">
                          Sem causa específica
                        </SelectItem>,
                        ...causas.map((causa) => (
                          <SelectItem
                            key={causa.id}
                            textValue={`${causa.nome}${causa.codigoCnj ? ` · ${causa.codigoCnj}` : ""}`}
                          >
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
