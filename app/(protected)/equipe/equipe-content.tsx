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
} from "lucide-react";
import { toast } from "sonner";

import {
  getCargos,
  getUsuariosEquipe,
  getDashboardEquipe,
  createCargo,
  updateCargo,
  deleteCargo,
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
      const data = await getCargos();

      setCargos(data);
    } catch (error) {
      toast.error("Erro ao carregar cargos");
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

      {/* Estado vazio */}
      {filteredCargos.length === 0 && !loading && (
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTipo, setSelectedTipo] = useState<string>("all");
  const [selectedVinculacao, setSelectedVinculacao] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [usuariosData, advogadosData] = await Promise.all([
        getUsuariosEquipe(),
        getAdvogados(),
      ]);

      setUsuarios(usuariosData);
      setAdvogados(advogadosData.data || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  function getRoleColor(role: string): ChipProps["color"] {
    const colors: Record<string, ChipProps["color"]> = {
      ADMIN: "danger",
      ADVOGADO: "primary",
      SECRETARIA: "secondary",
      CLIENTE: "default",
    };

    return colors[role] ?? "default";
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

  function getRoleIcon(role: string) {
    const icons = {
      ADMIN: Crown,
      ADVOGADO: Shield,
      SECRETARIA: Users,
      CLIENTE: User,
    };
    const IconComponent = icons[role as keyof typeof icons] || User;

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
                        <DropdownMenu>
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

      {/* Estado vazio */}
      {filteredUsuarios.length === 0 && !loading && (
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
