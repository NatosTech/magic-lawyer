"use client";

import type { CnpjData } from "@/types/brazil";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Textarea } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Badge } from "@heroui/badge";
import { Progress } from "@heroui/progress";
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
  Award,
  Calendar,
  Crown,
  Info,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { title } from "@/components/primitives";
import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { useClientesAdvogado, useAllClientes } from "@/app/hooks/use-clientes";
import { createCliente, updateCliente, deleteCliente, resetarSenhaCliente, type Cliente, type ClienteCreateInput, type ClienteUpdateInput } from "@/app/actions/clientes";
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
  const [clienteParaResetarSenha, setClienteParaResetarSenha] = useState<Cliente | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [clienteParaVisualizar, setClienteParaVisualizar] = useState<Cliente | null>(null);

  // Buscar clientes (advogado ou admin)
  const { clientes: clientesAdvogado, isLoading: isLoadingAdvogado, mutate: mutateAdvogado } = useClientesAdvogado();
  const { clientes: clientesAdmin, isLoading: isLoadingAdmin, mutate: mutateAdmin } = useAllClientes();

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

  const [formState, setFormState] = useState<ClienteCreateInput>(initialFormState);

  // Filtrar clientes
  const clientesFiltrados =
    clientes?.filter((cliente) => {
      const matchSearch =
        !searchTerm ||
        cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.documento?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTipoPessoa = selectedTipoPessoa === "all" || cliente.tipoPessoa === selectedTipoPessoa;

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
    const fisica = clientes.filter((c) => c.tipoPessoa === TipoPessoa.FISICA).length;
    const juridica = clientes.filter((c) => c.tipoPessoa === TipoPessoa.JURIDICA).length;
    const comProcessos = clientes.filter((c) => (c._count?.processos || 0) > 0).length;

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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Melhorado */}
      <motion.div animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center" initial={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Base de Clientes</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Gerencie sua carteira de clientes e acompanhe seus processos</p>
        </div>
        {permissions.canViewAllClients && (
          <Button
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            startContent={<Plus size={20} />}
            onPress={() => {
              setFormState(initialFormState);
              setIsCreateModalOpen(true);
            }}
          >
            Novo Cliente
          </Button>
        )}
      </motion.div>

      {/* Dashboard Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card Total de Clientes */}
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-indigo-900/30 border-blue-300 dark:border-blue-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="text-white" size={24} />
                  </div>
                  <Badge color="success" content="+" variant="shadow">
                    <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total de Clientes</p>
                  <p className="text-4xl font-bold text-blue-800 dark:text-blue-200">{metrics.total}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Carteira de clientes</p>
                </div>
                <div className="mt-4">
                  <Progress className="opacity-60" color="primary" size="sm" value={75} />
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Card Clientes com Acesso */}
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-200 dark:from-green-900/30 dark:via-emerald-800/20 dark:to-teal-900/30 border-green-300 dark:border-green-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Key className="text-white" size={24} />
                  </div>
                  <Badge color="success" content="✓" variant="shadow">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Com Acesso</p>
                  <p className="text-4xl font-bold text-green-800 dark:text-green-200">{metrics.comAcesso}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Usuários ativos</p>
                </div>
                <div className="mt-4">
                  <Progress className="opacity-60" color="success" size="sm" value={metrics.total > 0 ? (metrics.comAcesso / metrics.total) * 100 : 0} />
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Card Pessoa Física */}
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-purple-50 via-violet-100 to-purple-200 dark:from-purple-900/30 dark:via-violet-800/20 dark:to-purple-900/30 border-purple-300 dark:border-purple-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <User className="text-white" size={24} />
                  </div>
                  <Badge color="secondary" content="PF" variant="shadow">
                    <Crown className="text-purple-600 dark:text-purple-400" size={20} />
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Pessoa Física</p>
                  <p className="text-4xl font-bold text-purple-800 dark:text-purple-200">{metrics.fisica}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Clientes individuais</p>
                </div>
                <div className="mt-4">
                  <Progress className="opacity-60" color="secondary" size="sm" value={metrics.total > 0 ? (metrics.fisica / metrics.total) * 100 : 0} />
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Card Pessoa Jurídica */}
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-200 dark:from-orange-900/30 dark:via-amber-800/20 dark:to-yellow-900/30 border-orange-300 dark:border-orange-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="text-white" size={24} />
                  </div>
                  <Badge color="warning" content="PJ" variant="shadow">
                    <Award className="text-orange-600 dark:text-orange-400" size={20} />
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Pessoa Jurídica</p>
                  <p className="text-4xl font-bold text-orange-800 dark:text-orange-200">{metrics.juridica}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Empresas e organizações</p>
                </div>
                <div className="mt-4">
                  <Progress className="opacity-60" color="warning" size="sm" value={metrics.total > 0 ? (metrics.juridica / metrics.total) * 100 : 0} />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Cards de Estatísticas Adicionais */}
      <motion.div animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6" initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.5 }}>
        {/* Card de Processos Ativos */}
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/20 dark:to-blue-800/20 border-cyan-200 dark:border-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500 rounded-xl">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Com Processos</p>
                <p className="text-2xl font-bold text-cyan-800 dark:text-cyan-200">{metrics.comProcessos}</p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400">Clientes ativos</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card de Taxa de Conversão */}
        <Card className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-800/20 border-pink-200 dark:border-pink-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500 rounded-xl">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-pink-700 dark:text-pink-300">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-pink-800 dark:text-pink-200">{metrics.total > 0 ? Math.round((metrics.comAcesso / metrics.total) * 100) : 0}%</p>
                <p className="text-xs text-pink-600 dark:text-pink-400">Com acesso ao sistema</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card de Produtividade */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-800/20 border-indigo-200 dark:border-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500 rounded-xl">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Engajamento</p>
                <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{metrics.comProcessos > 0 ? Math.round((metrics.comProcessos / metrics.total) * 100) : 0}%</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Com processos ativos</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Filtros Avançados Melhorados */}
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
        <Card className="shadow-lg border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Filtros Inteligentes</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Encontre exatamente o cliente que precisa</p>
                </div>
                {hasActiveFilters && (
                  <motion.div animate={{ scale: 1 }} initial={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                    <Badge color="primary" content={[searchTerm, selectedTipoPessoa !== "all"].filter(Boolean).length} size="lg" variant="shadow">
                      <Chip className="font-semibold" color="primary" size="lg" variant="flat">
                        {[searchTerm, selectedTipoPessoa !== "all"].filter(Boolean).length} filtro(s) ativo(s)
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
                <Tooltip color="primary" content={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
                  <Button
                    className="hover:scale-105 transition-transform"
                    color="primary"
                    size="sm"
                    startContent={showFilters ? <XCircle className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
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
              <motion.div animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Filtro por Busca */}
                    <motion.div animate={{ opacity: 1, x: 0 }} className="space-y-3" initial={{ opacity: 0, x: -20 }} transition={{ delay: 0.1 }}>
                      <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="filtro-busca">
                        <Search className="w-4 h-4 text-blue-500" />
                        Busca Inteligente
                      </label>
                      <Input
                        classNames={{
                          input: "text-slate-700 dark:text-slate-300",
                          inputWrapper: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500",
                        }}
                        id="filtro-busca"
                        placeholder="Nome, email, documento..."
                        size="md"
                        startContent={<Search className="w-4 h-4 text-default-400" />}
                        value={searchTerm}
                        variant="bordered"
                        onValueChange={setSearchTerm}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Busca em nomes, emails e documentos</p>
                    </motion.div>

                    {/* Filtro por Tipo */}
                    <motion.div animate={{ opacity: 1, x: 0 }} className="space-y-3" initial={{ opacity: 0, x: -20 }} transition={{ delay: 0.2 }}>
                      <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="filtro-tipo">
                        <Users className="w-4 h-4 text-green-500" />
                        Tipo de Pessoa
                      </label>
                      <Select
                        classNames={{
                          trigger: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500",
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
                              {option.key === "all" && <Users className="w-4 h-4" />}
                              {option.key === TipoPessoa.FISICA && <User className="w-4 h-4" />}
                              {option.key === TipoPessoa.JURIDICA && <Building2 className="w-4 h-4" />}
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Filtre por tipo de pessoa</p>
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
                            Tipo: {tipoPessoaOptions.find((opt) => opt.key === selectedTipoPessoa)?.label}
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
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="shadow-xl border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Carteira de Clientes</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{clientesFiltrados.length} cliente(s) encontrado(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="primary" content={clientesFiltrados.length} size="lg" variant="shadow">
                  <Target className="text-indigo-600 dark:text-indigo-400" size={20} />
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
              <motion.div animate={{ opacity: 1, scale: 1 }} className="text-center py-16" initial={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Users className="text-slate-400" size={48} />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Nenhum cliente encontrado</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{hasActiveFilters ? "Tente ajustar os filtros para encontrar clientes" : "Comece adicionando seu primeiro cliente"}</p>
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
                                icon={cliente.tipoPessoa === TipoPessoa.JURIDICA ? <Building2 className="text-white" /> : <User className="text-white" />}
                                name={getInitials(cliente.nome)}
                                size="lg"
                              />
                            </motion.div>
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cliente.nome}</h3>
                                {cliente.usuarioId && (
                                  <Badge color="success" content="✓" size="sm" variant="shadow">
                                    <Chip className="font-semibold" color="success" size="sm" startContent={<Key className="h-3 w-3" />} variant="flat">
                                      Acesso
                                    </Chip>
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Chip
                                  color={cliente.tipoPessoa === TipoPessoa.FISICA ? "secondary" : "warning"}
                                  size="sm"
                                  startContent={cliente.tipoPessoa === TipoPessoa.FISICA ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                                  variant="flat"
                                >
                                  {cliente.tipoPessoa === TipoPessoa.FISICA ? "Pessoa Física" : "Pessoa Jurídica"}
                                </Chip>
                              </div>
                            </div>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly className="hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 transition-all" size="sm" variant="light" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu aria-label="Ações do cliente">
                                <DropdownItem key="view" as={Link} href={`/clientes/${cliente.id}`} startContent={<Eye className="h-4 w-4" />}>
                                  Ver Detalhes
                                </DropdownItem>
                                <DropdownItem key="edit" startContent={<Edit className="h-4 w-4" />} onPress={() => handleEditCliente(cliente)}>
                                  Editar
                                </DropdownItem>
                                {cliente.usuarioId ? (
                                  <DropdownItem
                                    key="reset-password"
                                    className="text-warning"
                                    color="warning"
                                    startContent={<KeyRound className="h-4 w-4" />}
                                    onPress={() => handleOpenResetModal(cliente)}
                                  >
                                    Resetar Senha
                                  </DropdownItem>
                                ) : null}
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="h-4 w-4" />} onPress={() => handleDeleteCliente(cliente.id)}>
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
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cliente.documento}</span>
                              </div>
                            )}
                            {cliente.email && (
                              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <Mail className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cliente.email}</span>
                              </div>
                            )}
                            {cliente.telefone && (
                              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <Phone className="h-4 w-4 text-purple-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cliente.telefone}</span>
                              </div>
                            )}
                          </div>

                          <Divider className="my-4" />

                          {/* Estatísticas e Ações */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <Badge color="primary" content={cliente._count?.processos || 0} size="sm" variant="shadow">
                                  <Chip className="font-semibold" color="primary" size="md" variant="flat">
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
      <Modal
        footer={
          <div className="flex gap-2">
            <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSaving} onPress={handleCreateCliente}>
              Criar Cliente
            </Button>
          </div>
        }
        isOpen={isCreateModalOpen}
        size="2xl"
        title="Novo Cliente"
        onOpenChange={setIsCreateModalOpen}
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
            <SelectItem key={TipoPessoa.FISICA}>Pessoa Física</SelectItem>
            <SelectItem key={TipoPessoa.JURIDICA}>Pessoa Jurídica</SelectItem>
          </Select>

          <Input
            isRequired
            label={formState.tipoPessoa === TipoPessoa.FISICA ? "Nome Completo" : "Razão Social"}
            placeholder={formState.tipoPessoa === TipoPessoa.FISICA ? "Nome completo" : "Razão Social"}
            startContent={formState.tipoPessoa === TipoPessoa.FISICA ? <User className="h-4 w-4 text-default-400" /> : <Building2 className="h-4 w-4 text-default-400" />}
            value={formState.nome}
            onValueChange={(value) => setFormState({ ...formState, nome: value })}
          />

          {formState.tipoPessoa === TipoPessoa.FISICA ? (
            <CpfInput value={formState.documento} onChange={(value) => setFormState({ ...formState, documento: value })} />
          ) : (
            <CnpjInput value={formState.documento} onChange={(value) => setFormState({ ...formState, documento: value })} onCnpjFound={handleCnpjFound} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              description={criarUsuario ? "Obrigatório para criar usuário" : undefined}
              isRequired={criarUsuario}
              label="Email"
              placeholder="email@exemplo.com"
              startContent={<Mail className="h-4 w-4 text-default-400" />}
              type="email"
              value={formState.email}
              onValueChange={(value) => setFormState({ ...formState, email: value })}
            />
            <Input
              label="Telefone"
              placeholder="(00) 0000-0000"
              startContent={<Phone className="h-4 w-4 text-default-400" />}
              value={formState.telefone}
              onValueChange={(value) => setFormState({ ...formState, telefone: value })}
            />
          </div>

          <Input
            label="Celular/WhatsApp"
            placeholder="(00) 00000-0000"
            startContent={<Phone className="h-4 w-4 text-default-400" />}
            value={formState.celular}
            onValueChange={(value) => setFormState({ ...formState, celular: value })}
          />

          {formState.tipoPessoa === TipoPessoa.JURIDICA && (
            <>
              <Divider className="my-2" />
              <p className="text-sm font-semibold text-default-700">Responsável pela Empresa</p>
              <Input
                label="Nome do Responsável"
                placeholder="Nome completo"
                startContent={<User className="h-4 w-4 text-default-400" />}
                value={formState.responsavelNome}
                onValueChange={(value) => setFormState({ ...formState, responsavelNome: value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email do Responsável"
                  placeholder="email@exemplo.com"
                  startContent={<Mail className="h-4 w-4 text-default-400" />}
                  type="email"
                  value={formState.responsavelEmail}
                  onValueChange={(value) => setFormState({ ...formState, responsavelEmail: value })}
                />
                <Input
                  label="Telefone do Responsável"
                  placeholder="(00) 00000-0000"
                  startContent={<Phone className="h-4 w-4 text-default-400" />}
                  value={formState.responsavelTelefone}
                  onValueChange={(value) => setFormState({ ...formState, responsavelTelefone: value })}
                />
              </div>
            </>
          )}

          <Divider className="my-4" />

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <Checkbox isSelected={criarUsuario} onValueChange={setCriarUsuario}>
              <div>
                <p className="font-semibold text-sm">Criar usuário de acesso ao sistema</p>
                <p className="text-xs text-default-500 mt-1">{criarUsuario ? "Um usuário será criado automaticamente com email e senha aleatória" : "O cliente não terá acesso ao sistema"}</p>
              </div>
            </Checkbox>
          </div>

          <Textarea
            label="Observações"
            minRows={3}
            placeholder="Informações adicionais sobre o cliente..."
            value={formState.observacoes}
            onValueChange={(value) => setFormState({ ...formState, observacoes: value })}
          />
        </div>
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal
        footer={
          <div className="flex gap-2">
            <Button variant="light" onPress={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSaving} onPress={handleUpdateCliente}>
              Salvar Alterações
            </Button>
          </div>
        }
        isOpen={isEditModalOpen}
        size="2xl"
        title="Editar Cliente"
        onOpenChange={setIsEditModalOpen}
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
            <SelectItem key={TipoPessoa.FISICA}>Pessoa Física</SelectItem>
            <SelectItem key={TipoPessoa.JURIDICA}>Pessoa Jurídica</SelectItem>
          </Select>

          <Input
            isRequired
            label={formState.tipoPessoa === TipoPessoa.FISICA ? "Nome Completo" : "Razão Social"}
            placeholder={formState.tipoPessoa === TipoPessoa.FISICA ? "Nome completo" : "Razão Social"}
            startContent={formState.tipoPessoa === TipoPessoa.FISICA ? <User className="h-4 w-4 text-default-400" /> : <Building2 className="h-4 w-4 text-default-400" />}
            value={formState.nome}
            onValueChange={(value) => setFormState({ ...formState, nome: value })}
          />

          {formState.tipoPessoa === TipoPessoa.FISICA ? (
            <CpfInput value={formState.documento} onChange={(value) => setFormState({ ...formState, documento: value })} />
          ) : (
            <CnpjInput value={formState.documento} onChange={(value) => setFormState({ ...formState, documento: value })} onCnpjFound={handleCnpjFound} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              placeholder="email@exemplo.com"
              startContent={<Mail className="h-4 w-4 text-default-400" />}
              type="email"
              value={formState.email}
              onValueChange={(value) => setFormState({ ...formState, email: value })}
            />
            <Input
              label="Telefone"
              placeholder="(00) 0000-0000"
              startContent={<Phone className="h-4 w-4 text-default-400" />}
              value={formState.telefone}
              onValueChange={(value) => setFormState({ ...formState, telefone: value })}
            />
          </div>

          <Input
            label="Celular/WhatsApp"
            placeholder="(00) 00000-0000"
            startContent={<Phone className="h-4 w-4 text-default-400" />}
            value={formState.celular}
            onValueChange={(value) => setFormState({ ...formState, celular: value })}
          />

          {formState.tipoPessoa === TipoPessoa.JURIDICA && (
            <>
              <Divider className="my-2" />
              <p className="text-sm font-semibold text-default-700">Responsável pela Empresa</p>
              <Input
                label="Nome do Responsável"
                placeholder="Nome completo"
                startContent={<User className="h-4 w-4 text-default-400" />}
                value={formState.responsavelNome}
                onValueChange={(value) => setFormState({ ...formState, responsavelNome: value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email do Responsável"
                  placeholder="email@exemplo.com"
                  startContent={<Mail className="h-4 w-4 text-default-400" />}
                  type="email"
                  value={formState.responsavelEmail}
                  onValueChange={(value) => setFormState({ ...formState, responsavelEmail: value })}
                />
                <Input
                  label="Telefone do Responsável"
                  placeholder="(00) 00000-0000"
                  startContent={<Phone className="h-4 w-4 text-default-400" />}
                  value={formState.responsavelTelefone}
                  onValueChange={(value) => setFormState({ ...formState, responsavelTelefone: value })}
                />
              </div>
            </>
          )}

          <Textarea
            label="Observações"
            minRows={3}
            placeholder="Informações adicionais sobre o cliente..."
            value={formState.observacoes}
            onValueChange={(value) => setFormState({ ...formState, observacoes: value })}
          />
        </div>
      </Modal>

      {/* Modal de Credenciais */}
      <Modal
        footer={
          <div className="flex justify-end">
            <Button color="primary" startContent={<CheckCircle className="h-4 w-4" />} onPress={() => setCredenciaisModal(null)}>
              Entendi
            </Button>
          </div>
        }
        isOpen={!!credenciaisModal}
        size="lg"
        title={credenciaisModal ? (credenciaisModal.senha.length > 0 ? "🔑 Credenciais de Acesso" : "✅ Cliente criado com sucesso!") : ""}
        onOpenChange={() => setCredenciaisModal(null)}
      >
        {credenciaisModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-success/10 border border-success/20 p-4">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-success">Usuário de acesso criado</p>
                  <p className="text-xs text-default-600 mt-1">As credenciais abaixo foram geradas automaticamente. Anote ou envie para o cliente.</p>
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
                  <p className="text-xs text-default-400 mb-1">Senha (temporária)</p>
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
              <p className="text-xs text-warning-600">⚠️ Esta senha será exibida apenas uma vez. Certifique-se de anotar ou enviar para o cliente.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmação de Reset de Senha */}
      <Modal
        footer={
          <div className="flex gap-2">
            <Button variant="light" onPress={() => setClienteParaResetarSenha(null)}>
              Cancelar
            </Button>
            <Button color="warning" isLoading={isResettingPassword} startContent={!isResettingPassword ? <RefreshCw className="h-4 w-4" /> : undefined} onPress={handleConfirmResetarSenha}>
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
                  <p className="text-xs text-default-600 mt-1">Esta ação irá gerar uma nova senha aleatória para o cliente.</p>
                </div>
              </div>
            </div>

            <Card className="border border-default-200 bg-default-50">
              <CardBody className="gap-2">
                <div className="flex items-center gap-2">
                  {clienteParaResetarSenha.tipoPessoa === TipoPessoa.JURIDICA ? <Building2 className="h-5 w-5 text-default-400" /> : <User className="h-5 w-5 text-default-400" />}
                  <div>
                    <p className="text-sm font-semibold">{clienteParaResetarSenha.nome}</p>
                    <p className="text-xs text-default-400">{clienteParaResetarSenha.email}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-xs text-primary-600">💡 Uma nova senha será gerada e exibida na próxima tela. Certifique-se de anotar e enviar para o cliente.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Visualização do Cliente */}
      <Modal isOpen={isViewModalOpen} size="2xl" title="Detalhes do Cliente" onOpenChange={setIsViewModalOpen}>
        {clienteParaVisualizar && (
          <div className="space-y-6">
            {/* Header do Cliente */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Avatar
                showFallback
                className="bg-blue-500 text-white shadow-lg"
                icon={clienteParaVisualizar.tipoPessoa === TipoPessoa.JURIDICA ? <Building2 className="text-white" /> : <User className="text-white" />}
                name={getInitials(clienteParaVisualizar.nome)}
                size="lg"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{clienteParaVisualizar.nome}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Chip
                    color={clienteParaVisualizar.tipoPessoa === TipoPessoa.FISICA ? "secondary" : "warning"}
                    size="sm"
                    startContent={clienteParaVisualizar.tipoPessoa === TipoPessoa.FISICA ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                    variant="flat"
                  >
                    {clienteParaVisualizar.tipoPessoa === TipoPessoa.FISICA ? "Pessoa Física" : "Pessoa Jurídica"}
                  </Chip>
                  {clienteParaVisualizar.usuarioId && (
                    <Chip color="success" size="sm" startContent={<Key className="h-3 w-3" />} variant="flat">
                      Tem Acesso
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informações de Contato
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clienteParaVisualizar.documento && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Documento</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{clienteParaVisualizar.documento}</p>
                    </div>
                  </div>
                )}
                {clienteParaVisualizar.email && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Mail className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{clienteParaVisualizar.email}</p>
                    </div>
                  </div>
                )}
                {clienteParaVisualizar.telefone && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Phone className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Telefone</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{clienteParaVisualizar.telefone}</p>
                    </div>
                  </div>
                )}
                {clienteParaVisualizar.celular && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Smartphone className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Celular</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{clienteParaVisualizar.celular}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações do Responsável (se PJ) */}
            {clienteParaVisualizar.tipoPessoa === TipoPessoa.JURIDICA &&
              (clienteParaVisualizar.responsavelNome || clienteParaVisualizar.responsavelEmail || clienteParaVisualizar.responsavelTelefone) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Responsável pela Empresa
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clienteParaVisualizar.responsavelNome && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <User className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Nome</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{clienteParaVisualizar.responsavelNome}</p>
                        </div>
                      </div>
                    )}
                    {clienteParaVisualizar.responsavelEmail && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <Mail className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{clienteParaVisualizar.responsavelEmail}</p>
                        </div>
                      </div>
                    )}
                    {clienteParaVisualizar.responsavelTelefone && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <Phone className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Telefone</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{clienteParaVisualizar.responsavelTelefone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Estatísticas */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Processos</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{clienteParaVisualizar._count?.processos || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">Cadastrado em</p>
                      <p className="text-sm font-bold text-green-700 dark:text-green-300">{new Date(clienteParaVisualizar.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            {clienteParaVisualizar.observacoes && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{clienteParaVisualizar.observacoes}</p>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button as={Link} className="flex-1" color="primary" href={`/clientes/${clienteParaVisualizar.id}`} startContent={<Eye className="h-4 w-4" />} variant="flat">
                Ver Página Completa
              </Button>
              <Button
                className="flex-1"
                color="secondary"
                startContent={<Edit className="h-4 w-4" />}
                variant="flat"
                onPress={() => {
                  setIsViewModalOpen(false);
                  handleEditCliente(clienteParaVisualizar);
                }}
              >
                Editar Cliente
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
