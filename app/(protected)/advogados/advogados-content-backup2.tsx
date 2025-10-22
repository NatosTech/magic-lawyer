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
  DatePicker,
  DateRangePicker,
  Popover,
  PopoverTrigger,
  PopoverContent,
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
  Download,
  Table,
  CheckSquare,
  Square,
  CheckCircle2,
  X,
  History,
  Scale,
  Bell,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { AdvogadoHistorico } from "./components/advogado-historico";
import { AdvogadoNotificacoes } from "./components/advogado-notificacoes";

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
import { useAdvogadosPerformance, usePerformanceGeral } from "@/app/hooks/use-advogados-performance";
import { useAdvogadosComissoes, useComissoesGeral } from "@/app/hooks/use-advogados-comissoes";
import { useEstadosBrasil } from "@/app/hooks/use-estados-brasil";
import { enviarEmailBoasVindas } from "@/app/actions/advogados-emails";
import { title, subtitle } from "@/components/primitives";
import { EspecialidadeJuridica } from "@/app/generated/prisma";
import { parseDate } from "@internationalized/date";
import { CepInput } from "@/components/cep-input";
import { CpfInput } from "@/components/cpf-input";
import { type CepData } from "@/types/brazil";
import { Globe, Linkedin, Twitter, Instagram } from "lucide-react";

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
  const [selectedAdvogados, setSelectedAdvogados] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [comissaoMin, setComissaoMin] = useState<string>("");
  const [comissaoMax, setComissaoMax] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [showPerformanceReports, setShowPerformanceReports] = useState(false);
  const [showCommissionsDashboard, setShowCommissionsDashboard] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAdvogado, setSelectedAdvogado] = useState<Advogado | null>(null);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isNotificacoesModalOpen, setIsNotificacoesModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCredenciaisModalOpen, setIsCredenciaisModalOpen] = useState(false);
  const [credenciaisTemporarias, setCredenciaisTemporarias] = useState<{
    email: string;
    senhaTemporaria: string;
    linkLogin: string;
  } | null>(null);

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

  // Hooks de performance
  const { performance: performanceData, isLoading: isLoadingPerformance, error: performanceError } = useAdvogadosPerformance();
  const { performance: performanceGeral, isLoading: isLoadingPerformanceGeral, error: performanceGeralError } = usePerformanceGeral();

  // Debug logs
  console.log("Performance Debug:", {
    performanceData,
    isLoadingPerformance,
    performanceError,
    performanceGeral,
    isLoadingPerformanceGeral,
    performanceGeralError,
    showPerformanceReports,
  });

  // Hooks de comissões
  const { comissoes: comissoesData, isLoading: isLoadingComissoes } = useAdvogadosComissoes();
  const { comissoes: comissoesGeral, isLoading: isLoadingComissoesGeral } = useComissoesGeral();

  // Hook de estados do Brasil
  const { ufs, isLoading: isLoadingUfs } = useEstadosBrasil();

  // Estado do formulário
  const initialFormState: CreateAdvogadoInput = {
    // Dados pessoais
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    rg: "",
    dataNascimento: "",
    observacoes: "",

    // Dados profissionais
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

    // Dados profissionais adicionais
    formacao: "",
    experiencia: "",
    premios: "",
    publicacoes: "",
    website: "",
    linkedin: "",
    twitter: "",
    instagram: "",

    // Configurações de notificação
    notificarEmail: true,
    notificarWhatsapp: true,
    notificarSistema: true,

    // Configurações de acesso
    podeCriarProcessos: true,
    podeEditarProcessos: true,
    podeExcluirProcessos: false,
    podeGerenciarClientes: true,
    podeAcessarFinanceiro: false,

    // Configurações de criação
    criarAcessoUsuario: true,
    enviarEmailCredenciais: true,

    // Endereço
    endereco: {
      apelido: "Principal",
      tipo: "ESCRITORIO",
      principal: true,
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      pais: "Brasil",
      telefone: "",
      observacoes: "",
    },
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

      // Filtro de status - quando "all" ou vazio, mostra todos
      const matchStatus = !selectedStatus || selectedStatus === "all" || (selectedStatus === "active" && advogado.usuario.active) || (selectedStatus === "inactive" && !advogado.usuario.active);

      // Filtro de especialidade - quando "all" ou vazio, mostra todos
      const matchEspecialidade = !selectedEspecialidade || selectedEspecialidade === "all" || advogado.especialidades.includes(selectedEspecialidade as EspecialidadeJuridica);

      // Filtro de tipo - quando "all" ou vazio, mostra todos
      const matchTipo = !selectedTipo || selectedTipo === "all" || (selectedTipo === "escritorio" && !advogado.isExterno) || (selectedTipo === "externo" && advogado.isExterno);

      // Filtros avançados
      const matchComissaoMin = !comissaoMin || advogado.comissaoPadrao >= parseFloat(comissaoMin);
      const matchComissaoMax = !comissaoMax || advogado.comissaoPadrao <= parseFloat(comissaoMax);

      // Para data de cadastro, vamos usar a data de criação do usuário (simulado)
      const matchDataInicio = !dataInicio || true; // Em produção, comparar com data de criação
      const matchDataFim = !dataFim || true; // Em produção, comparar com data de criação

      return matchSearch && matchStatus && matchEspecialidade && matchTipo && matchComissaoMin && matchComissaoMax && matchDataInicio && matchDataFim;
    });

    const sorted = sortAdvogados(filtered, sortField, sortDirection);

    // Aplicar paginação
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return sorted.slice(startIndex, endIndex);
  }, [advogados, debouncedSearchTerm, selectedStatus, selectedEspecialidade, selectedTipo, sortField, sortDirection, currentPage, itemsPerPage, comissaoMin, comissaoMax, dataInicio, dataFim]);

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

      // Filtros avançados
      const matchComissaoMin = !comissaoMin || advogado.comissaoPadrao >= parseFloat(comissaoMin);
      const matchComissaoMax = !comissaoMax || advogado.comissaoPadrao <= parseFloat(comissaoMax);

      // Para data de cadastro, vamos usar a data de criação do usuário (simulado)
      const matchDataInicio = !dataInicio || true; // Em produção, comparar com data de criação
      const matchDataFim = !dataFim || true; // Em produção, comparar com data de criação

      return matchSearch && matchStatus && matchEspecialidade && matchTipo && matchComissaoMin && matchComissaoMax && matchDataInicio && matchDataFim;
    }).length;
  }, [advogados, debouncedSearchTerm, selectedStatus, selectedEspecialidade, selectedTipo, comissaoMin, comissaoMax, dataInicio, dataFim]);

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

        // Se há credenciais temporárias, mostrar modal
        if (result.credenciais) {
          setCredenciaisTemporarias(result.credenciais);
          setIsCredenciaisModalOpen(true);
        }
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

  const handleCepFound = (cepData: CepData) => {
    setFormState(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        logradouro: cepData.logradouro || "",
        bairro: cepData.bairro || "",
        cidade: cepData.localidade || "",
        estado: cepData.uf || "",
        cep: cepData.cep || "",
      }
    }));
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

  const handleViewHistorico = (advogado: Advogado) => {
    setSelectedAdvogado(advogado);
    setIsHistoricoModalOpen(true);
  };

  const handleViewNotificacoes = (advogado: Advogado) => {
    setSelectedAdvogado(advogado);
    setIsNotificacoesModalOpen(true);
  };

  const handleEnviarEmailBoasVindas = async (advogado: Advogado) => {
    try {
      const result = await enviarEmailBoasVindas(advogado.id);

      if (result.success) {
        toast.success("Email de boas-vindas enviado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao enviar email de boas-vindas");
      }
    } catch (error) {
      console.error("Erro ao enviar email de boas-vindas:", error);
      toast.error("Erro interno ao enviar email");
    }
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
  }, [searchTerm, selectedStatus, selectedEspecialidade, selectedTipo, comissaoMin, comissaoMax, dataInicio, dataFim]);

  // Resetar seleção quando filtros mudarem
  useEffect(() => {
    setSelectedAdvogados([]);
  }, [searchTerm, selectedStatus, selectedEspecialidade, selectedTipo, currentPage]);

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

  // Funções de exportação
  const exportToCSV = () => {
    try {
      const csvData = advogados.map((advogado) => ({
        Nome: getNomeCompleto(advogado),
        Email: advogado.usuario.email,
        Telefone: advogado.usuario.phone || advogado.telefone || "",
        OAB: getOAB(advogado),
        Especialidades: advogado.especialidades.join(", "),
        Status: getStatusText(advogado.usuario.active),
        Tipo: advogado.isExterno ? "Externo" : "Interno",
        "Comissão Padrão": `${advogado.comissaoPadrao}%`,
        "Comissão Ação Ganha": `${advogado.comissaoAcaoGanha}%`,
        "Comissão Honorários": `${advogado.comissaoHonorarios}%`,
        Bio: advogado.bio || "",
        WhatsApp: advogado.whatsapp || "",
      }));

      const headers = Object.keys(csvData[0]);
      const csvContent = [headers.join(","), ...csvData.map((row) => headers.map((header) => `"${row[header as keyof typeof row]}"`).join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `advogados_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Arquivo CSV exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast.error("Erro ao exportar arquivo CSV");
    }
  };

  const exportToPDF = () => {
    try {
      // Criar conteúdo HTML para o PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Advogados</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
            .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Advogados</h1>
          <div class="header">
            <p><strong>Data de Exportação:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
            <p><strong>Total de Advogados:</strong> ${advogados.length}</p>
          </div>
          <div class="summary">
            <h3>Resumo</h3>
            <p><strong>Total:</strong> ${metrics.total} | <strong>Ativos:</strong> ${metrics.ativos} | <strong>Com OAB:</strong> ${metrics.comOAB} | <strong>Externos:</strong> ${metrics.externos} | <strong>Do Escritório:</strong> ${metrics.escritorio}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>OAB</th>
                <th>Especialidades</th>
                <th>Status</th>
                <th>Tipo</th>
                <th>Comissões</th>
              </tr>
            </thead>
            <tbody>
              ${advogados
                .map(
                  (advogado) => `
                <tr>
                  <td>${getNomeCompleto(advogado)}</td>
                  <td>${advogado.usuario.email}</td>
                  <td>${getOAB(advogado)}</td>
                  <td>${advogado.especialidades.join(", ")}</td>
                  <td>${getStatusText(advogado.usuario.active)}</td>
                  <td>${advogado.isExterno ? "Externo" : "Interno"}</td>
                  <td>Padrão: ${advogado.comissaoPadrao}% | Ação: ${advogado.comissaoAcaoGanha}% | Honorários: ${advogado.comissaoHonorarios}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  // Funções de ações em lote
  const handleSelectAll = () => {
    if (selectedAdvogados.length === advogadosFiltrados.length) {
      setSelectedAdvogados([]);
    } else {
      setSelectedAdvogados(advogadosFiltrados.map((advogado) => advogado.id));
    }
  };

  const handleSelectAdvogado = (advogadoId: string) => {
    setSelectedAdvogados((prev) => (prev.includes(advogadoId) ? prev.filter((id) => id !== advogadoId) : [...prev, advogadoId]));
  };

  const handleBulkActivate = async () => {
    if (selectedAdvogados.length === 0) return;

    setIsBulkActionLoading(true);
    try {
      // Simular ação em lote (em produção, seria uma action no backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`${selectedAdvogados.length} advogado(s) ativado(s) com sucesso!`);
      setSelectedAdvogados([]);
      mutate();
    } catch (error) {
      console.error("Erro ao ativar advogados:", error);
      toast.error("Erro ao ativar advogados");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedAdvogados.length === 0) return;

    if (!confirm(`Tem certeza que deseja desativar ${selectedAdvogados.length} advogado(s)?`)) return;

    setIsBulkActionLoading(true);
    try {
      // Simular ação em lote (em produção, seria uma action no backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`${selectedAdvogados.length} advogado(s) desativado(s) com sucesso!`);
      setSelectedAdvogados([]);
      mutate();
    } catch (error) {
      console.error("Erro ao desativar advogados:", error);
      toast.error("Erro ao desativar advogados");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAdvogados.length === 0) return;

    if (!confirm(`Tem certeza que deseja excluir ${selectedAdvogados.length} advogado(s)? Esta ação não pode ser desfeita.`)) return;

    setIsBulkActionLoading(true);
    try {
      // Simular ação em lote (em produção, seria uma action no backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`${selectedAdvogados.length} advogado(s) excluído(s) com sucesso!`);
      setSelectedAdvogados([]);
      mutate();
    } catch (error) {
      console.error("Erro ao excluir advogados:", error);
      toast.error("Erro ao excluir advogados");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Funções de filtros avançados
  const clearAdvancedFilters = () => {
    setComissaoMin("");
    setComissaoMax("");
    setDataInicio("");
    setDataFim("");
  };

  const hasAdvancedFilters = comissaoMin || comissaoMax || dataInicio || dataFim;

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
    if ((formState.comissaoPadrao ?? 0) < 0 || (formState.comissaoPadrao ?? 0) > 100) {
      errors.push("Comissão padrão deve estar entre 0 e 100%");
    }
    if ((formState.comissaoAcaoGanha ?? 0) < 0 || (formState.comissaoAcaoGanha ?? 0) > 100) {
      errors.push("Comissão ação ganha deve estar entre 0 e 100%");
    }
    if ((formState.comissaoHonorarios ?? 0) < 0 || (formState.comissaoHonorarios ?? 0) > 100) {
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
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" startContent={<Download size={20} />} className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 w-full sm:w-auto" size="sm">
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Opções de exportação">
              <DropdownItem key="csv" startContent={<Table className="h-4 w-4" />} onPress={exportToCSV}>
                Exportar para CSV
              </DropdownItem>
              <DropdownItem key="pdf" startContent={<FileText className="h-4 w-4" />} onPress={exportToPDF}>
                Exportar para PDF
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Button
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
            startContent={<BarChart3 size={20} />}
            onPress={() => setShowPerformanceReports(!showPerformanceReports)}
            size="sm"
          >
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Relatórios</span>
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
            startContent={<DollarSign size={20} />}
            onPress={() => setShowCommissionsDashboard(!showCommissionsDashboard)}
            size="sm"
          >
            <span className="hidden sm:inline">Comissões</span>
            <span className="sm:hidden">Comissões</span>
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
            startContent={<Plus size={20} />}
            onPress={() => {
              setFormState(initialFormState);
              setIsCreateModalOpen(true);
            }}
            size="sm"
          >
            <span className="hidden sm:inline">Novo Advogado</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </motion.div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                <Tooltip content="Filtros avançados" color="secondary">
                  <Button
                    size="sm"
                    startContent={<Filter className="w-4 h-4" />}
                    variant="light"
                    color="secondary"
                    onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`hover:scale-105 transition-transform ${hasAdvancedFilters ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    Avançados
                    {hasAdvancedFilters && (
                      <Badge content="!" color="primary" size="sm" className="ml-1">
                        !
                      </Badge>
                    )}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {showFilters && (
              <motion.div animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

          {/* Filtros Avançados */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <CardBody className="p-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros Avançados
                      </h4>
                      <Button size="sm" variant="light" color="danger" startContent={<X className="h-4 w-4" />} onPress={clearAdvancedFilters} isDisabled={!hasAdvancedFilters}>
                        Limpar Filtros
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Filtro de Comissão Mínima */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Comissão Mínima (%)
                        </label>
                        <Input type="number" placeholder="Ex: 5" value={comissaoMin} onChange={(e) => setComissaoMin(e.target.value)} min="0" max="100" size="sm" />
                      </div>

                      {/* Filtro de Comissão Máxima */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Comissão Máxima (%)
                        </label>
                        <Input type="number" placeholder="Ex: 20" value={comissaoMax} onChange={(e) => setComissaoMax(e.target.value)} min="0" max="100" size="sm" />
                      </div>

                      {/* Filtro de Data de Início */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Data de Início
                        </label>
                        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} size="sm" />
                      </div>

                      {/* Filtro de Data de Fim */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Data de Fim
                        </label>
                        <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} size="sm" />
                      </div>
                    </div>

                    {/* Resumo dos Filtros Ativos */}
                    {hasAdvancedFilters && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Filtros ativos:</strong> {comissaoMin && `Comissão mín: ${comissaoMin}%`}
                          {comissaoMin && comissaoMax && ", "}
                          {comissaoMax && `Comissão máx: ${comissaoMax}%`}
                          {(comissaoMin || comissaoMax) && (dataInicio || dataFim) && ", "}
                          {dataInicio && `De: ${new Date(dataInicio).toLocaleDateString("pt-BR")}`}
                          {dataInicio && dataFim && " "}
                          {dataFim && `Até: ${new Date(dataFim).toLocaleDateString("pt-BR")}`}
                        </p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Relatórios de Performance */}
      <AnimatePresence>
        {showPerformanceReports && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <Card className="shadow-lg border-2 border-green-200 dark:border-green-700">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-b border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Relatórios de Performance</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">Análise detalhada do desempenho dos advogados</p>
                    </div>
                  </div>
                  <Button size="sm" variant="light" color="danger" startContent={<X className="h-4 w-4" />} onPress={() => setShowPerformanceReports(false)}>
                    Fechar
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                {isLoadingPerformance || isLoadingPerformanceGeral ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spinner size="lg" />
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando relatórios de performance...</p>
                  </div>
                ) : performanceError || performanceGeralError ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-danger text-center">
                      <p className="text-lg font-semibold">Erro ao carregar relatórios</p>
                      <p className="text-sm mt-2">{performanceError?.message || performanceGeralError?.message || "Erro desconhecido"}</p>
                    </div>
                    <Button
                      color="primary"
                      className="mt-4"
                      onPress={() => {
                        // Forçar refresh dos dados
                        window.location.reload();
                      }}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Estatísticas Gerais */}
                    {performanceGeral && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-300 dark:border-blue-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-blue-500 rounded-full w-fit mx-auto mb-2">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-blue-800 dark:text-blue-200">{performanceGeral.totalAdvogados}</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Total de Advogados</p>
                          </CardBody>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-300 dark:border-green-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-green-500 rounded-full w-fit mx-auto mb-2">
                              <Scale className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-green-800 dark:text-green-200">{performanceGeral.totalProcessos}</h4>
                            <p className="text-sm text-green-600 dark:text-green-400">Total de Processos</p>
                          </CardBody>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-300 dark:border-purple-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-purple-500 rounded-full w-fit mx-auto mb-2">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-purple-800 dark:text-purple-200">{performanceGeral.taxaSucessoGeral}%</h4>
                            <p className="text-sm text-purple-600 dark:text-purple-400">Taxa de Sucesso</p>
                          </CardBody>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-300 dark:border-orange-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-orange-500 rounded-full w-fit mx-auto mb-2">
                              <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-orange-800 dark:text-orange-200">R$ {performanceGeral.comissaoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h4>
                            <p className="text-sm text-orange-600 dark:text-orange-400">Comissões Totais</p>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {/* Top Performers */}
                    {performanceGeral?.topPerformers && performanceGeral.topPerformers.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <Crown className="h-5 w-5 text-yellow-500" />
                          Top Performers
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {performanceGeral.topPerformers.map((performer, index) => (
                            <Card key={performer.advogadoId} className="border border-slate-200 dark:border-slate-700">
                              <CardBody className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-500" : "bg-slate-300"}`}>
                                    <Crown className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{performer.advogadoNome}</h5>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {performer.totalProcessos} processos • {performer.taxaSucesso}% sucesso
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance Individual */}
                    {performanceData && performanceData.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-500" />
                          Performance Individual
                        </h4>
                        <div className="space-y-4">
                          {performanceData.slice(0, 5).map((advogado) => (
                            <Card key={advogado.advogadoId} className="border border-slate-200 dark:border-slate-700">
                              <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={advogado.advogadoNome} className="bg-blue-500 text-white" />
                                    <div>
                                      <h5 className="font-semibold text-slate-800 dark:text-slate-200">{advogado.advogadoNome}</h5>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">OAB {advogado.advogadoOAB}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <p className="font-semibold text-slate-800 dark:text-slate-200">{advogado.totalProcessos}</p>
                                      <p className="text-slate-600 dark:text-slate-400">Processos</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="font-semibold text-green-600 dark:text-green-400">{advogado.taxaSucesso}%</p>
                                      <p className="text-slate-600 dark:text-slate-400">Sucesso</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="font-semibold text-blue-600 dark:text-blue-400">R$ {advogado.totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p className="text-slate-600 dark:text-slate-400">Comissões</p>
                                    </div>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard de Comissões */}
      <AnimatePresence>
        {showCommissionsDashboard && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <Card className="shadow-lg border-2 border-purple-200 dark:border-purple-700">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-b border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200">Dashboard de Comissões</h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Controle e análise de comissões dos advogados</p>
                    </div>
                  </div>
                  <Button size="sm" variant="light" color="danger" startContent={<X className="h-4 w-4" />} onPress={() => setShowCommissionsDashboard(false)}>
                    Fechar
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                {isLoadingComissoes || isLoadingComissoesGeral ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spinner size="lg" />
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando dashboard de comissões...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Estatísticas Gerais de Comissões */}
                    {comissoesGeral && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-300 dark:border-green-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-green-500 rounded-full w-fit mx-auto mb-2">
                              <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-green-800 dark:text-green-200">
                              R$ {comissoesGeral.totalComissoesCalculadas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </h4>
                            <p className="text-sm text-green-600 dark:text-green-400">Total Calculado</p>
                          </CardBody>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-300 dark:border-blue-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-blue-500 rounded-full w-fit mx-auto mb-2">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-blue-800 dark:text-blue-200">R$ {comissoesGeral.totalComissoesPagas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Total Pago</p>
                          </CardBody>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-300 dark:border-orange-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-orange-500 rounded-full w-fit mx-auto mb-2">
                              <Clock className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                              R$ {comissoesGeral.totalComissoesPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </h4>
                            <p className="text-sm text-orange-600 dark:text-orange-400">Pendente</p>
                          </CardBody>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-300 dark:border-purple-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-purple-500 rounded-full w-fit mx-auto mb-2">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-purple-800 dark:text-purple-200">R$ {comissoesGeral.comissaoMedia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h4>
                            <p className="text-sm text-purple-600 dark:text-purple-400">Média por Advogado</p>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {/* Status das Comissões */}
                    {comissoesGeral && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-300 dark:border-green-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-green-500 rounded-full w-fit mx-auto mb-2">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-green-800 dark:text-green-200">{comissoesGeral.advogadosEmDia}</h4>
                            <p className="text-sm text-green-600 dark:text-green-400">Em Dia</p>
                          </CardBody>
                        </Card>

                        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-yellow-500 rounded-full w-fit mx-auto mb-2">
                              <Clock className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{comissoesGeral.advogadosPendentes}</h4>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendentes</p>
                          </CardBody>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-300 dark:border-red-600">
                          <CardBody className="p-4 text-center">
                            <div className="p-2 bg-red-500 rounded-full w-fit mx-auto mb-2">
                              <XCircle className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-red-800 dark:text-red-200">{comissoesGeral.advogadosAtrasados}</h4>
                            <p className="text-sm text-red-600 dark:text-red-400">Atrasados</p>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {/* Próximos Vencimentos */}
                    {comissoesGeral?.proximosVencimentos && comissoesGeral.proximosVencimentos.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-orange-500" />
                          Próximos Vencimentos
                        </h4>
                        <div className="space-y-3">
                          {comissoesGeral.proximosVencimentos.map((vencimento) => (
                            <Card key={vencimento.advogadoId} className="border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
                              <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={vencimento.advogadoNome} className="bg-orange-500 text-white" />
                                    <div>
                                      <h5 className="font-semibold text-slate-800 dark:text-slate-200">{vencimento.advogadoNome}</h5>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">Vence em {vencimento.vencimento.toLocaleDateString("pt-BR")}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">R$ {vencimento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Comissão</p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comissões por Advogado */}
                    {comissoesData && comissoesData.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-500" />
                          Comissões por Advogado
                        </h4>
                        <div className="space-y-4">
                          {comissoesData.slice(0, 5).map((advogado) => (
                            <Card key={advogado.advogadoId} className="border border-slate-200 dark:border-slate-700">
                              <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={advogado.advogadoNome} className="bg-green-500 text-white" />
                                    <div>
                                      <h5 className="font-semibold text-slate-800 dark:text-slate-200">{advogado.advogadoNome}</h5>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">OAB {advogado.advogadoOAB}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                      <p className="font-semibold text-green-600 dark:text-green-400">R$ {advogado.comissaoCalculada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p className="text-slate-600 dark:text-slate-400">Calculada</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="font-semibold text-blue-600 dark:text-blue-400">R$ {advogado.comissaoPaga.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p className="text-slate-600 dark:text-slate-400">Paga</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="font-semibold text-orange-600 dark:text-orange-400">R$ {advogado.comissaoPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p className="text-slate-600 dark:text-slate-400">Pendente</p>
                                    </div>
                                    <div className="text-center">
                                      <Chip size="sm" color={advogado.statusComissao === "EM_DIA" ? "success" : advogado.statusComissao === "PENDENTE" ? "warning" : "danger"} variant="flat">
                                        {advogado.statusComissao === "EM_DIA" ? "Em Dia" : advogado.statusComissao === "PENDENTE" ? "Pendente" : "Atrasado"}
                                      </Chip>
                                    </div>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles de Paginação */}
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="shadow-lg border border-slate-200 dark:border-slate-700">
          <CardBody className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
                  Mostrando {startItem} a {endItem} de {totalAdvogadosFiltrados} advogados
                </span>
                <div className="flex items-center gap-2">
                  <Select
                    size="sm"
                    selectedKeys={[itemsPerPage.toString()]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                    className="w-20"
                  >
                    <SelectItem key="5">5</SelectItem>
                    <SelectItem key="10">10</SelectItem>
                    <SelectItem key="20">20</SelectItem>
                    <SelectItem key="50">50</SelectItem>
                  </Select>
                  <span className="text-sm text-slate-600 dark:text-slate-400">por página</span>
                </div>
              </div>
              {totalPages > 1 && <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} size="sm" showControls showShadow className="flex-shrink-0" />}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Barra de Ações em Lote */}
      {selectedAdvogados.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
          <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-200 text-center sm:text-left">{selectedAdvogados.length} advogado(s) selecionado(s)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
                  <Button
                    size="sm"
                    color="success"
                    variant="flat"
                    startContent={<CheckCircle2 className="h-4 w-4" />}
                    onPress={handleBulkActivate}
                    isLoading={isBulkActionLoading}
                    isDisabled={isBulkActionLoading}
                  >
                    Ativar
                  </Button>
                  <Button
                    size="sm"
                    color="warning"
                    variant="flat"
                    startContent={<XCircle className="h-4 w-4" />}
                    onPress={handleBulkDeactivate}
                    isLoading={isBulkActionLoading}
                    isDisabled={isBulkActionLoading}
                  >
                    Desativar
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    startContent={<Trash2 className="h-4 w-4" />}
                    onPress={handleBulkDelete}
                    isLoading={isBulkActionLoading}
                    isDisabled={isBulkActionLoading}
                  >
                    Excluir
                  </Button>
                  <Button size="sm" variant="light" onPress={() => setSelectedAdvogados([])}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

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
                <Checkbox
                  isSelected={selectedAdvogados.length === advogadosFiltrados.length && advogadosFiltrados.length > 0}
                  isIndeterminate={selectedAdvogados.length > 0 && selectedAdvogados.length < advogadosFiltrados.length}
                  onValueChange={handleSelectAll}
                  size="sm"
                >
                  <span className="text-sm text-slate-600 dark:text-slate-400">Selecionar Todos</span>
                </Checkbox>
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
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                      <Card
                        className={`border-2 transition-all duration-300 group shadow-lg hover:shadow-2xl ${
                          selectedAdvogados.includes(advogado.id)
                            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500"
                        }`}
                      >
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
                          <div className="flex gap-3 w-full">
                            <Checkbox isSelected={selectedAdvogados.includes(advogado.id)} onValueChange={() => handleSelectAdvogado(advogado.id)} size="sm" className="mt-2 flex-shrink-0" />
                            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="flex-shrink-0">
                              <Avatar showFallback className="bg-blue-500 text-white shadow-lg" name={getInitials(getNomeCompleto(advogado))} size="lg" src={advogado.usuario.avatarUrl || undefined} />
                            </motion.div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                                  {getNomeCompleto(advogado)}
                                </h3>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  {advogado.isExterno && (
                                    <Chip color="warning" size="sm" variant="flat" startContent={<Eye className="h-3 w-3" />}>
                                      Externo
                                    </Chip>
                                  )}
                                  <Chip color={getStatusColor(advogado.usuario.active)} size="sm" variant="flat">
                                    {getStatusText(advogado.usuario.active)}
                                  </Chip>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                    <ScaleIcon className="h-3 w-3" />
                                    {getOAB(advogado)}
                                  </span>
                                </div>
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
                                  key="profile"
                                  startContent={<User className="h-4 w-4" />}
                                  onPress={() => {
                                    window.open(`/advogados/${advogado.id}`, "_blank");
                                  }}
                                >
                                  Perfil Completo
                                </DropdownItem>
                                <DropdownItem
                                  key="history"
                                  startContent={<History className="h-4 w-4" />}
                                  onPress={() => {
                                    handleViewHistorico(advogado);
                                  }}
                                >
                                  Histórico
                                </DropdownItem>
                                <DropdownItem
                                  key="notifications"
                                  startContent={<Bell className="h-4 w-4" />}
                                  onPress={() => {
                                    handleViewNotificacoes(advogado);
                                  }}
                                >
                                  Notificações
                                </DropdownItem>
                                <DropdownItem
                                  key="email"
                                  startContent={<Mail className="h-4 w-4" />}
                                  onPress={() => {
                                    handleEnviarEmailBoasVindas(advogado);
                                  }}
                                >
                                  Enviar Email
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
                                {advogado.isExterno ? (
                                  <DropdownItem
                                    key="convert"
                                    className="text-warning"
                                    color="warning"
                                    startContent={<UserPlus className="h-4 w-4" />}
                                    onPress={() => handleConvertToInterno(advogado.id)}
                                  >
                                    Transformar em Interno
                                  </DropdownItem>
                                ) : null}
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="h-4 w-4" />} onPress={() => handleDeleteAdvogado(advogado.id)}>
                                  Excluir
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </CardHeader>
                        <CardBody className="p-4 space-y-3">
                          {/* Informações de Contato */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <MailIcon className="h-3 w-3 text-blue-500" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{advogado.usuario.email}</span>
                            </div>
                            {advogado.telefone && (
                              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <Phone className="h-3 w-3 text-green-500" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{advogado.telefone}</span>
                              </div>
                            )}
                            {advogado.whatsapp && (
                              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <Smartphone className="h-3 w-3 text-green-500" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{advogado.whatsapp}</span>
                              </div>
                            )}
                          </div>

                          <Divider className="my-3" />

                          {/* Processos e Especialidades */}
                          <div className="space-y-3">
                            {/* Contagem de Processos - Para todos os advogados */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                {advogado.isExterno ? "Processos Identificados" : "Processos Responsável"}
                              </p>
                              <div className="flex items-center gap-2">
                                <Chip color={advogado.isExterno ? "warning" : "primary"} size="sm" variant="flat" startContent={<FileText className="h-3 w-3" />}>
                                  {advogado.processosCount || 0} processo(s)
                                </Chip>
                                {advogado.isExterno && <span className="text-xs text-slate-500 dark:text-slate-400">Advogado externo identificado</span>}
                              </div>
                            </div>

                            {/* Especialidades - Para advogados internos */}
                            {!advogado.isExterno && advogado.especialidades.length > 0 && (
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
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <Button
                              color="primary"
                              size="sm"
                              variant="flat"
                              className="flex-1 hover:scale-105 transition-transform"
                              startContent={<Eye className="h-4 w-4" />}
                              onPress={() => handleViewAdvogado(advogado)}
                            >
                              <span className="hidden sm:inline">Ver Detalhes</span>
                              <span className="sm:hidden">Ver</span>
                            </Button>
                            <Button
                              color="secondary"
                              size="sm"
                              variant="flat"
                              className="flex-1 sm:flex-none hover:scale-105 transition-transform"
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
      <Modal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} size="3xl">
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
                <Select
                  label="UF OAB"
                  placeholder="Selecione a UF"
                  startContent={<MapPin className="h-4 w-4 text-default-400" />}
                  selectedKeys={formState.oabUf ? [formState.oabUf] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormState({ ...formState, oabUf: value });
                  }}
                  isLoading={isLoadingUfs}
                >
                  {ufs.map((uf) => (
                    <SelectItem key={uf} textValue={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </Select>
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
                  value={(formState.comissaoPadrao ?? 0).toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoPadrao: parseFloat(value) || 0 })}
                />
                <Input
                  label="Comissão Ação Ganha (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={(formState.comissaoAcaoGanha ?? 0).toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoAcaoGanha: parseFloat(value) || 0 })}
                />
                <Input
                  label="Comissão Honorários (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={(formState.comissaoHonorarios ?? 0).toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoHonorarios: parseFloat(value) || 0 })}
                />
              </div>

              {/* Opções de Configuração */}
              <div className="space-y-4">
                <Divider />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-default-700">Configurações de Acesso</h4>

                  <div className="flex items-center space-x-4">
                    <Checkbox isSelected={formState.isExterno} onValueChange={(checked) => setFormState({ ...formState, isExterno: checked })} color="warning">
                      <span className="text-sm">Advogado Externo</span>
                    </Checkbox>
                    <Popover placement="top" showArrow>
                      <PopoverTrigger>
                        <Button isIconOnly size="sm" variant="light" className="min-w-0 w-6 h-6 p-0">
                          <Info className="h-4 w-4 text-default-400 hover:text-default-600 transition-colors" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="px-1 py-2">
                          <div className="text-small font-bold mb-2 flex items-center gap-2">
                            <User className="h-4 w-4 text-warning" />O que é um Advogado Externo?
                          </div>
                          <div className="text-tiny space-y-2">
                            <p className="text-default-600">
                              <strong>Advogados externos</strong> são profissionais que aparecem mencionados em processos, mas <strong>não integram a equipe</strong> do seu escritório.
                            </p>
                            <div className="bg-warning-50 dark:bg-warning-900/20 p-3 rounded-lg border border-warning-200 dark:border-warning-800">
                              <p className="text-warning-700 dark:text-warning-300 font-medium mb-1">⚠️ Características:</p>
                              <ul className="text-warning-600 dark:text-warning-400 space-y-1 text-xs">
                                <li>
                                  • <strong>Não possuem acesso</strong> ao sistema
                                </li>
                                <li>
                                  • São apenas <strong>referenciados</strong> em processos
                                </li>
                                <li>
                                  • Podem ser <strong>advogados adversários</strong> ou <strong>colaboradores externos</strong>
                                </li>
                                <li>
                                  • Úteis para <strong>histórico</strong> e <strong>controle</strong> de processos
                                </li>
                              </ul>
                            </div>
                            <div className="bg-success-50 dark:bg-success-900/20 p-3 rounded-lg border border-success-200 dark:border-success-800">
                              <p className="text-success-700 dark:text-success-300 font-medium mb-1">💡 Dica:</p>
                              <p className="text-success-600 dark:text-success-400 text-xs">
                                <strong>Nunca se sabe!</strong> A vida é cheia de surpresas! Um advogado externo pode eventualmente ser <strong>ativado</strong> e <strong>incluído no sistema</strong>{" "}
                                caso se torne parte da equipe.
                              </p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Checkbox
                      isSelected={formState.criarAcessoUsuario}
                      onValueChange={(checked) => setFormState({ ...formState, criarAcessoUsuario: checked })}
                      color="primary"
                      isDisabled={formState.isExterno}
                    >
                      <span className="text-sm">Criar Acesso ao Sistema</span>
                    </Checkbox>
                    <Popover placement="top" showArrow>
                      <PopoverTrigger>
                        <Button isIconOnly size="sm" variant="light" className="min-w-0 w-6 h-6 p-0">
                          <Key className="h-4 w-4 text-default-400 hover:text-default-600 transition-colors" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="px-1 py-2">
                          <div className="text-small font-bold mb-2 flex items-center gap-2">
                            <Key className="h-4 w-4 text-primary" />
                            Criar Acesso ao Sistema
                          </div>
                          <div className="text-tiny space-y-2">
                            <p className="text-default-600">
                              Esta opção <strong>cria credenciais de acesso</strong> para o advogado utilizar o sistema Magic Lawyer.
                            </p>
                            <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-200 dark:border-primary-800">
                              <p className="text-primary-700 dark:text-primary-300 font-medium mb-1">🔑 O que é criado:</p>
                              <ul className="text-primary-600 dark:text-primary-400 space-y-1 text-xs">
                                <li>
                                  • <strong>Login</strong> com o email do advogado
                                </li>
                                <li>
                                  • <strong>Senha temporária</strong> gerada automaticamente
                                </li>
                                <li>
                                  • <strong>Conta ativa</strong> no sistema
                                </li>
                                <li>
                                  • <strong>Permissões</strong> de advogado
                                </li>
                              </ul>
                            </div>
                            <div className="bg-warning-50 dark:bg-warning-900/20 p-3 rounded-lg border border-warning-200 dark:border-warning-800">
                              <p className="text-warning-700 dark:text-warning-300 font-medium mb-1">⚠️ Importante:</p>
                              <p className="text-warning-600 dark:text-warning-400 text-xs">
                                Esta opção é <strong>desabilitada</strong> para advogados externos, pois eles não devem ter acesso ao sistema.
                              </p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {formState.criarAcessoUsuario && !formState.isExterno && (
                    <div className="flex items-center space-x-4">
                      <Checkbox isSelected={formState.enviarEmailCredenciais} onValueChange={(checked) => setFormState({ ...formState, enviarEmailCredenciais: checked })} color="success">
                        <span className="text-sm">Enviar Credenciais por Email</span>
                      </Checkbox>
                      <Popover placement="top" showArrow>
                        <PopoverTrigger>
                          <Button isIconOnly size="sm" variant="light" className="min-w-0 w-6 h-6 p-0">
                            <Mail className="h-4 w-4 text-default-400 hover:text-default-600 transition-colors" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="px-1 py-2">
                            <div className="text-small font-bold mb-2 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-success" />
                              Enviar Credenciais por Email
                            </div>
                            <div className="text-tiny space-y-2">
                              <p className="text-default-600">
                                Esta opção <strong>envia automaticamente</strong> as credenciais de acesso por email para o advogado.
                              </p>
                              <div className="bg-success-50 dark:bg-success-900/20 p-3 rounded-lg border border-success-200 dark:border-success-800">
                                <p className="text-success-700 dark:text-success-300 font-medium mb-1">📧 O que é enviado:</p>
                                <ul className="text-success-600 dark:text-success-400 space-y-1 text-xs">
                                  <li>
                                    • <strong>Email de boas-vindas</strong> personalizado
                                  </li>
                                  <li>
                                    • <strong>Login</strong> (email do advogado)
                                  </li>
                                  <li>
                                    • <strong>Senha temporária</strong> gerada
                                  </li>
                                  <li>
                                    • <strong>Link de acesso</strong> direto ao sistema
                                  </li>
                                  <li>
                                    • <strong>Instruções</strong> de primeiro acesso
                                  </li>
                                </ul>
                              </div>
                              <div className="bg-info-50 dark:bg-info-900/20 p-3 rounded-lg border border-info-200 dark:border-info-800">
                                <p className="text-info-700 dark:text-info-300 font-medium mb-1">💡 Vantagens:</p>
                                <ul className="text-info-600 dark:text-info-400 space-y-1 text-xs">
                                  <li>
                                    • <strong>Segurança</strong> - Credenciais não ficam expostas
                                  </li>
                                  <li>
                                    • <strong>Praticidade</strong> - Advogado recebe tudo pronto
                                  </li>
                                  <li>
                                    • <strong>Profissionalismo</strong> - Email bem formatado
                                  </li>
                                  <li>
                                    • <strong>Controle</strong> - Histórico de envio
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
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
                <Select
                  label="UF OAB"
                  placeholder="Selecione a UF"
                  startContent={<MapPin className="h-4 w-4 text-default-400" />}
                  selectedKeys={formState.oabUf ? [formState.oabUf] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormState({ ...formState, oabUf: value });
                  }}
                  isLoading={isLoadingUfs}
                >
                  {ufs.map((uf) => (
                    <SelectItem key={uf} textValue={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </Select>
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
                  value={(formState.comissaoPadrao ?? 0).toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoPadrao: parseFloat(value) || 0 })}
                />
                <Input
                  label="Comissão Ação Ganha (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={(formState.comissaoAcaoGanha ?? 0).toString()}
                  onValueChange={(value) => setFormState({ ...formState, comissaoAcaoGanha: parseFloat(value) || 0 })}
                />
                <Input
                  label="Comissão Honorários (%)"
                  type="number"
                  placeholder="0"
                  startContent={<Percent className="h-4 w-4 text-default-400" />}
                  value={(formState.comissaoHonorarios ?? 0).toString()}
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

                {/* Estatísticas Detalhadas */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Estatísticas
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <ScaleIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Processos</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{selectedAdvogado.processosCount || 0}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Vinculados</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <Percent className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Comissão</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">{selectedAdvogado.comissaoPadrao}%</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Padrão</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Especialidades</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{selectedAdvogado.especialidades.length}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Áreas</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Status</span>
                      </div>
                      <p className="text-lg font-bold text-orange-800 dark:text-orange-200">{selectedAdvogado.usuario.active ? "Ativo" : "Inativo"}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">{selectedAdvogado.isExterno ? "Externo" : "Interno"}</p>
                    </div>
                  </div>
                </div>

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

      {/* Modal de Histórico */}
      {selectedAdvogado && (
        <AdvogadoHistorico advogadoId={selectedAdvogado.id} advogadoNome={getNomeCompleto(selectedAdvogado)} isOpen={isHistoricoModalOpen} onClose={() => setIsHistoricoModalOpen(false)} />
      )}

      {/* Modal de Notificações */}
      {selectedAdvogado && (
        <AdvogadoNotificacoes advogadoId={selectedAdvogado.id} advogadoNome={getNomeCompleto(selectedAdvogado)} isOpen={isNotificacoesModalOpen} onClose={() => setIsNotificacoesModalOpen(false)} />
      )}

      {/* Modal de Credenciais Temporárias */}
      <Modal isOpen={isCredenciaisModalOpen} onOpenChange={setIsCredenciaisModalOpen} size="lg">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Key className="h-5 w-5 text-success" />
            Credenciais de Acesso Criadas
          </ModalHeader>
          <ModalBody>
            {credenciaisTemporarias && (
              <div className="space-y-4">
                <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <h4 className="font-semibold text-success-700 dark:text-success-300">Acesso ao Sistema Criado com Sucesso!</h4>
                  </div>
                  <p className="text-sm text-success-600 dark:text-success-400 mb-4">As credenciais de acesso foram geradas e enviadas por email. Guarde estas informações em local seguro:</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-default-500" />
                        <span className="text-sm font-medium">Email:</span>
                      </div>
                      <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{credenciaisTemporarias.email}</code>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-default-500" />
                        <span className="text-sm font-medium">Senha Temporária:</span>
                      </div>
                      <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono">{credenciaisTemporarias.senhaTemporaria}</code>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-default-500" />
                        <span className="text-sm font-medium">Link de Acesso:</span>
                      </div>
                      <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{credenciaisTemporarias.linkLogin}</code>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-warning-600 dark:text-warning-400 mt-0.5" />
                      <div className="text-sm text-warning-700 dark:text-warning-300">
                        <p className="font-medium mb-1">Importante:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• A senha temporária deve ser alterada no primeiro acesso</li>
                          <li>• As credenciais também foram enviadas por email</li>
                          <li>• Guarde estas informações em local seguro</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={() => {
                setIsCredenciaisModalOpen(false);
                setCredenciaisTemporarias(null);
              }}
            >
              Entendi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
