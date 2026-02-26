"use client";

import type { CnpjData } from "@/types/brazil";

import { memo, useCallback, useMemo, useState, type Key } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Textarea } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Badge } from "@heroui/badge";
import { Tooltip } from "@heroui/tooltip";
import { Skeleton } from "@heroui/skeleton";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  Users,
  Key,
  Copy,
  CheckCircle,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Filter,
  RotateCcw,
  XCircle,
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
  Info,
  Smartphone,
  Activity,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Modal as HeroUIModal,
  ModalContent,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
} from "@heroui/react";

import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { useClientesAdvogado, useAllClientes } from "@/app/hooks/use-clientes";
import { useAdvogadosParaSelect } from "@/app/hooks/use-advogados-select";
import { fadeInUp } from "@/components/ui/motion-presets";
import { ModalHeaderGradient } from "@/components/ui/modal-header-gradient";
import { ModalSectionCard } from "@/components/ui/modal-section-card";
import {
  createCliente,
  updateCliente,
  deleteCliente,
  resetarSenhaCliente,
  type Cliente,
  type ClienteCreateInput,
  type ClienteUpdateInput,
} from "@/app/actions/clientes";
import { TipoPessoa } from "@/generated/prisma";
import { Modal } from "@/components/ui/modal";
import { CpfInput } from "@/components/cpf-input";
import { CnpjInput } from "@/components/cnpj-input";
import { BulkExcelImportModal } from "@/components/bulk-excel-import-modal";
import { PeopleManagementNav } from "@/components/people-management-nav";
import {
  PeopleMetricCard,
  PeoplePageHeader,
} from "@/components/people-ui";

function formatDateToInput(value?: Date | string | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateFromInput(value: string) {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));

  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

const INITIAL_CLIENTE_FORM_STATE: ClienteCreateInput = {
  tipoPessoa: TipoPessoa.FISICA,
  nome: "",
  documento: "",
  email: "",
  telefone: "",
  celular: "",
  dataNascimento: undefined,
  inscricaoEstadual: "",
  observacoes: "",
  responsavelNome: "",
  responsavelEmail: "",
  responsavelTelefone: "",
  advogadosIds: undefined,
};

function getInitials(nome: string) {
  const names = nome.split(" ");

  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }

  return nome.substring(0, 2).toUpperCase();
}

interface ClientesListSectionProps {
  clientesFiltrados: Cliente[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  canCreateClient: boolean;
  onOpenCreateModal: () => void;
  onViewCliente: (cliente: Cliente) => void;
  onEditCliente: (cliente: Cliente) => void;
  onOpenResetModal: (cliente: Cliente) => void;
  onDeleteCliente: (clienteId: string) => void | Promise<void>;
}

const ClientesListSection = memo(function ClientesListSection({
  clientesFiltrados,
  isLoading,
  hasActiveFilters,
  canCreateClient,
  onOpenCreateModal,
  onViewCliente,
  onEditCliente,
  onOpenResetModal,
  onDeleteCliente,
}: ClientesListSectionProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  Carteira de Clientes
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {clientesFiltrados.length} cliente(s) encontrado(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                color="primary"
                content={clientesFiltrados.length}
                size="lg"
                variant="shadow"
              >
                <Target
                  className="text-indigo-600 dark:text-indigo-400"
                  size={20}
                />
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Users className="text-slate-400" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {hasActiveFilters
                  ? "Tente ajustar os filtros para encontrar clientes"
                  : "Comece adicionando seu primeiro cliente"}
              </p>
              {!hasActiveFilters && canCreateClient && (
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  color="primary"
                  startContent={<Plus size={20} />}
                  onPress={onOpenCreateModal}
                >
                  Adicionar Primeiro Cliente
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {clientesFiltrados.map((cliente, index) => (
                  <motion.div
                    key={cliente.id}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="group border border-white/10 bg-background/60 transition-all duration-300 hover:border-primary/40 hover:bg-background/80">
                      <CardHeader
                        className="cursor-pointer border-b border-white/10"
                        onClick={() => onViewCliente(cliente)}
                      >
                        <div className="flex gap-4 w-full">
                          <motion.div
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 10,
                            }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Avatar
                              showFallback
                              className="bg-blue-500 text-white shadow-lg"
                              icon={
                                cliente.tipoPessoa === TipoPessoa.JURIDICA ? (
                                  <Building2 className="text-white" />
                                ) : (
                                  <User className="text-white" />
                                )
                              }
                              name={getInitials(cliente.nome)}
                              size="lg"
                            />
                          </motion.div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {cliente.nome}
                              </h3>
                              {cliente.usuarioId && (
                                <Badge
                                  color="success"
                                  content="✓"
                                  size="sm"
                                  variant="shadow"
                                >
                                  <Chip
                                    className="font-semibold"
                                    color="success"
                                    size="sm"
                                    startContent={<Key className="h-3 w-3" />}
                                    variant="flat"
                                  >
                                    Acesso
                                  </Chip>
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Chip
                                color={
                                  cliente.tipoPessoa === TipoPessoa.FISICA
                                    ? "secondary"
                                    : "warning"
                                }
                                size="sm"
                                startContent={
                                  cliente.tipoPessoa === TipoPessoa.FISICA ? (
                                    <User className="h-3 w-3" />
                                  ) : (
                                    <Building2 className="h-3 w-3" />
                                  )
                                }
                                variant="flat"
                              >
                                {cliente.tipoPessoa === TipoPessoa.FISICA
                                  ? "Pessoa Física"
                                  : "Pessoa Jurídica"}
                              </Chip>
                            </div>
                          </div>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                className="hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 transition-all"
                                size="sm"
                                variant="light"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Ações do cliente">
                              <DropdownItem
                                key="view"
                                as={Link}
                                href={`/clientes/${cliente.id}`}
                                startContent={<Eye className="h-4 w-4" />}
                              >
                                Ver Detalhes
                              </DropdownItem>
                              <DropdownItem
                                key="edit"
                                startContent={<Edit className="h-4 w-4" />}
                                onPress={() => onEditCliente(cliente)}
                              >
                                Editar
                              </DropdownItem>
                              {cliente.usuarioId ? (
                                <DropdownItem
                                  key="reset-password"
                                  className="text-warning"
                                  color="warning"
                                  startContent={<KeyRound className="h-4 w-4" />}
                                  onPress={() => onOpenResetModal(cliente)}
                                >
                                  Resetar Senha
                                </DropdownItem>
                              ) : null}
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash2 className="h-4 w-4" />}
                                onPress={() => onDeleteCliente(cliente.id)}
                              >
                                Excluir
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </CardHeader>
                      <CardBody className="p-6 space-y-4">
                        <div className="space-y-3">
                          {cliente.documento && (
                            <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {cliente.documento}
                              </span>
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <Mail className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {cliente.email}
                              </span>
                            </div>
                          )}
                          {cliente.telefone && (
                            <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <Phone className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {cliente.telefone}
                              </span>
                            </div>
                          )}
                        </div>

                        <Divider className="my-4" />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Badge
                                color="primary"
                                content={cliente._count?.processos || 0}
                                size="sm"
                                variant="shadow"
                              >
                                <Chip
                                  className="font-semibold"
                                  color="primary"
                                  size="md"
                                  variant="flat"
                                >
                                  {cliente._count?.processos || 0} processo(s)
                                </Chip>
                              </Badge>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              as={Link}
                              className="flex-1 hover:scale-105 transition-transform"
                              color="primary"
                              href={`/clientes/${cliente.id}`}
                              size="sm"
                              startContent={<Eye className="h-4 w-4" />}
                              variant="flat"
                            >
                              Ver Detalhes
                            </Button>
                            <Button
                              as={Link}
                              className="hover:scale-105 transition-transform"
                              color="secondary"
                              href={`/clientes/${cliente.id}`}
                              size="sm"
                              startContent={<FileText className="h-4 w-4" />}
                              variant="flat"
                            >
                              Processos
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
});

export function ClientesContent() {
  const { permissions, isSuperAdmin, isAdmin } = useUserPermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipoPessoa, setSelectedTipoPessoa] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [criarUsuario, setCriarUsuario] = useState(true); // Criar usuário por padrão
  const [credenciaisModal, setCredenciaisModal] = useState<{
    email: string;
    senha: string;
  } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [clienteParaResetarSenha, setClienteParaResetarSenha] =
    useState<Cliente | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [clienteParaVisualizar, setClienteParaVisualizar] =
    useState<Cliente | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Buscar clientes (advogado ou admin)
  const {
    clientes: clientesAdvogado,
    isLoading: isLoadingAdvogado,
    mutate: mutateAdvogado,
  } = useClientesAdvogado();
  const {
    clientes: clientesAdmin,
    isLoading: isLoadingAdmin,
    mutate: mutateAdmin,
  } = useAllClientes();
  const { advogados, isLoading: isLoadingAdvogados } = useAdvogadosParaSelect();

  const canManageAllClients = isAdmin || isSuperAdmin;
  const clientes = canManageAllClients ? clientesAdmin : clientesAdvogado;
  const isLoading = canManageAllClients ? isLoadingAdmin : isLoadingAdvogado;
  const mutate = canManageAllClients ? mutateAdmin : mutateAdvogado;

  const [formState, setFormState] =
    useState<ClienteCreateInput>(INITIAL_CLIENTE_FORM_STATE);
  const advogadoIdSet = useMemo(
    () => new Set((advogados || []).map((advogado) => advogado.id)),
    [advogados],
  );
  const selectedAdvogadosKeys = useMemo(
    () =>
      (formState.advogadosIds || []).filter((id) => advogadoIdSet.has(id)),
    [advogadoIdSet, formState.advogadosIds],
  );

  // Filtrar clientes
  const clientesFiltrados = useMemo(
    () =>
      clientes?.filter((cliente) => {
        const search = searchTerm.toLowerCase();
        const matchSearch =
          !searchTerm ||
          cliente.nome?.toLowerCase().includes(search) ||
          cliente.email?.toLowerCase().includes(search) ||
          cliente.documento?.toLowerCase().includes(search);

        const matchTipoPessoa =
          selectedTipoPessoa === "all" ||
          cliente.tipoPessoa === selectedTipoPessoa;

        return matchSearch && matchTipoPessoa;
      }) || [],
    [clientes, searchTerm, selectedTipoPessoa],
  );

  // Calcular métricas
  const metrics = useMemo(() => {
    if (!clientes)
      return {
        total: 0,
        comAcesso: 0,
        fisica: 0,
        juridica: 0,
        comProcessos: 0,
      };

    const total = clientes.length;
    const comAcesso = clientes.filter((c) => c.usuarioId).length;
    const fisica = clientes.filter(
      (c) => c.tipoPessoa === TipoPessoa.FISICA,
    ).length;
    const juridica = clientes.filter(
      (c) => c.tipoPessoa === TipoPessoa.JURIDICA,
    ).length;
    const comProcessos = clientes.filter(
      (c) => (c._count?.processos || 0) > 0,
    ).length;

    return { total, comAcesso, fisica, juridica, comProcessos };
  }, [clientes]);

  // Verificar se há filtros ativos
  const hasActiveFilters =
    searchTerm.trim().length > 0 || selectedTipoPessoa !== "all";
  const taxaAcesso = metrics.total
    ? Math.round((metrics.comAcesso / metrics.total) * 100)
    : 0;
  const taxaEngajamento = metrics.total
    ? Math.round((metrics.comProcessos / metrics.total) * 100)
    : 0;

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedTipoPessoa("all");
    setShowFilters(false);
  }, []);

  const handleDeleteCliente = useCallback(async (clienteId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const result = await deleteCliente(clienteId);

      if (result.success) {
        toast.success("Cliente excluído com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir cliente");
      }
    } catch (error) {
      toast.error("Erro ao excluir cliente");
    }
  }, [mutate]);

  const handleCreateCliente = async () => {
    if (!formState.nome) {
      toast.error("Nome é obrigatório");

      return;
    }

    if (criarUsuario && !formState.email) {
      toast.error("Email é obrigatório para criar usuário de acesso");

      return;
    }

    setIsSaving(true);
    try {
      const payload: ClienteCreateInput = {
        ...formState,
        criarUsuario,
        dataNascimento: formState.dataNascimento || undefined,
        inscricaoEstadual: formState.inscricaoEstadual || undefined,
        advogadosIds:
          canManageAllClients && (formState.advogadosIds || []).length > 0
            ? formState.advogadosIds
            : undefined,
      };

      const result = await createCliente(payload);

      if (result.success) {
        toast.success("Cliente criado com sucesso!");
        setIsCreateModalOpen(false);
        setFormState(INITIAL_CLIENTE_FORM_STATE);
        setCriarUsuario(true);
        mutate();

        // Se criou usuário, mostrar credenciais
        if (result.usuario) {
          setCredenciaisModal(result.usuario);
        }
      } else {
        toast.error(result.error || "Erro ao criar cliente");
      }
    } catch (error) {
      toast.error("Erro ao criar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCliente = async () => {
    if (!selectedCliente?.id) return;

    if (!formState.nome) {
      toast.error("Nome é obrigatório");

      return;
    }

    setIsSaving(true);
    try {
      const updateData: ClienteUpdateInput = {
        nome: formState.nome,
        tipoPessoa: formState.tipoPessoa,
        documento: formState.documento,
        email: formState.email,
        telefone: formState.telefone,
        celular: formState.celular,
        dataNascimento: formState.dataNascimento || undefined,
        inscricaoEstadual: formState.inscricaoEstadual || undefined,
        observacoes: formState.observacoes,
        responsavelNome: formState.responsavelNome,
        responsavelEmail: formState.responsavelEmail,
        responsavelTelefone: formState.responsavelTelefone,
        advogadosIds:
          canManageAllClients ? formState.advogadosIds || [] : undefined,
      };

      const result = await updateCliente(selectedCliente.id, updateData);

      if (result.success) {
        toast.success("Cliente atualizado com sucesso!");
        setIsEditModalOpen(false);
        setSelectedCliente(null);
        setFormState(INITIAL_CLIENTE_FORM_STATE);
        mutate();
      } else {
        toast.error(result.error || "Erro ao atualizar cliente");
      }
    } catch (error) {
      toast.error("Erro ao atualizar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCliente = useCallback((cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormState({
      nome: cliente.nome,
      tipoPessoa: cliente.tipoPessoa,
      documento: cliente.documento || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      celular: cliente.celular || "",
      dataNascimento: cliente.dataNascimento
        ? new Date(cliente.dataNascimento)
        : undefined,
      inscricaoEstadual: cliente.inscricaoEstadual || "",
      observacoes: cliente.observacoes || "",
      responsavelNome: cliente.responsavelNome || "",
      responsavelEmail: cliente.responsavelEmail || "",
      responsavelTelefone: cliente.responsavelTelefone || "",
      advogadosIds: (cliente.advogadoClientes || []).map(
        (vinculo) => vinculo.advogadoId,
      ),
    });
    setIsEditModalOpen(true);
  }, []);

  const handleViewCliente = useCallback((cliente: Cliente) => {
    setClienteParaVisualizar(cliente);
    setIsViewModalOpen(true);
  }, []);

  const handleCnpjFound = useCallback((cnpjData: CnpjData) => {
    setFormState((prev) => ({
      ...prev,
      nome: cnpjData.razao_social || prev.nome,
      documento: cnpjData.cnpj,
    }));
    toast.success("Dados do CNPJ carregados!");
  }, []);

  const handleAdvogadosSelectionChange = useCallback((keys: "all" | Set<Key>) => {
    if (keys === "all") {
      const allAdvogados = (advogados || []).map((advogado) => advogado.id);

      setFormState((prev) => ({
        ...prev,
        advogadosIds: allAdvogados.length > 0 ? allAdvogados : undefined,
      }));

      return;
    }

    const selected = Array.from(keys)
      .filter((key): key is string => typeof key === "string")
      .filter((id) => advogadoIdSet.has(id));

    setFormState((prev) => ({
      ...prev,
      advogadosIds: selected.length > 0 ? selected : [],
    }));
  }, [advogadoIdSet, advogados]);

  const handleOpenResetModal = useCallback((cliente: Cliente) => {
    if (!cliente.usuarioId) {
      toast.error("Este cliente não possui usuário de acesso");

      return;
    }
    setClienteParaResetarSenha(cliente);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setFormState(INITIAL_CLIENTE_FORM_STATE);
    setCriarUsuario(true);
    setIsCreateModalOpen(true);
  }, []);

  const applyTipoPessoaChange = useCallback((selectedTipo: TipoPessoa) => {
    setFormState((prev) => ({
      ...prev,
      tipoPessoa: selectedTipo,
      inscricaoEstadual:
        selectedTipo === TipoPessoa.JURIDICA ? prev.inscricaoEstadual : "",
      responsavelNome:
        selectedTipo === TipoPessoa.JURIDICA ? prev.responsavelNome : "",
      responsavelEmail:
        selectedTipo === TipoPessoa.JURIDICA ? prev.responsavelEmail : "",
      responsavelTelefone:
        selectedTipo === TipoPessoa.JURIDICA ? prev.responsavelTelefone : "",
    }));
  }, []);

  const handleTipoPessoaSelectionChange = useCallback(
    (keys: unknown) => {
      if (keys === "all" || keys == null) {
        return;
      }

      let selectedTipo: TipoPessoa | undefined;

      if (typeof keys === "string") {
        if (keys === TipoPessoa.FISICA || keys === TipoPessoa.JURIDICA) {
          selectedTipo = keys;
        }
      } else if (keys instanceof Set) {
        selectedTipo = Array.from(keys).find(
          (key): key is TipoPessoa =>
            key === TipoPessoa.FISICA || key === TipoPessoa.JURIDICA,
        );
      } else if (
        typeof keys === "object" &&
        keys !== null &&
        Symbol.iterator in keys
      ) {
        selectedTipo = Array.from(keys as Iterable<Key>).find(
          (key): key is TipoPessoa =>
            key === TipoPessoa.FISICA || key === TipoPessoa.JURIDICA,
        );
      } else if (
        typeof keys === "object" &&
        keys !== null &&
        "currentKey" in keys
      ) {
        const currentKey = (keys as { currentKey?: Key | null }).currentKey;
        if (
          currentKey === TipoPessoa.FISICA ||
          currentKey === TipoPessoa.JURIDICA
        ) {
          selectedTipo = currentKey;
        }
      }

      if (!selectedTipo) {
        return;
      }

      applyTipoPessoaChange(selectedTipo);
    },
    [applyTipoPessoaChange],
  );

  const handleConfirmResetarSenha = async () => {
    if (!clienteParaResetarSenha) return;

    setIsResettingPassword(true);
    try {
      const result = await resetarSenhaCliente(clienteParaResetarSenha.id);

      if (result.success && result.usuario) {
        toast.success("Senha resetada com sucesso!");
        setClienteParaResetarSenha(null);
        setCredenciaisModal(result.usuario);
      } else {
        toast.error(result.error || "Erro ao resetar senha");
      }
    } catch (error) {
      toast.error("Erro ao resetar senha");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const tipoPessoaOptions = [
    { key: "all", label: "Todos" },
    { key: TipoPessoa.FISICA, label: "Pessoa Física" },
    { key: TipoPessoa.JURIDICA, label: "Pessoa Jurídica" },
  ];

  const clienteImportFields = [
    {
      label: "nomeCompleto",
      description: "Nome civil/social exatamente como no cadastro oficial.",
    },
    {
      label: "email",
      description: "Usado para login e notificações automáticas.",
    },
    {
      label: "telefone",
      description: "Aceita DDD + número (com ou sem máscara).",
    },
    {
      label: "tipoPessoa",
      description: "Informe FISICA ou JURIDICA.",
    },
    {
      label: "documento",
      description: "CPF/CNPJ somente números para validação.",
    },
    {
      label: "dataNascimento",
      description: "Formato AAAA-MM-DD (opcional para PJ).",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <PeopleManagementNav active="clientes" />

      <motion.div animate="visible" initial="hidden" variants={fadeInUp}>
        <PeoplePageHeader
          description="Centralize cadastro, relacionamento e acesso dos clientes com o mesmo padrão visual usado em todo o módulo."
          title="Clientes"
          actions={
            permissions.canViewAllClients ? (
              <>
                <Button
                  color="primary"
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={handleOpenCreateModal}
                >
                  Novo cliente
                </Button>
                <Button
                  startContent={<UploadCloud className="h-4 w-4" />}
                  variant="bordered"
                  onPress={() => setIsImportModalOpen(true)}
                >
                  Importar Excel
                </Button>
              </>
            ) : undefined
          }
        />
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={`clientes-metric-skeleton-${index}`} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PeopleMetricCard
            helper="Carteira cadastrada"
            icon={<Users className="h-4 w-4" />}
            label="Total de clientes"
            tone="primary"
            value={metrics.total}
          />
          <PeopleMetricCard
            helper={`${taxaAcesso}% com acesso`}
            icon={<Key className="h-4 w-4" />}
            label="Clientes com login"
            tone="success"
            value={metrics.comAcesso}
          />
          <PeopleMetricCard
            helper="Pessoa fisica"
            icon={<User className="h-4 w-4" />}
            label="Clientes PF"
            tone="secondary"
            value={metrics.fisica}
          />
          <PeopleMetricCard
            helper="Pessoa juridica"
            icon={<Building2 className="h-4 w-4" />}
            label="Clientes PJ"
            tone="warning"
            value={metrics.juridica}
          />
          <PeopleMetricCard
            helper="Clientes com processo"
            icon={<FileText className="h-4 w-4" />}
            label="Com processos"
            tone="primary"
            value={metrics.comProcessos}
          />
          <PeopleMetricCard
            helper="Conversao da base"
            icon={<TrendingUp className="h-4 w-4" />}
            label="Taxa de acesso"
            tone="success"
            value={`${taxaAcesso}%`}
          />
          <PeopleMetricCard
            helper="Engajamento da carteira"
            icon={<Activity className="h-4 w-4" />}
            label="Taxa de engajamento"
            tone="secondary"
            value={`${taxaEngajamento}%`}
          />
          <PeopleMetricCard
            helper="Acoes comerciais"
            icon={<BarChart3 className="h-4 w-4" />}
            label="Status da carteira"
            tone="default"
            value={metrics.total > 0 ? "Ativa" : "Vazia"}
          />
        </div>
      )}

      {/* Filtros Avançados Melhorados */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Filtros operacionais
                  </h3>
                  <p className="text-sm text-default-400">
                    Refine rapidamente a carteira ativa.
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
                        [searchTerm, selectedTipoPessoa !== "all"].filter(
                          Boolean,
                        ).length
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
                          [searchTerm, selectedTipoPessoa !== "all"].filter(
                            Boolean,
                          ).length
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Filtro por Busca */}
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-3"
                      initial={{ opacity: 0, x: -20 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label
                        className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300"
                        htmlFor="filtro-busca"
                      >
                        <Search className="w-4 h-4 text-blue-500" />
                        Busca Inteligente
                      </label>
                      <Input
                        classNames={{
                          input: "text-slate-700 dark:text-slate-300",
                          inputWrapper:
                            "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500",
                        }}
                        id="filtro-busca"
                        placeholder="Nome, email, documento..."
                        size="md"
                        startContent={
                          <Search className="w-4 h-4 text-default-400" />
                        }
                        value={searchTerm}
                        variant="bordered"
                        onValueChange={setSearchTerm}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Busca em nomes, emails e documentos
                      </p>
                    </motion.div>

                    {/* Filtro por Tipo */}
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-3"
                      initial={{ opacity: 0, x: -20 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label
                        className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300"
                        htmlFor="filtro-tipo"
                      >
                        <Users className="w-4 h-4 text-green-500" />
                        Tipo de Pessoa
                      </label>
                      <Select
                        classNames={{
                          trigger:
                            "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500",
                        }}
                        id="filtro-tipo"
                        placeholder="Selecione o tipo"
                        selectedKeys={[selectedTipoPessoa]}
                        size="md"
                        variant="bordered"
                        onChange={(e) => setSelectedTipoPessoa(e.target.value)}
                      >
                        {tipoPessoaOptions.map((option) => (
                          <SelectItem key={option.key} textValue={option.label}>
                            <div className="flex items-center gap-2">
                              {option.key === "all" && (
                                <Users className="w-4 h-4" />
                              )}
                              {option.key === TipoPessoa.FISICA && (
                                <User className="w-4 h-4" />
                              )}
                              {option.key === TipoPessoa.JURIDICA && (
                                <Building2 className="w-4 h-4" />
                              )}
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Filtre por tipo de pessoa
                      </p>
                    </motion.div>
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
                        {searchTerm && (
                          <Chip color="primary" size="sm" variant="flat">
                            Busca: "{searchTerm}"
                          </Chip>
                        )}
                        {selectedTipoPessoa !== "all" && (
                          <Chip color="success" size="sm" variant="flat">
                            Tipo:{" "}
                            {
                              tipoPessoaOptions.find(
                                (opt) => opt.key === selectedTipoPessoa,
                              )?.label
                            }
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

      <ClientesListSection
        canCreateClient={permissions.canViewAllClients}
        clientesFiltrados={clientesFiltrados}
        hasActiveFilters={hasActiveFilters}
        isLoading={isLoading}
        onDeleteCliente={handleDeleteCliente}
        onEditCliente={handleEditCliente}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenResetModal={handleOpenResetModal}
        onViewCliente={handleViewCliente}
      />

      {/* Modal Criar Cliente */}
      <HeroUIModal
        isOpen={isCreateModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onOpenChange={setIsCreateModalOpen}
      >
        <ModalContent>
          <ModalHeaderGradient
            description="Complete as informações para cadastrar um novo cliente"
            icon={Building2}
            title="Novo Cliente"
          />
          <ModalBody className="px-0">
            <Tabs
              aria-label="Formulário do cliente"
              classNames={{
                tabList:
                  "gap-6 w-full relative rounded-none px-6 pt-6 pb-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent:
                  "group-data-[selected=true]:text-primary font-medium text-sm tracking-wide",
                panel: "px-6 pb-6 pt-4",
              }}
              color="primary"
              variant="underlined"
            >
              <Tab
                key="dados-gerais"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                      <User className="text-blue-600 dark:text-blue-300 w-4 h-4" />
                    </div>
                    <span>Dados Gerais</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard
                    description="Informações básicas do cliente"
                    title="Identificação"
                  >
                    <div className="space-y-4">
                      <Select
                        label="Tipo de Pessoa"
                        placeholder="Selecione"
                        selectedKeys={new Set([formState.tipoPessoa])}
                        onChange={(e) => {
                          const nextTipo = e.target.value;
                          if (
                            nextTipo === TipoPessoa.FISICA ||
                            nextTipo === TipoPessoa.JURIDICA
                          ) {
                            applyTipoPessoaChange(nextTipo);
                          }
                        }}
                        onSelectionChange={handleTipoPessoaSelectionChange}
                      >
                        <SelectItem key={TipoPessoa.FISICA} textValue="Pessoa Física">
                          Pessoa Física
                        </SelectItem>
                        <SelectItem key={TipoPessoa.JURIDICA} textValue="Pessoa Jurídica">
                          Pessoa Jurídica
                        </SelectItem>
                      </Select>

                      <Input
                        isRequired
                        label={
                          formState.tipoPessoa === TipoPessoa.FISICA
                            ? "Nome Completo"
                            : "Razão Social"
                        }
                        placeholder={
                          formState.tipoPessoa === TipoPessoa.FISICA
                            ? "Nome completo"
                            : "Razão Social"
                        }
                        startContent={
                          formState.tipoPessoa === TipoPessoa.FISICA ? (
                            <User className="h-4 w-4 text-default-400" />
                          ) : (
                            <Building2 className="h-4 w-4 text-default-400" />
                          )
                        }
                        value={formState.nome}
                        onValueChange={(value) =>
                          setFormState({ ...formState, nome: value })
                        }
                      />

                      {formState.tipoPessoa === TipoPessoa.FISICA ? (
                        <CpfInput
                          value={formState.documento}
                          onChange={(value) =>
                            setFormState({ ...formState, documento: value })
                          }
                        />
                      ) : (
                        <CnpjInput
                          value={formState.documento}
                          onChange={(value) =>
                            setFormState({ ...formState, documento: value })
                          }
                          onCnpjFound={handleCnpjFound}
                        />
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label="Data de Nascimento"
                          type="date"
                          value={formatDateToInput(formState.dataNascimento)}
                          onValueChange={(value) =>
                            setFormState({
                              ...formState,
                              dataNascimento: parseDateFromInput(value),
                            })
                          }
                        />
                        {formState.tipoPessoa === TipoPessoa.JURIDICA ? (
                          <Input
                            label="Inscrição Estadual"
                            placeholder="Informe a inscrição estadual"
                            value={formState.inscricaoEstadual}
                            onValueChange={(value) =>
                              setFormState({
                                ...formState,
                                inscricaoEstadual: value,
                              })
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  </ModalSectionCard>

                  {(isAdmin || isSuperAdmin) && (
                    <ModalSectionCard
                      description="Defina quais advogados terão gestão direta deste cliente."
                      title="Vínculo de Advogados"
                    >
                      <Select
                        className="w-full"
                        isLoading={isLoadingAdvogados}
                        label="Advogados vinculados"
                        placeholder="Selecione um ou mais advogados"
                        selectedKeys={selectedAdvogadosKeys}
                        selectionMode="multiple"
                        onSelectionChange={handleAdvogadosSelectionChange}
                      >
                        {(advogados || []).map((advogado) => (
                          <SelectItem
                            key={advogado.id}
                            textValue={`${advogado.label} ${advogado.oab || ""}`.trim()}
                          >
                            {advogado.label}
                            {advogado.oab ? ` (${advogado.oab})` : ""}
                          </SelectItem>
                        ))}
                      </Select>
                    </ModalSectionCard>
                  )}
                </div>
              </Tab>

              <Tab
                key="contato"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-green-100 dark:bg-green-900">
                      <Phone className="text-green-600 dark:text-green-300 w-4 h-4" />
                    </div>
                    <span>Contato</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard
                    description="Telefones e email do cliente"
                    title="Informações de Contato"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          description={
                            criarUsuario
                              ? "Obrigatório para criar usuário"
                              : undefined
                          }
                          isRequired={criarUsuario}
                          label="Email"
                          placeholder="email@exemplo.com"
                          startContent={
                            <Mail className="h-4 w-4 text-default-400" />
                          }
                          type="email"
                          value={formState.email}
                          onValueChange={(value) =>
                            setFormState({ ...formState, email: value })
                          }
                        />
                        <Input
                          label="Telefone"
                          placeholder="(00) 0000-0000"
                          startContent={
                            <Phone className="h-4 w-4 text-default-400" />
                          }
                          value={formState.telefone}
                          onValueChange={(value) =>
                            setFormState({ ...formState, telefone: value })
                          }
                        />
                      </div>

                      <Input
                        label="Celular/WhatsApp"
                        placeholder="(00) 00000-0000"
                        startContent={
                          <Phone className="h-4 w-4 text-default-400" />
                        }
                        value={formState.celular}
                        onValueChange={(value) =>
                          setFormState({ ...formState, celular: value })
                        }
                      />
                    </div>
                  </ModalSectionCard>

                  {formState.tipoPessoa === TipoPessoa.JURIDICA && (
                    <ModalSectionCard
                      description="Dados do responsável legal"
                      title="Responsável pela Empresa"
                    >
                      <div className="space-y-4">
                        <Input
                          label="Nome do Responsável"
                          placeholder="Nome completo"
                          startContent={
                            <User className="h-4 w-4 text-default-400" />
                          }
                          value={formState.responsavelNome}
                          onValueChange={(value) =>
                            setFormState({
                              ...formState,
                              responsavelNome: value,
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Email do Responsável"
                            placeholder="email@exemplo.com"
                            startContent={
                              <Mail className="h-4 w-4 text-default-400" />
                            }
                            type="email"
                            value={formState.responsavelEmail}
                            onValueChange={(value) =>
                              setFormState({
                                ...formState,
                                responsavelEmail: value,
                              })
                            }
                          />
                          <Input
                            label="Telefone do Responsável"
                            placeholder="(00) 00000-0000"
                            startContent={
                              <Phone className="h-4 w-4 text-default-400" />
                            }
                            value={formState.responsavelTelefone}
                            onValueChange={(value) =>
                              setFormState({
                                ...formState,
                                responsavelTelefone: value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </ModalSectionCard>
                  )}
                </div>
              </Tab>

              <Tab
                key="acesso"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900">
                      <Key className="text-purple-600 dark:text-purple-300 w-4 h-4" />
                    </div>
                    <span>Acesso</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard
                    description="Configure se o cliente terá acesso ao sistema"
                    title="Usuário de Acesso"
                  >
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                      <Checkbox
                        isSelected={criarUsuario}
                        onValueChange={setCriarUsuario}
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            Criar usuário de acesso ao sistema
                          </p>
                          <p className="text-xs text-default-500 mt-1">
                            {criarUsuario
                              ? "Um usuário será criado automaticamente com email e senha aleatória"
                              : "O cliente não terá acesso ao sistema"}
                          </p>
                        </div>
                      </Checkbox>
                    </div>
                  </ModalSectionCard>
                </div>
              </Tab>

              <Tab
                key="observacoes"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900">
                      <FileText className="text-amber-600 dark:text-amber-300 w-4 h-4" />
                    </div>
                    <span>Observações</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard
                    description="Anotações e observações sobre o cliente"
                    title="Informações Adicionais"
                  >
                    <Textarea
                      label="Observações"
                      minRows={4}
                      placeholder="Informações adicionais sobre o cliente..."
                      value={formState.observacoes}
                      onValueChange={(value) =>
                        setFormState({ ...formState, observacoes: value })
                      }
                    />
                  </ModalSectionCard>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={isSaving}
              onPress={handleCreateCliente}
            >
              Criar Cliente
            </Button>
          </ModalFooter>
        </ModalContent>
      </HeroUIModal>

      {/* Modal Editar Cliente */}
      <HeroUIModal
        isOpen={isEditModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onOpenChange={setIsEditModalOpen}
      >
        <ModalContent>
          <ModalHeaderGradient
            description="Atualize as informações do cliente"
            icon={Edit}
            title="Editar Cliente"
          />
          <ModalBody className="px-0">
            <Tabs
              aria-label="Formulário de edição do cliente"
              classNames={{
                tabList:
                  "gap-6 w-full relative rounded-none px-6 pt-6 pb-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent:
                  "group-data-[selected=true]:text-primary font-medium text-sm tracking-wide",
                panel: "px-6 pb-6 pt-4",
              }}
              color="primary"
              variant="underlined"
            >
              <Tab
                key="dados-gerais"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                      <User className="text-blue-600 dark:text-blue-300 w-4 h-4" />
                    </div>
                    <span>Dados Gerais</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard
                    description="Informações básicas do cliente"
                    title="Identificação"
                  >
                    <div className="space-y-4">
                      <Select
                        label="Tipo de Pessoa"
                        placeholder="Selecione"
                        selectedKeys={new Set([formState.tipoPessoa])}
                        onChange={(e) => {
                          const nextTipo = e.target.value;
                          if (
                            nextTipo === TipoPessoa.FISICA ||
                            nextTipo === TipoPessoa.JURIDICA
                          ) {
                            applyTipoPessoaChange(nextTipo);
                          }
                        }}
                        onSelectionChange={handleTipoPessoaSelectionChange}
                      >
                        <SelectItem key={TipoPessoa.FISICA} textValue="Pessoa Física">
                          Pessoa Física
                        </SelectItem>
                        <SelectItem key={TipoPessoa.JURIDICA} textValue="Pessoa Jurídica">
                          Pessoa Jurídica
                        </SelectItem>
                      </Select>

                      <Input
                        isRequired
                        label={
                          formState.tipoPessoa === TipoPessoa.FISICA
                            ? "Nome Completo"
                            : "Razão Social"
                        }
                        placeholder={
                          formState.tipoPessoa === TipoPessoa.FISICA
                            ? "Nome completo"
                            : "Razão Social"
                        }
                        startContent={
                          formState.tipoPessoa === TipoPessoa.FISICA ? (
                            <User className="h-4 w-4 text-default-400" />
                          ) : (
                            <Building2 className="h-4 w-4 text-default-400" />
                          )
                        }
                        value={formState.nome}
                        onValueChange={(value) =>
                          setFormState({ ...formState, nome: value })
                        }
                      />

                      {formState.tipoPessoa === TipoPessoa.FISICA ? (
                        <CpfInput
                          value={formState.documento}
                          onChange={(value) =>
                            setFormState({ ...formState, documento: value })
                          }
                        />
                      ) : (
                        <CnpjInput
                          value={formState.documento}
                          onChange={(value) =>
                            setFormState({ ...formState, documento: value })
                          }
                          onCnpjFound={handleCnpjFound}
                        />
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label="Data de Nascimento"
                          type="date"
                          value={formatDateToInput(formState.dataNascimento)}
                          onValueChange={(value) =>
                            setFormState({
                              ...formState,
                              dataNascimento: parseDateFromInput(value),
                            })
                          }
                        />
                        {formState.tipoPessoa === TipoPessoa.JURIDICA ? (
                          <Input
                            label="Inscrição Estadual"
                            placeholder="Informe a inscrição estadual"
                            value={formState.inscricaoEstadual}
                            onValueChange={(value) =>
                              setFormState({
                                ...formState,
                                inscricaoEstadual: value,
                              })
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  </ModalSectionCard>

                  {(isAdmin || isSuperAdmin) && (
                    <ModalSectionCard
                      description="Ajuste os advogados responsáveis por este cliente."
                      title="Vínculo de Advogados"
                    >
                      <Select
                        className="w-full"
                        isLoading={isLoadingAdvogados}
                        label="Advogados vinculados"
                        placeholder="Selecione um ou mais advogados"
                        selectedKeys={selectedAdvogadosKeys}
                        selectionMode="multiple"
                        onSelectionChange={handleAdvogadosSelectionChange}
                      >
                        {(advogados || []).map((advogado) => (
                          <SelectItem
                            key={advogado.id}
                            textValue={`${advogado.label} ${advogado.oab || ""}`.trim()}
                          >
                            {advogado.label}
                            {advogado.oab ? ` (${advogado.oab})` : ""}
                          </SelectItem>
                        ))}
                      </Select>
                    </ModalSectionCard>
                  )}
                </div>
              </Tab>

              <Tab
                key="contato"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-green-100 dark:bg-green-900">
                      <Phone className="text-green-600 dark:text-green-300 w-4 h-4" />
                    </div>
                    <span>Contato</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard
                    description="Telefones e email do cliente"
                    title="Informações de Contato"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Email"
                          placeholder="email@exemplo.com"
                          startContent={
                            <Mail className="h-4 w-4 text-default-400" />
                          }
                          type="email"
                          value={formState.email}
                          onValueChange={(value) =>
                            setFormState({ ...formState, email: value })
                          }
                        />
                        <Input
                          label="Telefone"
                          placeholder="(00) 0000-0000"
                          startContent={
                            <Phone className="h-4 w-4 text-default-400" />
                          }
                          value={formState.telefone}
                          onValueChange={(value) =>
                            setFormState({ ...formState, telefone: value })
                          }
                        />
                      </div>

                      <Input
                        label="Celular/WhatsApp"
                        placeholder="(00) 00000-0000"
                        startContent={
                          <Phone className="h-4 w-4 text-default-400" />
                        }
                        value={formState.celular}
                        onValueChange={(value) =>
                          setFormState({ ...formState, celular: value })
                        }
                      />
                    </div>
                  </ModalSectionCard>

                  {formState.tipoPessoa === TipoPessoa.JURIDICA && (
                    <ModalSectionCard
                      description="Dados do responsável legal"
                      title="Responsável pela Empresa"
                    >
                      <div className="space-y-4">
                        <Input
                          label="Nome do Responsável"
                          placeholder="Nome completo"
                          startContent={
                            <User className="h-4 w-4 text-default-400" />
                          }
                          value={formState.responsavelNome}
                          onValueChange={(value) =>
                            setFormState({
                              ...formState,
                              responsavelNome: value,
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Email do Responsável"
                            placeholder="email@exemplo.com"
                            startContent={
                              <Mail className="h-4 w-4 text-default-400" />
                            }
                            type="email"
                            value={formState.responsavelEmail}
                            onValueChange={(value) =>
                              setFormState({
                                ...formState,
                                responsavelEmail: value,
                              })
                            }
                          />
                          <Input
                            label="Telefone do Responsável"
                            placeholder="(00) 00000-0000"
                            startContent={
                              <Phone className="h-4 w-4 text-default-400" />
                            }
                            value={formState.responsavelTelefone}
                            onValueChange={(value) =>
                              setFormState({
                                ...formState,
                                responsavelTelefone: value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </ModalSectionCard>
                  )}
                </div>
              </Tab>

              <Tab
                key="observacoes"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900">
                      <FileText className="text-amber-600 dark:text-amber-300 w-4 h-4" />
                    </div>
                    <span>Observações</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard
                    description="Anotações e observações sobre o cliente"
                    title="Informações Adicionais"
                  >
                    <Textarea
                      label="Observações"
                      minRows={4}
                      placeholder="Informações adicionais sobre o cliente..."
                      value={formState.observacoes}
                      onValueChange={(value) =>
                        setFormState({ ...formState, observacoes: value })
                      }
                    />
                  </ModalSectionCard>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={isSaving}
              onPress={handleUpdateCliente}
            >
              Salvar Alterações
            </Button>
          </ModalFooter>
        </ModalContent>
      </HeroUIModal>

      {/* Modal de Credenciais */}
      <Modal
        footer={
          <div className="flex justify-end">
            <Button
              color="primary"
              startContent={<CheckCircle className="h-4 w-4" />}
              onPress={() => setCredenciaisModal(null)}
            >
              Entendi
            </Button>
          </div>
        }
        isOpen={!!credenciaisModal}
        size="lg"
        title={
          credenciaisModal
            ? credenciaisModal.senha.length > 0
              ? "🔑 Credenciais de Acesso"
              : "✅ Cliente criado com sucesso!"
            : ""
        }
        onOpenChange={() => setCredenciaisModal(null)}
      >
        {credenciaisModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-success/10 border border-success/20 p-4">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-success">
                    Usuário de acesso criado
                  </p>
                  <p className="text-xs text-default-600 mt-1">
                    As credenciais abaixo foram geradas automaticamente. Anote
                    ou envie para o cliente.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border border-default-200">
              <CardBody className="gap-3">
                <div>
                  <p className="text-xs text-default-400 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      classNames={{
                        input: "font-mono",
                      }}
                      value={credenciaisModal.email}
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        navigator.clipboard.writeText(credenciaisModal.email);
                        toast.success("Email copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-default-400 mb-1">
                    Senha (temporária)
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      classNames={{
                        input: "font-mono",
                      }}
                      value={credenciaisModal.senha}
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        navigator.clipboard.writeText(credenciaisModal.senha);
                        toast.success("Senha copiada!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <p className="text-xs text-warning-600">
                ⚠️ Esta senha será exibida apenas uma vez. Certifique-se de
                anotar ou enviar para o cliente.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmação de Reset de Senha */}
      <Modal
        footer={
          <div className="flex gap-2">
            <Button
              variant="light"
              onPress={() => setClienteParaResetarSenha(null)}
            >
              Cancelar
            </Button>
            <Button
              color="warning"
              isLoading={isResettingPassword}
              startContent={
                !isResettingPassword ? (
                  <RefreshCw className="h-4 w-4" />
                ) : undefined
              }
              onPress={handleConfirmResetarSenha}
            >
              Resetar Senha
            </Button>
          </div>
        }
        isOpen={!!clienteParaResetarSenha}
        size="md"
        title="⚠️ Resetar Senha do Cliente"
        onOpenChange={() => setClienteParaResetarSenha(null)}
      >
        {clienteParaResetarSenha && (
          <div className="space-y-4">
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-warning">Atenção</p>
                  <p className="text-xs text-default-600 mt-1">
                    Esta ação irá gerar uma nova senha aleatória para o cliente.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border border-default-200 bg-default-50">
              <CardBody className="gap-2">
                <div className="flex items-center gap-2">
                  {clienteParaResetarSenha.tipoPessoa ===
                  TipoPessoa.JURIDICA ? (
                    <Building2 className="h-5 w-5 text-default-400" />
                  ) : (
                    <User className="h-5 w-5 text-default-400" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {clienteParaResetarSenha.nome}
                    </p>
                    <p className="text-xs text-default-400">
                      {clienteParaResetarSenha.email}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-xs text-primary-600">
                💡 Uma nova senha será gerada e exibida na próxima tela.
                Certifique-se de anotar e enviar para o cliente.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Visualização do Cliente */}
      <HeroUIModal
        isOpen={isViewModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onOpenChange={setIsViewModalOpen}
      >
        {clienteParaVisualizar && (
          <ModalContent>
            <ModalHeaderGradient
              description="Detalhes completos do cliente"
              icon={
                clienteParaVisualizar.tipoPessoa === TipoPessoa.JURIDICA
                  ? Building2
                  : User
              }
              title={clienteParaVisualizar.nome}
            />
            <ModalBody className="px-0">
              <Tabs
                aria-label="Detalhes do cliente"
                classNames={{
                  tabList:
                    "gap-6 w-full relative rounded-none px-6 pt-6 pb-0 border-b border-divider",
                  cursor: "w-full bg-primary",
                  tab: "max-w-fit px-0 h-12",
                  tabContent:
                    "group-data-[selected=true]:text-primary font-medium text-sm tracking-wide",
                  panel: "px-6 pb-6 pt-4",
                }}
                color="primary"
                variant="underlined"
              >
                <Tab
                  key="resumo"
                  title={
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                        <User className="text-blue-600 dark:text-blue-300 w-4 h-4" />
                      </div>
                      <span>Resumo</span>
                    </div>
                  }
                >
                  <div className="space-y-6">
                    <ModalSectionCard
                      description="Dados de identificação do cliente"
                      title="Informações Básicas"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-default-500">
                              Documento
                            </p>
                            <p className="text-sm font-medium">
                              {clienteParaVisualizar.documento || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                          <Chip
                            color={
                              clienteParaVisualizar.tipoPessoa ===
                              TipoPessoa.FISICA
                                ? "secondary"
                                : "warning"
                            }
                            size="sm"
                            startContent={
                              clienteParaVisualizar.tipoPessoa ===
                              TipoPessoa.FISICA ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <Building2 className="h-3 w-3" />
                              )
                            }
                            variant="flat"
                          >
                            {clienteParaVisualizar.tipoPessoa ===
                            TipoPessoa.FISICA
                              ? "Pessoa Física"
                              : "Pessoa Jurídica"}
                          </Chip>
                          {clienteParaVisualizar.usuarioId && (
                            <Chip
                              color="success"
                              size="sm"
                              startContent={<Key className="h-3 w-3" />}
                              variant="flat"
                            >
                              Tem Acesso
                            </Chip>
                          )}
                        </div>
                      </div>
                    </ModalSectionCard>

                    <ModalSectionCard
                      description="Métricas do cliente"
                      title="Estatísticas"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                Processos
                              </p>
                              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {clienteParaVisualizar._count?.processos || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Cadastrado em
                              </p>
                              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                {new Date(
                                  clienteParaVisualizar.createdAt,
                                ).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ModalSectionCard>
                  </div>
                </Tab>

                <Tab
                  key="contato"
                  title={
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-green-100 dark:bg-green-900">
                        <Phone className="text-green-600 dark:text-green-300 w-4 h-4" />
                      </div>
                      <span>Contato</span>
                    </div>
                  }
                >
                  <div className="space-y-6">
                    <ModalSectionCard
                      description="Telefones e email do cliente"
                      title="Informações de Contato"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clienteParaVisualizar.email && (
                          <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                            <Mail className="h-4 w-4 text-success" />
                            <div>
                              <p className="text-xs text-default-500">Email</p>
                              <p className="text-sm font-medium">
                                {clienteParaVisualizar.email}
                              </p>
                            </div>
                          </div>
                        )}
                        {clienteParaVisualizar.telefone && (
                          <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                            <Phone className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-default-500">
                                Telefone
                              </p>
                              <p className="text-sm font-medium">
                                {clienteParaVisualizar.telefone}
                              </p>
                            </div>
                          </div>
                        )}
                        {clienteParaVisualizar.celular && (
                          <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                            <Smartphone className="h-4 w-4 text-warning" />
                            <div>
                              <p className="text-xs text-default-500">
                                Celular
                              </p>
                              <p className="text-sm font-medium">
                                {clienteParaVisualizar.celular}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ModalSectionCard>

                    {clienteParaVisualizar.tipoPessoa === TipoPessoa.JURIDICA &&
                      (clienteParaVisualizar.responsavelNome ||
                        clienteParaVisualizar.responsavelEmail ||
                        clienteParaVisualizar.responsavelTelefone) && (
                        <ModalSectionCard
                          description="Dados do responsável legal"
                          title="Responsável pela Empresa"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clienteParaVisualizar.responsavelNome && (
                              <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                                <User className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="text-xs text-default-500">
                                    Nome
                                  </p>
                                  <p className="text-sm font-medium">
                                    {clienteParaVisualizar.responsavelNome}
                                  </p>
                                </div>
                              </div>
                            )}
                            {clienteParaVisualizar.responsavelEmail && (
                              <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                                <Mail className="h-4 w-4 text-success" />
                                <div>
                                  <p className="text-xs text-default-500">
                                    Email
                                  </p>
                                  <p className="text-sm font-medium">
                                    {clienteParaVisualizar.responsavelEmail}
                                  </p>
                                </div>
                              </div>
                            )}
                            {clienteParaVisualizar.responsavelTelefone && (
                              <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                                <Phone className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="text-xs text-default-500">
                                    Telefone
                                  </p>
                                  <p className="text-sm font-medium">
                                    {clienteParaVisualizar.responsavelTelefone}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </ModalSectionCard>
                      )}
                  </div>
                </Tab>

                <Tab
                  key="processos"
                  title={
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900">
                        <FileText className="text-purple-600 dark:text-purple-300 w-4 h-4" />
                      </div>
                      <span>Processos</span>
                    </div>
                  }
                >
                  <div className="space-y-6">
                    <ModalSectionCard
                      description={`Total: ${clienteParaVisualizar._count?.processos || 0} processos`}
                      title="Processos do Cliente"
                    >
                      <div className="space-y-4 py-4 text-center">
                        <FileText className="mx-auto mb-2 h-12 w-12 text-default-300" />
                        <p className="text-default-500">
                          {clienteParaVisualizar._count?.processos === 0
                            ? "Este cliente ainda não possui processos vinculados."
                            : "Abra a página completa para visualizar processos, contratos, procurações e demais relações."}
                        </p>
                        <Button
                          as={Link}
                          color="primary"
                          href={`/clientes/${clienteParaVisualizar.id}`}
                          size="sm"
                          startContent={<Eye className="h-4 w-4" />}
                          variant="flat"
                        >
                          Abrir página completa
                        </Button>
                      </div>
                    </ModalSectionCard>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setIsViewModalOpen(false)}>
                Fechar
              </Button>
              <Button
                color="primary"
                onPress={() => handleEditCliente(clienteParaVisualizar)}
              >
                Editar Cliente
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </HeroUIModal>
      <BulkExcelImportModal
        entityLabel="clientes"
        isOpen={isImportModalOpen}
        sampleFields={clienteImportFields}
        templateUrl="/api/templates/import-clients"
        onOpenChange={setIsImportModalOpen}
      />
    </div>
  );
}
