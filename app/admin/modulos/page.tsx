"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR, { mutate as mutateCache } from "swr";
import { motion } from "framer-motion";
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
  SettingsIcon,
  KeyIcon,
  HelpCircleIcon,
  InfoIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ZapIcon,
  ShieldIcon,
  DollarSignIcon,
  ActivityIcon,
  DatabaseIcon,
  LayersIcon,
  MessageSquareIcon,
  LockIcon,
  BarChartIcon,
  BotIcon,
  StoreIcon,
  WebhookIcon,
  FlaskConicalIcon,
  BookOpenIcon,
  LightbulbIcon,
  TargetIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  RouteIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";

import { listModulos, getDashboardModulos, createModulo, updateModulo, deleteModulo, toggleModuloStatus, getModulo, type ModuloCreateInput } from "@/app/actions/modulos";
import { createModuloRota, updateModuloRota, deleteModuloRota, toggleModuloRotaStatus, createBulkModuloRotas } from "@/app/actions/modulo-rotas";
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
    Produtividade: {
      bg: "bg-green-100 dark:bg-green-800",
      text: "text-green-600",
    },
    Financeiro: {
      bg: "bg-orange-100 dark:bg-orange-800",
      text: "text-orange-600",
    },
    Integração: {
      bg: "bg-purple-100 dark:bg-purple-800",
      text: "text-purple-600",
    },
    Comunicação: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600" },
    Segurança: { bg: "bg-red-100 dark:bg-red-800", text: "text-red-600" },
    Analytics: { bg: "bg-blue-100 dark:bg-blue-800", text: "text-blue-600" },
    IA: { bg: "bg-purple-100 dark:bg-purple-800", text: "text-purple-600" },
    Marketplace: {
      bg: "bg-green-100 dark:bg-green-800",
      text: "text-green-600",
    },
    Experimental: {
      bg: "bg-orange-100 dark:bg-orange-800",
      text: "text-orange-600",
    },
  };

  return (
    classMap[categoria] || {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-600",
    }
  );
};

export default function ModulosAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModulo, setSelectedModulo] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [loading, setLoading] = useState(false);

  // Modals
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isHelpOpen, onOpen: onHelpOpen, onClose: onHelpClose } = useDisclosure();
  const { isOpen: isRoutesModalOpen, onOpen: onRoutesModalOpen, onClose: onRoutesModalClose } = useDisclosure();

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
  const [routesModulo, setRoutesModulo] = useState<any>(null);

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

  const refreshAfterChange = useCallback(async () => {
    await Promise.all([mutateModulos(), mutateCache("dashboard-modulos"), mutateCache("module-map-status"), mutateCache("auto-detect-status")]);
  }, [mutateModulos]);

  const handleOpenRoutes = useCallback(
    (modulo: any) => {
      setRoutesModulo(modulo);
      onRoutesModalOpen();
    },
    [onRoutesModalOpen]
  );

  const handleCloseRoutes = useCallback(() => {
    onRoutesModalClose();
    setRoutesModulo(null);
  }, [onRoutesModalClose]);

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
        const { created, updated, removed, total, totalRoutes } = result.data!;

        toast.success(`Detecção automática concluída! ${created} criados, ${updated} atualizados, ${removed} removidos. Total: ${total} módulos / ${totalRoutes} rotas.`);

        // Forçar atualização de todos os caches
        await Promise.all([mutateModulos(), mutateCache("dashboard-modulos"), mutateCache("module-map-status"), mutateCache("auto-detect-status")]);

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
      <motion.div animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between" initial={{ opacity: 0, y: -20 }}>
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
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">📚 Guia Completo</p>
                <p className="text-sm">Acesse instruções detalhadas sobre como usar cada funcionalidade da tela de módulos.</p>
              </div>
            }
            placement="bottom"
          >
            <Button isIconOnly className="text-gray-500 hover:text-primary" color="default" variant="light" onPress={onHelpOpen}>
              <HelpCircleIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">🔄 Atualizar Página</p>
                <p className="text-sm">Força o recarregamento completo da página para garantir que todos os dados estejam atualizados.</p>
              </div>
            }
            placement="bottom"
          >
            <Button isIconOnly className="text-gray-500 hover:text-primary" color="default" variant="light" onPress={() => window.location.reload()}>
              <RefreshCwIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">🔍 Detecção Automática</p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Escaneia a pasta app/(protected)/ e detecta quais módulos realmente existem no código.
                </p>
                <p className="text-sm mb-2">
                  <strong>Quando usar:</strong> Após adicionar/remover pastas de módulos no código.
                </p>
                <p className="text-sm">
                  <strong>Resultado:</strong> Remove módulos "fantasma" e mantém apenas os reais.
                </p>
              </div>
            }
            placement="bottom"
          >
            <Button color="success" isLoading={loading} startContent={<ZapIcon size={20} />} variant={autoDetectStatus?.needsSync ? "solid" : "bordered"} onPress={handleAutoDetect}>
              {autoDetectStatus?.needsSync ? "Detectar Módulos" : "Detecção OK"}
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">⚙️ Sincronização</p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Limpa o cache do mapeamento de módulos (API interna e middleware).
                </p>
                <p className="text-sm mb-2">
                  <strong>Quando usar:</strong> Após adicionar/remover rotas de módulos.
                </p>
                <p className="text-sm">
                  <strong>Resultado:</strong> O sistema de controle de acesso funciona corretamente.
                </p>
              </div>
            }
            placement="bottom"
          >
            <Button
              color="secondary"
              isDisabled={!syncStatus?.needsSync}
              isLoading={loading}
              startContent={<SettingsIcon size={20} />}
              variant={syncStatus?.needsSync ? "solid" : "bordered"}
              onPress={handleSyncModuleMap}
            >
              {syncStatus?.needsSync ? "Sincronizar" : "Sincronizado"}
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">➕ Novo Módulo</p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Cria um novo módulo no sistema.
                </p>
                <p className="text-sm mb-2">
                  <strong>Quando usar:</strong> Para adicionar uma nova funcionalidade ao sistema.
                </p>
                <p className="text-sm">
                  <strong>Resultado:</strong> Módulo disponível para ser incluído em planos.
                </p>
              </div>
            }
            placement="bottom"
          >
            <Button className="bg-gradient-to-r from-primary to-secondary" color="primary" startContent={<PlusIcon size={20} />} onPress={() => handleOpenModal("create")}>
              Novo Módulo
            </Button>
          </Tooltip>
        </div>
      </motion.div>

      {/* Card de Instruções Rápidas */}
      <motion.div animate={{ opacity: 1, y: 0 }} className="mb-6" initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.05 }}>
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl flex-shrink-0">
                <BookOpenIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">🚀 Como Usar Esta Tela</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Criar Módulo</p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">Use "Novo Módulo" para adicionar funcionalidades</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Gerenciar Rotas</p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">Clique em "Gerenciar rotas" para adicionar URLs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Sincronizar</p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">Use "Detectar" e "Sincronizar" para atualizar</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button color="primary" size="sm" startContent={<HelpCircleIcon className="w-4 h-4" />} variant="bordered" onPress={onHelpOpen}>
                    Ver Guia Completo
                  </Button>
                  <span className="text-xs text-blue-600 dark:text-blue-400">Clique nos botões para ver tooltips explicativos</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Cards de métricas */}
      <motion.div animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.1 }}>
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
        <motion.div animate={{ opacity: 1, scale: 1 }} className="cursor-pointer" initial={{ opacity: 0, scale: 0.95 }} transition={{ delay: 0.2 }} whileHover={{ scale: 1.02 }}>
          <Tooltip
            showArrow
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
          >
            <Card
              className={`border-2 transition-all duration-300 ${autoDetectStatus.needsSync ? "border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 dark:border-orange-700 dark:from-orange-900/20 dark:to-orange-800/20" : "border-green-200 bg-gradient-to-r from-green-50 to-green-100 dark:border-green-700 dark:from-green-900/20 dark:to-green-800/20"}`}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        rotate: autoDetectStatus.needsSync ? [0, 5, -5, 0] : 0,
                      }}
                      className={`p-2 rounded-lg ${autoDetectStatus.needsSync ? "bg-orange-100 dark:bg-orange-800" : "bg-green-100 dark:bg-green-800"}`}
                      transition={{
                        duration: 2,
                        repeat: autoDetectStatus.needsSync ? Infinity : 0,
                      }}
                    >
                      {autoDetectStatus.needsSync ? <AlertTriangleIcon className="w-5 h-5 text-orange-600" /> : <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                    </motion.div>
                    <div>
                      <p className="font-medium text-foreground">{autoDetectStatus.needsSync ? "Módulos Desatualizados" : "Módulos Sincronizados"}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Banco: {autoDetectStatus.totalModules} módulos • {autoDetectStatus.totalRoutes} rotas
                        {typeof autoDetectStatus.filesystemModules === "number" && typeof autoDetectStatus.filesystemRoutes === "number" && (
                          <span>
                            {" "}
                            • Código: {autoDetectStatus.filesystemModules} módulos • {autoDetectStatus.filesystemRoutes} rotas
                          </span>
                        )}
                        {autoDetectStatus.lastDetection && <span> • Última detecção: {new Date(autoDetectStatus.lastDetection).toLocaleString("pt-BR")}</span>}
                      </p>
                    </div>
                  </div>
                  {autoDetectStatus.needsSync && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button color="warning" isLoading={loading} size="sm" startContent={<ZapIcon className="w-4 h-4" />} onPress={handleAutoDetect}>
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
        <motion.div animate={{ opacity: 1, scale: 1 }} className="cursor-pointer" initial={{ opacity: 0, scale: 0.95 }} transition={{ delay: 0.25 }} whileHover={{ scale: 1.02 }}>
          <Tooltip
            showArrow
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">⚙️ Sincronização do Module Map</p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Limpa o cache do mapeamento de módulos (API interna e middleware) para refletir imediatamente as rotas cadastradas no banco de dados.
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
          >
            <Card
              className={`border-2 transition-all duration-300 ${syncStatus.needsSync ? "border-warning-200 bg-gradient-to-r from-warning-50 to-warning-100 dark:border-warning-700 dark:from-warning-900/20 dark:to-warning-800/20" : "border-success-200 bg-gradient-to-r from-success-50 to-success-100 dark:border-success-700 dark:from-success-900/20 dark:to-success-800/20"}`}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        rotate: syncStatus.needsSync ? [0, 10, -10, 0] : 0,
                      }}
                      className={`p-2 rounded-lg ${syncStatus.needsSync ? "bg-warning-100 dark:bg-warning-800" : "bg-success-100 dark:bg-success-800"}`}
                      transition={{
                        duration: 3,
                        repeat: syncStatus.needsSync ? Infinity : 0,
                      }}
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
                      <Button color="warning" isLoading={loading} size="sm" startContent={<ZapIcon className="w-4 h-4" />} onPress={handleSyncModuleMap}>
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
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.3 }}>
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
                className="max-w-md"
                placeholder="Buscar módulos..."
                startContent={<SearchIcon size={20} />}
                value={searchTerm}
                variant="bordered"
                onChange={(e) => setSearchTerm(e.target.value)}
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
                          <motion.div className={`p-2 rounded-lg ${categoryClasses.bg}`} transition={{ type: "spring", stiffness: 300 }} whileHover={{ scale: 1.1, rotate: 5 }}>
                            <CategoryIcon className={`w-4 h-4 ${categoryClasses.text}`} />
                          </motion.div>
                          <div>
                            <p className="font-medium text-foreground">{modulo.nome}</p>
                            {modulo.descricao && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{modulo.descricao}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <motion.div transition={{ type: "spring", stiffness: 300 }} whileHover={{ scale: 1.05 }}>
                          <code className="text-sm bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 px-2 py-1 rounded font-mono">{modulo.slug}</code>
                        </motion.div>
                      </TableCell>
                      <TableCell>
                        {modulo.categoria && (
                          <motion.div transition={{ type: "spring", stiffness: 300 }} whileHover={{ scale: 1.05 }}>
                            <Chip className="bg-gradient-to-r from-opacity-80 to-opacity-60" color={categoryColor as any} size="sm" variant="flat">
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {modulo.categoria}
                            </Chip>
                          </motion.div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {modulo.rotas?.slice(0, 3).map((rota: any, idx: number) => (
                            <motion.div key={idx} animate={{ opacity: 1, scale: 1 }} initial={{ opacity: 0, scale: 0.8 }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.1 }}>
                              <Badge className="text-xs font-mono bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30" color="secondary" size="sm" variant="flat">
                                {rota.rota}
                              </Badge>
                            </motion.div>
                          ))}
                          {modulo.rotas && modulo.rotas.length > 3 && (
                            <motion.div animate={{ opacity: 1, scale: 1 }} initial={{ opacity: 0, scale: 0.8 }} transition={{ delay: 0.3 }} whileHover={{ scale: 1.1 }}>
                              <Badge className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" color="default" size="sm" variant="flat">
                                +{modulo.rotas.length - 3}
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <motion.div transition={{ type: "spring", stiffness: 300 }} whileHover={{ scale: 1.05 }}>
                          <Chip
                            className={`${modulo.ativo ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30" : "bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30"}`}
                            color={modulo.ativo ? "success" : "danger"}
                            size="sm"
                            variant="flat"
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
                              <Button isIconOnly size="sm" variant="light">
                                <SettingsIcon className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem key="view" startContent={<EyeIcon size={16} />} onPress={() => handleOpenModal("view", modulo)}>
                                <div className="flex flex-col">
                                  <span>Visualizar</span>
                                  <span className="text-xs text-gray-500">Ver detalhes do módulo</span>
                                </div>
                              </DropdownItem>
                              <DropdownItem key="edit" startContent={<PencilIcon size={16} />} onPress={() => handleOpenModal("edit", modulo)}>
                                <div className="flex flex-col">
                                  <span>Editar</span>
                                  <span className="text-xs text-gray-500">Modificar informações do módulo</span>
                                </div>
                              </DropdownItem>
                              <DropdownItem key="routes" startContent={<RouteIcon size={16} />} onPress={() => handleOpenRoutes(modulo)}>
                                <div className="flex flex-col">
                                  <span>Gerenciar rotas</span>
                                  <span className="text-xs text-gray-500">Adicionar/editar rotas do módulo</span>
                                </div>
                              </DropdownItem>
                              <DropdownItem key="toggle" startContent={<PowerIcon size={16} />} onPress={() => handleToggleStatus(modulo)}>
                                <div className="flex flex-col">
                                  <span>{modulo.ativo ? "Desativar" : "Ativar"}</span>
                                  <span className="text-xs text-gray-500">{modulo.ativo ? "Tornar módulo indisponível" : "Tornar módulo disponível"}</span>
                                </div>
                              </DropdownItem>
                              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon size={16} />} onPress={() => handleDelete(modulo)}>
                                <div className="flex flex-col">
                                  <span>Excluir</span>
                                  <span className="text-xs text-gray-500">Remover módulo permanentemente</span>
                                </div>
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
      <Modal isOpen={isHelpOpen} scrollBehavior="inside" size="4xl" onClose={onHelpClose}>
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
            {/* Seção de Introdução */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl">
                  <TargetIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">O que são Módulos?</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Funcionalidades do sistema que podem ser ativadas por plano</p>
                </div>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Módulos são funcionalidades do sistema que podem ser ativadas ou desativadas por plano. Cada módulo representa uma área específica como "Gestão de Processos", "Financeiro", etc. Eles
                controlam o acesso às rotas do sistema através do middleware de autenticação.
              </p>
            </div>

            {/* Cards de Funcionalidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                      <PlusIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Criar Módulos</h3>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3">Use o botão "Novo Módulo" para criar funcionalidades.</p>
                  <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                    <li>• Defina nome, slug e categoria</li>
                    <li>• Adicione descrição e ícone</li>
                    <li>• Configure ordem de exibição</li>
                  </ul>
                </CardBody>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                      <RouteIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Gerenciar Rotas</h3>
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">Cada módulo precisa ter suas rotas cadastradas.</p>
                  <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Clique em "Gerenciar rotas" no menu de ações</li>
                    <li>• Adicione rotas individuais ou em lote</li>
                    <li>• Ative/desative rotas conforme necessário</li>
                  </ul>
                </CardBody>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                      <ZapIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Detecção Automática</h3>
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">O sistema detecta automaticamente módulos do código.</p>
                  <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• Escaneia a pasta app/(protected)/</li>
                    <li>• Remove módulos "fantasma"</li>
                    <li>• Use após adicionar/remover pastas</li>
                  </ul>
                </CardBody>
              </Card>

              <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                      <SettingsIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Sincronização</h3>
                  </div>
                  <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-3">Atualiza o cache do mapeamento de módulos.</p>
                  <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                    <li>• Limpa cache da API interna</li>
                    <li>• Atualiza middleware de autenticação</li>
                    <li>• Use após alterar rotas</li>
                  </ul>
                </CardBody>
              </Card>
            </div>

            <Divider />

            {/* Seção de Instruções Passo a Passo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ArrowRightIcon className="w-5 h-5 text-blue-500" />
                Como Usar - Passo a Passo
              </h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                    Criar um Novo Módulo
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-8">
                    <li>1. Clique no botão "Novo Módulo"</li>
                    <li>2. Preencha nome, slug e categoria</li>
                    <li>3. Adicione descrição e configure ordem</li>
                    <li>4. Clique em "Criar"</li>
                  </ol>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                    Adicionar Rotas ao Módulo
                  </h4>
                  <ol className="text-sm text-green-800 dark:text-green-200 space-y-1 ml-8">
                    <li>1. Clique em "Gerenciar rotas" no menu de ações</li>
                    <li>2. Use "Nova rota" para adicionar individualmente</li>
                    <li>3. Ou use "Importar em lote" para várias rotas</li>
                    <li>4. Ative/desative rotas conforme necessário</li>
                  </ol>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                    <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                    Sincronizar com o Sistema
                  </h4>
                  <ol className="text-sm text-orange-800 dark:text-orange-200 space-y-1 ml-8">
                    <li>1. Use "Detectar Módulos" para sincronizar com o código</li>
                    <li>2. Use "Sincronizar" para atualizar o cache</li>
                    <li>3. Teste o acesso com usuário comum</li>
                    <li>4. Verifique se o middleware está funcionando</li>
                  </ol>
                </div>
              </div>
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
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <RouteIcon className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Rotas e Middleware</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sempre sincronize após alterar rotas para que o middleware funcione corretamente</p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" startContent={<ArrowRightIcon className="w-4 h-4" />} onPress={onHelpClose}>
              Entendi!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de módulo */}
      <Modal isOpen={isModalOpen} scrollBehavior="inside" size="2xl" onClose={handleCloseModal}>
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
                isRequired
                isDisabled={modalMode === "view"}
                label="Nome do Módulo"
                placeholder="Ex: Gestão de Processos"
                value={formData.nome}
                variant="bordered"
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
              <Input
                isRequired
                isDisabled={modalMode === "view"}
                label="Slug"
                placeholder="Ex: gestao-processos"
                value={formData.slug}
                variant="bordered"
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>

            <Select
              isDisabled={modalMode === "view"}
              label="Categoria"
              placeholder="Selecione uma categoria"
              value={formData.categoria}
              variant="bordered"
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
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
              isDisabled={modalMode === "view"}
              label="Descrição"
              minRows={3}
              placeholder="Descreva o que este módulo faz..."
              value={formData.descricao}
              variant="bordered"
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isDisabled={modalMode === "view"}
                label="Ícone"
                placeholder="Ex: PuzzleIcon"
                value={formData.icone}
                variant="bordered"
                onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
              />
              <Input
                isDisabled={modalMode === "view"}
                label="Ordem"
                placeholder="0"
                type="number"
                value={formData.ordem?.toString()}
                variant="bordered"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ordem: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            {modalMode !== "view" && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input checked={formData.ativo} className="rounded" id="ativo" type="checkbox" onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} />
                <label className="text-sm font-medium" htmlFor="ativo">
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
              <Button color="primary" isLoading={loading} startContent={modalMode === "create" ? <PlusIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />} onPress={handleSubmit}>
                {modalMode === "create" ? "Criar" : "Salvar"}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ModuleRoutesModal isOpen={isRoutesModalOpen} modulo={routesModulo} onClose={handleCloseRoutes} onRefresh={refreshAfterChange} />
    </div>
  );
}

type ModuleRoutesModalProps = {
  modulo: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
};

function ModuleRoutesModal({ modulo, isOpen, onClose, onRefresh }: ModuleRoutesModalProps) {
  const moduleId = modulo?.id;
  const { data, isValidating, mutate } = useSWR(isOpen && moduleId ? ["modulo-detail", moduleId] : null, () => getModulo(moduleId), {
    revalidateOnFocus: false,
    refreshInterval: 30000,
  });

  const moduloDetalhe = data?.data;
  const routes = useMemo(() => moduloDetalhe?.rotas ?? [], [moduloDetalhe?.rotas]);
  const totalRoutes = routes.length;
  const activeRoutes = useMemo(() => routes.filter((route: any) => route.ativo).length, [routes]);

  const [isRouteFormOpen, setRouteFormOpen] = useState(false);
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [routeFormMode, setRouteFormMode] = useState<"create" | "edit">("create");
  const [routeFormData, setRouteFormData] = useState({
    rota: "",
    descricao: "",
    ativo: true,
  });
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [bulkRoutesValue, setBulkRoutesValue] = useState("");
  const [routesLoading, setRoutesLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRouteFormOpen(false);
      setBulkModalOpen(false);
      setSelectedRoute(null);
      setRouteFormData({ rota: "", descricao: "", ativo: true });
      setBulkRoutesValue("");
    }
  }, [isOpen]);

  const moduleName = modulo?.nome || moduloDetalhe?.nome || "";

  const handleCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleOpenCreateRoute = useCallback(() => {
    setRouteFormMode("create");
    setSelectedRoute(null);
    setRouteFormData({ rota: "", descricao: "", ativo: true });
    setRouteFormOpen(true);
  }, []);

  const handleOpenEditRoute = useCallback((route: any) => {
    setRouteFormMode("edit");
    setSelectedRoute(route);
    setRouteFormData({
      rota: route.rota,
      descricao: route.descricao || "",
      ativo: route.ativo,
    });
    setRouteFormOpen(true);
  }, []);

  const handleSubmitRoute = useCallback(async () => {
    if (!moduleId) {
      return;
    }

    if (!routeFormData.rota.trim()) {
      toast.error("O path da rota é obrigatório");

      return;
    }

    setRoutesLoading(true);
    try {
      if (routeFormMode === "create") {
        const result = await createModuloRota({
          moduloId: moduleId,
          rota: routeFormData.rota.trim(),
          descricao: routeFormData.descricao?.trim() || undefined,
          ativo: routeFormData.ativo,
        });

        if (!result.success) {
          toast.error(result.error || "Erro ao criar rota");

          return;
        }

        toast.success("Rota criada com sucesso!");
      } else if (selectedRoute) {
        const result = await updateModuloRota(selectedRoute.id, {
          rota: routeFormData.rota.trim(),
          descricao: routeFormData.descricao?.trim() || undefined,
          ativo: routeFormData.ativo,
        });

        if (!result.success) {
          toast.error(result.error || "Erro ao atualizar rota");

          return;
        }

        toast.success("Rota atualizada com sucesso!");
      }

      setRouteFormOpen(false);
      await Promise.all([mutate(), onRefresh()]);
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setRoutesLoading(false);
    }
  }, [moduleId, routeFormData, routeFormMode, selectedRoute, mutate, onRefresh]);

  const handleToggleRouteStatus = useCallback(
    async (route: any) => {
      setRoutesLoading(true);
      try {
        const result = await toggleModuloRotaStatus(route.id);

        if (!result.success) {
          toast.error(result.error || "Erro ao atualizar status da rota");

          return;
        }

        toast.success(result.data?.ativo ? "Rota ativada com sucesso!" : "Rota desativada com sucesso!");
        await Promise.all([mutate(), onRefresh()]);
      } catch (error) {
        toast.error("Erro interno do servidor");
      } finally {
        setRoutesLoading(false);
      }
    },
    [mutate, onRefresh]
  );

  const handleDeleteRoute = useCallback(
    async (route: any) => {
      if (!confirm(`Tem certeza que deseja excluir a rota ${route.rota}?`)) {
        return;
      }

      setRoutesLoading(true);
      try {
        const result = await deleteModuloRota(route.id);

        if (!result.success) {
          toast.error(result.error || "Erro ao excluir rota");

          return;
        }

        toast.success("Rota excluída com sucesso!");
        await Promise.all([mutate(), onRefresh()]);
      } catch (error) {
        toast.error("Erro interno do servidor");
      } finally {
        setRoutesLoading(false);
      }
    },
    [mutate, onRefresh]
  );

  const handleBulkSubmit = useCallback(async () => {
    if (!moduleId) {
      return;
    }

    const rotas = bulkRoutesValue
      .split("\n")
      .map((rota) => rota.trim())
      .filter((rota) => rota.length > 0);

    if (rotas.length === 0) {
      toast.error("Informe ao menos uma rota");

      return;
    }

    setRoutesLoading(true);
    try {
      const result = await createBulkModuloRotas(moduleId, rotas);

      if (!result.success) {
        toast.error(result.error || "Erro ao criar rotas em lote");

        return;
      }

      toast.success(`${result.data?.length || rotas.length} rotas adicionadas com sucesso!`);
      setBulkRoutesValue("");
      setBulkModalOpen(false);
      await Promise.all([mutate(), onRefresh()]);
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setRoutesLoading(false);
    }
  }, [moduleId, bulkRoutesValue, mutate, onRefresh]);

  return (
    <>
      <Modal isOpen={isOpen} scrollBehavior="outside" size="5xl" onOpenChange={(open) => (!open ? handleCloseModal() : undefined)}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs uppercase text-gray-400 tracking-wide">Gerenciamento de rotas</p>
                    <h2 className="text-2xl font-bold text-foreground">{moduleName || "Módulo"}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip color="secondary" variant="flat">
                      {activeRoutes} ativas
                    </Chip>
                    <Chip color="primary" variant="flat">
                      {totalRoutes} rotas
                    </Chip>
                  </div>
                </div>
                {moduloDetalhe?.descricao && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">{moduloDetalhe.descricao}</p>}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {moduleId && (
                      <Badge color="secondary" variant="flat">
                        {moduleId}
                      </Badge>
                    )}
                    {(isValidating || routesLoading) && <Progress isIndeterminate aria-label="Atualizando rotas" className="w-32" size="sm" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip
                      content={
                        <div className="max-w-xs">
                          <p className="font-semibold mb-2">➕ Nova Rota</p>
                          <p className="text-sm">Adiciona uma rota individual ao módulo. Use para rotas específicas que precisam de configuração detalhada.</p>
                        </div>
                      }
                      placement="top"
                    >
                      <Button color="primary" isDisabled={routesLoading} startContent={<PlusIcon className="w-4 h-4" />} onPress={handleOpenCreateRoute}>
                        Nova rota
                      </Button>
                    </Tooltip>
                    <Tooltip
                      content={
                        <div className="max-w-xs">
                          <p className="font-semibold mb-2">📦 Importar em Lote</p>
                          <p className="text-sm">Adiciona várias rotas de uma vez. Cole uma rota por linha no formato /exemplo. Ideal para importar rotas detectadas automaticamente.</p>
                        </div>
                      }
                      placement="top"
                    >
                      <Button color="secondary" isDisabled={routesLoading} startContent={<UploadIcon className="w-4 h-4" />} variant="bordered" onPress={() => setBulkModalOpen(true)}>
                        Importar em lote
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                <Table aria-label="Rotas do módulo" className="border border-default-100 rounded-lg">
                  <TableHeader>
                    <TableColumn>Rota</TableColumn>
                    <TableColumn>Descrição</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Atualização</TableColumn>
                    <TableColumn>Ações</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="Nenhuma rota cadastrada">
                    {routes.map((route: any) => (
                      <TableRow key={route.id}>
                        <TableCell>
                          <code className="text-sm bg-default-100 px-2 py-1 rounded font-mono">{route.rota}</code>
                        </TableCell>
                        <TableCell>{route.descricao || "—"}</TableCell>
                        <TableCell>
                          <Chip color={route.ativo ? "success" : "danger"} size="sm" variant="flat">
                            {route.ativo ? "Ativa" : "Inativa"}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">{route.updatedAt ? new Date(route.updatedAt).toLocaleString("pt-BR") : "—"}</TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <SettingsIcon className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem key="edit" isDisabled={routesLoading} startContent={<PencilIcon size={16} />} onPress={() => handleOpenEditRoute(route)}>
                                <div className="flex flex-col">
                                  <span>Editar</span>
                                  <span className="text-xs text-gray-500">Modificar rota e descrição</span>
                                </div>
                              </DropdownItem>
                              <DropdownItem key="toggle" isDisabled={routesLoading} startContent={<PowerIcon size={16} />} onPress={() => handleToggleRouteStatus(route)}>
                                <div className="flex flex-col">
                                  <span>{route.ativo ? "Desativar" : "Ativar"}</span>
                                  <span className="text-xs text-gray-500">{route.ativo ? "Tornar rota inacessível" : "Tornar rota acessível"}</span>
                                </div>
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                isDisabled={routesLoading}
                                startContent={<TrashIcon size={16} />}
                                onPress={() => handleDeleteRoute(route)}
                              >
                                <div className="flex flex-col">
                                  <span>Excluir</span>
                                  <span className="text-xs text-gray-500">Remover rota permanentemente</span>
                                </div>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    close();
                    handleCloseModal();
                  }}
                >
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isRouteFormOpen} placement="center" onOpenChange={(open) => (!open ? setRouteFormOpen(false) : undefined)}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div>
                  <p className="text-sm text-gray-500">{routeFormMode === "create" ? "Cadastrar nova rota" : "Editar rota"}</p>
                  <h3 className="text-xl font-semibold">{moduleName}</h3>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Path da rota"
                  placeholder="/exemplo"
                  value={routeFormData.rota}
                  variant="bordered"
                  onChange={(e) =>
                    setRouteFormData((prev) => ({
                      ...prev,
                      rota: e.target.value,
                    }))
                  }
                />
                <Textarea
                  label="Descrição"
                  minRows={3}
                  placeholder="Descreva brevemente a rota"
                  value={routeFormData.descricao}
                  variant="bordered"
                  onChange={(e) =>
                    setRouteFormData((prev) => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                />
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    checked={routeFormData.ativo}
                    className="rounded"
                    type="checkbox"
                    onChange={(e) =>
                      setRouteFormData((prev) => ({
                        ...prev,
                        ativo: e.target.checked,
                      }))
                    }
                  />
                  Rota ativa
                </label>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    setRouteFormOpen(false);
                    close();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={routesLoading}
                  startContent={routeFormMode === "create" ? <PlusIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
                  onPress={handleSubmitRoute}
                >
                  {routeFormMode === "create" ? "Criar rota" : "Salvar alterações"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isBulkModalOpen} placement="center" onOpenChange={(open) => (!open ? setBulkModalOpen(false) : undefined)}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div>
                  <p className="text-sm text-gray-500">Adicionar rotas em lote</p>
                  <h3 className="text-xl font-semibold">{moduleName}</h3>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <InfoIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Como usar</span>
                  </div>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Cole uma rota por linha no formato /exemplo</li>
                    <li>• Rotas existentes serão ignoradas automaticamente</li>
                    <li>• Ideal para importar rotas detectadas pelo sistema</li>
                    <li>• Todas as rotas serão criadas como ativas</li>
                  </ul>
                </div>

                <Textarea
                  label="Informe uma rota por linha"
                  minRows={6}
                  placeholder={`/exemplo\n/outro-exemplo\n/terceiro-exemplo`}
                  value={bulkRoutesValue}
                  variant="bordered"
                  onChange={(e) => setBulkRoutesValue(e.target.value)}
                />

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-900 dark:text-green-100 text-sm">Dica</span>
                  </div>
                  <p className="text-xs text-green-800 dark:text-green-200">Use este recurso após executar a "Detecção Automática" para importar rapidamente todas as rotas encontradas no código.</p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    setBulkModalOpen(false);
                    close();
                  }}
                >
                  Cancelar
                </Button>
                <Button color="primary" isLoading={routesLoading} startContent={<UploadIcon className="w-4 h-4" />} variant="solid" onPress={handleBulkSubmit}>
                  Importar rotas
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
