"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Chip, Tooltip, Skeleton, DatePicker } from "@heroui/react";
import { parseDate, getLocalTimeZone, today } from "@internationalized/date";
import { toast } from "sonner";
import {
  Clock,
  FileText,
  Calendar,
  Plus,
  Search,
  Filter,
  X,
  Pencil,
  Trash2,
  AlertCircle,
  Activity,
  Bell,
  Paperclip,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Users,
  Scale,
  Gavel,
  FileCheck,
  Timer,
  Megaphone,
  CalendarDays,
  FolderOpen,
  Star,
  TrendingUp,
  Target,
  Shield,
  Award,
  BookOpen,
  Briefcase,
  Building,
  UserCheck,
  Send,
  Eye,
  Edit3,
  Save,
  RefreshCw,
  Download,
  Upload,
  Link,
  Copy,
  Share,
  Heart,
  ThumbsUp,
  Flag,
  MapPin,
  Phone,
  Globe,
  Lock,
  Unlock,
  Settings,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Rocket,
  Crown,
  Gem,
  Flame,
  Sun,
  Moon,
  Cloud,
  Rainbow,
  CheckSquare,
  Coffee,
  Lightbulb,
  Gift,
  Trophy,
  Medal,
  Diamond,
  Leaf,
  Flower,
  TreePine,
  Mountain,
  Waves,
  Tag,
  RotateCcw,
  XCircle,
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

  // Estado do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedAndamento, setSelectedAndamento] = useState<Andamento | null>(null);

  // SWR - Fetch data
  const { data: andamentosData, mutate: mutateAndamentos, isLoading: loadingAndamentos } = useSWR(["andamentos", filters], () => listAndamentos(filters));

  const { data: dashboardData, isLoading: loadingDashboard } = useSWR("dashboard-andamentos", getDashboardAndamentos);

  const { data: processosData } = useSWR("processos-list", getAllProcessos);

  const { data: tiposData } = useSWR("tipos-movimentacao", getTiposMovimentacao);

  const andamentos = (andamentosData?.data || []) as Andamento[];
  const dashboard = dashboardData?.data as DashboardData | undefined;
  const processos = processosData?.processos || [];
  const tipos = tiposData?.data || [];

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
    setShowFilters(false);
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filters.processoId || filters.tipo || searchTerm;

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
        return <Activity size={16} className="text-blue-600 dark:text-blue-400" />;
      case "PRAZO":
        return <Timer size={16} className="text-amber-600 dark:text-amber-400" />;
      case "INTIMACAO":
        return <Megaphone size={16} className="text-red-600 dark:text-red-400" />;
      case "AUDIENCIA":
        return <CalendarDays size={16} className="text-purple-600 dark:text-purple-400" />;
      case "ANEXO":
        return <Paperclip size={16} className="text-green-600 dark:text-green-400" />;
      case "OUTRO":
        return <Sparkles size={16} className="text-gray-600 dark:text-gray-400" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
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
          <h1 className={title({ size: "lg", color: "blue" })}>Andamentos Processuais</h1>
          <p className={subtitle({ fullWidth: true })}>Timeline completa de movimentações processuais</p>
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
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{dashboard.total}</p>
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
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{dashboard.porTipo.find((t) => t.tipo === "PRAZO")?._count || 0}</p>
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
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{dashboard.porTipo.find((t) => t.tipo === "INTIMACAO")?._count || 0}</p>
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
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{dashboard.porTipo.find((t) => t.tipo === "AUDIENCIA")?._count || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                <Calendar className="text-white" size={28} />
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {/* Filtros Avançados */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Filtros</h3>
              {hasActiveFilters && (
                <Chip color="primary" size="sm" variant="flat">
                  {[filters.processoId, filters.tipo, searchTerm].filter(Boolean).length} ativo(s)
                </Chip>
              )}
            </div>
            <div className="flex gap-2">
              <Button isDisabled={!hasActiveFilters} size="sm" startContent={<RotateCcw className="w-4 h-4" />} variant="light" onPress={clearFilters}>
                Limpar
              </Button>
              <Button size="sm" startContent={showFilters ? <XCircle className="w-4 h-4" /> : <Filter className="w-4 h-4" />} variant="light" onPress={() => setShowFilters(!showFilters)}>
                {showFilters ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </CardHeader>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Filtro por Título */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2" htmlFor="filtro">
                        <Search className="w-4 h-4" />
                        Título
                      </label>
                      <Input
                        placeholder="Buscar por título..."
                        size="sm"
                        startContent={<Search className="w-4 h-4 text-default-400" />}
                        value={searchTerm}
                        variant="bordered"
                        onValueChange={handleSearch}
                      />
                    </div>

                    {/* Filtro por Processo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2" htmlFor="processo">
                        <FileText className="w-4 h-4" />
                        Processo
                      </label>
                      <Select
                        placeholder="Todos os processos"
                        size="sm"
                        variant="bordered"
                        selectedKeys={filters.processoId ? [filters.processoId] : []}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          handleFilterChange("processoId", value);
                        }}
                      >
                        {processos.map((proc: any) => (
                          <SelectItem key={proc.id} textValue={`${proc.numero}${proc.titulo ? ` - ${proc.titulo}` : ""}`}>
                            {proc.numero} {proc.titulo ? `- ${proc.titulo}` : ""}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Filtro por Tipo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2" htmlFor="tipo">
                        <Tag className="w-4 h-4" />
                        Tipo
                      </label>
                      <Select
                        placeholder="Todos os tipos"
                        size="sm"
                        variant="bordered"
                        selectedKeys={filters.tipo ? [filters.tipo] : []}
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
                  </div>
                </CardBody>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Timeline de Andamentos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
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
              <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 dark:text-gray-400">Nenhum andamento encontrado</p>
              </motion.div>
            ) : (
              <div className="relative space-y-6">
                {/* Linha vertical da timeline */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />

                <AnimatePresence>
                  {andamentos.map((andamento, index) => (
                    <motion.div
                      key={andamento.id}
                      className="relative flex gap-6"
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
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
                        isPressable
                        className={`flex-1 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 ${
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
                        onPress={() => openViewModal(andamento)}
                      >
                        <CardBody className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{andamento.titulo}</h3>
                                {andamento.tipo && (
                                  <Chip color={getTipoColor(andamento.tipo)} size="sm" variant="flat">
                                    {andamento.tipo}
                                  </Chip>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Processo: {andamento.processo.numero}
                                {andamento.processo.titulo && ` - ${andamento.processo.titulo}`}
                              </p>

                              {andamento.descricao && <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{andamento.descricao}</p>}

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
                                    {andamento.prazosRelacionados.length} prazo(s)
                                  </span>
                                )}

                                {andamento.criadoPor && (
                                  <span>
                                    Por: {andamento.criadoPor.firstName} {andamento.criadoPor.lastName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Tooltip content="Editar" color="primary">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => openEditModal(andamento)}
                                  className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20 hover:scale-110 transition-transform duration-200"
                                >
                                  <Edit3 size={16} />
                                </Button>
                              </Tooltip>

                              <Tooltip content="Excluir" color="danger">
                                <Button
                                  isIconOnly
                                  color="danger"
                                  size="sm"
                                  variant="light"
                                  onPress={() => handleDelete(andamento.id)}
                                  className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 hover:scale-110 transition-transform duration-200"
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
      <AndamentoModal andamento={selectedAndamento} isOpen={modalOpen} mode={modalMode} processos={processos} tipos={tipos} onClose={closeModal} onSuccess={mutateAndamentos} />
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

function AndamentoModal({ isOpen, onClose, mode, andamento, processos, tipos, onSuccess }: AndamentoModalProps) {
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
        dataMovimentacao: parseDate(new Date(andamento.dataMovimentacao).toISOString().split("T")[0]),
        prazo: andamento.prazo ? parseDate(new Date(andamento.prazo).toISOString().split("T")[0]) : null,
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
      dataMovimentacao: formData.dataMovimentacao ? new Date(formData.dataMovimentacao.toString()) : undefined,
      prazo: formData.prazo ? new Date(formData.prazo.toString()) : undefined,
      geraPrazo: formData.geraPrazo,
      // Campos para notificações
      notificarCliente: formData.notificarCliente,
      notificarEmail: formData.notificarEmail,
      notificarWhatsapp: formData.notificarWhatsapp,
      mensagemPersonalizada: formData.mensagemPersonalizada || undefined,
    };

    const result = mode === "create" ? await createAndamento(input) : await updateAndamento(andamento!.id, input);

    setSaving(false);

    if (result.success) {
      toast.success(mode === "create" ? "Andamento criado com sucesso!" : "Andamento atualizado com sucesso!");
      onSuccess();
      onClose();
    } else {
      toast.error(result.error || "Erro ao salvar andamento");
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
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
                  <span className="text-xl font-semibold">Editar Andamento</span>
                </>
              )}
              {mode === "view" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Eye className="text-white" size={20} />
                  </div>
                  <span className="text-xl font-semibold">Detalhes do Andamento</span>
                </>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <FileText className="text-blue-500" size={16} />
                  Processo
                </label>
                <Select
                  isRequired
                  isDisabled={isReadOnly || mode === "edit"}
                  placeholder="Selecione o processo"
                  selectedKeys={formData.processoId ? [formData.processoId] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormData({ ...formData, processoId: value });
                  }}
                  classNames={{
                    trigger: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                  }}
                >
                  {processos.map((proc: any) => (
                    <SelectItem key={proc.id} textValue={`${proc.numero}${proc.titulo ? ` - ${proc.titulo}` : ""}`}>
                      {proc.numero} {proc.titulo ? `- ${proc.titulo}` : ""}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Star className="text-yellow-500" size={16} />
                  Título
                </label>
                <Input
                  isRequired
                  isReadOnly={isReadOnly}
                  placeholder="Ex: Sentença proferida, Intimação recebida, etc"
                  value={formData.titulo}
                  onValueChange={(value) => setFormData({ ...formData, titulo: value })}
                  classNames={{
                    input: "text-slate-700 dark:text-slate-300",
                    inputWrapper: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <FileText className="text-green-500" size={16} />
                  Descrição
                </label>
                <Textarea
                  isReadOnly={isReadOnly}
                  minRows={3}
                  placeholder="Descreva o andamento em detalhes..."
                  value={formData.descricao}
                  onValueChange={(value) => setFormData({ ...formData, descricao: value })}
                  classNames={{
                    input: "text-slate-700 dark:text-slate-300",
                    inputWrapper: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                  }}
                />
              </div>

              <Select
                isDisabled={isReadOnly}
                label="Tipo"
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

              <DatePicker
                isReadOnly={isReadOnly}
                label="Data da Movimentação"
                value={formData.dataMovimentacao}
                onChange={(date) => {
                  if (date) {
                    setFormData({ ...formData, dataMovimentacao: date });
                  }
                }}
                className="w-full"
              />

              <DatePicker
                description="Se houver prazo relacionado a este andamento"
                isReadOnly={isReadOnly}
                label="Prazo (opcional)"
                value={formData.prazo}
                onChange={(date) => {
                  setFormData({ ...formData, prazo: date });
                }}
                className="w-full"
              />

              {!isReadOnly && formData.prazo && mode === "create" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input checked={formData.geraPrazo} className="w-4 h-4" type="checkbox" onChange={(e) => setFormData({ ...formData, geraPrazo: e.target.checked })} />
                  <span className="text-sm">Gerar prazo automático no sistema</span>
                </label>
              )}

              {/* Seção de Notificações */}
              {!isReadOnly && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Bell className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Notificações</h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
                      <input
                        checked={formData.notificarCliente}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        type="checkbox"
                        onChange={(e) => setFormData({ ...formData, notificarCliente: e.target.checked })}
                      />
                      <MessageSquare className="text-slate-600 dark:text-slate-400" size={18} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notificar cliente sobre este andamento</span>
                    </label>

                    {formData.notificarCliente && (
                      <div className="ml-6 space-y-3 border-l-2 border-blue-200 dark:border-blue-700 pl-4">
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
                          <input
                            checked={formData.notificarEmail}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            type="checkbox"
                            onChange={(e) => setFormData({ ...formData, notificarEmail: e.target.checked })}
                          />
                          <Mail className="text-blue-600 dark:text-blue-400" size={18} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Enviar notificação por email</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
                          <input
                            checked={formData.notificarWhatsapp}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            type="checkbox"
                            onChange={(e) => setFormData({ ...formData, notificarWhatsapp: e.target.checked })}
                          />
                          <Smartphone className="text-green-600 dark:text-green-400" size={18} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Enviar notificação por WhatsApp</span>
                        </label>

                        <div className="mt-4">
                          <Textarea
                            isReadOnly={isReadOnly}
                            label="Mensagem personalizada (opcional)"
                            placeholder="Deixe em branco para usar mensagem padrão..."
                            minRows={2}
                            value={formData.mensagemPersonalizada}
                            onValueChange={(value) => setFormData({ ...formData, mensagemPersonalizada: value })}
                            classNames={{
                              input: "text-slate-700 dark:text-slate-300",
                              inputWrapper: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                            }}
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
                      <p className="text-sm font-semibold mb-2">Documentos Anexados:</p>
                      <div className="space-y-1">
                        {andamento.documentos.map((doc) => (
                          <a key={doc.id} className="flex items-center gap-2 text-sm text-primary hover:underline" href={doc.url} rel="noopener noreferrer" target="_blank">
                            <Paperclip size={14} />
                            {doc.nome}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {andamento.prazosRelacionados.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Prazos Relacionados:</p>
                      <div className="space-y-2">
                        {andamento.prazosRelacionados.map((prazo) => (
                          <div key={prazo.id} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <p className="text-sm font-medium">{prazo.titulo}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Vencimento: {new Date(prazo.dataVencimento).toLocaleDateString("pt-BR")}</p>
                            <Chip color={prazo.status === "ABERTO" ? "warning" : "success"} size="sm">
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
