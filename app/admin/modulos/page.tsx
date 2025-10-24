"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Tooltip,
  Badge,
  Progress,
  Divider,
} from "@heroui/react";
import {
  PlusIcon,
  SearchIcon,
  PuzzleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PowerIcon,
  ChartBarIcon,
  SettingsIcon,
  GlobeIcon,
  FileTextIcon,
  KeyIcon,
  HelpCircleIcon,
  InfoIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ZapIcon,
  ShieldIcon,
  UsersIcon,
  DollarSignIcon,
  BrainIcon,
  RocketIcon,
  StarIcon,
  TrendingUpIcon,
  ActivityIcon,
  DatabaseIcon,
  LayersIcon,
  WorkflowIcon,
  MessageSquareIcon,
  LockIcon,
  BarChartIcon,
  BotIcon,
  StoreIcon,
  WebhookIcon,
  HeadphonesIcon,
  FlaskConicalIcon,
  BookOpenIcon,
  LightbulbIcon,
  TargetIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  RouteIcon,
} from "lucide-react";
import { toast } from "sonner";

import { listModulos, getDashboardModulos, createModulo, updateModulo, deleteModulo, toggleModuloStatus, type ModuloCreateInput } from "@/app/actions/modulos";
import { syncModuleMap, getModuleMapStatus } from "@/app/actions/sync-module-map";
import { autoDetectModules, getAutoDetectStatus } from "@/app/actions/auto-detect-modules";

// Mapeamento de ícones por categoria
const getCategoryIcon = (categoria: string) => {
  const iconMap: Record<string, any> = {
    Core: ShieldIcon,
    Produtividade: ZapIcon,
    Financeiro: DollarSignIcon,
    Integração: WebhookIcon,
    Comunicação: MessageSquareIcon,
    Segurança: LockIcon,
    Analytics: BarChartIcon,
    IA: BotIcon,
    Marketplace: StoreIcon,
    Experimental: FlaskConicalIcon,
  };
  return iconMap[categoria] || PuzzleIcon;
};

// Mapeamento de cores por categoria
const getCategoryColor = (categoria: string) => {
  const colorMap: Record<string, string> = {
    Core: "primary",
    Produtividade: "success",
    Financeiro: "warning",
    Integração: "secondary",
    Comunicação: "default",
    Segurança: "danger",
    Analytics: "primary",
    IA: "secondary",
    Marketplace: "success",
    Experimental: "warning",
  };
  return colorMap[categoria] || "default";
};

// Mapeamento de classes CSS por categoria
const getCategoryClasses = (categoria: string) => {
  const classMap: Record<string, { bg: string; text: string }> = {
    Core: { bg: "bg-blue-100 dark:bg-blue-800", text: "text-blue-600" },
    Produtividade: { bg: "bg-green-100 dark:bg-green-800", text: "text-green-600" },
    Financeiro: { bg: "bg-orange-100 dark:bg-orange-800", text: "text-orange-600" },
    Integração: { bg: "bg-purple-100 dark:bg-purple-800", text: "text-purple-600" },
    Comunicação: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600" },
    Segurança: { bg: "bg-red-100 dark:bg-red-800", text: "text-red-600" },
    Analytics: { bg: "bg-blue-100 dark:bg-blue-800", text: "text-blue-600" },
    IA: { bg: "bg-purple-100 dark:bg-purple-800", text: "text-purple-600" },
    Marketplace: { bg: "bg-green-100 dark:bg-green-800", text: "text-green-600" },
    Experimental: { bg: "bg-orange-100 dark:bg-orange-800", text: "text-orange-600" },
  };
  return classMap[categoria] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600" };
};

export default function ModulosAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModulo, setSelectedModulo] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [loading, setLoading] = useState(false);

  // Modals
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isHelpOpen, onOpen: onHelpOpen, onClose: onHelpClose } = useDisclosure();

  // Form data
  const [formData, setFormData] = useState<ModuloCreateInput & { ativo?: boolean }>({
    slug: "",
    nome: "",
    descricao: "",
    categoria: "",
    icone: "",
    ordem: 0,
    ativo: true,
  });

  // SWR hooks
  const { data: modulosData, mutate: mutateModulos } = useSWR(["modulos", searchTerm], () => listModulos({ search: searchTerm || undefined, limit: 100 }), { refreshInterval: 30000 });

  const { data: dashboardData } = useSWR("dashboard-modulos", getDashboardModulos, {
    refreshInterval: 60000,
  });

  const { data: syncStatusData } = useSWR("module-map-status", getModuleMapStatus, {
    refreshInterval: 30000,
  });

  const { data: autoDetectStatusData } = useSWR("auto-detect-status", getAutoDetectStatus, {
    refreshInterval: 30000,
  });

  // Detecção automática no primeiro carregamento se necessário
  useEffect(() => {
    const runInitialDetection = async () => {
      if (autoDetectStatusData?.data?.needsSync && !loading) {
        console.log("🚀 Executando detecção automática inicial...");
        await handleAutoDetect();
      }
    };

    runInitialDetection();
  }, [autoDetectStatusData?.data?.needsSync]);

  const modulos = modulosData?.data?.modulos || [];
  const dashboard = dashboardData?.data;
  const syncStatus = syncStatusData?.data;
  const autoDetectStatus = autoDetectStatusData?.data;

  const handleOpenModal = (mode: "create" | "edit" | "view", modulo?: any) => {
    setModalMode(mode);
    if (modulo) {
      setSelectedModulo(modulo);
      setFormData({
        slug: modulo.slug,
        nome: modulo.nome,
        descricao: modulo.descricao || "",
        categoria: modulo.categoria || "",
        icone: modulo.icone || "",
        ordem: modulo.ordem || 0,
        ativo: modulo.ativo,
      });
    } else {
      setSelectedModulo(null);
      setFormData({
        slug: "",
        nome: "",
        descricao: "",
        categoria: "",
        icone: "",
        ordem: 0,
        ativo: true,
      });
    }
    onModalOpen();
  };

  const handleCloseModal = () => {
    onModalClose();
    setSelectedModulo(null);
    setFormData({
      slug: "",
      nome: "",
      descricao: "",
      categoria: "",
      icone: "",
      ordem: 0,
      ativo: true,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let result;
      if (modalMode === "create") {
        result = await createModulo(formData);
      } else {
        result = await updateModulo(selectedModulo.id, formData);
      }

      if (result.success) {
        toast.success(`Módulo ${modalMode === "create" ? "criado" : "atualizado"} com sucesso!`);
        mutateModulos();
        handleCloseModal();
      } else {
        toast.error(result.error || "Erro ao salvar módulo");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modulo: any) => {
    if (!confirm(`Tem certeza que deseja excluir o módulo "${modulo.nome}"?`)) return;

    setLoading(true);
    try {
      const result = await deleteModulo(modulo.id);
      if (result.success) {
        toast.success("Módulo excluído com sucesso!");
        mutateModulos();
      } else {
        toast.error(result.error || "Erro ao excluir módulo");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (modulo: any) => {
    setLoading(true);
    try {
      const result = await toggleModuloStatus(modulo.id);
      if (result.success) {
        toast.success(`Módulo ${modulo.ativo ? "desativado" : "ativado"} com sucesso!`);
        mutateModulos();
      } else {
        toast.error(result.error || "Erro ao alterar status");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncModuleMap = async () => {
    setLoading(true);
    try {
      const result = await syncModuleMap();
      if (result.success) {
        toast.success("Module map sincronizado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao sincronizar");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setLoading(true);
    try {
      const result = await autoDetectModules();
      if (result.success) {
        const { created, updated, removed, total } = result.data!;
        toast.success(`Detecção automática concluída! ${created} criados, ${updated} atualizados, ${removed} removidos. Total: ${total} módulos.`);

        // Forçar atualização de todos os caches
        await Promise.all([mutateModulos(), mutate("dashboard-modulos"), mutate("module-map-status"), mutate("auto-detect-status")]);

        // Aguardar um pouco e forçar refresh da página
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(result.error || "Erro na detecção automática");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com título e botões */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <PuzzleIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Módulos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os módulos disponíveis no sistema</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Tooltip content="Ajuda e instruções">
            <Button isIconOnly variant="light" color="default" onPress={onHelpOpen} className="text-gray-500 hover:text-primary">
              <HelpCircleIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip content="Forçar atualização da página">
            <Button isIconOnly variant="light" color="default" onPress={() => window.location.reload()} className="text-gray-500 hover:text-primary">
              <RefreshCwIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip content="Detectar módulos automaticamente do código">
            <Button color="success" startContent={<ZapIcon size={20} />} onPress={handleAutoDetect} isLoading={loading} variant={autoDetectStatus?.needsSync ? "solid" : "bordered"}>
              {autoDetectStatus?.needsSync ? "Detectar Módulos" : "Detecção OK"}
            </Button>
          </Tooltip>
          <Tooltip content="Sincronizar mapeamento de rotas">
            <Button
              color="secondary"
              startContent={<SettingsIcon size={20} />}
              onPress={handleSyncModuleMap}
              isLoading={loading}
              isDisabled={!syncStatus?.needsSync}
              variant={syncStatus?.needsSync ? "solid" : "bordered"}
            >
              {syncStatus?.needsSync ? "Sincronizar" : "Sincronizado"}
            </Button>
          </Tooltip>
          <Button color="primary" startContent={<PlusIcon size={20} />} onPress={() => handleOpenModal("create")} className="bg-gradient-to-r from-primary to-secondary">
            Novo Módulo
          </Button>
        </div>
      </motion.div>

      {/* Cards de métricas */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Módulos</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{dashboard?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <PuzzleIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Módulos Ativos</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{dashboard?.ativos || 0}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Categorias</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{dashboard?.categorias || 0}</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <LayersIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Status Sync</p>
                <div className="flex items-center gap-2 mt-1">
                  {syncStatus?.needsSync ? (
                    <Badge color="warning" variant="flat">
                      <AlertTriangleIcon className="w-3 h-3 mr-1" />
                      Desatualizado
                    </Badge>
                  ) : (
                    <Badge color="success" variant="flat">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Sincronizado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <ActivityIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Status de detecção automática */}
      {autoDetectStatus && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} whileHover={{ scale: 1.02 }} className="cursor-pointer">
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">🔍 Detecção Automática de Módulos</p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Escaneia automaticamente a pasta <code>app/(protected)/</code> e detecta quais módulos realmente existem no código.
                </p>
                <p className="text-sm mb-2">
                  <strong>Quando usar:</strong> Sempre que você adicionar ou remover pastas de módulos no código.
                </p>
                <p className="text-sm">
                  <strong>Resultado:</strong> Remove módulos "fantasma" e mantém apenas os reais.
                </p>
              </div>
            }
            placement="top"
            showArrow
          >
            <Card
              className={`border-2 transition-all duration-300 ${autoDetectStatus.needsSync ? "border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 dark:border-orange-700 dark:from-orange-900/20 dark:to-orange-800/20" : "border-green-200 bg-gradient-to-r from-green-50 to-green-100 dark:border-green-700 dark:from-green-900/20 dark:to-green-800/20"}`}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`p-2 rounded-lg ${autoDetectStatus.needsSync ? "bg-orange-100 dark:bg-orange-800" : "bg-green-100 dark:bg-green-800"}`}
                      animate={{ rotate: autoDetectStatus.needsSync ? [0, 5, -5, 0] : 0 }}
                      transition={{ duration: 2, repeat: autoDetectStatus.needsSync ? Infinity : 0 }}
                    >
                      {autoDetectStatus.needsSync ? <AlertTriangleIcon className="w-5 h-5 text-orange-600" /> : <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                    </motion.div>
                    <div>
                      <p className="font-medium text-foreground">{autoDetectStatus.needsSync ? "Módulos Desatualizados" : "Módulos Sincronizados"}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {autoDetectStatus.totalModules} módulos • {autoDetectStatus.totalRoutes} rotas
                        {autoDetectStatus.lastDetection && <span> • Última detecção: {new Date(autoDetectStatus.lastDetection).toLocaleString("pt-BR")}</span>}
                      </p>
                    </div>
                  </div>
                  {autoDetectStatus.needsSync && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button color="warning" size="sm" onPress={handleAutoDetect} isLoading={loading} startContent={<ZapIcon className="w-4 h-4" />}>
                        Detectar Agora
                      </Button>
                    </motion.div>
                  )}
                </div>
              </CardBody>
            </Card>
          </Tooltip>
        </motion.div>
      )}

      {/* Status de sincronização */}
      {syncStatus && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }} whileHover={{ scale: 1.02 }} className="cursor-pointer">
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">⚙️ Sincronização do Module Map</p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Atualiza o arquivo <code>app/lib/module-map.ts</code> com as rotas dos módulos do banco de dados.
                </p>
                <p className="text-sm mb-2">
                  <strong>Quando usar:</strong> Após adicionar/remover rotas de módulos ou quando o middleware não reconhece as permissões.
                </p>
                <p className="text-sm">
                  <strong>Resultado:</strong> O sistema de controle de acesso funciona corretamente.
                </p>
              </div>
            }
            placement="top"
            showArrow
          >
            <Card
              className={`border-2 transition-all duration-300 ${syncStatus.needsSync ? "border-warning-200 bg-gradient-to-r from-warning-50 to-warning-100 dark:border-warning-700 dark:from-warning-900/20 dark:to-warning-800/20" : "border-success-200 bg-gradient-to-r from-success-50 to-success-100 dark:border-success-700 dark:from-success-900/20 dark:to-success-800/20"}`}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`p-2 rounded-lg ${syncStatus.needsSync ? "bg-warning-100 dark:bg-warning-800" : "bg-success-100 dark:bg-success-800"}`}
                      animate={{ rotate: syncStatus.needsSync ? [0, 10, -10, 0] : 0 }}
                      transition={{ duration: 3, repeat: syncStatus.needsSync ? Infinity : 0 }}
                    >
                      {syncStatus.needsSync ? <AlertTriangleIcon className="w-5 h-5 text-warning-600" /> : <CheckCircleIcon className="w-5 h-5 text-success-600" />}
                    </motion.div>
                    <div>
                      <p className="font-medium text-foreground">{syncStatus.needsSync ? "Module Map Desatualizado" : "Module Map Sincronizado"}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {syncStatus.totalModules} módulos • {syncStatus.totalRoutes} rotas
                        {syncStatus.lastSync && <span> • Última sincronização: {new Date(syncStatus.lastSync).toLocaleString("pt-BR")}</span>}
                      </p>
                    </div>
                  </div>
                  {syncStatus.needsSync && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button color="warning" size="sm" onPress={handleSyncModuleMap} isLoading={loading} startContent={<ZapIcon className="w-4 h-4" />}>
                        Sincronizar Agora
                      </Button>
                    </motion.div>
                  )}
                </div>
              </CardBody>
            </Card>
          </Tooltip>
        </motion.div>
      )}

      {/* Tabela de módulos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <DatabaseIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Módulos do Sistema</h3>
                <Badge color="primary" variant="flat">
                  {modulos.length} módulos
                </Badge>
              </div>
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<SearchIcon size={20} />}
                className="max-w-md"
                variant="bordered"
              />
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Table aria-label="Tabela de módulos">
              <TableHeader>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <PuzzleIcon className="w-4 h-4" />
                    Módulo
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <KeyIcon className="w-4 h-4" />
                    Slug
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <LayersIcon className="w-4 h-4" />
                    Categoria
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <RouteIcon className="w-4 h-4" />
                    Rotas
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4" />
                    Status
                  </div>
                </TableColumn>
                <TableColumn>
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" />
                    Ações
                  </div>
                </TableColumn>
              </TableHeader>
              <TableBody>
                {modulos.map((modulo, index) => {
                  const CategoryIcon = getCategoryIcon(modulo.categoria || "");
                  const categoryColor = getCategoryColor(modulo.categoria || "");
                  const categoryClasses = getCategoryClasses(modulo.categoria || "");

                  return (
                    <TableRow key={modulo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <motion.div className={`p-2 rounded-lg ${categoryClasses.bg}`} whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                            <CategoryIcon className={`w-4 h-4 ${categoryClasses.text}`} />
                          </motion.div>
                          <div>
                            <p className="font-medium text-foreground">{modulo.nome}</p>
                            {modulo.descricao && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{modulo.descricao}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                          <code className="text-sm bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 px-2 py-1 rounded font-mono">{modulo.slug}</code>
                        </motion.div>
                      </TableCell>
                      <TableCell>
                        {modulo.categoria && (
                          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                            <Chip size="sm" color={categoryColor as any} variant="flat" className="bg-gradient-to-r from-opacity-80 to-opacity-60">
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {modulo.categoria}
                            </Chip>
                          </motion.div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {modulo.rotas?.slice(0, 3).map((rota, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.1 }}>
                              <Badge variant="flat" color="secondary" size="sm" className="text-xs font-mono bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                                {rota}
                              </Badge>
                            </motion.div>
                          ))}
                          {modulo.rotas && modulo.rotas.length > 3 && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} whileHover={{ scale: 1.1 }}>
                              <Badge variant="flat" color="default" size="sm" className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                                +{modulo.rotas.length - 3}
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                          <Chip
                            size="sm"
                            color={modulo.ativo ? "success" : "danger"}
                            variant="flat"
                            className={`${modulo.ativo ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30" : "bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30"}`}
                          >
                            {modulo.ativo ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <XCircleIcon className="w-3 h-3 mr-1" />}
                            {modulo.ativo ? "Ativo" : "Inativo"}
                          </Chip>
                        </motion.div>
                      </TableCell>
                      <TableCell>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly variant="light" size="sm">
                                <SettingsIcon className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem key="view" startContent={<EyeIcon size={16} />} onPress={() => handleOpenModal("view", modulo)}>
                                Visualizar
                              </DropdownItem>
                              <DropdownItem key="edit" startContent={<PencilIcon size={16} />} onPress={() => handleOpenModal("edit", modulo)}>
                                Editar
                              </DropdownItem>
                              <DropdownItem key="toggle" startContent={<PowerIcon size={16} />} onPress={() => handleToggleStatus(modulo)}>
                                {modulo.ativo ? "Desativar" : "Ativar"}
                              </DropdownItem>
                              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon size={16} />} onPress={() => handleDelete(modulo)}>
                                Excluir
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </motion.div>

      {/* Modal de ajuda */}
      <Modal isOpen={isHelpOpen} onClose={onHelpClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Guia de Gestão de Módulos</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aprenda como gerenciar os módulos do sistema</p>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                      <TargetIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">O que são Módulos?</h3>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Módulos são funcionalidades do sistema que podem ser ativadas ou desativadas por plano. Cada módulo representa uma área específica como "Gestão de Processos", "Financeiro", etc.
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                      <SettingsIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Como Gerenciar?</h3>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Use os botões de ação para criar, editar, ativar/desativar ou excluir módulos. Cada módulo tem um slug único e pode ser categorizado.
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                      <ZapIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Detecção Automática</h3>
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">O sistema detecta automaticamente os módulos que existem no código. Clique em "Detectar Módulos" para sincronizar.</p>
                </CardBody>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                      <SettingsIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Sincronização</h3>
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-200">A sincronização atualiza o mapeamento de rotas automaticamente. Execute quando houver mudanças nos módulos ou rotas.</p>
                </CardBody>
              </Card>
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <LightbulbIcon className="w-5 h-5 text-yellow-500" />
                Dicas Importantes
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <InfoIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Slug Único</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">O slug deve ser único e em formato kebab-case (ex: gestao-processos)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <AlertTriangleIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Exclusão Cuidadosa</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Não exclua módulos que estão sendo usados por planos ativos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Status Ativo</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Apenas módulos ativos aparecem nas opções de planos</p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onHelpClose} startContent={<ArrowRightIcon className="w-4 h-4" />}>
              Entendi!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de módulo */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PuzzleIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{modalMode === "create" ? "Novo Módulo" : modalMode === "edit" ? "Editar Módulo" : "Visualizar Módulo"}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {modalMode === "create" ? "Crie um novo módulo para o sistema" : modalMode === "edit" ? "Edite as informações do módulo" : "Visualize as informações do módulo"}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Módulo"
                placeholder="Ex: Gestão de Processos"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                isDisabled={modalMode === "view"}
                isRequired
                variant="bordered"
              />
              <Input
                label="Slug"
                placeholder="Ex: gestao-processos"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                isDisabled={modalMode === "view"}
                isRequired
                variant="bordered"
              />
            </div>

            <Select
              label="Categoria"
              placeholder="Selecione uma categoria"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              isDisabled={modalMode === "view"}
              variant="bordered"
            >
              <SelectItem key="Core" value="Core">
                Core
              </SelectItem>
              <SelectItem key="Produtividade" value="Produtividade">
                Produtividade
              </SelectItem>
              <SelectItem key="Financeiro" value="Financeiro">
                Financeiro
              </SelectItem>
              <SelectItem key="Integração" value="Integração">
                Integração
              </SelectItem>
              <SelectItem key="Comunicação" value="Comunicação">
                Comunicação
              </SelectItem>
              <SelectItem key="Segurança" value="Segurança">
                Segurança
              </SelectItem>
              <SelectItem key="Analytics" value="Analytics">
                Analytics
              </SelectItem>
              <SelectItem key="IA" value="IA">
                IA
              </SelectItem>
              <SelectItem key="Marketplace" value="Marketplace">
                Marketplace
              </SelectItem>
              <SelectItem key="Experimental" value="Experimental">
                Experimental
              </SelectItem>
            </Select>

            <Textarea
              label="Descrição"
              placeholder="Descreva o que este módulo faz..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              isDisabled={modalMode === "view"}
              variant="bordered"
              minRows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ícone"
                placeholder="Ex: PuzzleIcon"
                value={formData.icone}
                onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                isDisabled={modalMode === "view"}
                variant="bordered"
              />
              <Input
                label="Ordem"
                type="number"
                placeholder="0"
                value={formData.ordem?.toString()}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                isDisabled={modalMode === "view"}
                variant="bordered"
              />
            </div>

            {modalMode !== "view" && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input type="checkbox" id="ativo" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} className="rounded" />
                <label htmlFor="ativo" className="text-sm font-medium">
                  Módulo ativo
                </label>
                <Tooltip content="Módulos ativos aparecem nas opções de planos">
                  <InfoIcon className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseModal}>
              Cancelar
            </Button>
            {modalMode !== "view" && (
              <Button color="primary" onPress={handleSubmit} isLoading={loading} startContent={modalMode === "create" ? <PlusIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}>
                {modalMode === "create" ? "Criar" : "Salvar"}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
