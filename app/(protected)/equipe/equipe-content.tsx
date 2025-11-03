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
  Checkbox,
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
  Crown,
  Award,
  Activity,
  Download,
  Settings,
  UserCheck,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Calendar,
  FileText,
  CreditCard,
  Image,
  GraduationCap,
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
  type CargoData,
  type UsuarioEquipeData,
} from "@/app/actions/equipe";
import {
  getConvitesEquipe,
  createConviteEquipe,
  resendConviteEquipe,
  cancelConviteEquipe,
  type ConviteEquipeData,
  type CreateConviteData,
} from "@/app/actions/convites-equipe";
import { getAdvogados } from "@/app/actions/advogados";
import { useModulosTenant } from "@/app/hooks/use-equipe";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardBody className="flex flex-row items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-default-500">Total de Usuários</p>
            <p className="text-2xl font-bold">{dashboardData.totalUsuarios}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <Shield className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-default-500">Cargos Ativos</p>
            <p className="text-2xl font-bold">{dashboardData.totalCargos}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Mail className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-default-500">Convites Pendentes</p>
            <p className="text-2xl font-bold">
              {dashboardData.convitesPendentes}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <LinkIcon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-default-500">Vinculações Ativas</p>
            <p className="text-2xl font-bold">
              {dashboardData.vinculacoesAtivas}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
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
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao carregar cargos. Tente novamente.";
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

    if (
      !confirm(
        `Tem certeza que deseja excluir o cargo "${cargoNome}"?\n\nEsta ação não pode ser desfeita e pode afetar usuários vinculados a este cargo.`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(cargoId);
      await deleteCargo(cargoId);
      toast.success(`Cargo "${cargoNome}" excluído com sucesso!`);
      loadCargos();
    } catch (error) {
      toast.error(
        "Erro ao excluir cargo. Verifique se não há usuários vinculados a este cargo.",
      );
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
        ["Nome", "Descrição", "Nível", "Status", "Usuários", "Permissões"].join(
          ",",
        ),
        // Dados
        ...filteredCargos.map((cargo) =>
          [
            `"${cargo.nome}"`,
            `"${cargo.descricao || ""}"`,
            `"${getNivelLabel(cargo.nivel)}"`,
            `"${cargo.ativo ? "Ativo" : "Inativo"}"`,
            `"${cargo.usuariosCount}"`,
            `"${cargo.permissoes.length}"`,
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `equipe-cargos-${new Date().toISOString().split("T")[0]}.csv`,
      );
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
      const matchesSearch =
        cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cargo.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNivel =
        selectedNivel === "all" || cargo.nivel.toString() === selectedNivel;

      return matchesSearch && matchesNivel;
    });
  }, [cargos, searchTerm, selectedNivel]);

  // Paginação
  const totalPages = Math.ceil(filteredCargos.length / itemsPerPage);
  const paginatedCargos = filteredCargos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading || modulosLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Input
              endContent={
                searchTerm && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setSearchTerm("")}
                  >
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

          <Button
            startContent={<Filter className="w-4 h-4" />}
            variant="light"
            onPress={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            startContent={<Download className="w-4 h-4" />}
            variant="light"
            onPress={() => handleExportCargos()}
          >
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
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardBody>
                <div className="flex flex-wrap gap-4">
                  <Select
                    className="min-w-40"
                    label="Nível"
                    placeholder="Todos os níveis"
                    selectedKeys={
                      selectedNivel === "all" ? [] : [selectedNivel]
                    }
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
                    Limpar Filtros
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de cargos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCargos.map((cargo) => (
          <motion.div
            key={cargo.id}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{cargo.nome}</h3>
                    <Tooltip
                      content={`Nível ${cargo.nivel} - ${getNivelLabel(cargo.nivel)}`}
                    >
                      <Chip
                        color={getNivelColor(cargo.nivel)}
                        size="sm"
                        startContent={<Crown className="w-3 h-3" />}
                        variant="flat"
                      >
                        {getNivelLabel(cargo.nivel)}
                      </Chip>
                    </Tooltip>
                  </div>
                  {cargo.descricao && (
                    <p className="text-sm text-default-500 line-clamp-2">
                      {cargo.descricao}
                    </p>
                  )}
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="edit"
                      startContent={<Edit className="w-4 h-4" />}
                      onPress={() => handleEditCargo(cargo)}
                    >
                      Editar
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      isDisabled={actionLoading === cargo.id}
                      startContent={
                        actionLoading === cargo.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )
                      }
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
                      <span className="text-sm text-default-500">
                        {cargo.usuariosCount} usuário(s)
                      </span>
                    </div>
                    <Badge color="primary" content={cargo.permissoes.length}>
                      <Chip
                        size="sm"
                        startContent={<Shield className="w-3 h-3" />}
                        variant="flat"
                      >
                        Permissões
                      </Chip>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch isDisabled isSelected={cargo.ativo} size="sm" />
                    <span className="text-sm text-default-500">
                      {cargo.ativo ? "Ativo" : "Inativo"}
                    </span>
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
          <Pagination
            showControls
            showShadow
            page={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
          />
        </div>
      )}

      {/* Estado de erro */}
      {error && !loading && (
        <Card className="border-danger/20 bg-danger/5">
          <CardBody className="py-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-danger mb-1">
                  Erro ao carregar cargos
                </h3>
                <p className="text-sm text-default-600 mb-3">{error}</p>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  startContent={<RefreshCw className="w-4 h-4" />}
                  onPress={() => loadCargos()}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Estado vazio */}
      {filteredCargos.length === 0 && !loading && !error && (
        <Card>
          <CardBody className="text-center py-12">
            <Users className="w-12 h-12 text-default-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum cargo encontrado
            </h3>
            <p className="text-default-500 mb-4">
              {searchTerm || selectedNivel !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Crie o primeiro cargo para começar a organizar sua equipe"}
            </p>
            {!searchTerm && selectedNivel === "all" && (
              <Button
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={() => {
                  setEditingCargo(null);
                  setModalOpen(true);
                }}
              >
                Criar Primeiro Cargo
              </Button>
            )}
          </CardBody>
        </Card>
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
    </div>
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

  function togglePermissao(modulo: string, acao: string) {
    const permissao = `${modulo}-${acao}`;

    setFormData((prev) => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissao)
        ? prev.permissoes.filter((p) => p !== permissao)
        : [...prev.permissoes, permissao],
    }));
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
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">
              {cargo ? "Editar Cargo" : "Novo Cargo"}
            </h2>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isRequired
                label="Nome do Cargo"
                placeholder="Ex: Advogado Sênior"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />

              <Select
                label="Nível Hierárquico"
                selectedKeys={[formData.nivel.toString()]}
                onSelectionChange={(keys) => {
                  const nivel = parseInt(Array.from(keys)[0] as string);

                  setFormData({ ...formData, nivel });
                }}
              >
                <SelectItem key="1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Estagiário
                  </div>
                </SelectItem>
                <SelectItem key="2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assistente
                  </div>
                </SelectItem>
                <SelectItem key="3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Advogado
                  </div>
                </SelectItem>
                <SelectItem key="4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Coordenador
                  </div>
                </SelectItem>
                <SelectItem key="5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Diretor
                  </div>
                </SelectItem>
              </Select>
            </div>

            <Textarea
              label="Descrição"
              minRows={3}
              placeholder="Descreva as responsabilidades e funções deste cargo..."
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
            />

            <div className="flex items-center gap-2">
              <Switch
                isSelected={formData.ativo}
                onValueChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
              <span className="text-sm">Cargo ativo</span>
            </div>

            <Divider />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-lg font-semibold">Permissões</h4>
                <Tooltip content="Configure as permissões que este cargo terá no sistema">
                  <HelpCircle className="w-4 h-4 text-default-400" />
                </Tooltip>
              </div>

              <div className="space-y-4">
                {modulos.map((modulo) => (
                  <div key={modulo.key} className="border rounded-lg p-4">
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      {modulo.label}
                      <Chip size="sm" variant="flat">
                        {
                          acoes.filter((acao) =>
                            hasPermissao(modulo.key, acao.key),
                          ).length
                        }
                        /{acoes.length}
                      </Chip>
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {acoes.map((acao) => (
                        <div key={acao.key} className="flex items-center gap-2">
                          <Checkbox
                            isSelected={hasPermissao(modulo.key, acao.key)}
                            size="sm"
                            onValueChange={() =>
                              togglePermissao(modulo.key, acao.key)
                            }
                          />
                          <span className="text-sm">{acao.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            isDisabled={!formData.nome.trim()}
            isLoading={loading}
            onPress={handleSubmit}
          >
            {cargo ? "Atualizar" : "Criar"} Cargo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioEquipeData[]>([]);
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Buscar módulos do tenant via hook
  const { modulos: modulosData } = useModulosTenant();
  
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
  });
  const [isSaving, setIsSaving] = useState(false);
  const [permissionsForm, setPermissionsForm] = useState<Record<string, Record<string, boolean>>>({});
  const [permissoesEfetivas, setPermissoesEfetivas] = useState<Array<{
    modulo: string;
    acao: string;
    permitido: boolean;
    origem: "override" | "cargo" | "role";
  }>>([]);
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
      const [usuariosData, advogadosData] = await Promise.all([
        getUsuariosEquipe(),
        getAdvogados(),
      ]);

      setUsuarios(usuariosData);
      setAdvogados(advogadosData.data || []);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados. Tente novamente.";
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
    const usuarioAny = usuario as any;
    setEditFormData({
      firstName: usuario.firstName || "",
      lastName: usuario.lastName || "",
      email: usuario.email || "",
      phone: usuarioAny.phone || "",
      active: usuario.active,
      cpf: usuarioAny.cpf || "",
      rg: usuarioAny.rg || "",
      dataNascimento: usuarioAny.dataNascimento 
        ? new Date(usuarioAny.dataNascimento).toISOString().split("T")[0]
        : "",
      observacoes: usuarioAny.observacoes || "",
      role: usuario.role || "SECRETARIA",
      avatarUrl: usuarioAny.avatarUrl || "",
    });
    setIsEditModalOpen(true);
  }

  async function handleSaveUsuario() {
    if (!selectedUsuario) return;

    setIsSaving(true);
    try {
      await updateUsuarioEquipe(selectedUsuario.id, {
        firstName: editFormData.firstName || undefined,
        lastName: editFormData.lastName || undefined,
        email: editFormData.email,
        phone: editFormData.phone || undefined,
        active: editFormData.active,
        cpf: editFormData.cpf || null,
        rg: editFormData.rg || null,
        dataNascimento: editFormData.dataNascimento 
          ? new Date(editFormData.dataNascimento)
          : null,
        observacoes: editFormData.observacoes || null,
        role: editFormData.role as any,
        avatarUrl: editFormData.avatarUrl || null,
      });
      toast.success("Usuário atualizado com sucesso");
      setIsEditModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar usuário"
      );
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
      await adicionarPermissaoIndividual(
        selectedUsuario.id,
        modulo,
        acao,
        permitido,
        `Permissão ${permitido ? "concedida" : "negada"} pelo admin`
      );
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
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar permissão"
      );
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
      await vincularUsuarioAdvogado(
        selectedUsuario.id,
        linkForm.advogadoId,
        linkForm.tipo,
        linkForm.observacoes || undefined
      );
      toast.success("Usuário vinculado com sucesso");
      setIsLinkModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao vincular usuário"
      );
    } finally {
      setIsSavingLink(false);
    }
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

  function handleExportUsuarios() {
    try {
      const csvContent = [
        // Cabeçalho
        [
          "Nome",
          "Email",
          "Role",
          "Tipo",
          "Status",
          "Cargos",
          "Vinculações",
        ].join(","),
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
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `equipe-usuarios-${new Date().toISOString().split("T")[0]}.csv`,
      );
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

      const matchesRole =
        selectedRole === "all" || usuario.role === selectedRole;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && usuario.active) ||
        (selectedStatus === "inactive" && !usuario.active);

      const matchesTipo =
        selectedTipo === "all" ||
        (selectedTipo === "interno" &&
          usuario.role === "ADVOGADO" &&
          !usuario.isExterno) ||
        (selectedTipo === "externo" &&
          usuario.role === "ADVOGADO" &&
          usuario.isExterno) ||
        (selectedTipo === "nao-advogado" && usuario.role !== "ADVOGADO");

      const matchesVinculacao =
        selectedVinculacao === "all" ||
        (selectedVinculacao === "com-vinculacao" &&
          usuario.vinculacoes.length > 0) ||
        (selectedVinculacao === "sem-vinculacao" &&
          usuario.vinculacoes.length === 0);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesTipo &&
        matchesVinculacao
      );
    });
  }, [
    usuarios,
    searchTerm,
    selectedRole,
    selectedStatus,
    selectedTipo,
    selectedVinculacao,
  ]);

  // Paginação
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const paginatedUsuarios = filteredUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Input
              endContent={
                searchTerm && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setSearchTerm("")}
                  >
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

          <Button
            startContent={<Filter className="w-4 h-4" />}
            variant="light"
            onPress={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            startContent={<Download className="w-4 h-4" />}
            variant="light"
            onPress={() => handleExportUsuarios()}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros expandidos */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
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
                    selectedKeys={
                      selectedStatus === "all" ? [] : [selectedStatus]
                    }
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
                    selectedKeys={
                      selectedVinculacao === "all" ? [] : [selectedVinculacao]
                    }
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
                    <Shield className="w-4 h-4" />
                    ROLE
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
                        <Avatar
                          name={usuario.firstName || usuario.email}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {usuario.firstName && usuario.lastName
                              ? `${usuario.firstName} ${usuario.lastName}`
                              : usuario.email}
                          </p>
                          <p className="text-sm text-default-500">
                            {usuario.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getRoleColor(usuario.role)}
                        size="sm"
                        startContent={getRoleIcon(usuario.role)}
                        variant="flat"
                      >
                        {getRoleLabel(usuario.role)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {usuario.role === "ADVOGADO" ? (
                        <Chip
                          color={usuario.isExterno ? "warning" : "success"}
                          size="sm"
                          startContent={
                            usuario.isExterno ? (
                              <ExternalLink className="w-3 h-3" />
                            ) : (
                              <Building2 className="w-3 h-3" />
                            )
                          }
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
                          <Chip
                            key={cargo.id}
                            color="primary"
                            size="sm"
                            variant="flat"
                          >
                            {cargo.nome}
                          </Chip>
                        ))}
                        {usuario.cargos.length === 0 && (
                          <span className="text-sm text-default-400">
                            Sem cargos
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.vinculacoes.map((vinculacao) => (
                          <Tooltip
                            key={vinculacao.id}
                            content={
                              vinculacao.observacoes || "Sem observações"
                            }
                          >
                            <Chip color="secondary" size="sm" variant="flat">
                              {vinculacao.tipo} → {vinculacao.advogadoNome}
                            </Chip>
                          </Tooltip>
                        ))}
                        {usuario.vinculacoes.length === 0 && (
                          <span className="text-sm text-default-400">
                            Sem vinculações
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={usuario.active ? "success" : "default"}
                        size="sm"
                        startContent={
                          usuario.active ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )
                        }
                        variant="flat"
                      >
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
                        <DropdownMenu onAction={(key) => {
                          if (key === "view") {
                            handleViewUsuario(usuario);
                          } else if (key === "edit") {
                            handleEditUsuario(usuario);
                          } else if (key === "permissions") {
                            handlePermissionsUsuario(usuario);
                          } else if (key === "link") {
                            handleLinkUsuario(usuario);
                          }
                        }}>
                          <DropdownItem
                            key="view"
                            startContent={<Eye className="w-4 h-4" />}
                          >
                            Visualizar
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<Edit className="w-4 h-4" />}
                          >
                            Editar
                          </DropdownItem>
                          <DropdownItem
                            key="permissions"
                            startContent={<Shield className="w-4 h-4" />}
                          >
                            Permissões
                          </DropdownItem>
                          <DropdownItem
                            key="link"
                            startContent={<LinkIcon className="w-4 h-4" />}
                          >
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
          <Pagination
            showControls
            showShadow
            page={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
          />
        </div>
      )}

      {/* Estado de erro */}
      {error && !loading && (
        <Card className="border-danger/20 bg-danger/5">
          <CardBody className="py-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-danger mb-1">
                  Erro ao carregar usuários
                </h3>
                <p className="text-sm text-default-600 mb-3">{error}</p>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  startContent={<RefreshCw className="w-4 h-4" />}
                  onPress={() => loadData()}
                >
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
            <h3 className="text-lg font-semibold mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-default-500">
              {searchTerm ||
              selectedRole !== "all" ||
              selectedStatus !== "all" ||
              selectedTipo !== "all" ||
              selectedVinculacao !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Nenhum usuário cadastrado na equipe"}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Modal de Visualização de Usuário */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Detalhes do Usuário</h2>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedUsuario && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-default-200">
                  <Avatar
                    name={selectedUsuario.firstName || selectedUsuario.email}
                    size="lg"
                    src={selectedUsuario.avatarUrl || undefined}
                  />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedUsuario.firstName && selectedUsuario.lastName
                        ? `${selectedUsuario.firstName} ${selectedUsuario.lastName}`
                        : selectedUsuario.email}
                    </h3>
                    <p className="text-sm text-default-500">{selectedUsuario.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-default-500 mb-1">Role</p>
                    <Chip
                      color={getRoleColor(selectedUsuario.role)}
                      size="sm"
                      startContent={getRoleIcon(selectedUsuario.role)}
                      variant="flat"
                    >
                      {getRoleLabel(selectedUsuario.role)}
                    </Chip>
                  </div>
                  
                  <div>
                    <p className="text-xs text-default-500 mb-1">Status</p>
                    <Chip
                      color={selectedUsuario.active ? "success" : "default"}
                      size="sm"
                      startContent={
                        selectedUsuario.active ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )
                      }
                      variant="flat"
                    >
                      {selectedUsuario.active ? "Ativo" : "Inativo"}
                    </Chip>
                  </div>
                </div>

                {selectedUsuario.cargos.length > 0 && (
                  <div>
                    <p className="text-xs text-default-500 mb-2">Cargos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsuario.cargos.map((cargo) => (
                        <Chip
                          key={cargo.id}
                          color="primary"
                          size="sm"
                          variant="flat"
                        >
                          {cargo.nome}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUsuario.vinculacoes.length > 0 && (
                  <div>
                    <p className="text-xs text-default-500 mb-2">Vinculações</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsuario.vinculacoes.map((vinculacao) => (
                        <Tooltip
                          key={vinculacao.id}
                          content={vinculacao.observacoes || "Sem observações"}
                        >
                          <Chip color="secondary" size="sm" variant="flat">
                            {vinculacao.tipo} → {vinculacao.advogadoNome}
                          </Chip>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUsuario.permissoesIndividuais.length > 0 && (
                  <div>
                    <p className="text-xs text-default-500 mb-2">Permissões Individuais</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsuario.permissoesIndividuais.map((perm) => (
                        <Chip
                          key={perm.id}
                          color={perm.permitido ? "success" : "danger"}
                          size="sm"
                          variant="flat"
                        >
                          {perm.modulo}/{perm.acao}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Edição de Usuário */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Editar Usuário</h2>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome"
                  placeholder="Primeiro nome"
                  value={editFormData.firstName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, firstName: e.target.value })
                  }
                />
                <Input
                  label="Sobrenome"
                  placeholder="Sobrenome"
                  value={editFormData.lastName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, lastName: e.target.value })
                  }
                />
              </div>
              <Input
                isRequired
                label="Email"
                placeholder="email@exemplo.com"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
              />
              
              <Divider />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={editFormData.cpf}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, cpf: e.target.value })
                  }
                  startContent={<CreditCard className="w-4 h-4 text-default-400" />}
                />
                <Input
                  label="RG"
                  placeholder="0000000"
                  value={editFormData.rg}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, rg: e.target.value })
                  }
                  startContent={<FileText className="w-4 h-4 text-default-400" />}
                />
              </div>
              
              <Input
                label="Data de Nascimento"
                type="date"
                value={editFormData.dataNascimento}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, dataNascimento: e.target.value })
                }
                startContent={<Calendar className="w-4 h-4 text-default-400" />}
              />
              
              <Select
                label="Role (Função)"
                selectedKeys={[editFormData.role]}
                onSelectionChange={(keys) => {
                  const role = Array.from(keys)[0] as string;
                  setEditFormData({ ...editFormData, role: role || "SECRETARIA" });
                }}
                startContent={<User className="w-4 h-4 text-default-400" />}
              >
                <SelectItem key="ADMIN" value="ADMIN">
                  {getRoleLabel("ADMIN")}
                </SelectItem>
                <SelectItem key="ADVOGADO" value="ADVOGADO">
                  {getRoleLabel("ADVOGADO")}
                </SelectItem>
                <SelectItem key="SECRETARIA" value="SECRETARIA">
                  {getRoleLabel("SECRETARIA")}
                </SelectItem>
                <SelectItem key="FINANCEIRO" value="FINANCEIRO">
                  {getRoleLabel("FINANCEIRO")}
                </SelectItem>
                <SelectItem key="ESTAGIARIA" value="ESTAGIARIA">
                  {getRoleLabel("ESTAGIARIA")}
                </SelectItem>
                <SelectItem key="CLIENTE" value="CLIENTE">
                  {getRoleLabel("CLIENTE")}
                </SelectItem>
              </Select>
              
              <Input
                label="URL do Avatar"
                placeholder="https://exemplo.com/avatar.jpg"
                value={editFormData.avatarUrl}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, avatarUrl: e.target.value })
                }
                startContent={<Image className="w-4 h-4 text-default-400" />}
                description="URL da imagem do avatar do usuário"
              />
              
              <Textarea
                label="Observações"
                placeholder="Observações sobre o usuário..."
                value={editFormData.observacoes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, observacoes: e.target.value })
                }
                minRows={3}
              />
              
              <Divider />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <p className="text-xs text-default-500">
                    Usuários inativos não conseguem fazer login
                  </p>
                </div>
                <Switch
                  isSelected={editFormData.active}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, active: value })
                  }
                >
                  {editFormData.active ? "Ativo" : "Inativo"}
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={isSaving}
              onPress={handleSaveUsuario}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Permissões */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Gerenciar Permissões - {selectedUsuario?.firstName || selectedUsuario?.email}
              </h2>
            </div>
          </ModalHeader>
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
                      
                      <p className="text-sm text-default-700">
                        As permissões são verificadas nesta ordem de precedência:
                      </p>
                      
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
                        <p className="text-sm font-medium text-default-700 mb-2">
                          Significado dos chips:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="primary">
                              Override
                            </Chip>
                            <span className="text-xs text-default-600">
                              Permissão personalizada (sobrescreve cargo/role)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="secondary">
                              Herdado do cargo
                            </Chip>
                            <span className="text-xs text-default-600">
                              Vem do cargo ativo do usuário
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="default">
                              Padrão do role
                            </Chip>
                            <span className="text-xs text-default-600">
                              Permissão padrão do tipo de usuário
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="danger">
                              Sem permissão
                            </Chip>
                            <span className="text-xs text-default-600">
                              Negado em todas as camadas
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-default-200">
                        <p className="text-sm font-medium text-default-700 mb-1">
                          Como usar:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-default-600">
                          <li>Ligue/desligue o switch para criar um <strong>override individual</strong></li>
                          <li>O override <strong>substitui</strong> a permissão do cargo e role</li>
                          <li>Para remover um override, desligue o switch e ele voltará ao estado do cargo/role</li>
                          <li>O switch mostra o <strong>estado efetivo atual</strong> da permissão</li>
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
                      {modulo.description && (
                        <p className="text-xs text-default-500">{modulo.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {acoes.map((acao) => {
                          // Estado efetivo da permissão
                          const permissaoEfetiva = permissoesEfetivas.find(
                            (p) => p.modulo === modulo.key && p.acao === acao.key
                          );
                          const estaPermitido = permissaoEfetiva?.permitido ?? false;
                          const origem = permissaoEfetiva?.origem ?? "role";
                          
                          // Override individual (se existe)
                          const temOverride = permissionsForm[modulo.key]?.[acao.key] !== undefined;
                          const overrideValue = permissionsForm[modulo.key]?.[acao.key] ?? null;
                          
                          // Determinar se o switch deve estar ligado
                          // Se tem override, usa o override; senão, mostra o estado efetivo
                          const switchValue = temOverride ? (overrideValue === true) : estaPermitido;
                          
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
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color={chipColor}
                                  >
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
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Vincular Usuário - {selectedUsuario?.firstName || selectedUsuario?.email}
              </h2>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Advogado"
                placeholder="Selecione um advogado"
                selectedKeys={linkForm.advogadoId ? [linkForm.advogadoId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setLinkForm({ ...linkForm, advogadoId: selected });
                }}
              >
                {advogados.map((adv) => (
                  <SelectItem key={adv.id} value={adv.id}>
                    {adv.nome} {adv.oabNumero && `- OAB ${adv.oabNumero}/${adv.oabUf}`}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Tipo de Vinculação"
                selectedKeys={[linkForm.tipo]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setLinkForm({ ...linkForm, tipo: selected });
                }}
              >
                <SelectItem key="assistente" value="assistente">
                  Assistente
                </SelectItem>
                <SelectItem key="responsavel" value="responsavel">
                  Responsável
                </SelectItem>
                <SelectItem key="colaborador" value="colaborador">
                  Colaborador
                </SelectItem>
              </Select>

              <Textarea
                label="Observações"
                placeholder="Observações sobre esta vinculação..."
                value={linkForm.observacoes}
                onChange={(e) =>
                  setLinkForm({ ...linkForm, observacoes: e.target.value })
                }
                minRows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsLinkModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={isSavingLink}
              onPress={handleSaveLink}
              isDisabled={!linkForm.advogadoId}
            >
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
      const [convitesData, cargosData] = await Promise.all([
        getConvitesEquipe(),
        getCargos(),
      ]);

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

    if (
      !confirm(
        `Tem certeza que deseja cancelar o convite para "${email}"?\n\nEsta ação não pode ser desfeita.`,
      )
    ) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Convites de Equipe</h2>
          <p className="text-default-500">
            Gerencie os convites enviados para novos membros
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => setIsModalOpen(true)}
        >
          Enviar Convite
        </Button>
      </div>

      {convites.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Mail className="w-12 h-12 text-default-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum convite encontrado
            </h3>
            <p className="text-default-500 mb-4">
              Envie o primeiro convite para começar a expandir sua equipe
            </p>
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setIsModalOpen(true)}
            >
              Enviar Primeiro Convite
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table aria-label="Lista de convites" className="min-w-[1000px]">
            <TableHeader>
              <TableColumn>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  EMAIL
                </div>
              </TableColumn>
              <TableColumn>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  NOME
                </div>
              </TableColumn>
              <TableColumn>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  CARGO
                </div>
              </TableColumn>
              <TableColumn>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  ROLE
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
                  <Clock className="w-4 h-4" />
                  EXPIRA EM
                </div>
              </TableColumn>
              <TableColumn>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  ENVIADO POR
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
              {convites.map((convite) => (
                <TableRow key={convite.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-default-400" />
                      <span className="font-medium">{convite.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{convite.nome || "-"}</TableCell>
                  <TableCell>
                    {convite.cargo ? (
                      <Chip color="primary" size="sm" variant="flat">
                        {convite.cargo.nome}
                      </Chip>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {getRoleLabel(convite.role)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(convite.status)}
                      size="sm"
                      startContent={getStatusIcon(convite.status)}
                      variant="flat"
                    >
                      {convite.status.charAt(0).toUpperCase() +
                        convite.status.slice(1)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-default-400" />
                      <span className="text-sm">
                        {formatDate(convite.expiraEm)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {convite.enviadoPorUsuario ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={
                            convite.enviadoPorUsuario.firstName ||
                            convite.enviadoPorUsuario.email
                          }
                          size="sm"
                        />
                        <span className="text-sm">
                          {convite.enviadoPorUsuario.firstName &&
                          convite.enviadoPorUsuario.lastName
                            ? `${convite.enviadoPorUsuario.firstName} ${convite.enviadoPorUsuario.lastName}`
                            : convite.enviadoPorUsuario.email}
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        {convite.status === "pendente" ? (
                          <>
                            <DropdownItem
                              key="resend"
                              isDisabled={actionLoading === convite.id}
                              startContent={
                                actionLoading === convite.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )
                              }
                              onPress={() => handleResendConvite(convite.id)}
                            >
                              {actionLoading === convite.id
                                ? "Reenviando..."
                                : "Reenviar"}
                            </DropdownItem>
                            <DropdownItem
                              key="cancel"
                              className="text-danger"
                              color="danger"
                              isDisabled={actionLoading === convite.id}
                              startContent={
                                actionLoading === convite.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )
                              }
                              onPress={() => handleCancelConvite(convite.id)}
                            >
                              {actionLoading === convite.id
                                ? "Cancelando..."
                                : "Cancelar"}
                            </DropdownItem>
                          </>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Novo Convite */}
      <Modal
        isOpen={isModalOpen}
        size="2xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Enviar Convite</h2>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Email"
                placeholder="email@exemplo.com"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <Input
                label="Nome (opcional)"
                placeholder="Nome completo"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />

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

              <Textarea
                label="Observações (opcional)"
                minRows={3}
                placeholder="Mensagem personalizada para o convite..."
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isDisabled={!formData.email.trim()}
              isLoading={loading}
              onPress={handleCreateConvite}
            >
              Enviar Convite
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
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
        [
          "Equipe",
          "Magic Lawyer",
          "Exportação completa",
          "Sistema",
          "Ativo",
          `Exportado em ${timestamp}`,
        ].join(","),
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
    <div className="space-y-6">
      {/* Dashboard */}
      <DashboardEquipe />

      {/* Filtros e Ações */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Input
                  endContent={
                    searchTerm && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => setSearchTerm("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )
                  }
                  placeholder="Buscar na equipe..."
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                startContent={<Filter className="w-4 h-4" />}
                variant="light"
                onPress={() => setShowFilters(!showFilters)}
              >
                Filtros
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                startContent={<Download className="w-4 h-4" />}
                variant="light"
                onPress={() => handleExportAll()}
              >
                Exportar
              </Button>
            </div>
          </div>

          {/* Filtros expandidos */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden mt-4"
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
              >
                <div className="flex flex-wrap gap-4">
                  <Select
                    className="min-w-40"
                    label="Seção"
                    placeholder="Todas as seções"
                    selectedKeys={
                      selectedSection === "all" ? [] : [selectedSection]
                    }
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

      {/* Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            aria-label="Gestão de Equipe"
            classNames={{
              tabList:
                "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-6 h-12",
              tabContent: "group-data-[selected=true]:text-primary",
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
    </div>
  );
}
