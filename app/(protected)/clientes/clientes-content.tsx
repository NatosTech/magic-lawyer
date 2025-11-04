"use client";

import type { CnpjData } from "@/types/brazil";

import { useState, useMemo } from "react";
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
  Zap,
  Target,
  Calendar,
  Info,
  Smartphone,
  Activity,
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
import { TipoPessoa } from "@/app/generated/prisma";
import { Modal } from "@/components/ui/modal";
import { CpfInput } from "@/components/cpf-input";
import { CnpjInput } from "@/components/cnpj-input";

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

  const clientes = isAdmin ? clientesAdmin : clientesAdvogado;
  const isLoading = isAdmin ? isLoadingAdmin : isLoadingAdvogado;
  const mutate = isAdmin ? mutateAdmin : mutateAdvogado;

  // Estado do formulário
  const initialFormState: ClienteCreateInput = {
    tipoPessoa: TipoPessoa.FISICA,
    nome: "",
    documento: "",
    email: "",
    telefone: "",
    celular: "",
    observacoes: "",
    responsavelNome: "",
    responsavelEmail: "",
    responsavelTelefone: "",
  };

  const [formState, setFormState] =
    useState<ClienteCreateInput>(initialFormState);

  // Filtrar clientes
  const clientesFiltrados =
    clientes?.filter((cliente) => {
      const matchSearch =
        !searchTerm ||
        cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.documento?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTipoPessoa =
        selectedTipoPessoa === "all" ||
        cliente.tipoPessoa === selectedTipoPessoa;

      return matchSearch && matchTipoPessoa;
    }) || [];

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
  const hasActiveFilters = searchTerm || selectedTipoPessoa !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTipoPessoa("all");
    setShowFilters(false);
  };

  const handleDeleteCliente = async (clienteId: string) => {
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
  };

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
      const result = await createCliente({ ...formState, criarUsuario });

      if (result.success) {
        toast.success("Cliente criado com sucesso!");
        setIsCreateModalOpen(false);
        setFormState(initialFormState);
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
        observacoes: formState.observacoes,
        responsavelNome: formState.responsavelNome,
        responsavelEmail: formState.responsavelEmail,
        responsavelTelefone: formState.responsavelTelefone,
      };

      const result = await updateCliente(selectedCliente.id, updateData);

      if (result.success) {
        toast.success("Cliente atualizado com sucesso!");
        setIsEditModalOpen(false);
        setSelectedCliente(null);
        setFormState(initialFormState);
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

  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormState({
      nome: cliente.nome,
      tipoPessoa: cliente.tipoPessoa,
      documento: cliente.documento || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      celular: cliente.celular || "",
      observacoes: cliente.observacoes || "",
      responsavelNome: cliente.responsavelNome || "",
      responsavelEmail: cliente.responsavelEmail || "",
      responsavelTelefone: cliente.responsavelTelefone || "",
    });
    setIsEditModalOpen(true);
  };

  const handleViewCliente = (cliente: Cliente) => {
    setClienteParaVisualizar(cliente);
    setIsViewModalOpen(true);
  };

  const handleCnpjFound = (cnpjData: CnpjData) => {
    setFormState({
      ...formState,
      nome: cnpjData.razao_social || formState.nome,
      documento: cnpjData.cnpj,
    });
    toast.success("Dados do CNPJ carregados!");
  };

  const handleOpenResetModal = (cliente: Cliente) => {
    if (!cliente.usuarioId) {
      toast.error("Este cliente não possui usuário de acesso");

      return;
    }
    setClienteParaResetarSenha(cliente);
  };

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

  const getInitials = (nome: string) => {
    const names = nome.split(" ");

    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }

    return nome.substring(0, 2).toUpperCase();
  };

  const tipoPessoaOptions = [
    { key: "all", label: "Todos" },
    { key: TipoPessoa.FISICA, label: "Pessoa Física" },
    { key: TipoPessoa.JURIDICA, label: "Pessoa Jurídica" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Hero */}
      <motion.div animate="visible" initial="hidden" variants={fadeInUp}>
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-900 via-blue-900/90 to-indigo-800 text-white shadow-2xl">
          <CardBody className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Base de Clientes
                </h1>
                <p className="text-white/80">
                  Gerencie sua carteira de clientes, acompanhe processos e
                  mantenha relacionamentos organizados. Acesso completo às
                  informações em tempo real.
                </p>
                {permissions.canViewAllClients && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      color="secondary"
                      startContent={<Plus className="w-4 h-4" />}
                      onPress={() => {
                        setFormState(initialFormState);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      Novo Cliente
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </Card>
      </motion.div>

      {/* Dashboard Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
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
                    {metrics.total}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Carteira de clientes
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Card Clientes com Acesso */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-200 dark:from-green-900/30 dark:via-emerald-800/20 dark:to-teal-900/30 border-green-300 dark:border-green-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Key className="text-white" size={24} />
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
                    Com Acesso
                  </p>
                  <p className="text-4xl font-bold text-green-800 dark:text-green-200">
                    {metrics.comAcesso}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Com login ativo
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Card Pessoa Física */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 via-violet-100 to-purple-200 dark:from-purple-900/30 dark:via-violet-800/20 dark:to-purple-900/30 border-purple-300 dark:border-purple-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <User className="text-white" size={24} />
                  </div>
                  <Badge color="secondary" content="👤" variant="shadow">
                    <User
                      className="text-purple-600 dark:text-purple-400"
                      size={20}
                    />
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                    Pessoa Física
                  </p>
                  <p className="text-4xl font-bold text-purple-800 dark:text-purple-200">
                    {metrics.fisica}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Clientes PF
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Card Pessoa Jurídica */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-200 dark:from-amber-900/30 dark:via-yellow-800/20 dark:to-orange-900/30 border-amber-300 dark:border-amber-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="text-white" size={24} />
                  </div>
                  <Badge color="warning" content="🏢" variant="shadow">
                    <Building2
                      className="text-amber-600 dark:text-amber-400"
                      size={20}
                    />
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                    Pessoa Jurídica
                  </p>
                  <p className="text-4xl font-bold text-amber-800 dark:text-amber-200">
                    {metrics.juridica}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Clientes PJ
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Cards de Estatísticas Adicionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card de Processos Ativos */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-cyan-50 via-blue-100 to-cyan-200 dark:from-cyan-900/30 dark:via-blue-800/20 dark:to-cyan-900/30 border-cyan-300 dark:border-cyan-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-cyan-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="text-white" size={24} />
                </div>
                <Badge
                  color="primary"
                  content={metrics.comProcessos}
                  variant="shadow"
                >
                  <FileText
                    className="text-cyan-600 dark:text-cyan-400"
                    size={20}
                  />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
                  Com Processos
                </p>
                <p className="text-4xl font-bold text-cyan-800 dark:text-cyan-200">
                  {metrics.comProcessos}
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400">
                  Clientes ativos
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card de Taxa de Conversão */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-pink-50 via-rose-100 to-pink-200 dark:from-pink-900/30 dark:via-rose-800/20 dark:to-pink-900/30 border-pink-300 dark:border-pink-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <Badge color="secondary" content="%" variant="shadow">
                  <TrendingUp
                    className="text-pink-600 dark:text-pink-400"
                    size={20}
                  />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wide">
                  Taxa de Conversão
                </p>
                <p className="text-4xl font-bold text-pink-800 dark:text-pink-200">
                  {metrics.total > 0
                    ? Math.round((metrics.comAcesso / metrics.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-pink-600 dark:text-pink-400">
                  Com acesso ao sistema
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card de Produtividade */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-indigo-50 via-purple-100 to-indigo-200 dark:from-indigo-900/30 dark:via-purple-800/20 dark:to-indigo-900/30 border-indigo-300 dark:border-indigo-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="text-white" size={24} />
                </div>
                <Badge color="secondary" content="⚡" variant="shadow">
                  <Zap
                    className="text-indigo-600 dark:text-indigo-400"
                    size={20}
                  />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                  Engajamento
                </p>
                <p className="text-4xl font-bold text-indigo-800 dark:text-indigo-200">
                  {metrics.comProcessos > 0
                    ? Math.round((metrics.comProcessos / metrics.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  Com processos ativos
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
                    Encontre exatamente o cliente que precisa
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

      {/* Lista de Clientes Melhorada */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="shadow-xl border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
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
                {!hasActiveFilters && permissions.canViewAllClients && (
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    color="primary"
                    startContent={<Plus size={20} />}
                    onPress={() => {
                      setFormState(initialFormState);
                      setIsCreateModalOpen(true);
                    }}
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
                      <Card className="border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group shadow-lg hover:shadow-2xl">
                        <CardHeader
                          className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 cursor-pointer"
                          onClick={() => handleViewCliente(cliente)}
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
                                  onPress={() => handleEditCliente(cliente)}
                                >
                                  Editar
                                </DropdownItem>
                                {cliente.usuarioId ? (
                                  <DropdownItem
                                    key="reset-password"
                                    className="text-warning"
                                    color="warning"
                                    startContent={
                                      <KeyRound className="h-4 w-4" />
                                    }
                                    onPress={() =>
                                      handleOpenResetModal(cliente)
                                    }
                                  >
                                    Resetar Senha
                                  </DropdownItem>
                                ) : null}
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={<Trash2 className="h-4 w-4" />}
                                  onPress={() =>
                                    handleDeleteCliente(cliente.id)
                                  }
                                >
                                  Excluir
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </CardHeader>
                        <CardBody className="p-6 space-y-4">
                          {/* Informações de Contato */}
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

                          {/* Estatísticas e Ações */}
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
                        selectedKeys={[formState.tipoPessoa]}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            tipoPessoa: e.target.value as TipoPessoa,
                          })
                        }
                      >
                        <SelectItem key={TipoPessoa.FISICA}>
                          Pessoa Física
                        </SelectItem>
                        <SelectItem key={TipoPessoa.JURIDICA}>
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
                        selectedKeys={[formState.tipoPessoa]}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            tipoPessoa: e.target.value as TipoPessoa,
                          })
                        }
                      >
                        <SelectItem key={TipoPessoa.FISICA}>
                          Pessoa Física
                        </SelectItem>
                        <SelectItem key={TipoPessoa.JURIDICA}>
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
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <FileText className="w-12 h-12 text-default-300 mx-auto mb-4" />
                          <p className="text-default-500">
                            {clienteParaVisualizar._count?.processos === 0
                              ? "Este cliente ainda não possui processos vinculados"
                              : "Lista de processos será implementada em breve"}
                          </p>
                        </div>
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
    </div>
  );
}
