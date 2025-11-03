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
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Tabs,
  Tab,
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  type ChipProps,
} from "@heroui/react";
import {
  Users,
  Shield,
  Link as LinkIcon,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  Search,
  Filter,
  XCircle,
  RotateCcw,
  CheckCircle,
  X,
  Clock,
  Mail,
  Building2,
  User,
  Award,
  Crown,
  Activity,
  Download,
  Settings,
  UserCheck,
  HelpCircle,
  UserPlus,
  ExternalLink,
  RefreshCw,
  Calendar,
  FileText,
  CreditCard,
  Image,
  GraduationCap,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

import {
  getCargos,
  getUsuariosEquipe,
  getDashboardEquipe,
  createCargo,
  updateCargo,
  deleteCargo,
  updateUsuarioEquipe,
  adicionarPermissaoIndividual,
  vincularUsuarioAdvogado,
  getPermissoesEfetivas,
  getEquipeHistorico,
  uploadAvatarUsuarioEquipe,
  type CargoData,
  type UsuarioEquipeData,
  type EquipeHistoricoData,
} from "@/app/actions/equipe";
import { getConvitesEquipe, createConviteEquipe, resendConviteEquipe, cancelConviteEquipe, type ConviteEquipeData, type CreateConviteData } from "@/app/actions/convites-equipe";
import { getAdvogados } from "@/app/actions/advogados";
import { EnderecoManager } from "@/components/endereco-manager";
import { MapPin, History as HistoryIcon } from "lucide-react";
import useSWR from "swr";
import { useModulosTenant, useCargos } from "@/app/hooks/use-equipe";
import { ModalHeaderGradient } from "@/components/ui/modal-header-gradient";
import { ModalSectionCard } from "@/components/ui/modal-section-card";
import { MotionCardGrid } from "@/components/ui/motion-card-grid";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 140,
      damping: 18,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

// ===== COMPONENTES =====

function DashboardEquipe() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardEquipe();

        setDashboardData(data);
      } catch (error) {
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Erro ao carregar dashboard</div>;
  }

  return (
    <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" initial="hidden" animate="visible" variants={containerVariants}>
      {[
        {
          label: "Total de Usuários",
          value: dashboardData.totalUsuarios,
          icon: Users,
          accent: "from-sky-500/90 via-sky-500/70 to-sky-500/50",
        },
        {
          label: "Cargos Ativos",
          value: dashboardData.totalCargos,
          icon: Shield,
          accent: "from-emerald-500/90 via-emerald-500/70 to-emerald-500/50",
        },
        {
          label: "Convites Pendentes",
          value: dashboardData.convitesPendentes,
          icon: Mail,
          accent: "from-amber-500/90 via-amber-500/70 to-amber-500/50",
        },
        {
          label: "Vinculações Ativas",
          value: dashboardData.vinculacoesAtivas,
          icon: LinkIcon,
          accent: "from-violet-500/90 via-violet-500/70 to-violet-500/50",
        },
      ].map((stat) => {
        const Icon = stat.icon;

        return (
          <motion.div key={stat.label} variants={cardVariants}>
            <Card className="border-none bg-white/10 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
              <CardBody className="relative overflow-hidden rounded-3xl px-6 py-6 text-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stat.accent} opacity-80`} />
                <div className="relative flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-wider text-white/80">{stat.label}</p>
                    <p className="text-3xl font-semibold">{stat.value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function CargosTab() {
  const [cargos, setCargos] = useState<CargoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<CargoData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNivel, setSelectedNivel] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Buscar módulos do tenant via hook
  const { modulos: modulosData, isLoading: modulosLoading } = useModulosTenant();

  // Transformar módulos do tenant para o formato esperado
  const modulos = useMemo(() => {
    return modulosData.map((m) => ({
      key: m.slug,
      label: m.nome,
      description: m.descricao,
    }));
  }, [modulosData]);

  const acoes = [
    { key: "visualizar", label: "Visualizar" },
    { key: "criar", label: "Criar" },
    { key: "editar", label: "Editar" },
    { key: "excluir", label: "Excluir" },
  ];

  useEffect(() => {
    loadCargos();
  }, []);

  async function loadCargos() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCargos();

      setCargos(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar cargos. Tente novamente.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCargo(cargoId: string) {
    // Encontrar o cargo para mostrar o nome
    const cargo = cargos.find((c) => c.id === cargoId);
    const cargoNome = cargo?.nome || "este cargo";

    if (!confirm(`Tem certeza que deseja excluir o cargo "${cargoNome}"?\n\nEsta ação não pode ser desfeita e pode afetar usuários vinculados a este cargo.`)) {
      return;
    }

    try {
      setActionLoading(cargoId);
      await deleteCargo(cargoId);
      toast.success(`Cargo "${cargoNome}" excluído com sucesso!`);
      loadCargos();
    } catch (error) {
      toast.error("Erro ao excluir cargo. Verifique se não há usuários vinculados a este cargo.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleEditCargo(cargo: CargoData) {
    setEditingCargo(cargo);
    setModalOpen(true);
  }

  function getNivelLabel(nivel: number) {
    const niveis = {
      1: "Estagiário",
      2: "Assistente",
      3: "Advogado",
      4: "Coordenador",
      5: "Diretor",
    };

    return niveis[nivel as keyof typeof niveis] || "Nível " + nivel;
  }

  function getNivelColor(nivel: number): ChipProps["color"] {
    const colors: Record<number, ChipProps["color"]> = {
      1: "default",
      2: "primary",
      3: "secondary",
      4: "warning",
      5: "danger",
    };

    return colors[nivel] ?? "default";
  }

  function handleExportCargos() {
    try {
      const csvContent = [
        // Cabeçalho
        ["Nome", "Descrição", "Nível", "Status", "Usuários", "Permissões"].join(","),
        // Dados
        ...filteredCargos.map((cargo) =>
          [
            `"${cargo.nome}"`,
            `"${cargo.descricao || ""}"`,
            `"${getNivelLabel(cargo.nivel)}"`,
            `"${cargo.ativo ? "Ativo" : "Inativo"}"`,
            `"${cargo.usuariosCount}"`,
            `"${cargo.permissoes.length}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `equipe-cargos-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  }

  // Filtros
  const filteredCargos = useMemo(() => {
    return cargos.filter((cargo) => {
      const matchesSearch = cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) || cargo.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNivel = selectedNivel === "all" || cargo.nivel.toString() === selectedNivel;

      return matchesSearch && matchesNivel;
    });
  }, [cargos, searchTerm, selectedNivel]);

  // Paginação
  const totalPages = Math.ceil(filteredCargos.length / itemsPerPage);
  const paginatedCargos = filteredCargos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading || modulosLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
      {/* Header com busca e filtros */}
      <motion.div variants={cardVariants}>
        <Card className="border-none bg-white/90 shadow-lg backdrop-blur dark:bg-content2/80">
          <CardBody className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                <div className="relative flex-1 max-w-md">
                  <Input
                    endContent={
                      searchTerm && (
                        <Button isIconOnly size="sm" variant="light" onPress={() => setSearchTerm("")}>
                          <X className="w-4 h-4" />
                        </Button>
                      )
                    }
                    placeholder="Buscar cargos..."
                    startContent={<Search className="w-4 h-4 text-default-400" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button startContent={<Filter className="w-4 h-4" />} variant="light" onPress={() => setShowFilters(!showFilters)}>
                  Filtros
                </Button>
              </div>

              <div className="flex gap-2">
                <Button startContent={<Download className="w-4 h-4" />} variant="light" onPress={() => handleExportCargos()}>
                  Exportar
                </Button>
                <Button
                  color="primary"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={() => {
                    setEditingCargo(null);
                    setModalOpen(true);
                  }}
                >
                  Novo Cargo
                </Button>
              </div>
            </div>

            {/* Filtros expandidos */}
            <AnimatePresence>
              {showFilters && (
                <motion.div animate={{ opacity: 1, height: "auto" }} className="overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }}>
                  <div className="flex flex-wrap gap-4 rounded-2xl border border-dashed border-default-200 bg-white/70 p-4 dark:border-default-100/40 dark:bg-content1/60">
                    <Select
                      className="min-w-40"
                      label="Nível do cargo"
                      placeholder="Todos os níveis"
                      selectedKeys={selectedNivel === "all" ? [] : [selectedNivel]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;

                        setSelectedNivel(selected || "all");
                      }}
                    >
                      <SelectItem key="all">Todos</SelectItem>
                      <SelectItem key="1">Estagiário</SelectItem>
                      <SelectItem key="2">Assistente</SelectItem>
                      <SelectItem key="3">Advogado</SelectItem>
                      <SelectItem key="4">Coordenador</SelectItem>
                      <SelectItem key="5">Diretor</SelectItem>
                    </Select>

                    <Button
                      startContent={<RotateCcw className="w-4 h-4" />}
                      variant="light"
                      onPress={() => {
                        setSearchTerm("");
                        setSelectedNivel("all");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardBody>
        </Card>
      </motion.div>

      {/* Grid de cargos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCargos.map((cargo) => (
          <motion.div key={cargo.id} animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
            <Card className="h-full">
              <CardHeader className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{cargo.nome}</h3>
                    <Tooltip content={`Nível ${cargo.nivel} - ${getNivelLabel(cargo.nivel)}`}>
                      <Chip color={getNivelColor(cargo.nivel)} size="sm" startContent={<Crown className="w-3 h-3" />} variant="flat">
                        {getNivelLabel(cargo.nivel)}
                      </Chip>
                    </Tooltip>
                  </div>
                  {cargo.descricao && <p className="text-sm text-default-500 line-clamp-2">{cargo.descricao}</p>}
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditCargo(cargo)}>
                      Editar
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      isDisabled={actionLoading === cargo.id}
                      startContent={actionLoading === cargo.id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                      onPress={() => handleDeleteCargo(cargo.id)}
                    >
                      {actionLoading === cargo.id ? "Excluindo..." : "Excluir"}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-default-400" />
                      <span className="text-sm text-default-500">{cargo.usuariosCount} usuário(s)</span>
                    </div>
                    <Badge color="primary" content={cargo.permissoes.length}>
                      <Chip size="sm" startContent={<Shield className="w-3 h-3" />} variant="flat">
                        Permissões
                      </Chip>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch isDisabled isSelected={cargo.ativo} size="sm" />
                    <span className="text-sm text-default-500">{cargo.ativo ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination showControls showShadow page={currentPage} total={totalPages} onChange={setCurrentPage} />
        </div>
      )}

      {/* Estado de erro */}
      {error && !loading && (
        <motion.div variants={cardVariants}>
          <Card className="border-none bg-danger-50/60 text-danger-700 shadow-lg dark:bg-danger-500/10 dark:text-danger-300">
            <CardBody className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4" />
                <span>Erro ao carregar cargos</span>
              </div>
              <p className="text-sm text-danger-600/80 dark:text-danger-200/80">{error}</p>
              <Button size="sm" startContent={<RefreshCw className="w-4 h-4" />} variant="bordered" onPress={() => loadCargos()}>
                Tentar novamente
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Estado vazio */}
      {filteredCargos.length === 0 && !loading && !error && (
        <motion.div variants={cardVariants}>
          <Card className="border-none bg-dotted-pattern bg-white/90 py-12 text-center shadow-lg dark:bg-content2/80">
            <CardBody className="space-y-3">
              <Users className="mx-auto h-10 w-10 text-default-400" />
              <h3 className="text-lg font-semibold">Nenhum cargo encontrado</h3>
              <p className="text-sm text-default-500">
                {searchTerm || selectedNivel !== "all" ? "Ajuste os filtros de busca para visualizar outros cargos." : "Crie o primeiro cargo para organizar a sua equipe."}
              </p>
              <Button
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={() => {
                  setEditingCargo(null);
                  setModalOpen(true);
                }}
              >
                Criar Cargo
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Modal de Cargo */}
      <CargoModal
        acoes={acoes}
        cargo={editingCargo}
        isOpen={modalOpen}
        modulos={modulos}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          loadCargos();
        }}
      />
    </motion.div>
  );
}

function CargoModal({
  isOpen,
  onClose,
  cargo,
  onSuccess,
  modulos,
  acoes,
}: {
  isOpen: boolean;
  onClose: () => void;
  cargo: CargoData | null;
  onSuccess: () => void;
  modulos: Array<{ key: string; label: string }>;
  acoes: Array<{ key: string; label: string }>;
}) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    nivel: 1,
    ativo: true,
    permissoes: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cargo) {
      setFormData({
        nome: cargo.nome,
        descricao: cargo.descricao || "",
        nivel: cargo.nivel,
        ativo: cargo.ativo,
        permissoes: cargo.permissoes.map((p) => `${p.modulo}-${p.acao}`),
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        nivel: 1,
        ativo: true,
        permissoes: [],
      });
    }
  }, [cargo, isOpen]);

  function hasPermissao(modulo: string, acao: string) {
    return formData.permissoes.includes(`${modulo}-${acao}`);
  }

  function togglePermissao(modulo: string, acao: string, value?: boolean) {
    const permissao = `${modulo}-${acao}`;

    setFormData((prev) => {
      const permissoes = new Set(prev.permissoes);
      const shouldEnable = typeof value === "boolean" ? value : !permissoes.has(permissao);

      if (shouldEnable) {
        permissoes.add(permissao);
      } else {
        permissoes.delete(permissao);
      }

      return {
        ...prev,
        permissoes: Array.from(permissoes),
      };
    });
  }

  function toggleModuloCompleto(modulo: string, selecionar: boolean) {
    setFormData((prev) => {
      const permissoes = new Set(prev.permissoes);

      acoes.forEach((acao) => {
        const permissao = `${modulo}-${acao.key}`;

        if (selecionar) {
          permissoes.add(permissao);
        } else {
          permissoes.delete(permissao);
        }
      });

      return {
        ...prev,
        permissoes: Array.from(permissoes),
      };
    });
  }

  function toggleTodasPermissoes(selecionar: boolean) {
    if (selecionar) {
      const todas = modulos.flatMap((modulo) => acoes.map((acao) => `${modulo.key}-${acao.key}`));

      setFormData((prev) => ({
        ...prev,
        permissoes: Array.from(new Set([...prev.permissoes, ...todas])),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissoes: [],
      }));
    }
  }

  async function handleSubmit() {
    // Validações
    if (!formData.nome.trim()) {
      toast.error("Nome do cargo é obrigatório");

      return;
    }

    if (formData.nome.trim().length < 2) {
      toast.error("Nome do cargo deve ter pelo menos 2 caracteres");

      return;
    }

    if (formData.nome.trim().length > 50) {
      toast.error("Nome do cargo deve ter no máximo 50 caracteres");

      return;
    }

    if (formData.descricao && formData.descricao.length > 500) {
      toast.error("Descrição deve ter no máximo 500 caracteres");

      return;
    }

    if (formData.permissoes.length === 0) {
      toast.error("Selecione pelo menos uma permissão para o cargo");

      return;
    }

    try {
      setLoading(true);

      const permissoesData = formData.permissoes.map((p) => {
        const [modulo, acao] = p.split("-");

        return { modulo, acao, permitido: true };
      });

      if (cargo) {
        await updateCargo(cargo.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          nivel: formData.nivel,
          ativo: formData.ativo,
          permissoes: permissoesData,
        });
        toast.success("Cargo atualizado com sucesso!");
      } else {
        await createCargo({
          nome: formData.nome,
          descricao: formData.descricao,
          nivel: formData.nivel,
          permissoes: permissoesData,
        });
        toast.success("Cargo criado com sucesso!");
      }

      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar cargo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeaderGradient
          icon={Shield}
          title={cargo ? "Editar Cargo" : "Novo Cargo"}
          description={cargo ? "Atualize as informações e permissões do cargo" : "Crie um novo cargo e configure suas permissões no sistema"}
        />
        <ModalBody className="px-0">
          <div className="space-y-6 px-6 pb-6">
            {/* Card de Ajuda */}
            <ModalSectionCard title="Como configurar o cargo" description="Guia rápido para configurar as permissões">
              <ul className="list-disc list-inside space-y-2 text-sm text-default-600">
                <li>Selecione as ações que este cargo pode executar em cada módulo do sistema.</li>
                <li>
                  Use <strong className="text-primary">Selecionar tudo</strong> para liberar todas as permissões ou <strong className="text-primary">Limpar tudo</strong> para recomeçar.
                </li>
                <li>Cada módulo mostra quantas ações estão liberadas (ex.: 3/4).</li>
                <li>Você pode voltar e ajustar as permissões a qualquer momento após a criação.</li>
              </ul>
            </ModalSectionCard>

            {/* Dados Básicos */}
            <ModalSectionCard title="Dados Básicos" description="Informações principais do cargo">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Nome do Cargo"
                  placeholder="Ex: Advogado Sênior"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  startContent={<Shield className="w-4 h-4 text-default-400" />}
                />

                <Select
                  label="Nível Hierárquico"
                  selectedKeys={[formData.nivel.toString()]}
                  onSelectionChange={(keys) => {
                    const nivel = parseInt(Array.from(keys)[0] as string);
                    setFormData({ ...formData, nivel });
                  }}
                  startContent={<Award className="w-4 h-4 text-default-400" />}
                  description="Define a hierarquia do cargo no escritório"
                >
                  <SelectItem key="1" textValue="Estagiário">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Estagiário</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="2" textValue="Assistente">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Assistente</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="3" textValue="Advogado">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Advogado</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="4" textValue="Coordenador">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      <span>Coordenador</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="5" textValue="Diretor">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>Diretor</span>
                    </div>
                  </SelectItem>
                </Select>
              </div>

              <Textarea
                label="Descrição"
                minRows={3}
                placeholder="Descreva as responsabilidades e funções deste cargo..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                description="Descrição detalhada das responsabilidades do cargo"
              />

              <div className="flex items-center justify-between p-4 rounded-lg border border-default-200 bg-default-50">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-default-700">Status do Cargo</span>
                  <span className="text-xs text-default-500">Cargos inativos não podem ser atribuídos a novos usuários</span>
                </div>
                <Switch
                  isSelected={formData.ativo}
                  onValueChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  color="primary"
                >
                  <span className="text-sm font-medium">{formData.ativo ? "Ativo" : "Inativo"}</span>
                </Switch>
              </div>
            </ModalSectionCard>

            {/* Permissões */}
            <ModalSectionCard
              title="Permissões do Sistema"
              description="Configure as ações que este cargo pode executar em cada módulo"
            >
              <div className="space-y-4">
                {/* Toolbar de Permissões */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-default-200 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-500/10">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-default-700 dark:text-default-200">
                        {formData.permissoes.length} permissão{formData.permissoes.length !== 1 ? "ões" : ""} selecionada{formData.permissoes.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-default-500">De {modulos.length * acoes.length} disponíveis</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<CheckCircle className="w-4 h-4" />}
                      onPress={() => toggleTodasPermissoes(true)}
                      isDisabled={
                        modulos.length === 0 || modulos.every((modulo) => acoes.every((acao) => formData.permissoes.includes(`${modulo.key}-${acao.key}`)))
                      }
                    >
                      Selecionar tudo
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<X className="w-4 h-4" />}
                      onPress={() => toggleTodasPermissoes(false)}
                      isDisabled={formData.permissoes.length === 0}
                    >
                      Limpar tudo
                    </Button>
                  </div>
                </div>

                {/* Lista de Módulos */}
                <div className="space-y-4">
                  {modulos.map((modulo) => {
                    const permissoesModulo = acoes.filter((acao) => hasPermissao(modulo.key, acao.key));
                    const todasSelecionadas = acoes.every((acao) => hasPermissao(modulo.key, acao.key));

                    return (
                      <Card key={modulo.key} className="border border-default-200 shadow-sm">
                        <CardBody className="p-5 space-y-4">
                          {/* Header do Módulo */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-default-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                                <Shield className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-default-700 dark:text-default-200">{modulo.label}</h5>
                                <p className="text-xs text-default-500">Módulo do sistema</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Chip
                                size="sm"
                                variant="flat"
                                color={permissoesModulo.length === acoes.length ? "success" : permissoesModulo.length > 0 ? "warning" : "default"}
                              >
                                {permissoesModulo.length}/{acoes.length}
                              </Chip>
                              <Button
                                size="sm"
                                variant="flat"
                                color={todasSelecionadas ? "danger" : "primary"}
                                onPress={() => toggleModuloCompleto(modulo.key, !todasSelecionadas)}
                              >
                                {todasSelecionadas ? (
                                  <>
                                    <X className="w-3 h-3 mr-1" />
                                    Remover todas
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Selecionar todas
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Lista de Ações */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {acoes.map((acao) => {
                              const selecionada = hasPermissao(modulo.key, acao.key);

                              return (
                                <div
                                  key={acao.key}
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    selecionada
                                      ? "border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
                                      : "border-default-200 bg-default-50 dark:bg-default-100/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {selecionada && <CheckCircle className="w-4 h-4 text-primary" />}
                                    <span className={`text-sm font-medium ${selecionada ? "text-primary-700 dark:text-primary-300" : "text-default-600"}`}>
                                      {acao.label}
                                    </span>
                                  </div>
                                  <Switch
                                    size="sm"
                                    isSelected={selecionada}
                                    onValueChange={(value) => togglePermissao(modulo.key, acao.key, value)}
                                    color="primary"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </ModalSectionCard>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" isDisabled={!formData.nome.trim()} isLoading={loading} onPress={handleSubmit}>
            {cargo ? "Atualizar Cargo" : "Criar Cargo"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Componente para aba de Histórico
function UsuarioHistoricoTab({ usuarioId }: { usuarioId: string }) {
  const {
    data: historico,
    error,
    isLoading,
    mutate,
  } = useSWR(`equipe-historico-${usuarioId}`, () => getEquipeHistorico(usuarioId), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const getAcaoColor = (acao: string): ChipProps["color"] => {
    switch (acao) {
      case "criado":
        return "success";
      case "editado":
        return "primary";
      case "cargo_alterado":
        return "warning";
      case "permissao_alterada":
        return "secondary";
      case "vinculacao_alterada":
        return "default";
      default:
        return "default";
    }
  };

  const getAcaoText = (acao: string) => {
    const labels: Record<string, string> = {
      criado: "Criado",
      editado: "Editado",
      cargo_alterado: "Cargo Alterado",
      permissao_alterada: "Permissão Alterada",
      vinculacao_alterada: "Vinculação Alterada",
    };
    return labels[acao] || acao;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <XCircle className="w-12 h-12 text-danger mb-4" />
        <h4 className="text-lg font-semibold mb-2">Erro ao carregar histórico</h4>
        <p className="text-sm text-default-500 mb-4">{error instanceof Error ? error.message : "Erro desconhecido"}</p>
        <Button size="sm" variant="flat" color="primary" startContent={<RefreshCw className="w-4 h-4" />} onPress={() => mutate()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!historico || historico.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <HistoryIcon className="w-12 h-12 text-default-300 mb-4" />
        <h4 className="text-lg font-semibold mb-2">Nenhum histórico encontrado</h4>
        <p className="text-sm text-default-500">Este usuário ainda não possui alterações registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-default-500">Total de {historico.length} registro(s)</p>
        <Button size="sm" variant="light" startContent={<RefreshCw className="w-4 h-4" />} onPress={() => mutate()}>
          Atualizar
        </Button>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {historico.map((item: EquipeHistoricoData) => (
          <Card key={item.id} className="border border-default-200">
            <CardBody className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Chip color={getAcaoColor(item.acao)} size="sm" variant="flat">
                      {getAcaoText(item.acao)}
                    </Chip>
                    {item.realizadoPorUsuario && (
                      <span className="text-xs text-default-500">
                        por {item.realizadoPorUsuario.firstName} {item.realizadoPorUsuario.lastName || item.realizadoPorUsuario.email}
                      </span>
                    )}
                  </div>
                  {item.motivo && (
                    <p className="text-sm text-default-600 mb-2">
                      <strong>Motivo:</strong> {item.motivo}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-default-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioEquipeData[]>([]);
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar módulos do tenant via hook
  const { modulos: modulosData } = useModulosTenant();

  // Buscar cargos via hook para o select
  const { cargos } = useCargos();

  // Transformar módulos para o formato esperado
  const modulos = useMemo(() => {
    return modulosData.map((m) => ({
      key: m.slug,
      label: m.nome,
      description: m.descricao,
    }));
  }, [modulosData]);

  const acoes = [
    { key: "visualizar", label: "Visualizar" },
    { key: "criar", label: "Criar" },
    { key: "editar", label: "Editar" },
    { key: "excluir", label: "Excluir" },
  ];
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTipo, setSelectedTipo] = useState<string>("all");
  const [selectedVinculacao, setSelectedVinculacao] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioEquipeData | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    active: true,
    cpf: "",
    rg: "",
    dataNascimento: "",
    observacoes: "",
    role: "SECRETARIA" as string,
    avatarUrl: "",
    cargoId: "" as string | undefined,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [permissionsForm, setPermissionsForm] = useState<Record<string, Record<string, boolean>>>({});
  const [permissoesEfetivas, setPermissoesEfetivas] = useState<
    Array<{
      modulo: string;
      acao: string;
      permitido: boolean;
      origem: "override" | "cargo" | "role";
    }>
  >([]);
  const [linkForm, setLinkForm] = useState({
    advogadoId: "",
    tipo: "assistente",
    observacoes: "",
  });
  const [isSavingPermission, setIsSavingPermission] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [loadingPermissoes, setLoadingPermissoes] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [usuariosData, advogadosData] = await Promise.all([getUsuariosEquipe(), getAdvogados()]);

      setUsuarios(usuariosData);
      setAdvogados(advogadosData.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados. Tente novamente.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleViewUsuario(usuario: UsuarioEquipeData) {
    setSelectedUsuario(usuario);
    setIsViewModalOpen(true);
  }

  function handleEditUsuario(usuario: UsuarioEquipeData) {
    setSelectedUsuario(usuario);
    setEditFormData({
      firstName: usuario.firstName || "",
      lastName: usuario.lastName || "",
      email: usuario.email || "",
      phone: usuario.phone || "",
      active: usuario.active,
      cpf: usuario.cpf || "",
      rg: usuario.rg || "",
      dataNascimento: usuario.dataNascimento ? new Date(usuario.dataNascimento).toISOString().split("T")[0] : "",
      observacoes: usuario.observacoes || "",
      role: usuario.role || "SECRETARIA",
      avatarUrl: usuario.avatarUrl || "",
      cargoId: getCargoPrincipal(usuario)?.id || "",
    });
    setIsEditModalOpen(true);
  }

  async function handleSaveUsuario() {
    if (!selectedUsuario) return;

    setIsSaving(true);
    try {
      // Atualizar dados básicos do usuário
      await updateUsuarioEquipe(selectedUsuario.id, {
        firstName: editFormData.firstName || undefined,
        lastName: editFormData.lastName || undefined,
        email: editFormData.email,
        phone: editFormData.phone || undefined,
        active: editFormData.active,
        cpf: editFormData.cpf || null,
        rg: editFormData.rg || null,
        dataNascimento: editFormData.dataNascimento ? new Date(editFormData.dataNascimento) : null,
        observacoes: editFormData.observacoes || null,
        role: editFormData.role as any,
        avatarUrl: editFormData.avatarUrl || null,
      });

      // Atualizar cargo se foi alterado
      const cargoPrincipal = getCargoPrincipal(selectedUsuario);
      if (editFormData.cargoId && editFormData.cargoId !== cargoPrincipal?.id) {
        const { atribuirCargoUsuario } = await import("@/app/actions/equipe");
        await atribuirCargoUsuario(selectedUsuario.id, editFormData.cargoId);
      } else if (!editFormData.cargoId && cargoPrincipal) {
        // Se removeu o cargo, desativar cargo atual
        const { removerCargoUsuario } = await import("@/app/actions/equipe");
        await removerCargoUsuario(selectedUsuario.id, cargoPrincipal.id);
      }

      toast.success("Usuário atualizado com sucesso");
      setIsEditModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar usuário");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePermissionsUsuario(usuario: UsuarioEquipeData) {
    setSelectedUsuario(usuario);
    setIsPermissionsModalOpen(true);
    setLoadingPermissoes(true);

    try {
      // Buscar permissões efetivas (override + cargo + role)
      const efetivas = await getPermissoesEfetivas(usuario.id);
      setPermissoesEfetivas(efetivas);

      // Inicializar form apenas com overrides individuais
      const existingPerms: Record<string, Record<string, boolean>> = {};
      usuario.permissoesIndividuais.forEach((perm) => {
        if (!existingPerms[perm.modulo]) {
          existingPerms[perm.modulo] = {};
        }
        existingPerms[perm.modulo][perm.acao] = perm.permitido;
      });
      setPermissionsForm(existingPerms);
    } catch (error) {
      toast.error("Erro ao carregar permissões efetivas");
      console.error(error);
    } finally {
      setLoadingPermissoes(false);
    }
  }

  function handleLinkUsuario(usuario: UsuarioEquipeData) {
    setSelectedUsuario(usuario);
    setLinkForm({
      advogadoId: "",
      tipo: "assistente",
      observacoes: "",
    });
    setIsLinkModalOpen(true);
  }

  async function handleSavePermission(modulo: string, acao: string, permitido: boolean) {
    if (!selectedUsuario) return;

    // Atualização otimista do estado local
    setPermissionsForm((prev) => {
      const updated = { ...prev };
      if (!updated[modulo]) {
        updated[modulo] = {};
      }
      updated[modulo] = { ...updated[modulo], [acao]: permitido };
      return updated;
    });

    setIsSavingPermission(true);
    try {
      await adicionarPermissaoIndividual(selectedUsuario.id, modulo, acao, permitido, `Permissão ${permitido ? "concedida" : "negada"} pelo admin`);
      toast.success("Permissão atualizada com sucesso");

      // Recarregar dados e atualizar usuário selecionado
      await loadData();

      // Atualizar permissões do usuário selecionado após reload
      const updatedUsuarios = await getUsuariosEquipe();
      const updatedUsuario = updatedUsuarios.find((u) => u.id === selectedUsuario.id);
      if (updatedUsuario) {
        const existingPerms: Record<string, Record<string, boolean>> = {};
        updatedUsuario.permissoesIndividuais.forEach((perm) => {
          if (!existingPerms[perm.modulo]) {
            existingPerms[perm.modulo] = {};
          }
          existingPerms[perm.modulo][perm.acao] = perm.permitido;
        });
        setPermissionsForm(existingPerms);
        setSelectedUsuario(updatedUsuario);

        // Recarregar permissões efetivas
        const efetivas = await getPermissoesEfetivas(updatedUsuario.id);
        setPermissoesEfetivas(efetivas);
      }
    } catch (error) {
      // Reverter atualização otimista em caso de erro
      setPermissionsForm((prev) => {
        const updated = { ...prev };
        if (updated[modulo] && updated[modulo][acao] !== undefined) {
          const reverted = { ...updated[modulo] };
          delete reverted[acao];
          updated[modulo] = reverted;
          if (Object.keys(updated[modulo]).length === 0) {
            delete updated[modulo];
          }
        }
        return updated;
      });
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar permissão");
    } finally {
      setIsSavingPermission(false);
    }
  }

  async function handleSaveLink() {
    if (!selectedUsuario || !linkForm.advogadoId) {
      toast.error("Selecione um advogado");
      return;
    }

    setIsSavingLink(true);
    try {
      await vincularUsuarioAdvogado(selectedUsuario.id, linkForm.advogadoId, linkForm.tipo, linkForm.observacoes || undefined);
      toast.success("Usuário vinculado com sucesso");
      setIsLinkModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao vincular usuário");
    } finally {
      setIsSavingLink(false);
    }
  }

  function handleOpenCreateUsuario() {
    setSelectedUsuario(null);
    setIsCreateModalOpen(true);
  }

  function getRoleColor(role: string): ChipProps["color"] {
    const colors: Record<string, ChipProps["color"]> = {
      ADMIN: "danger",
      ADVOGADO: "primary",
      SECRETARIA: "secondary",
      FINANCEIRO: "success",
      CLIENTE: "warning",
      SUPER_ADMIN: "warning",
      ESTAGIARIA: "default",
    };

    return colors[role] ?? "default";
  }

  function getRoleLabel(role: string) {
    const labels = {
      ADMIN: "Administrador",
      ADVOGADO: "Advogado",
      SECRETARIA: "Secretária",
      FINANCEIRO: "Financeiro",
      CLIENTE: "Cliente",
      SUPER_ADMIN: "Super Admin",
      ESTAGIARIA: "Estagiária",
    };

    return labels[role as keyof typeof labels] || role;
  }

  function getRoleIcon(role: string) {
    const icons: Record<string, any> = {
      ADMIN: Shield,
      ADVOGADO: User,
      SECRETARIA: Settings,
      FINANCEIRO: Award,
      CLIENTE: User,
      SUPER_ADMIN: Crown,
      ESTAGIARIA: GraduationCap,
    };
    const IconComponent = icons[role] || User;

    return <IconComponent className="w-3 h-3" />;
  }

  // Helper functions para Cargo como identificador principal
  function getCargoPrincipal(usuario: UsuarioEquipeData) {
    // Retorna o primeiro cargo ativo
    const cargoAtivo = usuario.cargos.find((c) => c.ativo);
    return cargoAtivo || null;
  }

  function getDisplayLabel(usuario: UsuarioEquipeData) {
    const cargoPrincipal = getCargoPrincipal(usuario);
    if (cargoPrincipal) {
      const outrosCargos = usuario.cargos.filter((c) => c.ativo && c.id !== cargoPrincipal.id).length;
      const sufixo = outrosCargos > 0 ? ` +${outrosCargos}` : "";
      return `${cargoPrincipal.nome}${sufixo}`;
    }
    // Fallback para role se não houver cargo
    return getRoleLabel(usuario.role);
  }

  function getDisplayColor(usuario: UsuarioEquipeData): ChipProps["color"] {
    // Priorizar cargo, mas usar role como fallback
    const cargoPrincipal = getCargoPrincipal(usuario);
    if (cargoPrincipal) {
      // Cargos podem ter cores customizadas no futuro
      // Por enquanto, usar cor baseada no nível do cargo
      if (cargoPrincipal.nivel >= 4) return "danger"; // Coordenador/Diretor
      if (cargoPrincipal.nivel >= 3) return "primary"; // Advogado/Especialista
      if (cargoPrincipal.nivel >= 2) return "secondary"; // Assistente
      return "default"; // Estagiário/Júnior
    }
    // Fallback para role
    return getRoleColor(usuario.role);
  }

  function getDisplayIcon(usuario: UsuarioEquipeData) {
    const cargoPrincipal = getCargoPrincipal(usuario);
    if (cargoPrincipal) {
      // Por enquanto usar ícone genérico para cargo
      // No futuro pode ter ícone customizado no cargo
      return <Award className="w-3 h-3" />;
    }
    // Fallback para role
    return getRoleIcon(usuario.role);
  }

  function handleExportUsuarios() {
    try {
      const csvContent = [
        // Cabeçalho
        ["Nome", "Email", "Role", "Tipo", "Status", "Cargos", "Vinculações"].join(","),
        // Dados
        ...filteredUsuarios.map((usuario) =>
          [
            `"${usuario.firstName && usuario.lastName ? `${usuario.firstName} ${usuario.lastName}` : usuario.email}"`,
            `"${usuario.email}"`,
            `"${getRoleLabel(usuario.role)}"`,
            `"${usuario.role === "ADVOGADO" ? (usuario.isExterno ? "Externo" : "Interno") : "N/A"}"`,
            `"${usuario.active ? "Ativo" : "Inativo"}"`,
            `"${usuario.cargos.map((c) => c.nome).join("; ")}"`,
            `"${usuario.vinculacoes.map((v) => `${v.tipo} → ${v.advogadoNome}`).join("; ")}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `equipe-usuarios-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  }

  // Filtros
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      const matchesSearch =
        usuario.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = selectedRole === "all" || usuario.role === selectedRole;
      const matchesStatus = selectedStatus === "all" || (selectedStatus === "active" && usuario.active) || (selectedStatus === "inactive" && !usuario.active);

      const matchesTipo =
        selectedTipo === "all" ||
        (selectedTipo === "interno" && usuario.role === "ADVOGADO" && !usuario.isExterno) ||
        (selectedTipo === "externo" && usuario.role === "ADVOGADO" && usuario.isExterno) ||
        (selectedTipo === "nao-advogado" && usuario.role !== "ADVOGADO");

      const matchesVinculacao =
        selectedVinculacao === "all" || (selectedVinculacao === "com-vinculacao" && usuario.vinculacoes.length > 0) || (selectedVinculacao === "sem-vinculacao" && usuario.vinculacoes.length === 0);

      return matchesSearch && matchesRole && matchesStatus && matchesTipo && matchesVinculacao;
    });
  }, [usuarios, searchTerm, selectedRole, selectedStatus, selectedTipo, selectedVinculacao]);

  // Paginação
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const paginatedUsuarios = filteredUsuarios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Estatísticas dos usuários
  const usuarioStats = useMemo(() => {
    const total = usuarios.length;
    const ativos = usuarios.filter((u) => u.active).length;
    const inativos = usuarios.filter((u) => !u.active).length;
    const porRole: Record<string, number> = {};
    usuarios.forEach((u) => {
      porRole[u.role] = (porRole[u.role] || 0) + 1;
    });
    const comCargo = usuarios.filter((u) => u.cargos.length > 0).length;
    const comVinculacao = usuarios.filter((u) => u.vinculacoes.length > 0).length;

    return {
      total,
      ativos,
      inativos,
      porRole,
      comCargo,
      comVinculacao,
    };
  }, [usuarios]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar com Estatísticas */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-300 dark:border-blue-600">
            <CardBody className="p-4 text-center">
              <div className="p-2 bg-blue-500 rounded-full w-fit mx-auto mb-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-blue-800 dark:text-blue-200">{usuarioStats.total}</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">Total de Usuários</p>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-300 dark:border-green-600">
            <CardBody className="p-4 text-center">
              <div className="p-2 bg-green-500 rounded-full w-fit mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-green-800 dark:text-green-200">{usuarioStats.ativos}</h4>
              <p className="text-sm text-green-600 dark:text-green-400">Ativos</p>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-300 dark:border-red-600">
            <CardBody className="p-4 text-center">
              <div className="p-2 bg-red-500 rounded-full w-fit mx-auto mb-2">
                <X className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-red-800 dark:text-red-200">{usuarioStats.inativos}</h4>
              <p className="text-sm text-red-600 dark:text-red-400">Inativos</p>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-300 dark:border-purple-600">
            <CardBody className="p-4 text-center">
              <div className="p-2 bg-purple-500 rounded-full w-fit mx-auto mb-2">
                <Award className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-purple-800 dark:text-purple-200">{usuarioStats.comCargo}</h4>
              <p className="text-sm text-purple-600 dark:text-purple-400">Com Cargo</p>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-300 dark:border-orange-600">
            <CardBody className="p-4 text-center">
              <div className="p-2 bg-orange-500 rounded-full w-fit mx-auto mb-2">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-orange-800 dark:text-orange-200">{usuarioStats.comVinculacao}</h4>
              <p className="text-sm text-orange-600 dark:text-orange-400">Vinculados</p>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 border-indigo-300 dark:border-indigo-600">
            <CardBody className="p-4 text-center">
              <div className="p-2 bg-indigo-500 rounded-full w-fit mx-auto mb-2">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{usuarioStats.porRole.ADMIN || 0}</h4>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">Administradores</p>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      {/* Header com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Input
              endContent={
                searchTerm && (
                  <Button isIconOnly size="sm" variant="light" onPress={() => setSearchTerm("")}>
                    <X className="w-4 h-4" />
                  </Button>
                )
              }
              placeholder="Buscar usuários..."
              startContent={<Search className="w-4 h-4 text-default-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button startContent={<Filter className="w-4 h-4" />} variant="light" onPress={() => setShowFilters(!showFilters)}>
            Filtros
          </Button>
        </div>

        <div className="flex gap-2">
          <Button color="primary" startContent={<UserPlus className="w-4 h-4" />} onPress={handleOpenCreateUsuario}>
            Novo Funcionário
          </Button>
          <Button startContent={<Download className="w-4 h-4" />} variant="light" onPress={() => handleExportUsuarios()}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros expandidos */}
      <AnimatePresence>
        {showFilters && (
          <motion.div animate={{ opacity: 1, height: "auto" }} className="overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }}>
            <Card>
              <CardBody>
                <div className="flex flex-wrap gap-4">
                  <Select
                    className="min-w-40"
                    label="Role"
                    placeholder="Todos os roles"
                    selectedKeys={selectedRole === "all" ? [] : [selectedRole]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;

                      setSelectedRole(selected || "all");
                    }}
                  >
                    <SelectItem key="all">Todos</SelectItem>
                    <SelectItem key="ADMIN">Administrador</SelectItem>
                    <SelectItem key="ADVOGADO">Advogado</SelectItem>
                    <SelectItem key="SECRETARIA">Secretária</SelectItem>
                    <SelectItem key="CLIENTE">Cliente</SelectItem>
                  </Select>

                  <Select
                    className="min-w-40"
                    label="Status"
                    placeholder="Todos os status"
                    selectedKeys={selectedStatus === "all" ? [] : [selectedStatus]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;

                      setSelectedStatus(selected || "all");
                    }}
                  >
                    <SelectItem key="all">Todos</SelectItem>
                    <SelectItem key="active">Ativo</SelectItem>
                    <SelectItem key="inactive">Inativo</SelectItem>
                  </Select>

                  <Select
                    className="min-w-40"
                    label="Tipo"
                    placeholder="Todos os tipos"
                    selectedKeys={selectedTipo === "all" ? [] : [selectedTipo]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;

                      setSelectedTipo(selected || "all");
                    }}
                  >
                    <SelectItem key="all">Todos</SelectItem>
                    <SelectItem key="interno">Advogado Interno</SelectItem>
                    <SelectItem key="externo">Advogado Externo</SelectItem>
                    <SelectItem key="nao-advogado">Não Advogado</SelectItem>
                  </Select>

                  <Select
                    className="min-w-40"
                    label="Vinculação"
                    placeholder="Todas as vinculações"
                    selectedKeys={selectedVinculacao === "all" ? [] : [selectedVinculacao]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;

                      setSelectedVinculacao(selected || "all");
                    }}
                  >
                    <SelectItem key="all">Todas</SelectItem>
                    <SelectItem key="com-vinculacao">Com Vinculação</SelectItem>
                    <SelectItem key="sem-vinculacao">Sem Vinculação</SelectItem>
                  </Select>

                  <Button
                    startContent={<RotateCcw className="w-4 h-4" />}
                    variant="light"
                    onPress={() => {
                      setSearchTerm("");
                      setSelectedRole("all");
                      setSelectedStatus("all");
                      setSelectedTipo("all");
                      setSelectedVinculacao("all");
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabela de usuários */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table aria-label="Usuários da equipe" className="min-w-[800px]">
              <TableHeader>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    USUÁRIO
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    FUNÇÃO
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    TIPO
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    CARGOS
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    VINCULAÇÕES
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    STATUS
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    AÇÕES
                  </div>
                </TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={usuario.firstName || usuario.email} size="sm" />
                        <div>
                          <p className="font-medium">{usuario.firstName && usuario.lastName ? `${usuario.firstName} ${usuario.lastName}` : usuario.email}</p>
                          <p className="text-sm text-default-500">{usuario.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {/* Cargo Principal ou Role como fallback */}
                        <Tooltip
                          content={
                            usuario.cargos.length > 0
                              ? `Cargos: ${usuario.cargos
                                  .filter((c) => c.ativo)
                                  .map((c) => c.nome)
                                  .join(", ")} | Role: ${getRoleLabel(usuario.role)}`
                              : `Role: ${getRoleLabel(usuario.role)} (sem cargo)`
                          }
                        >
                          <Chip color={getDisplayColor(usuario)} size="sm" startContent={getDisplayIcon(usuario)} variant="flat" className="w-fit">
                            {getDisplayLabel(usuario)}
                          </Chip>
                        </Tooltip>
                        {/* Role como informação secundária */}
                        {getCargoPrincipal(usuario) && (
                          <Chip color="default" size="sm" variant="flat" className="w-fit text-xs opacity-70">
                            {getRoleLabel(usuario.role)}
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {usuario.role === "ADVOGADO" ? (
                        <Chip
                          color={usuario.isExterno ? "warning" : "success"}
                          size="sm"
                          startContent={usuario.isExterno ? <ExternalLink className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          variant="flat"
                        >
                          {usuario.isExterno ? "Externo" : "Interno"}
                        </Chip>
                      ) : (
                        <span className="text-sm text-default-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.cargos.map((cargo) => (
                          <Chip key={cargo.id} color="primary" size="sm" variant="flat">
                            {cargo.nome}
                          </Chip>
                        ))}
                        {usuario.cargos.length === 0 && <span className="text-sm text-default-400">Sem cargos</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.vinculacoes.map((vinculacao) => (
                          <Tooltip key={vinculacao.id} content={vinculacao.observacoes || "Sem observações"}>
                            <Chip color="secondary" size="sm" variant="flat">
                              {vinculacao.tipo} → {vinculacao.advogadoNome}
                            </Chip>
                          </Tooltip>
                        ))}
                        {usuario.vinculacoes.length === 0 && <span className="text-sm text-default-400">Sem vinculações</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip color={usuario.active ? "success" : "default"} size="sm" startContent={usuario.active ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />} variant="flat">
                        {usuario.active ? "Ativo" : "Inativo"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          onAction={(key) => {
                            if (key === "view") {
                              handleViewUsuario(usuario);
                            } else if (key === "edit") {
                              handleEditUsuario(usuario);
                            } else if (key === "permissions") {
                              handlePermissionsUsuario(usuario);
                            } else if (key === "link") {
                              handleLinkUsuario(usuario);
                            }
                          }}
                        >
                          <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />}>
                            Visualizar
                          </DropdownItem>
                          <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />}>
                            Editar
                          </DropdownItem>
                          <DropdownItem key="permissions" startContent={<Shield className="w-4 h-4" />}>
                            Permissões
                          </DropdownItem>
                          <DropdownItem key="link" startContent={<LinkIcon className="w-4 h-4" />}>
                            Vincular
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination showControls showShadow page={currentPage} total={totalPages} onChange={setCurrentPage} />
        </div>
      )}

      {/* Estado de erro */}
      {error && !loading && (
        <Card className="border-danger/20 bg-danger/5">
          <CardBody className="py-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-danger mb-1">Erro ao carregar usuários</h3>
                <p className="text-sm text-default-600 mb-3">{error}</p>
                <Button size="sm" variant="flat" color="danger" startContent={<RefreshCw className="w-4 h-4" />} onPress={() => loadData()}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Estado vazio */}
      {filteredUsuarios.length === 0 && !loading && !error && (
        <Card>
          <CardBody className="text-center py-12">
            <Users className="w-12 h-12 text-default-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-default-500">
              {searchTerm || selectedRole !== "all" || selectedStatus !== "all" || selectedTipo !== "all" || selectedVinculacao !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Nenhum usuário cadastrado na equipe"}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Modal de Criação de Funcionário */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeaderGradient icon={UserPlus} title="Novo Funcionário" description="Cadastre colaboradores internos com dados trabalhistas completos" />
          <ModalBody className="px-0">
            <div className="space-y-6 px-6 pb-6">
              <ModalSectionCard
                title="Resumo do fluxo"
                description="O modal de criação reutiliza as abas existentes (Perfil, Contatos, Cargo/Role) e adiciona etapas específicas para funcionários."
              >
                <ul className="list-disc pl-5 space-y-2 text-sm text-default-600">
                  <li>Perfil: dados pessoais, CPF, geração de senha temporária, cargo principal.</li>
                  <li>Dados trabalhistas: contrato, CTPS, PIS, jornada, flags de benefícios padrão.</li>
                  <li>Benefícios: uso de `FuncionarioBeneficio` para registrar VA/VR/plano de saúde, com valores e vigência.</li>
                  <li>Documentos: upload para Cloudinary (`FuncionarioDocumento`), com tipo, emissão e validade.</li>
                  <li>Endereços e Contas: reaproveitar `EnderecoManager` e dados bancários existentes.</li>
                  <li>Histórico: registrar alterações em `EquipeHistorico` (ex.: contrato alterado, benefício incluído).</li>
                </ul>
              </ModalSectionCard>

              <ModalSectionCard title="Próximos passos" description="Implemente as etapas conforme o roteiro documentado.">
                <div className="space-y-3 text-sm text-default-600">
                  <p>
                    • Conferir o documento <code>docs/features/tenant-dashboard-enhancements/team-employee-profiles.md</code> para o passo a passo completo.<br />
                    • Criar a action `createFuncionarioUsuario` (ou nome similar) reaproveitando padrões de `createCliente` / `createAdvogado`.<br />
                    • Implementar realtime (<code>equipe.usuario.created</code>) e auditoria para cada operação.<br />
                    • Atualizar a dashboard de estatísticas após salvar um novo registro.
                  </p>
                  <p className="text-xs text-default-500">
                    Este modal é temporário – substitua-o pelo formulário definitivo assim que o backend estiver pronto.
                  </p>
                </div>
              </ModalSectionCard>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Visualização de Usuário */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          {selectedUsuario && (
            <>
              <ModalHeaderGradient
                icon={User}
                title={selectedUsuario.firstName && selectedUsuario.lastName ? `${selectedUsuario.firstName} ${selectedUsuario.lastName}` : selectedUsuario.email}
                description="Detalhes completos do usuário"
              />
              <ModalBody className="px-0">
                <Tabs
                  aria-label="Detalhes do usuário"
                  classNames={{
                    tabList: "gap-6 w-full relative rounded-none px-6 pt-6 pb-0 border-b border-divider",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-primary font-medium text-sm tracking-wide",
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
                      <ModalSectionCard title="Informações Básicas" description="Dados de identificação do usuário">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                            <Mail className="h-4 w-4 text-primary" />
                  <div>
                              <p className="text-xs text-default-500">Email</p>
                              <p className="text-sm font-medium">{selectedUsuario.email}</p>
                  </div>
                </div>
                          <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                    <Chip color={getRoleColor(selectedUsuario.role)} size="sm" startContent={getRoleIcon(selectedUsuario.role)} variant="flat">
                      {getRoleLabel(selectedUsuario.role)}
                    </Chip>
                    <Chip
                      color={selectedUsuario.active ? "success" : "default"}
                      size="sm"
                      startContent={selectedUsuario.active ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      variant="flat"
                    >
                      {selectedUsuario.active ? "Ativo" : "Inativo"}
                    </Chip>
                  </div>
                </div>
                      </ModalSectionCard>

                {selectedUsuario.cargos.length > 0 && (
                        <ModalSectionCard title="Cargos" description="Funções do usuário no escritório">
                    <div className="flex flex-wrap gap-2">
                      {selectedUsuario.cargos.map((cargo) => (
                              <Chip key={cargo.id} color="primary" size="sm" variant="flat" startContent={<Award className="w-3 h-3" />}>
                          {cargo.nome}
                        </Chip>
                      ))}
                    </div>
                        </ModalSectionCard>
                )}

                {selectedUsuario.vinculacoes.length > 0 && (
                        <ModalSectionCard title="Vinculações" description="Relacionamentos com advogados">
                    <div className="flex flex-wrap gap-2">
                      {selectedUsuario.vinculacoes.map((vinculacao) => (
                        <Tooltip key={vinculacao.id} content={vinculacao.observacoes || "Sem observações"}>
                                <Chip color="secondary" size="sm" variant="flat" startContent={<LinkIcon className="w-3 h-3" />}>
                            {vinculacao.tipo} → {vinculacao.advogadoNome}
                          </Chip>
                        </Tooltip>
                      ))}
                    </div>
                        </ModalSectionCard>
                )}

                {selectedUsuario.permissoesIndividuais.length > 0 && (
                        <ModalSectionCard title="Permissões Individuais" description="Override de permissões personalizadas">
                    <div className="flex flex-wrap gap-2">
                      {selectedUsuario.permissoesIndividuais.map((perm) => (
                        <Chip key={perm.id} color={perm.permitido ? "success" : "danger"} size="sm" variant="flat">
                          {perm.modulo}/{perm.acao}
                        </Chip>
                      ))}
                          </div>
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
                      <ModalSectionCard title="Informações de Contato" description="Telefone e observações">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedUsuario.phone && (
                            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                              <Phone className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-default-500">Telefone</p>
                                <p className="text-sm font-medium">{selectedUsuario.phone}</p>
                    </div>
                  </div>
                )}
                          {selectedUsuario.observacoes && (
                            <div className="col-span-2">
                              <p className="text-xs text-default-500 mb-2">Observações</p>
                              <p className="text-sm text-default-700">{selectedUsuario.observacoes}</p>
              </div>
            )}
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
                <Button color="primary" onPress={() => handleEditUsuario(selectedUsuario)}>
                  Editar Usuário
                </Button>
          </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de Edição de Usuário */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeaderGradient icon={Edit} title="Editar Usuário" description="Atualize as informações do usuário" />
          <ModalBody className="px-0">
            <Tabs
              aria-label="Formulário de edição do usuário"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none px-6 pt-6 pb-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-primary font-medium text-sm tracking-wide",
                panel: "px-6 pb-6 pt-4",
              }}
              color="primary"
              variant="underlined"
            >
              <Tab
                key="perfil"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                      <User className="text-blue-600 dark:text-blue-300 w-4 h-4" />
                    </div>
                    <span>Perfil</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard title="Dados Pessoais" description="Informações básicas do usuário">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nome" placeholder="Primeiro nome" value={editFormData.firstName} onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })} />
                        <Input label="Sobrenome" placeholder="Sobrenome" value={editFormData.lastName} onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })} />
                      </div>
                      <Input
                        isRequired
                        label="Email"
                        placeholder="email@exemplo.com"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      />
                      <ModalSectionCard title="Avatar" description="Foto de perfil do usuário">
                        <div className="flex flex-col items-center gap-4">
                          <Avatar
                            isBordered
                            className="w-24 h-24"
                            color="primary"
                            name={selectedUsuario ? `${selectedUsuario.firstName || ""} ${selectedUsuario.lastName || ""}`.trim() || selectedUsuario.email : ""}
                            size="lg"
                            src={editFormData.avatarUrl || undefined}
                          />
                          <div className="flex flex-col gap-3 w-full max-w-md">
                      <Input
                        label="URL do Avatar"
                        placeholder="https://exemplo.com/avatar.jpg"
                        value={editFormData.avatarUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
                        startContent={<Image className="w-4 h-4 text-default-400" />}
                              description="Cole a URL da imagem ou faça upload de arquivo"
                            />
                            <div className="flex flex-col gap-3 w-full max-w-md">
                              <div className="flex gap-2">
                                <Button
                                  color="primary"
                                  size="sm"
                                  startContent={<Image className="w-4 h-4" />}
                                  variant="bordered"
                                  isDisabled={!editFormData.avatarUrl}
                                  onPress={async () => {
                                    if (!selectedUsuario) return;
                                    if (!editFormData.avatarUrl) {
                                      toast.error("Digite uma URL válida");
                                      return;
                                    }
                                    // Criar FormData com URL
                                    const formData = new FormData();
                                    formData.append("url", editFormData.avatarUrl);
                                    const result = await uploadAvatarUsuarioEquipe(selectedUsuario.id, formData);
                                    if (result.success && result.avatarUrl) {
                                      setEditFormData({ ...editFormData, avatarUrl: result.avatarUrl });
                                      await loadData();
                                      toast.success("Avatar atualizado!");
                                    } else {
                                      toast.error(result.error || "Erro ao atualizar avatar");
                                    }
                                  }}
                                >
                                  Salvar URL
                                </Button>
                                <label htmlFor="avatar-file-upload">
                                  <Button as="span" color="secondary" size="sm" startContent={<Image className="w-4 h-4" />} variant="bordered">
                                    Upload Arquivo
                                  </Button>
                                  <input
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    className="hidden"
                                    id="avatar-file-upload"
                                    type="file"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file || !selectedUsuario) return;
                                      // Converter para base64 e enviar via API route
                                      const reader = new FileReader();
                                      reader.onloadend = async () => {
                                        try {
                                          const base64 = reader.result as string;
                                          const response = await fetch("/api/equipe/upload-avatar", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                              usuarioId: selectedUsuario.id,
                                              file: base64.split(",")[1], // Remover data:image/...;base64,
                                              fileName: file.name,
                                              mimeType: file.type,
                                            }),
                                          });
                                          const result = await response.json();
                                          if (result.success && result.avatarUrl) {
                                            setEditFormData({ ...editFormData, avatarUrl: result.avatarUrl });
                                            await loadData();
                                            toast.success("Avatar atualizado!");
                                          } else {
                                            toast.error(result.error || "Erro ao atualizar avatar");
                                          }
                                        } catch (error) {
                                          toast.error("Erro ao fazer upload do avatar");
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                      e.target.value = ""; // Reset input
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ModalSectionCard>
                    </div>
                  </ModalSectionCard>

                  <ModalSectionCard title="Documentos" description="CPF, RG e data de nascimento">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="CPF"
                          placeholder="000.000.000-00"
                          value={editFormData.cpf}
                          onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                          startContent={<CreditCard className="w-4 h-4 text-default-400" />}
                        />
                        <Input
                          label="RG"
                          placeholder="0000000"
                          value={editFormData.rg}
                          onChange={(e) => setEditFormData({ ...editFormData, rg: e.target.value })}
                          startContent={<FileText className="w-4 h-4 text-default-400" />}
                        />
                      </div>
                      <Input
                        label="Data de Nascimento"
                        type="date"
                        value={editFormData.dataNascimento}
                        onChange={(e) => setEditFormData({ ...editFormData, dataNascimento: e.target.value })}
                        startContent={<Calendar className="w-4 h-4 text-default-400" />}
                      />
                    </div>
                  </ModalSectionCard>
                </div>
              </Tab>

              <Tab
                key="contatos"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-green-100 dark:bg-green-900">
                      <Phone className="text-green-600 dark:text-green-300 w-4 h-4" />
                    </div>
                    <span>Contatos</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard title="Informações de Contato" description="Telefone e observações">
                    <div className="space-y-4">
                      <Input label="Telefone" placeholder="(00) 00000-0000" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} />
                      <Textarea
                        label="Observações"
                        placeholder="Observações sobre o usuário..."
                        value={editFormData.observacoes}
                        onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                        minRows={3}
                      />
                    </div>
                  </ModalSectionCard>
                </div>
              </Tab>

              <Tab
                key="cargo-role"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900">
                      <Award className="text-purple-600 dark:text-purple-300 w-4 h-4" />
                    </div>
                    <span>Cargo/Role</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard title="Função no Escritório" description="Configure o cargo e nível base do usuário">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Cargo (Função Principal)"
                          placeholder="Selecione um cargo"
                          selectedKeys={editFormData.cargoId ? [editFormData.cargoId] : []}
                          onSelectionChange={(keys) => {
                            const cargoId = Array.from(keys)[0] as string;
                            setEditFormData({ ...editFormData, cargoId: cargoId || "" });
                          }}
                          startContent={<Award className="w-4 h-4 text-default-400" />}
                          description="Função específica do usuário no escritório"
                        >
                          {cargos
                            .filter((c) => c.ativo)
                            .map((cargo) => (
                              <SelectItem key={cargo.id}>{cargo.nome}</SelectItem>
                            ))}
                        </Select>

                        <Select
                          label="Role (Nível Base)"
                          selectedKeys={[editFormData.role]}
                          onSelectionChange={(keys) => {
                            const role = Array.from(keys)[0] as string;
                            setEditFormData({ ...editFormData, role: role || "SECRETARIA" });
                          }}
                          startContent={<User className="w-4 h-4 text-default-400" />}
                          description="Nível base do sistema para permissões padrão"
                        >
                          <SelectItem key="ADMIN">{getRoleLabel("ADMIN")}</SelectItem>
                          <SelectItem key="ADVOGADO">{getRoleLabel("ADVOGADO")}</SelectItem>
                          <SelectItem key="SECRETARIA">{getRoleLabel("SECRETARIA")}</SelectItem>
                          <SelectItem key="FINANCEIRO">{getRoleLabel("FINANCEIRO")}</SelectItem>
                          <SelectItem key="ESTAGIARIA">{getRoleLabel("ESTAGIARIA")}</SelectItem>
                          <SelectItem key="CLIENTE">{getRoleLabel("CLIENTE")}</SelectItem>
                        </Select>
                      </div>
                    </div>
                  </ModalSectionCard>

                  <ModalSectionCard title="Status do Usuário" description="Controle de acesso ao sistema">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium mb-1">Status</p>
                        <p className="text-xs text-default-500">Usuários inativos não conseguem fazer login</p>
                      </div>
                      <Switch isSelected={editFormData.active} onValueChange={(value) => setEditFormData({ ...editFormData, active: value })}>
                        {editFormData.active ? "Ativo" : "Inativo"}
                      </Switch>
                    </div>
                  </ModalSectionCard>
                </div>
              </Tab>

              <Tab
                key="enderecos"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-green-100 dark:bg-green-900">
                      <MapPin className="text-green-600 dark:text-green-300 w-4 h-4" />
                    </div>
                    <span>Endereços</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard title="Gerenciar Endereços" description="Adicione e gerencie os endereços do usuário">
                    {selectedUsuario && (
                      <div className="endereco-manager-wrapper" key={selectedUsuario.id}>
                        <EnderecoManager userId={selectedUsuario.id} />
                      </div>
                    )}
                  </ModalSectionCard>
                </div>
              </Tab>

              <Tab
                key="historico"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900">
                      <HistoryIcon className="text-purple-600 dark:text-purple-300 w-4 h-4" />
                    </div>
                    <span>Histórico</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard title="Histórico de Alterações" description="Registro de todas as alterações do usuário">
                    {selectedUsuario && <UsuarioHistoricoTab usuarioId={selectedUsuario.id} />}
                  </ModalSectionCard>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSaving} onPress={handleSaveUsuario}>
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Permissões */}
      <Modal isOpen={isPermissionsModalOpen} onClose={() => setIsPermissionsModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeaderGradient icon={Shield} title={`Gerenciar Permissões - ${selectedUsuario?.firstName || selectedUsuario?.email || ""}`} description="Configure permissões individuais do usuário" />
          <ModalBody>
            {selectedUsuario && (
              <div className="space-y-6">
                {/* Legenda */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardBody className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-primary">Como funciona</h3>
                      </div>

                      <p className="text-sm text-default-700">As permissões são verificadas nesta ordem de precedência:</p>

                      <ol className="list-decimal list-inside space-y-2 text-sm text-default-600">
                        <li>
                          <strong className="text-primary">Override individual</strong> - Permissão personalizada criada manualmente
                        </li>
                        <li>
                          <strong className="text-secondary">Cargo</strong> - Permissão herdada do cargo ativo do usuário
                        </li>
                        <li>
                          <strong className="text-default-500">Role padrão</strong> - Permissão padrão baseada no tipo de usuário (Advogado, Secretária, etc.)
                        </li>
                      </ol>

                      <div className="pt-2 border-t border-default-200">
                        <p className="text-sm font-medium text-default-700 mb-2">Significado dos chips:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="primary">
                              Override
                            </Chip>
                            <span className="text-xs text-default-600">Permissão personalizada (sobrescreve cargo/role)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="secondary">
                              Herdado do cargo
                            </Chip>
                            <span className="text-xs text-default-600">Vem do cargo ativo do usuário</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="default">
                              Padrão do role
                            </Chip>
                            <span className="text-xs text-default-600">Permissão padrão do tipo de usuário</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="danger">
                              Sem permissão
                            </Chip>
                            <span className="text-xs text-default-600">Negado em todas as camadas</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-default-200">
                        <p className="text-sm font-medium text-default-700 mb-1">Como usar:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-default-600">
                          <li>
                            Ligue/desligue o switch para criar um <strong>override individual</strong>
                          </li>
                          <li>
                            O override <strong>substitui</strong> a permissão do cargo e role
                          </li>
                          <li>Para remover um override, desligue o switch e ele voltará ao estado do cargo/role</li>
                          <li>
                            O switch mostra o <strong>estado efetivo atual</strong> da permissão
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Divider />
                {loadingPermissoes ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  modulos.map((modulo) => (
                    <div key={modulo.key} className="space-y-3">
                      <h3 className="font-semibold text-default-700">{modulo.label}</h3>
                      {modulo.description && <p className="text-xs text-default-500">{modulo.description}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {acoes.map((acao) => {
                          // Estado efetivo da permissão
                          const permissaoEfetiva = permissoesEfetivas.find((p) => p.modulo === modulo.key && p.acao === acao.key);
                          const estaPermitido = permissaoEfetiva?.permitido ?? false;
                          const origem = permissaoEfetiva?.origem ?? "role";

                          // Override individual (se existe)
                          const temOverride = permissionsForm[modulo.key]?.[acao.key] !== undefined;
                          const overrideValue = permissionsForm[modulo.key]?.[acao.key] ?? null;

                          // Determinar se o switch deve estar ligado
                          // Se tem override, usa o override; senão, mostra o estado efetivo
                          const switchValue = temOverride ? overrideValue === true : estaPermitido;

                          // Labels para origem (incluindo estado negado)
                          const origemLabels = {
                            override: "Override",
                            cargo: "Herdado do cargo",
                            role: "Padrão do role",
                            negado: "Sem permissão",
                          };

                          const origemColors = {
                            override: "primary" as const,
                            cargo: "secondary" as const,
                            role: "default" as const,
                            negado: "danger" as const,
                          };

                          // Se a permissão está negada em todas as camadas (sem override, sem cargo, role padrão negado), destacar
                          // Só mostra "Sem permissão" se não há override explícito E a origem é role (padrão negado)
                          const mostrarNegado = !estaPermitido && !temOverride && origem === "role";
                          const labelOrigem = mostrarNegado ? "negado" : origem;
                          const chipColor = origemColors[labelOrigem as keyof typeof origemColors];
                          const chipLabel = origemLabels[labelOrigem as keyof typeof origemLabels];

                          return (
                            <div key={acao.key} className="flex items-center justify-between p-3 rounded-lg border border-default-200 bg-default-50">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Switch
                                    isSelected={switchValue}
                                    onValueChange={(value) => {
                                      handleSavePermission(modulo.key, acao.key, value);
                                    }}
                                    isDisabled={isSavingPermission}
                                  >
                                    <span className="text-sm font-medium">{acao.label}</span>
                                  </Switch>
                                </div>
                                <div className="ml-8">
                                  <Chip size="sm" variant="flat" color={chipColor}>
                                    {chipLabel}
                                  </Chip>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Divider />
                    </div>
                  ))
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsPermissionsModalOpen(false)}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Vincular */}
      <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeaderGradient
            icon={LinkIcon}
            title={`Vincular Usuário - ${selectedUsuario?.firstName || selectedUsuario?.email || ""}`}
            description="Vincule este usuário a um advogado do escritório"
          />
          <ModalBody>
            <div className="space-y-6">
              <ModalSectionCard title="Seleção do Advogado" description="Escolha o advogado ao qual este usuário será vinculado">
                <Select
                  label="Advogado"
                  placeholder="Selecione um advogado"
                  selectedKeys={linkForm.advogadoId ? [linkForm.advogadoId] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setLinkForm({ ...linkForm, advogadoId: selected });
                  }}
                  startContent={<User className="w-4 h-4 text-default-400" />}
                  description="O advogado selecionado será responsável por este usuário"
                >
                  {advogados.map((adv) => (
                    <SelectItem key={adv.id}>
                      {adv.nome} {adv.oabNumero && `- OAB ${adv.oabNumero}/${adv.oabUf}`}
                    </SelectItem>
                  ))}
                </Select>
              </ModalSectionCard>

              <ModalSectionCard title="Tipo de Vinculação" description="Defina o tipo de relacionamento entre o usuário e o advogado">
                <Select
                  label="Tipo de Vinculação"
                  placeholder="Selecione o tipo"
                  selectedKeys={[linkForm.tipo]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setLinkForm({ ...linkForm, tipo: selected });
                  }}
                  startContent={<LinkIcon className="w-4 h-4 text-default-400" />}
                  description="Assistente: auxilia o advogado | Responsável: gerencia o usuário | Colaborador: trabalha em conjunto"
                >
                  <SelectItem key="assistente">Assistente</SelectItem>
                  <SelectItem key="responsavel">Responsável</SelectItem>
                  <SelectItem key="colaborador">Colaborador</SelectItem>
                </Select>
              </ModalSectionCard>

              <ModalSectionCard title="Observações" description="Informações adicionais sobre esta vinculação">
                <Textarea
                  label="Observações (opcional)"
                  placeholder="Observações sobre esta vinculação..."
                  value={linkForm.observacoes}
                  onChange={(e) => setLinkForm({ ...linkForm, observacoes: e.target.value })}
                  minRows={3}
                />
              </ModalSectionCard>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsLinkModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSavingLink} onPress={handleSaveLink} isDisabled={!linkForm.advogadoId}>
              Vincular
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function ConvitesTab() {
  const [convites, setConvites] = useState<ConviteEquipeData[]>([]);
  const [cargos, setCargos] = useState<CargoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateConviteData>({
    email: "",
    nome: "",
    cargoId: "",
    role: "ADVOGADO" as any,
    observacoes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [convitesData, cargosData] = await Promise.all([getConvitesEquipe(), getCargos()]);

      setConvites(convitesData);
      setCargos(cargosData);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateConvite() {
    // Validações
    if (!formData.email.trim()) {
      toast.error("Email é obrigatório");

      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Email inválido");

      return;
    }

    if (formData.nome && formData.nome.trim().length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres");

      return;
    }

    if (formData.nome && formData.nome.trim().length > 100) {
      toast.error("Nome deve ter no máximo 100 caracteres");

      return;
    }

    if (formData.observacoes && formData.observacoes.length > 500) {
      toast.error("Observações devem ter no máximo 500 caracteres");

      return;
    }

    try {
      setLoading(true);
      await createConviteEquipe(formData);
      toast.success("Convite enviado com sucesso!");
      setIsModalOpen(false);
      setFormData({
        email: "",
        nome: "",
        cargoId: "",
        role: "ADVOGADO" as any,
        observacoes: "",
      });
      loadData();
    } catch (error) {
      toast.error("Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConvite(conviteId: string) {
    try {
      setActionLoading(conviteId);
      await resendConviteEquipe(conviteId);
      toast.success("Convite reenviado com sucesso!");
      loadData();
    } catch (error) {
      toast.error("Erro ao reenviar convite");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelConvite(conviteId: string) {
    // Encontrar o convite para mostrar o email
    const convite = convites.find((c) => c.id === conviteId);
    const email = convite?.email || "este convite";

    if (!confirm(`Tem certeza que deseja cancelar o convite para "${email}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setActionLoading(conviteId);
      await cancelConviteEquipe(conviteId);
      toast.success(`Convite para "${email}" cancelado com sucesso!`);
      loadData();
    } catch (error) {
      toast.error("Erro ao cancelar convite");
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusColor(status: string): ChipProps["color"] {
    const colors: Record<string, ChipProps["color"]> = {
      pendente: "warning",
      aceito: "success",
      rejeitado: "danger",
      expirado: "default",
    };

    return colors[status] ?? "default";
  }

  function getStatusIcon(status: string) {
    const icons = {
      pendente: Clock,
      aceito: CheckCircle,
      rejeitado: XCircle,
      expirado: X,
    };
    const IconComponent = icons[status as keyof typeof icons] || Clock;

    return <IconComponent className="w-3 h-3" />;
  }

  function getRoleLabel(role: string) {
    const labels = {
      ADMIN: "Administrador",
      ADVOGADO: "Advogado",
      SECRETARIA: "Secretária",
      CLIENTE: "Cliente",
    };

    return labels[role as keyof typeof labels] || role;
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  // useMemo deve ser chamado ANTES de qualquer return condicional (regra dos hooks)
  const convitesStats = useMemo(() => {
    const pendentes = convites.filter((c) => c.status === "pendente").length;
    const aceitos = convites.filter((c) => c.status === "aceito").length;
    const expirados = convites.filter((c) => c.status === "expirado").length;
    const rejeitados = convites.filter((c) => c.status === "rejeitado").length;
    return { pendentes, aceitos, expirados, rejeitados, total: convites.length };
  }, [convites]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
      {/* Cards de Resumo */}
      <MotionCardGrid columns={4}>
        <Card className="border-none bg-white/10 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <CardBody className="relative overflow-hidden rounded-3xl px-6 py-6 text-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/90 via-amber-500/70 to-amber-500/50 opacity-80" />
            <div className="relative flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-white/80">Pendentes</p>
                <p className="text-3xl font-semibold">{convitesStats.pendentes}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-white/10 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <CardBody className="relative overflow-hidden rounded-3xl px-6 py-6 text-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/90 via-emerald-500/70 to-emerald-500/50 opacity-80" />
            <div className="relative flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-white/80">Aceitos</p>
                <p className="text-3xl font-semibold">{convitesStats.aceitos}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-white/10 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <CardBody className="relative overflow-hidden rounded-3xl px-6 py-6 text-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/90 via-red-500/70 to-red-500/50 opacity-80" />
            <div className="relative flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-white/80">Expirados</p>
                <p className="text-3xl font-semibold">{convitesStats.expirados}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-white/10 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <CardBody className="relative overflow-hidden rounded-3xl px-6 py-6 text-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/90 via-violet-500/70 to-violet-500/50 opacity-80" />
            <div className="relative flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-white/80">Total</p>
                <p className="text-3xl font-semibold">{convitesStats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>
      </MotionCardGrid>

      <motion.div variants={cardVariants}>
        <Card className="border-none bg-white/90 shadow-lg backdrop-blur dark:bg-content1/80">
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Convites de Equipe</h2>
                <p className="text-default-500">Gerencie os convites enviados para novos membros</p>
              </div>
              <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={() => setIsModalOpen(true)}>
                Enviar Convite
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {convites.length === 0 ? (
        <motion.div variants={cardVariants}>
          <Card className="border-none bg-dotted-pattern bg-white/90 py-12 text-center shadow-lg dark:bg-content2/80">
            <CardBody className="space-y-3">
              <Mail className="mx-auto h-10 w-10 text-default-400" />
              <h3 className="text-lg font-semibold">Nenhum convite encontrado</h3>
              <p className="text-sm text-default-500">Envie um convite para adicionar novos membros à equipe</p>
              <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={() => setIsModalOpen(true)}>
                Enviar Primeiro Convite
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={cardVariants}>
          <Card className="border-none shadow-xl">
            <CardBody>
              <div className="space-y-4">
                {convites.map((convite) => (
                  <div key={convite.id} className="flex items-center justify-between p-4 rounded-lg border border-default-200 hover:bg-default-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{convite.nome || convite.email}</h3>
                        <Chip color={getStatusColor(convite.status)} size="sm" startContent={getStatusIcon(convite.status)} variant="flat">
                          {convite.status}
                        </Chip>
                      </div>
                      <p className="text-sm text-default-500">{convite.email}</p>
                      {convite.cargo && (
                        <p className="text-xs text-default-400 mt-1">
                          Cargo: {convite.cargo.nome} | Role: {getRoleLabel(convite.role)}
                        </p>
                      )}
                      <p className="text-xs text-default-400 mt-1">Enviado em: {formatDate(convite.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      {convite.status === "pendente" && (
                        <>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            isLoading={actionLoading === convite.id}
                            startContent={<Mail className="w-4 h-4" />}
                            onPress={() => handleResendConvite(convite.id)}
                          >
                            Reenviar
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isLoading={actionLoading === convite.id}
                            startContent={<XCircle className="w-4 h-4" />}
                            onPress={() => handleCancelConvite(convite.id)}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Modal de Novo Convite */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeaderGradient icon={Mail} title="Enviar Convite" description="Convide um novo membro para a equipe" />
          <ModalBody className="px-0">
            <Tabs
              aria-label="Formulário de convite"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none px-6 pt-6 pb-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-primary font-medium text-sm tracking-wide",
                panel: "px-6 pb-6 pt-4",
              }}
              color="primary"
              variant="underlined"
            >
              <Tab
                key="dados"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                      <User className="text-blue-600 dark:text-blue-300 w-4 h-4" />
                    </div>
                    <span>Dados</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard title="Informações do Convite" description="Dados do novo membro">
                    <div className="space-y-4">
                      <Input isRequired label="Email" placeholder="email@exemplo.com" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

                      <Input label="Nome (opcional)" placeholder="Nome completo" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                    </div>
                  </ModalSectionCard>
                </div>
              </Tab>

              <Tab
                key="cargo-role"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900">
                      <Award className="text-purple-600 dark:text-purple-300 w-4 h-4" />
                    </div>
                    <span>Cargo/Role</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ModalSectionCard title="Função no Escritório" description="Configure cargo e role do novo membro">
                    <div className="space-y-4">
                      <Select
                        label="Cargo (opcional)"
                        placeholder="Selecione um cargo"
                        selectedKeys={formData.cargoId ? [formData.cargoId] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;
                          setFormData({ ...formData, cargoId: selectedKey || "" });
                        }}
                      >
                        {cargos.map((cargo) => (
                          <SelectItem key={cargo.id}>{cargo.nome}</SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Role"
                        placeholder="Selecione o role"
                        selectedKeys={[formData.role]}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;
                          setFormData({ ...formData, role: selectedKey as any });
                        }}
                      >
                        <SelectItem key="ADMIN">Administrador</SelectItem>
                        <SelectItem key="ADVOGADO">Advogado</SelectItem>
                        <SelectItem key="SECRETARIA">Secretária</SelectItem>
                        <SelectItem key="CLIENTE">Cliente</SelectItem>
                      </Select>
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
                  <ModalSectionCard title="Mensagem Personalizada" description="Mensagem adicional para o convite">
                    <Textarea
                      label="Observações (opcional)"
                      minRows={4}
                      placeholder="Mensagem personalizada para o convite..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    />
                  </ModalSectionCard>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isDisabled={!formData.email.trim()} isLoading={loading} onPress={handleCreateConvite}>
              Enviar Convite
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </motion.div>
  );
}

// ===== COMPONENTE PRINCIPAL =====

export default function EquipeContent() {
  const [selectedTab, setSelectedTab] = useState("cargos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  function handleExportAll() {
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const csvContent = [
        // Cabeçalho
        ["Tipo", "Nome", "Email", "Role", "Status", "Detalhes"].join(","),
        // Dados (será preenchido pelas tabs específicas)
        ["Equipe", "Magic Lawyer", "Exportação completa", "Sistema", "Ativo", `Exportado em ${timestamp}`].join(","),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `equipe-completa-${timestamp}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-800 text-white shadow-2xl">
          <CardBody className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-tight">Equipe & Permissões</h1>
                <p className="text-white/80">
                  Controle cargos, perfis de acesso e convites da sua equipe em tempo real. Use os cargos como identidade principal e mantenha a segurança alinhada ao dia a dia do escritório.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button color="secondary" startContent={<Users className="w-4 h-4" />} onPress={() => setSelectedTab("usuarios")}>
                    Gerenciar Usuários
                  </Button>
                  <Button variant="bordered" className="border-white/40 bg-white/10 text-white" startContent={<Crown className="w-4 h-4" />} onPress={() => setSelectedTab("cargos")}>
                    Configurar Cargos
                  </Button>
                </div>
              </div>
              <motion.div className="flex flex-col gap-3 text-white/80" initial="hidden" animate="visible" variants={containerVariants}>
                <motion.div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm" variants={cardVariants}>
                  <Activity className="h-4 w-4" />
                  Sincronização em tempo real ativada
                </motion.div>
                <motion.div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm" variants={cardVariants}>
                  <Shield className="h-4 w-4" />
                  Overrides e cargos com auditoria
                </motion.div>
              </motion.div>
            </div>

            <DashboardEquipe />
          </CardBody>
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </Card>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <Card className="border-none bg-white/90 shadow-lg backdrop-blur dark:bg-content1/80">
          <CardBody className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Input
                    endContent={
                      searchTerm && (
                        <Button isIconOnly size="sm" variant="light" onPress={() => setSearchTerm("")}>
                          <X className="w-4 h-4" />
                        </Button>
                      )
                    }
                    label="Buscar na equipe"
                    placeholder="Pesquise por nome, e-mail ou cargo..."
                    startContent={<Search className="w-4 h-4 text-default-400" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button startContent={<Filter className="w-4 h-4" />} variant="flat" onPress={() => setShowFilters(!showFilters)}>
                  Filtros
                </Button>
              </div>

              <div className="flex gap-2">
                <Button startContent={<Download className="w-4 h-4" />} variant="flat" onPress={() => handleExportAll()}>
                  Exportar visão
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div animate={{ opacity: 1, height: "auto" }} className="overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }}>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Select
                      className="min-w-40"
                      label="Seção"
                      placeholder="Todas as seções"
                      selectedKeys={selectedSection === "all" ? [] : [selectedSection]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;

                        setSelectedSection(selected || "all");
                      }}
                    >
                      <SelectItem key="all">Todas</SelectItem>
                      <SelectItem key="cargos">Cargos</SelectItem>
                      <SelectItem key="usuarios">Usuários</SelectItem>
                      <SelectItem key="convites">Convites</SelectItem>
                    </Select>

                    <Button
                      startContent={<RotateCcw className="w-4 h-4" />}
                      variant="light"
                      onPress={() => {
                        setSearchTerm("");
                        setSelectedSection("all");
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardBody>
        </Card>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <Card className="border-none shadow-xl">
          <CardBody className="p-0">
            <Tabs
              aria-label="Gestão de Equipe"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none bg-content1/90 p-2 backdrop-blur",
                cursor: "w-full bg-gradient-to-r from-primary/90 to-secondary/70 shadow-lg",
                tab: "max-w-fit px-6 py-3 h-12 rounded-xl data-[selected=true]:text-white",
                tabContent: "group-data-[selected=true]:text-white text-default-500",
              }}
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
            >
              <Tab
                key="cargos"
                title={
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span>Cargos</span>
                  </div>
                }
              >
                <div className="p-6">
                  <CargosTab />
                </div>
              </Tab>

              <Tab
                key="usuarios"
                title={
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Usuários</span>
                  </div>
                }
              >
                <div className="p-6">
                  <UsuariosTab />
                </div>
              </Tab>

              <Tab
                key="convites"
                title={
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Convites</span>
                  </div>
                }
              >
                <div className="p-6">
                  <ConvitesTab />
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
