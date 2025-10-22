"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Chip,
  Tooltip,
  Skeleton,
  DatePicker,
  DateRangePicker,
} from "@heroui/react";
import { parseDate, getLocalTimeZone, today } from "@internationalized/date";
import { toast } from "sonner";
import {
  Clock,
  FileText,
  Calendar,
  Plus,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  Activity,
  Bell,
  Paperclip,
  MessageSquare,
  Mail,
  Smartphone,
  Timer,
  Megaphone,
  CalendarDays,
  Star,
  Eye,
  Edit3,
  Tag,
  RotateCcw,
  XCircle,
  Sparkles,
  User,
} from "lucide-react";

import {
  listAndamentos,
  createAndamento,
  updateAndamento,
  deleteAndamento,
  getDashboardAndamentos,
  getTiposMovimentacao,
  type AndamentoFilters,
  type AndamentoCreateInput,
} from "@/app/actions/andamentos";
import { getAllProcessos } from "@/app/actions/processos";
import { MovimentacaoTipo } from "@/app/generated/prisma";
import { title, subtitle } from "@/components/primitives";

// ============================================
// TIPOS
// ============================================

interface Andamento {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: MovimentacaoTipo | null;
  dataMovimentacao: Date | string;
  prazo: Date | string | null;
  processo: {
    id: string;
    numero: string;
    titulo: string | null;
  };
  criadoPor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  documentos: Array<{
    id: string;
    nome: string;
    tipo: string | null;
    url: string;
  }>;
  prazosRelacionados: Array<{
    id: string;
    titulo: string;
    dataVencimento: Date | string;
    status: string;
  }>;
  createdAt: Date | string;
  // Campos para notificações
  notificarCliente?: boolean;
  notificarEmail?: boolean;
  notificarWhatsapp?: boolean;
  mensagemPersonalizada?: string;
}

interface DashboardData {
  total: number;
  porTipo: Array<{
    tipo: string | null;
    _count: number;
  }>;
  ultimosAndamentos: Andamento[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AndamentosPage() {
  // Estado dos filtros
  const [filters, setFilters] = useState<AndamentoFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<any>(null);
  const [clienteId, setClienteId] = useState<string>("");

  // Estado do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [selectedAndamento, setSelectedAndamento] = useState<Andamento | null>(
    null,
  );

  // SWR - Fetch data
  const {
    data: andamentosData,
    mutate: mutateAndamentos,
    isLoading: loadingAndamentos,
  } = useSWR(["andamentos", filters], () => listAndamentos(filters));

  const { data: dashboardData, isLoading: loadingDashboard } = useSWR(
    "dashboard-andamentos",
    getDashboardAndamentos,
  );

  // Debug temporário
  console.log("Dashboard data:", dashboardData);
  console.log("Dashboard data.data:", dashboardData?.data);
  console.log("Dashboard data.data.total:", dashboardData?.data?.total);
  console.log("Dashboard data.data.porTipo:", dashboardData?.data?.porTipo);

  const { data: processosData } = useSWR("processos-list", getAllProcessos);

  const { data: tiposData } = useSWR(
    "tipos-movimentacao",
    getTiposMovimentacao,
  );

  // Por enquanto, vamos usar uma lista vazia de clientes
  // TODO: Implementar API de clientes ou buscar de outra forma
  const clientesData = { clientes: [] };

  const andamentos = (andamentosData?.data || []) as Andamento[];
  const dashboard = dashboardData?.data as DashboardData | undefined;
  const processos = processosData?.processos || [];
  const tipos = tiposData?.data || [];
  const clientes = clientesData?.clientes || [];

  // Calcular métricas do dashboard a partir dos andamentos
  const calculatedDashboard = useMemo(() => {
    if (!andamentos.length) {
      return {
        total: 0,
        porTipo: [],
        ultimosAndamentos: [],
      };
    }

    const total = andamentos.length;
    const porTipo = andamentos.reduce((acc: any, andamento: any) => {
      const tipo = andamento.tipo;

      acc[tipo] = (acc[tipo] || 0) + 1;

      return acc;
    }, {});

    const porTipoArray = Object.entries(porTipo).map(([tipo, count]) => ({
      tipo,
      _count: count,
    }));

    const ultimosAndamentos = andamentos
      .sort(
        (a: any, b: any) =>
          new Date(b.dataMovimentacao).getTime() -
          new Date(a.dataMovimentacao).getTime(),
      )
      .slice(0, 10);

    return {
      total,
      porTipo: porTipoArray,
      ultimosAndamentos,
    };
  }, [andamentos]);

  // Usar os dados calculados se o dashboard não estiver funcionando
  const finalDashboard =
    dashboard?.total === 0 ? calculatedDashboard : dashboard;

  // Função auxiliar para obter contagem por tipo
  const getCountByType = (tipo: string): number => {
    const item = finalDashboard?.porTipo.find((t: any) => t.tipo === tipo);

    return (item as any)?._count || 0;
  };

  // Handlers de filtro
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2 || value.length === 0) {
      setFilters({ ...filters, searchTerm: value || undefined });
    }
  };

  const handleFilterChange = (key: keyof AndamentoFilters, value: any) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setDateRange(null);
    setClienteId("");
    setShowFilters(false);
  };

  // Verificar se há filtros ativos
  const hasActiveFilters =
    filters.processoId || filters.tipo || searchTerm || dateRange || clienteId;

  // Handlers do modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedAndamento(null);
    setModalOpen(true);
  };

  const openEditModal = (andamento: Andamento) => {
    setModalMode("edit");
    setSelectedAndamento(andamento);
    setModalOpen(true);
  };

  const openViewModal = (andamento: Andamento) => {
    setModalMode("view");
    setSelectedAndamento(andamento);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAndamento(null);
  };

  // Handler de exclusão
  const handleDelete = async (andamentoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este andamento?")) return;

    const result = await deleteAndamento(andamentoId);

    if (result.success) {
      toast.success("Andamento excluído com sucesso!");
      mutateAndamentos();
    } else {
      toast.error(result.error || "Erro ao excluir andamento");
    }
  };

  // Helpers
  const getTipoColor = (tipo: MovimentacaoTipo | null) => {
    switch (tipo) {
      case "ANDAMENTO":
        return "primary";
      case "PRAZO":
        return "warning";
      case "INTIMACAO":
        return "danger";
      case "AUDIENCIA":
        return "secondary";
      case "ANEXO":
        return "success";
      case "OUTRO":
        return "default";
      default:
        return "default";
    }
  };

  const getTipoIcon = (tipo: MovimentacaoTipo | null) => {
    switch (tipo) {
      case "ANDAMENTO":
        return (
          <Activity className="text-blue-600 dark:text-blue-400" size={16} />
        );
      case "PRAZO":
        return (
          <Timer className="text-amber-600 dark:text-amber-400" size={16} />
        );
      case "INTIMACAO":
        return (
          <Megaphone className="text-red-600 dark:text-red-400" size={16} />
        );
      case "AUDIENCIA":
        return (
          <CalendarDays
            className="text-purple-600 dark:text-purple-400"
            size={16}
          />
        );
      case "ANEXO":
        return (
          <Paperclip className="text-green-600 dark:text-green-400" size={16} />
        );
      case "OUTRO":
        return (
          <Sparkles className="text-gray-600 dark:text-gray-400" size={16} />
        );
      default:
        return <FileText className="text-gray-500" size={16} />;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>
            Andamentos Processuais
          </h1>
          <p className={subtitle({ fullWidth: true })}>
            Timeline completa de movimentações processuais
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          startContent={<Plus size={20} />}
          onPress={openCreateModal}
        >
          Novo Andamento
        </Button>
      </div>

      {/* Dashboard Cards */}
      {loadingDashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2">
                  <Sparkles className="text-blue-500" size={16} />
                  Total de Andamentos
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {finalDashboard?.total || 0}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
                <Activity className="text-white" size={28} />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 border-amber-200 dark:border-amber-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                  <Timer className="text-amber-500" size={16} />
                  Com Prazo
                </p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {getCountByType("PRAZO")}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-lg">
                <Clock className="text-white" size={28} />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20 border-red-200 dark:border-red-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                  <Megaphone className="text-red-500" size={16} />
                  Intimações
                </p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {getCountByType("INTIMACAO")}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-lg">
                <Bell className="text-white" size={28} />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                  <CalendarDays className="text-green-500" size={16} />
                  Audiências
                </p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {getCountByType("AUDIENCIA")}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                <Calendar className="text-white" size={28} />
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {/* Filtros Avançados */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Filtros</h3>
              {hasActiveFilters && (
                <Chip color="primary" size="sm" variant="flat">
                  {
                    [
                      filters.processoId,
                      filters.tipo,
                      searchTerm,
                      dateRange,
                      clienteId,
                    ].filter(Boolean).length
                  }{" "}
                  ativo(s)
                </Chip>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                isDisabled={!hasActiveFilters}
                size="sm"
                startContent={<RotateCcw className="w-4 h-4" />}
                variant="light"
                onPress={clearFilters}
              >
                Limpar
              </Button>
              <Button
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
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Filtro por Título */}
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium flex items-center gap-2"
                        htmlFor="filtro-titulo"
                      >
                        <Search className="w-4 h-4" />
                        Título
                      </label>
                      <Input
                        id="filtro-titulo"
                        placeholder="Buscar por título..."
                        size="sm"
                        startContent={
                          <Search className="w-4 h-4 text-default-400" />
                        }
                        value={searchTerm}
                        variant="bordered"
                        onValueChange={handleSearch}
                      />
                    </div>

                    {/* Filtro por Processo */}
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium flex items-center gap-2"
                        htmlFor="filtro-processo"
                      >
                        <FileText className="w-4 h-4" />
                        Processo
                      </label>
                      <Select
                        id="filtro-processo"
                        placeholder="Todos os processos"
                        selectedKeys={
                          filters.processoId ? [filters.processoId] : []
                        }
                        size="sm"
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;

                          handleFilterChange("processoId", value);
                        }}
                      >
                        {processos.map((proc: any) => (
                          <SelectItem
                            key={proc.id}
                            textValue={`${proc.numero}${proc.titulo ? ` - ${proc.titulo}` : ""}`}
                          >
                            {proc.numero}{" "}
                            {proc.titulo ? `- ${proc.titulo}` : ""}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Filtro por Tipo */}
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium flex items-center gap-2"
                        htmlFor="filtro-tipo"
                      >
                        <Tag className="w-4 h-4" />
                        Tipo
                      </label>
                      <Select
                        id="filtro-tipo"
                        placeholder="Todos os tipos"
                        selectedKeys={filters.tipo ? [filters.tipo] : []}
                        size="sm"
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;

                          handleFilterChange("tipo", value);
                        }}
                      >
                        {tipos.map((tipo) => (
                          <SelectItem key={tipo} textValue={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Filtro por Data Range */}
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium flex items-center gap-2"
                        htmlFor="filtro-data"
                      >
                        <Calendar className="w-4 h-4" />
                        Período
                      </label>
                      <DateRangePicker
                        className="max-w-xs"
                        id="filtro-data"
                        size="sm"
                        value={dateRange}
                        variant="bordered"
                        onChange={(range) => {
                          setDateRange(range);
                          if (range?.start && range?.end) {
                            setFilters({
                              ...filters,
                              dataInicio: new Date(range.start as any),
                              dataFim: new Date(range.end as any),
                            });
                          } else {
                            const { dataInicio, dataFim, ...restFilters } =
                              filters;

                            setFilters(restFilters);
                          }
                        }}
                      />
                    </div>

                    {/* Filtro por Cliente */}
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium flex items-center gap-2"
                        htmlFor="filtro-cliente"
                      >
                        <User className="w-4 h-4" />
                        Cliente
                      </label>
                      <Select
                        id="filtro-cliente"
                        placeholder="Todos os clientes"
                        selectedKeys={clienteId ? [clienteId] : []}
                        size="sm"
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;

                          setClienteId(value);
                          // Filtrar processos por cliente
                          if (value) {
                            const processosDoCliente = processos.filter(
                              (proc: any) =>
                                proc.partes?.some(
                                  (parte: any) => parte.clienteId === value,
                                ),
                            );
                            // Por enquanto, vamos apenas marcar que há um filtro ativo
                            // A lógica de filtro por cliente precisará ser implementada no backend
                          }
                        }}
                      >
                        {clientes.map((cliente: any) => (
                          <SelectItem
                            key={cliente.id}
                            textValue={`${cliente.firstName} ${cliente.lastName}`}
                          >
                            {cliente.firstName} {cliente.lastName}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                </CardBody>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Timeline de Andamentos */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Timeline</h2>
          </CardHeader>
          <CardBody>
            {loadingAndamentos ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : andamentos.length === 0 ? (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum andamento encontrado
                </p>
              </motion.div>
            ) : (
              <div className="relative space-y-6">
                {/* Linha vertical da timeline */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />

                <AnimatePresence>
                  {andamentos.map((andamento, index) => (
                    <motion.div
                      key={andamento.id}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative flex gap-6"
                      exit={{ opacity: 0, x: 50 }}
                      initial={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Ícone da timeline */}
                      <div
                        className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-4 flex items-center justify-center shadow-lg ${
                          andamento.tipo === "ANDAMENTO"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : andamento.tipo === "PRAZO"
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                              : andamento.tipo === "INTIMACAO"
                                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                : andamento.tipo === "AUDIENCIA"
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                  : andamento.tipo === "ANEXO"
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-500 bg-gray-50 dark:bg-gray-900/20"
                        }`}
                      >
                        {getTipoIcon(andamento.tipo)}
                      </div>

                      {/* Card do andamento */}
                      <Card
                        className={`flex-1 hover:shadow-xl transition-all duration-300 border-l-4 ${
                          andamento.tipo === "ANDAMENTO"
                            ? "border-l-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                            : andamento.tipo === "PRAZO"
                              ? "border-l-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                              : andamento.tipo === "INTIMACAO"
                                ? "border-l-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                                : andamento.tipo === "AUDIENCIA"
                                  ? "border-l-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10"
                                  : andamento.tipo === "ANEXO"
                                    ? "border-l-green-500 hover:bg-green-50 dark:hover:bg-green-900/10"
                                    : "border-l-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/10"
                        }`}
                      >
                        <CardBody className="p-4">
                          <div
                            className="flex justify-between items-start mb-2 cursor-pointer"
                            onClick={() => openViewModal(andamento)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {andamento.titulo}
                                </h3>
                                {andamento.tipo && (
                                  <Chip
                                    color={getTipoColor(andamento.tipo)}
                                    size="sm"
                                    variant="flat"
                                  >
                                    {andamento.tipo}
                                  </Chip>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Processo: {andamento.processo.numero}
                                {andamento.processo.titulo &&
                                  ` - ${andamento.processo.titulo}`}
                              </p>

                              {andamento.descricao && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                  {andamento.descricao}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {formatDateTime(andamento.dataMovimentacao)}
                                </span>

                                {andamento.prazo && (
                                  <span className="flex items-center gap-1 text-warning">
                                    <Clock size={14} />
                                    Prazo: {formatDate(andamento.prazo)}
                                  </span>
                                )}

                                {andamento.documentos.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Paperclip size={14} />
                                    {andamento.documentos.length} documento(s)
                                  </span>
                                )}

                                {andamento.prazosRelacionados.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {andamento.prazosRelacionados.length}{" "}
                                    prazo(s)
                                  </span>
                                )}

                                {andamento.criadoPor && (
                                  <span>
                                    Por: {andamento.criadoPor.firstName}{" "}
                                    {andamento.criadoPor.lastName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Tooltip color="primary" content="Editar">
                                <Button
                                  isIconOnly
                                  className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20 hover:scale-110 transition-transform duration-200"
                                  size="sm"
                                  variant="light"
                                  onPress={() => {
                                    openEditModal(andamento);
                                  }}
                                >
                                  <Edit3 size={16} />
                                </Button>
                              </Tooltip>

                              <Tooltip color="danger" content="Excluir">
                                <Button
                                  isIconOnly
                                  className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 hover:scale-110 transition-transform duration-200"
                                  color="danger"
                                  size="sm"
                                  variant="light"
                                  onPress={() => {
                                    handleDelete(andamento.id);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </Tooltip>
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

      {/* Modal de Criar/Editar/Visualizar */}
      <AndamentoModal
        andamento={selectedAndamento}
        isOpen={modalOpen}
        mode={modalMode}
        processos={processos}
        tipos={tipos}
        onClose={closeModal}
        onSuccess={mutateAndamentos}
      />
    </div>
  );
}

// ============================================
// MODAL DE ANDAMENTO
// ============================================

interface AndamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  andamento: Andamento | null;
  processos: any[];
  tipos: MovimentacaoTipo[];
  onSuccess: () => void;
}

function AndamentoModal({
  isOpen,
  onClose,
  mode,
  andamento,
  processos,
  tipos,
  onSuccess,
}: AndamentoModalProps) {
  const isReadOnly = mode === "view";

  // Calcular dados iniciais do formulário
  const initialFormData = useMemo(() => {
    if (mode === "create") {
      return {
        processoId: "",
        titulo: "",
        descricao: "",
        tipo: "",
        dataMovimentacao: today(getLocalTimeZone()),
        prazo: null,
        geraPrazo: false,
        // Campos para notificações
        notificarCliente: false,
        notificarEmail: false,
        notificarWhatsapp: false,
        mensagemPersonalizada: "",
      };
    } else if (andamento) {
      return {
        processoId: andamento.processo.id,
        titulo: andamento.titulo,
        descricao: andamento.descricao || "",
        tipo: andamento.tipo || "",
        dataMovimentacao: parseDate(
          new Date(andamento.dataMovimentacao).toISOString().split("T")[0],
        ),
        prazo: andamento.prazo
          ? parseDate(new Date(andamento.prazo).toISOString().split("T")[0])
          : null,
        geraPrazo: false,
        // Campos para notificações
        notificarCliente: andamento.notificarCliente || false,
        notificarEmail: andamento.notificarEmail || false,
        notificarWhatsapp: andamento.notificarWhatsapp || false,
        mensagemPersonalizada: andamento.mensagemPersonalizada || "",
      };
    }

    return {
      processoId: "",
      titulo: "",
      descricao: "",
      tipo: "",
      dataMovimentacao: today(getLocalTimeZone()),
      prazo: null,
      geraPrazo: false,
      notificarCliente: false,
      notificarEmail: false,
      notificarWhatsapp: false,
      mensagemPersonalizada: "",
    };
  }, [mode, andamento]);

  const [formData, setFormData] = useState<any>(initialFormData);
  const [saving, setSaving] = useState(false);

  // Atualizar formData quando initialFormData mudar
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleSubmit = async () => {
    if (!formData.processoId || !formData.titulo) {
      toast.error("Preencha os campos obrigatórios");

      return;
    }

    setSaving(true);

    const input: AndamentoCreateInput = {
      processoId: formData.processoId,
      titulo: formData.titulo,
      descricao: formData.descricao || undefined,
      tipo: formData.tipo || undefined,
      dataMovimentacao: formData.dataMovimentacao
        ? new Date(formData.dataMovimentacao.toString())
        : undefined,
      prazo: formData.prazo ? new Date(formData.prazo.toString()) : undefined,
      geraPrazo: formData.geraPrazo,
      // Campos para notificações
      notificarCliente: formData.notificarCliente,
      notificarEmail: formData.notificarEmail,
      notificarWhatsapp: formData.notificarWhatsapp,
      mensagemPersonalizada: formData.mensagemPersonalizada || undefined,
    };

    const result =
      mode === "create"
        ? await createAndamento(input)
        : await updateAndamento(andamento!.id, input);

    setSaving(false);

    if (result.success) {
      toast.success(
        mode === "create"
          ? "Andamento criado com sucesso!"
          : "Andamento atualizado com sucesso!",
      );
      onSuccess();
      onClose();
    } else {
      toast.error(result.error || "Erro ao salvar andamento");
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              {mode === "create" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Plus className="text-white" size={20} />
                  </div>
                  <span className="text-xl font-semibold">Novo Andamento</span>
                </>
              )}
              {mode === "edit" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Edit3 className="text-white" size={20} />
                  </div>
                  <span className="text-xl font-semibold">
                    Editar Andamento
                  </span>
                </>
              )}
              {mode === "view" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Eye className="text-white" size={20} />
                  </div>
                  <span className="text-xl font-semibold">
                    Detalhes do Andamento
                  </span>
                </>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"
                  htmlFor="modal-processo"
                >
                  <FileText className="text-blue-500" size={16} />
                  Processo
                </label>
                <Select
                  isRequired
                  classNames={{
                    trigger:
                      "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                  }}
                  id="modal-processo"
                  isDisabled={isReadOnly || mode === "edit"}
                  placeholder="Selecione o processo"
                  selectedKeys={
                    formData.processoId ? [formData.processoId] : []
                  }
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;

                    setFormData({ ...formData, processoId: value });
                  }}
                >
                  {processos.map((proc: any) => (
                    <SelectItem
                      key={proc.id}
                      textValue={`${proc.numero}${proc.titulo ? ` - ${proc.titulo}` : ""}`}
                    >
                      {proc.numero} {proc.titulo ? `- ${proc.titulo}` : ""}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"
                  htmlFor="modal-titulo"
                >
                  <Star className="text-yellow-500" size={16} />
                  Título
                </label>
                <Input
                  isRequired
                  classNames={{
                    input: "text-slate-700 dark:text-slate-300",
                    inputWrapper:
                      "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                  }}
                  id="modal-titulo"
                  isReadOnly={isReadOnly}
                  placeholder="Ex: Sentença proferida, Intimação recebida, etc"
                  value={formData.titulo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, titulo: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"
                  htmlFor="modal-descricao"
                >
                  <FileText className="text-green-500" size={16} />
                  Descrição
                </label>
                <Textarea
                  classNames={{
                    input: "text-slate-700 dark:text-slate-300",
                    inputWrapper:
                      "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                  }}
                  id="modal-descricao"
                  isReadOnly={isReadOnly}
                  minRows={3}
                  placeholder="Descreva o andamento em detalhes..."
                  value={formData.descricao}
                  onValueChange={(value) =>
                    setFormData({ ...formData, descricao: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"
                  htmlFor="modal-tipo"
                >
                  <Tag className="text-purple-500" size={16} />
                  Tipo
                </label>
                <Select
                  id="modal-tipo"
                  isDisabled={isReadOnly}
                  placeholder="Selecione o tipo"
                  selectedKeys={formData.tipo ? [formData.tipo] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;

                    setFormData({ ...formData, tipo: value });
                  }}
                >
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo} textValue={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"
                  htmlFor="modal-data-movimentacao"
                >
                  <Calendar className="text-blue-500" size={16} />
                  Data da Movimentação
                </label>
                <DatePicker
                  className="w-full"
                  id="modal-data-movimentacao"
                  isReadOnly={isReadOnly}
                  value={formData.dataMovimentacao}
                  onChange={(date) => {
                    if (date) {
                      setFormData({ ...formData, dataMovimentacao: date });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"
                  htmlFor="modal-prazo"
                >
                  <Clock className="text-amber-500" size={16} />
                  Prazo (opcional)
                </label>
                <DatePicker
                  className="w-full"
                  description="Se houver prazo relacionado a este andamento"
                  id="modal-prazo"
                  isReadOnly={isReadOnly}
                  value={formData.prazo}
                  onChange={(date) => {
                    setFormData({ ...formData, prazo: date });
                  }}
                />
              </div>

              {!isReadOnly && formData.prazo && mode === "create" && (
                <label
                  className="flex items-center gap-2 cursor-pointer"
                  htmlFor="gera-prazo"
                >
                  <input
                    checked={formData.geraPrazo}
                    className="w-4 h-4"
                    id="gera-prazo"
                    type="checkbox"
                    onChange={(e) =>
                      setFormData({ ...formData, geraPrazo: e.target.checked })
                    }
                  />
                  <span className="text-sm">
                    Gerar prazo automático no sistema
                  </span>
                </label>
              )}

              {/* Seção de Notificações */}
              {!isReadOnly && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Bell
                        className="text-blue-600 dark:text-blue-400"
                        size={20}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                      Notificações
                    </h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                    <label
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      htmlFor="notificar-cliente"
                    >
                      <input
                        checked={formData.notificarCliente}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        id="notificar-cliente"
                        type="checkbox"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notificarCliente: e.target.checked,
                          })
                        }
                      />
                      <MessageSquare
                        className="text-slate-600 dark:text-slate-400"
                        size={18}
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Notificar cliente sobre este andamento
                      </span>
                    </label>

                    {formData.notificarCliente && (
                      <div className="ml-6 space-y-3 border-l-2 border-blue-200 dark:border-blue-700 pl-4">
                        <label
                          className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          htmlFor="notificar-email"
                        >
                          <input
                            checked={formData.notificarEmail}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            id="notificar-email"
                            type="checkbox"
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                notificarEmail: e.target.checked,
                              })
                            }
                          />
                          <Mail
                            className="text-blue-600 dark:text-blue-400"
                            size={18}
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            Enviar notificação por email
                          </span>
                        </label>

                        <label
                          className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          htmlFor="notificar-whatsapp"
                        >
                          <input
                            checked={formData.notificarWhatsapp}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            id="notificar-whatsapp"
                            type="checkbox"
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                notificarWhatsapp: e.target.checked,
                              })
                            }
                          />
                          <Smartphone
                            className="text-green-600 dark:text-green-400"
                            size={18}
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            Enviar notificação por WhatsApp
                          </span>
                        </label>

                        <div className="mt-4 space-y-2">
                          <label
                            className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"
                            htmlFor="modal-mensagem-personalizada"
                          >
                            <MessageSquare
                              className="text-purple-500"
                              size={16}
                            />
                            Mensagem personalizada (opcional)
                          </label>
                          <Textarea
                            classNames={{
                              input: "text-slate-700 dark:text-slate-300",
                              inputWrapper:
                                "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                            }}
                            id="modal-mensagem-personalizada"
                            isReadOnly={isReadOnly}
                            minRows={2}
                            placeholder="Deixe em branco para usar mensagem padrão..."
                            value={formData.mensagemPersonalizada}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                mensagemPersonalizada: value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mode === "view" && andamento && (
                <>
                  {andamento.documentos.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        Documentos Anexados:
                      </p>
                      <div className="space-y-1">
                        {andamento.documentos.map((doc) => (
                          <a
                            key={doc.id}
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                            href={doc.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <Paperclip size={14} />
                            {doc.nome}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {andamento.prazosRelacionados.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        Prazos Relacionados:
                      </p>
                      <div className="space-y-2">
                        {andamento.prazosRelacionados.map((prazo) => (
                          <div
                            key={prazo.id}
                            className="p-2 bg-gray-100 dark:bg-gray-800 rounded"
                          >
                            <p className="text-sm font-medium">
                              {prazo.titulo}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Vencimento:{" "}
                              {new Date(
                                prazo.dataVencimento,
                              ).toLocaleDateString("pt-BR")}
                            </p>
                            <Chip
                              color={
                                prazo.status === "ABERTO"
                                  ? "warning"
                                  : "success"
                              }
                              size="sm"
                            >
                              {prazo.status}
                            </Chip>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {isReadOnly ? "Fechar" : "Cancelar"}
            </Button>
            {!isReadOnly && (
              <Button color="primary" isLoading={saving} onPress={handleSubmit}>
                {mode === "create" ? "Criar" : "Salvar"}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </motion.div>
    </Modal>
  );
}
