"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Avatar,
  Spinner,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Divider,
  Badge,
  Progress,
  Tooltip,
  Skeleton,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Checkbox,
  Pagination,
} from "@heroui/react";
import {
  UserIcon,
  MailIcon,
  ScaleIcon,
  CalendarIcon,
  Plus,
  Search,
  Filter,
  XCircle,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  Smartphone,
  FileText,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Crown,
  Award,
  Zap,
  Info,
  Target,
  Users,
  Building2,
  User,
  Key,
  Calendar,
  DollarSign,
  Percent,
  Star,
  MapPin,
  Clock,
  Shield,
  Activity,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import {
  getAdvogadosDoTenant,
  createAdvogado,
  updateAdvogado,
  deleteAdvogado,
  uploadAvatarAdvogado,
  deleteAvatarAdvogado,
  convertAdvogadoExternoToInterno,
  type Advogado,
  type CreateAdvogadoInput,
  type UpdateAdvogadoInput,
} from "@/app/actions/advogados";
import { title, subtitle } from "@/components/primitives";
import { EspecialidadeJuridica } from "@/app/generated/prisma";

export default function AdvogadosContent() {
  const { data, error, isLoading, mutate } = useSWR("advogados-do-tenant", getAdvogadosDoTenant, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0,
  });

  const advogados = data?.advogados || [];
  const loading = isLoading;
  const errorMessage = error?.message || data?.error;

  // Estados para modais e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<string>("all");
  const [selectedTipo, setSelectedTipo] = useState<string>("all"); // Novo filtro para tipo de advogado
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<string>("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAdvogado, setSelectedAdvogado] = useState<Advogado | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Hook para debounce da busca
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Estado do formulário
  const initialFormState: CreateAdvogadoInput = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    oabNumero: "",
    oabUf: "",
    especialidades: [],
    bio: "",
    telefone: "",
    whatsapp: "",
    comissaoPadrao: 0,
    comissaoAcaoGanha: 0,
    comissaoHonorarios: 0,
    isExterno: false,
  };

  const [formState, setFormState] = useState<CreateAdvogadoInput>(initialFormState);

  // Funções auxiliares
  const getNomeCompleto = (advogado: Advogado) => {
    const firstName = advogado.usuario.firstName || "";
    const lastName = advogado.usuario.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Nome não informado";
  };

  const getOAB = (advogado: Advogado) => {
    if (advogado.oabNumero && advogado.oabUf) {
      return `${advogado.oabUf} ${advogado.oabNumero}`;
    }
    return "OAB não informada";
  };

  const getStatusColor = (active: boolean) => {
    return active ? "success" : "danger";
  };

  const getStatusText = (active: boolean) => {
    return active ? "Ativo" : "Inativo";
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Função de ordenação
  const sortAdvogados = (advogados: Advogado[], field: string, direction: "asc" | "desc") => {
    return [...advogados].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case "nome":
          aValue = getNomeCompleto(a).toLowerCase();
          bValue = getNomeCompleto(b).toLowerCase();
          break;
        case "email":
          aValue = a.usuario.email.toLowerCase();
          bValue = b.usuario.email.toLowerCase();
          break;
        case "oab":
          aValue = getOAB(a).toLowerCase();
          bValue = getOAB(b).toLowerCase();
          break;
        case "especialidade":
          aValue = a.especialidades.length > 0 ? a.especialidades[0] : "";
          bValue = b.especialidades.length > 0 ? b.especialidades[0] : "";
          break;
        case "status":
          aValue = a.usuario.active ? 1 : 0;
          bValue = b.usuario.active ? 1 : 0;
          break;
        case "tipo":
          aValue = a.isExterno ? 1 : 0;
          bValue = b.isExterno ? 1 : 0;
          break;
        default:
          aValue = getNomeCompleto(a).toLowerCase();
          bValue = getNomeCompleto(b).toLowerCase();
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Filtrar, ordenar e paginar advogados
  const advogadosFiltrados = useMemo(() => {
    const filtered = advogados.filter((advogado) => {
      const nomeCompleto = getNomeCompleto(advogado).toLowerCase();
      const email = advogado.usuario.email.toLowerCase();
      const oab = getOAB(advogado).toLowerCase();

      const matchSearch =
        !debouncedSearchTerm || nomeCompleto.includes(debouncedSearchTerm.toLowerCase()) || email.includes(debouncedSearchTerm.toLowerCase()) || oab.includes(debouncedSearchTerm.toLowerCase());

      const matchStatus = selectedStatus === "all" || (selectedStatus === "active" && advogado.usuario.active) || (selectedStatus === "inactive" && !advogado.usuario.active);

      const matchEspecialidade = selectedEspecialidade === "all" || advogado.especialidades.includes(selectedEspecialidade as EspecialidadeJuridica);

      const matchTipo = selectedTipo === "all" || (selectedTipo === "escritorio" && !advogado.isExterno) || (selectedTipo === "externo" && advogado.isExterno);

      return matchSearch && matchStatus && matchEspecialidade && matchTipo;
    });

    const sorted = sortAdvogados(filtered, sortField, sortDirection);

    // Aplicar paginação
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return sorted.slice(startIndex, endIndex);
  }, [advogados, debouncedSearchTerm, selectedStatus, selectedEspecialidade, selectedTipo, sortField, sortDirection, currentPage, itemsPerPage]);

  // Calcular total de advogados filtrados (sem paginação)
  const totalAdvogadosFiltrados = useMemo(() => {
    return advogados.filter((advogado) => {
      const nomeCompleto = getNomeCompleto(advogado).toLowerCase();
      const email = advogado.usuario.email.toLowerCase();
      const oab = getOAB(advogado).toLowerCase();

      const matchSearch =
        !debouncedSearchTerm || nomeCompleto.includes(debouncedSearchTerm.toLowerCase()) || email.includes(debouncedSearchTerm.toLowerCase()) || oab.includes(debouncedSearchTerm.toLowerCase());

      const matchStatus = selectedStatus === "all" || (selectedStatus === "active" && advogado.usuario.active) || (selectedStatus === "inactive" && !advogado.usuario.active);

      const matchEspecialidade = selectedEspecialidade === "all" || advogado.especialidades.includes(selectedEspecialidade as EspecialidadeJuridica);

      const matchTipo = selectedTipo === "all" || (selectedTipo === "escritorio" && !advogado.isExterno) || (selectedTipo === "externo" && advogado.isExterno);

      return matchSearch && matchStatus && matchEspecialidade && matchTipo;
    }).length;
  }, [advogados, debouncedSearchTerm, selectedStatus, selectedEspecialidade, selectedTipo]);

  // Calcular informações de paginação
  const totalPages = Math.ceil(totalAdvogadosFiltrados / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalAdvogadosFiltrados);

  // Calcular métricas
  const metrics = useMemo(() => {
    if (!advogados) return { total: 0, ativos: 0, comOAB: 0, especialidades: 0, externos: 0, escritorio: 0 };

    const total = advogados.length;
    const ativos = advogados.filter((a) => a.usuario.active).length;
    const comOAB = advogados.filter((a) => a.oabNumero && a.oabUf).length;
    const especialidades = new Set(advogados.flatMap((a) => a.especialidades)).size;
    const externos = advogados.filter((a) => a.isExterno).length;
    const escritorio = advogados.filter((a) => !a.isExterno).length;

    return { total, ativos, comOAB, especialidades, externos, escritorio };
  }, [advogados]);

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm || selectedStatus !== "all" || selectedEspecialidade !== "all" || selectedTipo !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedEspecialidade("all");
    setSelectedTipo("all");
    setShowFilters(false);
  };

  // Handlers
  const handleCreateAdvogado = async () => {
    setIsSaving(true);
    try {
      // Validar formulário
      const validation = validateForm();
      if (!validation.isValid) {
        validation.errors.forEach((error) => toast.error(error));
        return;
      }

      const input: CreateAdvogadoInput = {
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        phone: formState.phone,
        oabNumero: formState.oabNumero,
        oabUf: formState.oabUf,
        especialidades: formState.especialidades,
        bio: formState.bio,
        telefone: formState.telefone,
        whatsapp: formState.whatsapp,
        comissaoPadrao: formState.comissaoPadrao,
        comissaoAcaoGanha: formState.comissaoAcaoGanha,
        comissaoHonorarios: formState.comissaoHonorarios,
        isExterno: formState.isExterno,
      };

      const result = await createAdvogado(input);

      if (result.success) {
        toast.success("Advogado criado com sucesso!");
        setIsCreateModalOpen(false);
        setFormState(initialFormState);
        mutate();
      } else {
        toast.error(result.error || "Erro ao criar advogado");
      }
    } catch (error) {
      console.error("Erro ao criar advogado:", error);
      toast.error("Erro ao criar advogado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAdvogado = (advogado: Advogado) => {
    setFormState({
      firstName: advogado.usuario.firstName || "",
      lastName: advogado.usuario.lastName || "",
      email: advogado.usuario.email,
      phone: advogado.usuario.phone || "",
      oabNumero: advogado.oabNumero || "",
      oabUf: advogado.oabUf || "",
      especialidades: advogado.especialidades,
      bio: advogado.bio || "",
      telefone: advogado.telefone || "",
      whatsapp: advogado.whatsapp || "",
      comissaoPadrao: advogado.comissaoPadrao,
      comissaoAcaoGanha: advogado.comissaoAcaoGanha,
      comissaoHonorarios: advogado.comissaoHonorarios,
    });
    setSelectedAdvogado(advogado);
    setIsEditModalOpen(true);
  };

  const handleViewAdvogado = (advogado: Advogado) => {
    setSelectedAdvogado(advogado);
    setIsViewModalOpen(true);
  };

  const handleUpdateAdvogado = async () => {
    if (!selectedAdvogado) return;

    setIsSaving(true);
    try {
      // Validar formulário
      const validation = validateForm();
      if (!validation.isValid) {
        validation.errors.forEach((error) => toast.error(error));
        return;
      }
      const input: UpdateAdvogadoInput = {
        firstName: formState.firstName,
        lastName: formState.lastName,
        phone: formState.phone,
        oabNumero: formState.oabNumero,
        oabUf: formState.oabUf,
        especialidades: formState.especialidades,
        bio: formState.bio,
        telefone: formState.telefone,
        whatsapp: formState.whatsapp,
        comissaoPadrao: formState.comissaoPadrao,
        comissaoAcaoGanha: formState.comissaoAcaoGanha,
        comissaoHonorarios: formState.comissaoHonorarios,
      };

      const result = await updateAdvogado(selectedAdvogado.id, input);

      if (result.success) {
        toast.success("Advogado atualizado com sucesso!");
        setIsEditModalOpen(false);
        setSelectedAdvogado(null);
        mutate();
      } else {
        toast.error(result.error || "Erro ao atualizar advogado");
      }
    } catch (error) {
      console.error("Erro ao atualizar advogado:", error);
      toast.error("Erro ao atualizar advogado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAdvogado = async (advogadoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este advogado?")) return;

    try {
      const result = await deleteAdvogado(advogadoId);

      if (result.success) {
        toast.success("Advogado excluído com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir advogado");
      }
    } catch (error) {
      console.error("Erro ao excluir advogado:", error);
      toast.error("Erro ao excluir advogado");
    }
  };

  const handleUploadAvatar = async (advogadoId: string, file: File) => {
    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatarAdvogado(advogadoId, file);

      if (result.success) {
        toast.success("Avatar atualizado com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao fazer upload do avatar");
      }
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      toast.error("Erro ao fazer upload do avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async (advogadoId: string) => {
    if (!confirm("Tem certeza que deseja remover o avatar?")) return;

    try {
      const result = await deleteAvatarAdvogado(advogadoId);

      if (result.success) {
        toast.success("Avatar removido com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao remover avatar");
      }
    } catch (error) {
      console.error("Erro ao remover avatar:", error);
      toast.error("Erro ao remover avatar");
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Resetar paginação quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedEspecialidade, selectedTipo]);

  const handleConvertToInterno = async (advogadoId: string) => {
    if (!confirm("Tem certeza que deseja transformar este advogado externo em interno? Esta ação não pode ser desfeita.")) return;

    try {
      const result = await convertAdvogadoExternoToInterno(advogadoId);

      if (result.success) {
        toast.success("Advogado convertido para interno com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao converter advogado");
      }
    } catch (error) {
      console.error("Erro ao converter advogado:", error);
      toast.error("Erro ao converter advogado");
    }
  };

  // Funções de validação
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateOAB = (oabNumero: string, oabUf: string): boolean => {
    if (!oabNumero || !oabUf) return true; // OAB é opcional
    const oabRegex = /^\d{1,6}$/;
    return oabRegex.test(oabNumero) && oabUf.length === 2;
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Telefone é opcional
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar campos obrigatórios
    if (!formState.firstName.trim()) {
      errors.push("Nome é obrigatório");
    }
    if (!formState.lastName.trim()) {
      errors.push("Sobrenome é obrigatório");
    }
    if (!formState.email.trim()) {
      errors.push("Email é obrigatório");
    }

    // Validar formato do email
    if (formState.email && !validateEmail(formState.email)) {
      errors.push("Email inválido");
    }

    // Validar OAB
    if (formState.oabNumero && formState.oabUf && !validateOAB(formState.oabNumero, formState.oabUf)) {
      errors.push("OAB inválida. Número deve ter até 6 dígitos e UF deve ter 2 caracteres");
    }

    // Validar telefone
    if (formState.phone && !validatePhone(formState.phone)) {
      errors.push("Telefone inválido. Use o formato (XX) XXXXX-XXXX");
    }

    // Validar comissões (devem ser entre 0 e 100)
    if (formState.comissaoPadrao < 0 || formState.comissaoPadrao > 100) {
      errors.push("Comissão padrão deve estar entre 0 e 100%");
    }
    if (formState.comissaoAcaoGanha < 0 || formState.comissaoAcaoGanha > 100) {
      errors.push("Comissão ação ganha deve estar entre 0 e 100%");
    }
    if (formState.comissaoHonorarios < 0 || formState.comissaoHonorarios > 100) {
      errors.push("Comissão honorários deve estar entre 0 e 100%");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Opções para filtros
  const statusOptions = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Ativos" },
    { key: "inactive", label: "Inativos" },
  ];

  const tipoOptions = [
    { key: "all", label: "Todos" },
    { key: "escritorio", label: "Do Escritório" },
    { key: "externo", label: "Externos Identificados" },
  ];

  const especialidadeOptions = [
    { key: "all", label: "Todas" },
    { key: EspecialidadeJuridica.CIVIL, label: "Direito Civil" },
    { key: EspecialidadeJuridica.CRIMINAL, label: "Direito Criminal" },
    { key: EspecialidadeJuridica.TRABALHISTA, label: "Direito Trabalhista" },
    { key: EspecialidadeJuridica.ADMINISTRATIVO, label: "Direito Administrativo" },
    { key: EspecialidadeJuridica.TRIBUTARIO, label: "Direito Tributário" },
    { key: EspecialidadeJuridica.EMPRESARIAL, label: "Direito Empresarial" },
    { key: EspecialidadeJuridica.FAMILIA, label: "Direito de Família" },
    { key: EspecialidadeJuridica.CONSUMIDOR, label: "Direito do Consumidor" },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-danger text-center">
          <p className="text-lg font-semibold">Erro ao carregar advogados</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
        <Button color="primary" onClick={() => mutate()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Melhorado */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Equipe de Advogados</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Gerencie os advogados do seu escritório de advocacia</p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          startContent={<Plus size={20} />}
          onPress={() => {
            setFormState(initialFormState);
            setIsCreateModalOpen(true);
          }}
        >
          Novo Advogado
        </Button>
      </motion.div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Total de Advogados */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-indigo-900/30 border-blue-300 dark:border-blue-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="text-white" size={24} />
                </div>
                <Badge content="+" color="success" variant="shadow">
                  <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total de Advogados</p>
                <p className="text-4xl font-bold text-blue-800 dark:text-blue-200">{metrics.total}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Equipe do escritório</p>
              </div>
              <div className="mt-4">
                <Progress value={75} color="primary" size="sm" className="opacity-60" />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card Advogados Ativos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-200 dark:from-green-900/30 dark:via-emerald-800/20 dark:to-teal-900/30 border-green-300 dark:border-green-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <Badge content="✓" color="success" variant="shadow">
                  <Activity className="text-green-600 dark:text-green-400" size={20} />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Advogados Ativos</p>
                <p className="text-4xl font-bold text-green-800 dark:text-green-200">{metrics.ativos}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Em atividade</p>
              </div>
              <div className="mt-4">
                <Progress value={metrics.total > 0 ? (metrics.ativos / metrics.total) * 100 : 0} color="success" size="sm" className="opacity-60" />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card Com OAB */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-50 via-violet-100 to-purple-200 dark:from-purple-900/30 dark:via-violet-800/20 dark:to-purple-900/30 border-purple-300 dark:border-purple-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ScaleIcon className="text-white" size={24} />
                </div>
                <Badge content="OAB" color="secondary" variant="shadow">
                  <Shield className="text-purple-600 dark:text-purple-400" size={20} />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Com OAB</p>
                <p className="text-4xl font-bold text-purple-800 dark:text-purple-200">{metrics.comOAB}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Registrados na OAB</p>
              </div>
              <div className="mt-4">
                <Progress value={metrics.total > 0 ? (metrics.comOAB / metrics.total) * 100 : 0} color="secondary" size="sm" className="opacity-60" />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card Especialidades */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-200 dark:from-orange-900/30 dark:via-amber-800/20 dark:to-yellow-900/30 border-orange-300 dark:border-orange-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="text-white" size={24} />
                </div>
                <Badge content="+" color="warning" variant="shadow">
                  <Award className="text-orange-600 dark:text-orange-400" size={20} />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Especialidades</p>
                <p className="text-4xl font-bold text-orange-800 dark:text-orange-200">{metrics.especialidades}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">Áreas de atuação</p>
              </div>
              <div className="mt-4">
                <Progress value={75} color="warning" size="sm" className="opacity-60" />
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Cards Adicionais para Advogados Externos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Advogados do Escritório */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
          <Card className="bg-gradient-to-br from-emerald-50 via-green-100 to-teal-200 dark:from-emerald-900/30 dark:via-green-800/20 dark:to-teal-900/30 border-emerald-300 dark:border-emerald-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="text-white" size={24} />
                </div>
                <Badge content="🏢" color="success" variant="shadow">
                  <Users className="text-emerald-600 dark:text-emerald-400" size={20} />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Do Escritório</p>
                <p className="text-4xl font-bold text-emerald-800 dark:text-emerald-200">{metrics.escritorio}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Equipe interna</p>
              </div>
              <div className="mt-4">
                <Progress value={metrics.total > 0 ? (metrics.escritorio / metrics.total) * 100 : 0} color="success" size="sm" className="opacity-60" />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Card Advogados Externos Identificados */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
          <Card className="bg-gradient-to-br from-rose-50 via-pink-100 to-red-200 dark:from-rose-900/30 dark:via-pink-800/20 dark:to-red-900/30 border-rose-300 dark:border-rose-600 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <User className="text-white" size={24} />
                </div>
                <Badge content="🔍" color="danger" variant="shadow">
                  <Eye className="text-rose-600 dark:text-rose-400" size={20} />
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wide">Externos Identificados</p>
                <p className="text-4xl font-bold text-rose-800 dark:text-rose-200">{metrics.externos}</p>
                <p className="text-xs text-rose-600 dark:text-rose-400">Encontrados em processos</p>
              </div>
              <div className="mt-4">
                <Progress value={metrics.total > 0 ? (metrics.externos / metrics.total) * 100 : 0} color="danger" size="sm" className="opacity-60" />
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Filtros Avançados */}
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
                  <p className="text-sm text-slate-600 dark:text-slate-400">Encontre exatamente o advogado que precisa</p>
                </div>
                {hasActiveFilters && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                    <Badge content={[searchTerm, selectedStatus !== "all", selectedEspecialidade !== "all", selectedTipo !== "all"].filter(Boolean).length} color="primary" variant="shadow" size="lg">
                      <Chip color="primary" size="lg" variant="flat" className="font-semibold">
                        {[searchTerm, selectedStatus !== "all", selectedEspecialidade !== "all", selectedTipo !== "all"].filter(Boolean).length} filtro(s) ativo(s)
                      </Chip>
                    </Badge>
                  </motion.div>
                )}
              </div>
              <div className="flex gap-2">
                <Tooltip content="Limpar todos os filtros" color="warning">
                  <Button
                    isDisabled={!hasActiveFilters}
                    size="sm"
                    startContent={<RotateCcw className="w-4 h-4" />}
                    variant="light"
                    color="warning"
                    onPress={clearFilters}
                    className="hover:scale-105 transition-transform"
                  >
                    Limpar
                  </Button>
                </Tooltip>
                <Tooltip content={showFilters ? "Ocultar filtros" : "Mostrar filtros"} color="primary">
                  <Button
                    size="sm"
                    startContent={showFilters ? <XCircle className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                    variant="light"
                    color="primary"
                    onPress={() => setShowFilters(!showFilters)}
                    className="hover:scale-105 transition-transform"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Filtro por Busca */}
                    <motion.div className="space-y-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                      <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="filtro-busca">
                        <Search className="w-4 h-4 text-blue-500" />
                        Busca Inteligente
                      </label>
                      <Input
                        id="filtro-busca"
                        placeholder="Nome, email, OAB..."
                        size="md"
                        startContent={<Search className="w-4 h-4 text-default-400" />}
                        value={searchTerm}
                        variant="bordered"
                        classNames={{
                          input: "text-slate-700 dark:text-slate-300",
                          inputWrapper: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500",
                        }}
                        onValueChange={setSearchTerm}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Busca em nomes, emails e OAB</p>
                    </motion.div>

                    {/* Filtro por Status */}
                    <motion.div className="space-y-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                      <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="filtro-status">
                        <Activity className="w-4 h-4 text-green-500" />
                        Status
                      </label>
                      <Select
                        id="filtro-status"
                        placeholder="Selecione o status"
                        selectedKeys={[selectedStatus]}
                        size="md"
                        variant="bordered"
                        classNames={{
                          trigger: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500",
                        }}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        {statusOptions.map((option) => (
                          <SelectItem key={option.key} textValue={option.label}>
                            <div className="flex items-center gap-2">
                              {option.key === "all" && <Users className="w-4 h-4" />}
                              {option.key === "active" && <CheckCircle className="w-4 h-4" />}
                              {option.key === "inactive" && <XCircle className="w-4 h-4" />}
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Filtre por status do advogado</p>
                    </motion.div>

                    {/* Filtro por Especialidade */}
                    <motion.div className="space-y-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                      <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="filtro-especialidade">
                        <Star className="w-4 h-4 text-purple-500" />
                        Especialidade
                      </label>
                      <Select
                        id="filtro-especialidade"
                        placeholder="Selecione a especialidade"
                        selectedKeys={[selectedEspecialidade]}
                        size="md"
                        variant="bordered"
                        classNames={{
                          trigger: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500",
                        }}
                        onChange={(e) => setSelectedEspecialidade(e.target.value)}
                      >
                        {especialidadeOptions.map((option) => (
                          <SelectItem key={option.key} textValue={option.label}>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Filtre por área de atuação</p>
                    </motion.div>

                    {/* Filtro por Tipo */}
                    <motion.div className="space-y-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                      <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="filtro-tipo">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        Tipo de Advogado
                      </label>
                      <Select
                        id="filtro-tipo"
                        placeholder="Selecione o tipo"
                        selectedKeys={[selectedTipo]}
                        size="md"
                        variant="bordered"
                        classNames={{
                          trigger: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500",
                        }}
                        onChange={(e) => setSelectedTipo(e.target.value)}
                      >
                        {tipoOptions.map((option) => (
                          <SelectItem key={option.key} textValue={option.label}>
                            <div className="flex items-center gap-2">
                              {option.key === "all" && <Users className="w-4 h-4" />}
                              {option.key === "escritorio" && <Building2 className="w-4 h-4" />}
                              {option.key === "externo" && <User className="w-4 h-4" />}
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Filtre por tipo de advogado</p>
                    </motion.div>
                  </div>

                  {/* Resumo dos Filtros Ativos */}
                  {hasActiveFilters && (
                    <motion.div
                      className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Filtros Aplicados
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                          <Chip color="primary" variant="flat" size="sm">
                            Busca: "{searchTerm}"
                          </Chip>
                        )}
                        {selectedStatus !== "all" && (
                          <Chip color="success" variant="flat" size="sm">
                            Status: {statusOptions.find((opt) => opt.key === selectedStatus)?.label}
                          </Chip>
                        )}
                        {selectedEspecialidade !== "all" && (
                          <Chip color="secondary" variant="flat" size="sm">
                            Especialidade: {especialidadeOptions.find((opt) => opt.key === selectedEspecialidade)?.label}
                          </Chip>
                        )}
                        {selectedTipo !== "all" && (
                          <Chip color="warning" variant="flat" size="sm">
                            Tipo: {tipoOptions.find((opt) => opt.key === selectedTipo)?.label}
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

      {/* Controles de Paginação */}
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="shadow-lg border border-slate-200 dark:border-slate-700">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {startItem} a {endItem} de {totalAdvogadosFiltrados} advogados
                </span>
                <Select
                  size="sm"
                  value={itemsPerPage.toString()}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-20"
                >
                  <SelectItem key="5" value="5">
                    5
                  </SelectItem>
                  <SelectItem key="10" value="10">
                    10
                  </SelectItem>
                  <SelectItem key="20" value="20">
                    20
                  </SelectItem>
                  <SelectItem key="50" value="50">
                    50
                  </SelectItem>
                </Select>
                <span className="text-sm text-slate-600 dark:text-slate-400">por página</span>
              </div>
              {totalPages > 1 && <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} size="sm" showControls showShadow />}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Lista de Advogados Melhorada */}
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="shadow-xl border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Equipe de Advogados</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{advogadosFiltrados.length} advogado(s) encontrado(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge content={advogadosFiltrados.length} color="primary" variant="shadow" size="lg">
                  <Target className="text-indigo-600 dark:text-indigo-400" size={20} />
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {advogadosFiltrados.length === 0 ? (
              <motion.div animate={{ opacity: 1, scale: 1 }} className="text-center py-16" initial={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Users className="text-slate-400" size={48} />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Nenhum advogado encontrado</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{hasActiveFilters ? "Tente ajustar os filtros para encontrar advogados" : "Comece adicionando seu primeiro advogado"}</p>
                {!hasActiveFilters && (
                  <Button
                    color="primary"
                    startContent={<Plus size={20} />}
                    onPress={() => {
                      setFormState(initialFormState);
                      setIsCreateModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    Adicionar Primeiro Advogado
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {advogadosFiltrados.map((advogado, index) => (
                    <motion.div
                      key={advogado.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group shadow-lg hover:shadow-2xl">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                          <div className="flex gap-4 w-full">
                            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                              <Avatar showFallback className="bg-blue-500 text-white shadow-lg" name={getInitials(getNomeCompleto(advogado))} size="lg" src={advogado.usuario.avatarUrl || undefined} />
                            </motion.div>
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {getNomeCompleto(advogado)}
                                </h3>
                                <Chip color={getStatusColor(advogado.usuario.active)} size="sm" variant="flat">
                                  {getStatusText(advogado.usuario.active)}
                                </Chip>
                                {advogado.isExterno && (
                                  <Chip color="warning" size="sm" variant="flat" startContent={<Eye className="h-3 w-3" />}>
                                    Externo
                                  </Chip>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Chip color="primary" size="sm" variant="flat" startContent={<ScaleIcon className="h-3 w-3" />}>
                                  {getOAB(advogado)}
                                </Chip>
                              </div>
                            </div>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light" className="hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 transition-all">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu aria-label="Ações do advogado">
                                <DropdownItem
                                  key="view"
                                  startContent={<Eye className="h-4 w-4" />}
                                  onPress={() => {
                                    console.log("Abrindo modal de visualização");
                                    handleViewAdvogado(advogado);
                                  }}
                                >
                                  Ver Detalhes
                                </DropdownItem>
                                <DropdownItem
                                  key="edit"
                                  startContent={<Edit className="h-4 w-4" />}
                                  onPress={() => {
                                    console.log("Abrindo modal de edição");
                                    handleEditAdvogado(advogado);
                                  }}
                                >
                                  Editar
                                </DropdownItem>
                                {advogado.isExterno && (
                                  <DropdownItem
                                    key="convert"
                                    className="text-warning"
                                    color="warning"
                                    startContent={<UserPlus className="h-4 w-4" />}
                                    onPress={() => handleConvertToInterno(advogado.id)}
                                  >
                                    Transformar em Interno
                                  </DropdownItem>
                                )}
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="h-4 w-4" />} onPress={() => handleDeleteAdvogado(advogado.id)}>
                                  Excluir
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </CardHeader>
                        <CardBody className="p-6 space-y-4">
                          {/* Informações de Contato */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <MailIcon className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{advogado.usuario.email}</span>
                            </div>
                            {advogado.telefone && (
                              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <Phone className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{advogado.telefone}</span>
                              </div>
                            )}
                            {advogado.whatsapp && (
                              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <Smartphone className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{advogado.whatsapp}</span>
                              </div>
                            )}
                          </div>

                          <Divider className="my-4" />

                          {/* Especialidades ou Informações de Processos */}
                          {advogado.isExterno ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Processos Identificados</p>
                              <div className="flex items-center gap-2">
                                <Chip color="info" size="sm" variant="flat" startContent={<FileText className="h-3 w-3" />}>
                                  {advogado.processosCount || 0} processo(s)
                                </Chip>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Advogado externo identificado</span>
                              </div>
                            </div>
                          ) : (
                            advogado.especialidades.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Especialidades</p>
                                <div className="flex flex-wrap gap-1">
                                  {advogado.especialidades.slice(0, 2).map((especialidade) => (
                                    <Chip key={especialidade} color="secondary" size="sm" variant="flat" className="text-xs">
                                      {especialidadeOptions.find((opt) => opt.key === especialidade)?.label || especialidade}
                                    </Chip>
                                  ))}
                                  {advogado.especialidades.length > 2 && (
                                    <Chip color="default" size="sm" variant="flat" className="text-xs">
                                      +{advogado.especialidades.length - 2}
                                    </Chip>
                                  )}
                                </div>
                              </div>
                            )
                          )}

                          {/* Ações */}
                          <div className="flex gap-2">
                            <Button
                              color="primary"
                              size="sm"
                              variant="flat"
                              className="flex-1 hover:scale-105 transition-transform"
                              startContent={<Eye className="h-4 w-4" />}
                              onPress={() => handleViewAdvogado(advogado)}
                            >
                              Ver Detalhes
                            </Button>
                            <Button
                              color="secondary"
                              size="sm"
                              variant="flat"
                              className="hover:scale-105 transition-transform"
                              startContent={<Edit className="h-4 w-4" />}
                              onPress={() => handleEditAdvogado(advogado)}
                            >
                              Editar
                            </Button>
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

      {/* Modal Criar Advogado */}
      <Modal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} size="2xl">
        <ModalContent>
          <ModalHeader>Novo Advogado</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Nome"
                  placeholder="Nome do advogado"
                  startContent={<User className="h-4 w-4 text-default-400" />}
                  value={formState.firstName}
                  onValueChange={(value) => setFormState({ ...formState, firstName: value })}
                />
                <Input
                  isRequired
                  label="Sobrenome"
                  placeholder="Sobrenome do advogado"
                  startContent={<User className="h-4 w-4 text-default-400" />}
                  value={formState.lastName}
                  onValueChange={(value) => setFormState({ ...formState, lastName: value })}
                />
              </div>

              <Input
                isRequired
                label="Email"
                placeholder="email@exemplo.com"
                type="email"
                startContent={<MailIcon className="h-4 w-4 text-default-400" />}
                value={formState.email}
                onValueChange={(value) => setFormState({ ...formState, email: value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Número OAB"
                  placeholder="123456"
                  startContent={<ScaleIcon className="h-4 w-4 text-default-400" />}
                  value={formState.oabNumero}
                  onValueChange={(value) => setFormState({ ...formState, oabNumero: value })}
                />
                <Input
                  label="UF OAB"
                  placeholder="SP"
                  startContent={<MapPin className="h-4 w-4 text-default-400" />}
                  value={formState.oabUf}
                  onValueChange={(value) => setFormState({ ...formState, oabUf: value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  startContent={<Phone className="h-4 w-4 text-default-400" />}
                  value={formState.telefone}
                  onValueChange={(value) => setFormState({ ...formState, telefone: value })}
                />
                <Input
                  label="WhatsApp"
                  placeholder="(11) 99999-9999"
                  startContent={<Smartphone className="h-4 w-4 text-default-400" />}
                  value={formState.whatsapp}
                  onValueChange={(value) => setFormState({ ...formState, whatsapp: value })}
                />
              </div>

              <Textarea label="Biografia" placeholder="Conte um pouco sobre o advogado..." value={formState.bio} onValueChange={(value) => setFormState({ ...formState, bio: value })} />

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Comissão Padrão (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={formState.comissaoPadrao.toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoPadrao: parseFloat(value) || 0 })}
                />
                <Input
                  label="Comissão Ação Ganha (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={formState.comissaoAcaoGanha.toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoAcaoGanha: parseFloat(value) || 0 })}
                />
                <Input
                  label="Comissão Honorários (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={formState.comissaoHonorarios.toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoHonorarios: parseFloat(value) || 0 })}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSaving} onPress={handleCreateAdvogado}>
              Criar Advogado
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Editar Advogado */}
      <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} size="2xl">
        <ModalContent>
          <ModalHeader>Editar Advogado</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Nome"
                  placeholder="Nome do advogado"
                  startContent={<User className="h-4 w-4 text-default-400" />}
                  value={formState.firstName}
                  onValueChange={(value) => setFormState({ ...formState, firstName: value })}
                />
                <Input
                  isRequired
                  label="Sobrenome"
                  placeholder="Sobrenome do advogado"
                  startContent={<User className="h-4 w-4 text-default-400" />}
                  value={formState.lastName}
                  onValueChange={(value) => setFormState({ ...formState, lastName: value })}
                />
              </div>

              <Input
                isRequired
                label="Email"
                placeholder="email@exemplo.com"
                type="email"
                startContent={<MailIcon className="h-4 w-4 text-default-400" />}
                value={formState.email}
                onValueChange={(value) => setFormState({ ...formState, email: value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Número OAB"
                  placeholder="123456"
                  startContent={<ScaleIcon className="h-4 w-4 text-default-400" />}
                  value={formState.oabNumero}
                  onValueChange={(value) => setFormState({ ...formState, oabNumero: value })}
                />
                <Input
                  label="UF OAB"
                  placeholder="SP"
                  startContent={<MapPin className="h-4 w-4 text-default-400" />}
                  value={formState.oabUf}
                  onValueChange={(value) => setFormState({ ...formState, oabUf: value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  startContent={<Phone className="h-4 w-4 text-default-400" />}
                  value={formState.telefone}
                  onValueChange={(value) => setFormState({ ...formState, telefone: value })}
                />
                <Input
                  label="WhatsApp"
                  placeholder="(11) 99999-9999"
                  startContent={<Smartphone className="h-4 w-4 text-default-400" />}
                  value={formState.whatsapp}
                  onValueChange={(value) => setFormState({ ...formState, whatsapp: value })}
                />
              </div>

              <Textarea label="Biografia" placeholder="Conte um pouco sobre o advogado..." value={formState.bio} onValueChange={(value) => setFormState({ ...formState, bio: value })} />

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Comissão Padrão (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={formState.comissaoPadrao.toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoPadrao: parseFloat(value) || 0 })}
                />
                <Input
                  label="Comissão Ação Ganha (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={formState.comissaoAcaoGanha.toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoAcaoGanha: parseFloat(value) || 0 })}
                />
                <Input
                  label="Comissão Honorários (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={formState.comissaoHonorarios.toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoHonorarios: parseFloat(value) || 0 })}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSaving} onPress={handleUpdateAdvogado}>
              Salvar Alterações
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Visualização do Advogado */}
      <Modal isOpen={isViewModalOpen} onOpenChange={setIsViewModalOpen} size="2xl">
        <ModalContent>
          <ModalHeader>Detalhes do Advogado</ModalHeader>
          <ModalBody>
            {selectedAdvogado && (
              <div className="space-y-6">
                {/* Header do Advogado */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Avatar
                    showFallback
                    className="bg-blue-500 text-white shadow-lg"
                    name={getInitials(getNomeCompleto(selectedAdvogado))}
                    size="lg"
                    src={selectedAdvogado.usuario.avatarUrl || undefined}
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{getNomeCompleto(selectedAdvogado)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip color={getStatusColor(selectedAdvogado.usuario.active)} size="sm" variant="flat">
                        {getStatusText(selectedAdvogado.usuario.active)}
                      </Chip>
                      <Chip color="primary" size="sm" variant="flat" startContent={<ScaleIcon className="h-3 w-3" />}>
                        {getOAB(selectedAdvogado)}
                      </Chip>
                      {selectedAdvogado.isExterno && (
                        <Chip color="warning" size="sm" variant="flat" startContent={<Eye className="h-3 w-3" />}>
                          Advogado Externo Identificado
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
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <MailIcon className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedAdvogado.usuario.email}</p>
                      </div>
                    </div>
                    {selectedAdvogado.telefone && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <Phone className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Telefone</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedAdvogado.telefone}</p>
                        </div>
                      </div>
                    )}
                    {selectedAdvogado.whatsapp && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <Smartphone className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">WhatsApp</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedAdvogado.whatsapp}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Especialidades ou Informações de Processos */}
                {selectedAdvogado.isExterno ? (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Processos Identificados
                    </h4>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Este advogado foi identificado em {selectedAdvogado.processosCount || 0} processo(s) do seu escritório</p>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Ele não faz parte da equipe do escritório, mas aparece como advogado de outras partes nos processos.</p>
                    </div>
                  </div>
                ) : (
                  selectedAdvogado.especialidades.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Especialidades
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAdvogado.especialidades.map((especialidade) => (
                          <Chip key={especialidade} color="secondary" variant="flat" startContent={<Star className="h-3 w-3" />}>
                            {especialidadeOptions.find((opt) => opt.key === especialidade)?.label || especialidade}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* Comissões - Apenas para advogados do escritório */}
                {!selectedAdvogado.isExterno && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Comissões
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2">
                          <Percent className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400">Padrão</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{selectedAdvogado.comissaoPadrao}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-2">
                          <Percent className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-xs text-green-600 dark:text-green-400">Ação Ganha</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{selectedAdvogado.comissaoAcaoGanha}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center gap-2">
                          <Percent className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-xs text-purple-600 dark:text-purple-400">Honorários</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{selectedAdvogado.comissaoHonorarios}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Biografia */}
                {selectedAdvogado.bio && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Biografia
                    </h4>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{selectedAdvogado.bio}</p>
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {selectedAdvogado.isExterno ? (
                    <div className="w-full space-y-3">
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                          <Eye className="h-5 w-5" />
                          <span className="font-medium">Advogado Externo</span>
                        </div>
                        <p className="text-sm text-amber-600 dark:text-amber-400">Este advogado foi identificado automaticamente através dos processos.</p>
                      </div>
                      <Button
                        color="warning"
                        variant="flat"
                        startContent={<UserPlus className="h-4 w-4" />}
                        onPress={() => {
                          setIsViewModalOpen(false);
                          handleConvertToInterno(selectedAdvogado.id);
                        }}
                        className="w-full"
                      >
                        Transformar em Advogado Interno
                      </Button>
                    </div>
                  ) : (
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<Edit className="h-4 w-4" />}
                      onPress={() => {
                        setIsViewModalOpen(false);
                        handleEditAdvogado(selectedAdvogado);
                      }}
                      className="flex-1"
                    >
                      Editar Advogado
                    </Button>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
