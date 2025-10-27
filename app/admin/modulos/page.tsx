"use client";

import { useState, useCallback } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  Badge,
  Divider,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  SearchIcon,
  PuzzleIcon,
  SettingsIcon,
  HelpCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ZapIcon,
  ActivityIcon,
  BookOpenIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  RouteIcon,
  DatabaseIcon,
  KeyIcon,
  TargetIcon,
  LightbulbIcon,
  EyeIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  listModulos,
  getDashboardModulos,
  updateModuloCategoria,
} from "@/app/actions/modulos";
import { getModuleMapStatus } from "@/app/actions/sync-module-map";
import {
  autoDetectModules,
  getAutoDetectStatus,
} from "@/app/actions/auto-detect-modules";
import {
  getCategoryIcon,
  getCategoryColor,
  getCategoryClasses,
} from "@/app/lib/category-utils";

export default function ModulosAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals
  const {
    isOpen: isHelpOpen,
    onOpen: onHelpOpen,
    onClose: onHelpClose,
  } = useDisclosure();
  const {
    isOpen: isRoutesModalOpen,
    onOpen: onRoutesModalOpen,
    onClose: onRoutesModalClose,
  } = useDisclosure();
  const [selectedModulo, setSelectedModulo] = useState<any>(null);

  // SWR hooks
  const { data: modulosData, mutate: mutateModulos } = useSWR(
    ["modulos", searchTerm],
    () => listModulos({ search: searchTerm || undefined, limit: 100 }),
    { refreshInterval: 30000 },
  );

  const { data: dashboardData } = useSWR(
    "dashboard-modulos",
    getDashboardModulos,
    {
      refreshInterval: 60000,
    },
  );

  const { data: syncStatusData } = useSWR(
    "module-map-status",
    getModuleMapStatus,
    {
      refreshInterval: 30000,
    },
  );

  const { data: autoDetectStatusData } = useSWR(
    "auto-detect-status",
    getAutoDetectStatus,
    {
      refreshInterval: 30000,
    },
  );

  // Execução automática quando necessário
  useSWR(
    autoDetectStatusData?.data?.needsSync ? "auto-sync" : null,
    async () => {
      if (autoDetectStatusData?.data?.needsSync && !loading) {
        console.log("🔄 Executando sincronização automática...");
        await handleAutoDetect();
      }

      return null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    },
  );

  const modulos = modulosData?.data?.modulos || [];
  const dashboard = dashboardData?.data;
  const syncStatus = syncStatusData?.data;
  const autoDetectStatus = autoDetectStatusData?.data;

  const refreshAfterChange = useCallback(async () => {
    await Promise.all([
      mutateModulos(),
      mutateCache("dashboard-modulos"),
      mutateCache("module-map-status"),
      mutateCache("auto-detect-status"),
    ]);
  }, [mutateModulos]);

  const handleViewRoutes = (modulo: any) => {
    setSelectedModulo(modulo);
    onRoutesModalOpen();
  };

  const handleUpdateCategoria = async (
    moduloId: string,
    categoriaId: string | null,
  ) => {
    try {
      const result = await updateModuloCategoria(moduloId, categoriaId);

      if (result.success) {
        toast.success("Categoria atualizada com sucesso!");
        // Forçar atualização dos dados
        await Promise.all([mutateModulos(), mutateCache("dashboard-modulos")]);
      } else {
        toast.error(result.error || "Erro ao atualizar categoria");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    }
  };

  const handleAutoDetect = async () => {
    setLoading(true);
    try {
      const result = await autoDetectModules();

      if (result.success) {
        const { created, updated, removed, total, totalRoutes } = result.data!;

        toast.success(
          `🚀 Sistema sincronizado! ${created} criados, ${updated} atualizados, ${removed} removidos. Total: ${total} módulos / ${totalRoutes} rotas.`,
        );

        // Forçar atualização de todos os caches
        await Promise.all([
          mutateModulos(),
          mutateCache("dashboard-modulos"),
          mutateCache("module-map-status"),
          mutateCache("auto-detect-status"),
        ]);
      } else {
        toast.error(result.error || "Erro na sincronização");
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
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <PuzzleIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gestão de Módulos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie os módulos disponíveis no sistema
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">📚 Guia Completo</p>
                <p className="text-sm">
                  Acesse instruções detalhadas sobre como usar cada
                  funcionalidade da tela de módulos.
                </p>
              </div>
            }
            placement="bottom"
          >
            <Button
              isIconOnly
              className="text-gray-500 hover:text-primary"
              color="default"
              variant="light"
              onPress={onHelpOpen}
            >
              <HelpCircleIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">🔄 Atualizar Página</p>
                <p className="text-sm">
                  Força o recarregamento completo da página para garantir que
                  todos os dados estejam atualizados.
                </p>
              </div>
            }
            placement="bottom"
          >
            <Button
              isIconOnly
              className="text-gray-500 hover:text-primary"
              color="default"
              variant="light"
              onPress={() => window.location.reload()}
            >
              <RefreshCwIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">🚀 Sincronização Completa</p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Detecta módulos no código +
                  Sincroniza cache + Atualiza sistema de permissões.
                </p>
                <p className="text-sm mb-2">
                  <strong>Quando usar:</strong> Após adicionar/remover módulos
                  ou rotas no código.
                </p>
                <p className="text-sm">
                  <strong>Resultado:</strong> Sistema 100% atualizado e
                  funcionando corretamente.
                </p>
              </div>
            }
            placement="bottom"
          >
            <Button
              color="primary"
              isLoading={loading}
              startContent={<ZapIcon size={20} />}
              variant={autoDetectStatus?.needsSync ? "solid" : "bordered"}
              onPress={handleAutoDetect}
            >
              {autoDetectStatus?.needsSync
                ? "Sincronizar Sistema"
                : "Sistema OK"}
            </Button>
          </Tooltip>
        </div>
      </motion.div>

      {/* Card de Instruções Rápidas */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl flex-shrink-0">
                <BookOpenIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🚀 Como Usar Esta Tela
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      ✨
                    </span>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        Sincronização Automática
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">
                        O sistema detecta e sincroniza automaticamente quando
                        necessário
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      🚀
                    </span>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        Sincronização Manual
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">
                        Use "Sincronizar Sistema" para forçar atualização
                        completa
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    color="primary"
                    size="sm"
                    startContent={<HelpCircleIcon className="w-4 h-4" />}
                    variant="bordered"
                    onPress={onHelpOpen}
                  >
                    Ver Guia Completo
                  </Button>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Clique nos botões para ver tooltips explicativos
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Cards de métricas */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total de Módulos
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {dashboard?.total || 0}
                </p>
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
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Módulos Ativos
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {dashboard?.ativos || 0}
                </p>
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
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Categorias
                </p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {dashboard?.categorias || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <RouteIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Status Sync
                </p>
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
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="cursor-pointer"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <Tooltip
            showArrow
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">
                  🔍 Detecção Automática de Módulos
                </p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Escaneia automaticamente a pasta{" "}
                  <code>app/(protected)/</code> e detecta quais módulos
                  realmente existem no código.
                </p>
                <p className="text-sm mb-2">
                  <strong>Quando usar:</strong> Sempre que você adicionar ou
                  remover pastas de módulos no código.
                </p>
                <p className="text-sm">
                  <strong>Resultado:</strong> Remove módulos
                  &quot;fantasma&quot; e mantém apenas os reais.
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
                      {autoDetectStatus.needsSync ? (
                        <AlertTriangleIcon className="w-5 h-5 text-orange-600" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      )}
                    </motion.div>
                    <div>
                      <p className="font-medium text-foreground">
                        {autoDetectStatus.needsSync
                          ? "Módulos Desatualizados"
                          : "Módulos Sincronizados"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Banco: {autoDetectStatus.totalModules} módulos •{" "}
                        {autoDetectStatus.totalRoutes} rotas
                        {typeof autoDetectStatus.filesystemModules ===
                          "number" &&
                          typeof autoDetectStatus.filesystemRoutes ===
                            "number" && (
                            <span>
                              {" "}
                              • Código: {
                                autoDetectStatus.filesystemModules
                              }{" "}
                              módulos • {autoDetectStatus.filesystemRoutes}{" "}
                              rotas
                            </span>
                          )}
                        {autoDetectStatus.lastDetection && (
                          <span>
                            {" "}
                            • Última detecção:{" "}
                            {new Date(
                              autoDetectStatus.lastDetection,
                            ).toLocaleString("pt-BR")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {autoDetectStatus.needsSync && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        color="warning"
                        isLoading={loading}
                        size="sm"
                        startContent={<ZapIcon className="w-4 h-4" />}
                        onPress={handleAutoDetect}
                      >
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
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="cursor-pointer"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02 }}
        >
          <Tooltip
            showArrow
            content={
              <div className="max-w-xs">
                <p className="font-semibold mb-2">
                  ⚙️ Sincronização do Module Map
                </p>
                <p className="text-sm mb-2">
                  <strong>O que faz:</strong> Limpa o cache do mapeamento de
                  módulos (API interna e middleware) para refletir imediatamente
                  as rotas cadastradas no banco de dados.
                </p>
                <p className="text-sm mb-2">
                  <strong>Quando usar:</strong> Após adicionar/remover rotas de
                  módulos ou quando o middleware não reconhece as permissões.
                </p>
                <p className="text-sm">
                  <strong>Resultado:</strong> O sistema de controle de acesso
                  funciona corretamente.
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
                      {syncStatus.needsSync ? (
                        <AlertTriangleIcon className="w-5 h-5 text-warning-600" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 text-success-600" />
                      )}
                    </motion.div>
                    <div>
                      <p className="font-medium text-foreground">
                        {syncStatus.needsSync
                          ? "Module Map Desatualizado"
                          : "Module Map Sincronizado"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {syncStatus.totalModules} módulos •{" "}
                        {syncStatus.totalRoutes} rotas
                        {syncStatus.lastSync && (
                          <span>
                            {" "}
                            • Última sincronização:{" "}
                            {new Date(syncStatus.lastSync).toLocaleString(
                              "pt-BR",
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tooltip>
        </motion.div>
      )}

      {/* Tabela de módulos */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
      >
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
                    <RouteIcon className="w-4 h-4" />
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
              </TableHeader>
              <TableBody>
                {modulos.map((modulo, index) => {
                  const categoriaNome = modulo.categoriaInfo?.nome || "";
                  const CategoryIcon = getCategoryIcon(modulo.categoriaInfo);
                  const categoryColor = getCategoryColor(modulo.categoriaInfo);
                  const categoryClasses = getCategoryClasses(
                    modulo.categoriaInfo,
                  );

                  return (
                    <TableRow
                      key={modulo.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <motion.div
                            className={`p-2 rounded-lg ${categoryClasses.bg}`}
                            transition={{ type: "spring", stiffness: 300 }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <CategoryIcon
                              className={`w-4 h-4 ${categoryClasses.text}`}
                            />
                          </motion.div>
                          <div>
                            <p className="font-medium text-foreground">
                              {modulo.nome}
                            </p>
                            {modulo.descricao && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {modulo.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <motion.div
                          transition={{ type: "spring", stiffness: 300 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <code className="text-sm bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 px-2 py-1 rounded font-mono">
                            {modulo.slug}
                          </code>
                        </motion.div>
                      </TableCell>
                      <TableCell>
                        <Select
                          className="min-w-[200px]"
                          placeholder="Selecionar categoria"
                          selectedKeys={
                            modulo.categoriaId ? [modulo.categoriaId] : []
                          }
                          size="sm"
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0] as string;

                            handleUpdateCategoria(
                              modulo.id,
                              selectedKey || null,
                            );
                          }}
                        >
                          <SelectItem key="" textValue="Sem categoria">
                            <div className="flex items-center gap-2">
                              <PuzzleIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-500">
                                Sem categoria
                              </span>
                            </div>
                          </SelectItem>
                          {
                            (modulosData?.data?.categorias?.map((categoria) => {
                              const CatIcon = getCategoryIcon(categoria);
                              const catColor = getCategoryColor(categoria);

                              return (
                                <SelectItem
                                  key={categoria.id}
                                  textValue={categoria.nome}
                                >
                                  <div className="flex items-center gap-2">
                                    <CatIcon
                                      className="w-4 h-4"
                                      style={{ color: catColor }}
                                    />
                                    <span>{categoria.nome}</span>
                                  </div>
                                </SelectItem>
                              );
                            }) || []) as any
                          }
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {modulo.rotas && modulo.rotas.length > 0 ? (
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Tooltip
                                content={`Visualizar ${modulo.rotas.length} rotas`}
                                placement="top"
                              >
                                <Button
                                  isIconOnly
                                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  color="default"
                                  size="sm"
                                  variant="light"
                                  onPress={() => handleViewRoutes(modulo)}
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              </Tooltip>
                            </motion.div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <motion.div
                          transition={{ type: "spring", stiffness: 300 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Chip
                            className={`${modulo.ativo ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30" : "bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30"}`}
                            color={modulo.ativo ? "success" : "danger"}
                            size="sm"
                            variant="flat"
                          >
                            {modulo.ativo ? (
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircleIcon className="w-3 h-3 mr-1" />
                            )}
                            {modulo.ativo ? "Ativo" : "Inativo"}
                          </Chip>
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

      {/* Modal de visualização de rotas */}
      <Modal
        isOpen={isRoutesModalOpen}
        scrollBehavior="inside"
        size="3xl"
        onClose={onRoutesModalClose}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <RouteIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Rotas do Módulo</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedModulo?.nome} - {selectedModulo?.rotas?.length || 0}{" "}
                rotas
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {selectedModulo?.rotas && selectedModulo.rotas.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {selectedModulo.rotas.map((rota: any, index: number) => (
                  <motion.div
                    key={rota.id}
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div
                              className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg"
                              transition={{ type: "spring", stiffness: 300 }}
                              whileHover={{ rotate: 5 }}
                            >
                              <RouteIcon className="w-4 h-4 text-blue-600" />
                            </motion.div>
                            <div>
                              <p className="font-mono text-sm font-medium text-blue-900 dark:text-blue-100">
                                {rota.rota}
                              </p>
                              {rota.descricao && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  {rota.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip
                              className={
                                rota.ativo
                                  ? "bg-green-100 dark:bg-green-900/30"
                                  : "bg-red-100 dark:bg-red-900/30"
                              }
                              color={rota.ativo ? "success" : "danger"}
                              size="sm"
                              variant="flat"
                            >
                              {rota.ativo ? (
                                <>
                                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                                  Ativa
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="w-3 h-3 mr-1" />
                                  Inativa
                                </>
                              )}
                            </Chip>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
              >
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <RouteIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma rota encontrada para este módulo
                </p>
              </motion.div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              startContent={<ArrowRightIcon className="w-4 h-4" />}
              onPress={onRoutesModalClose}
            >
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de ajuda */}
      <Modal
        isOpen={isHelpOpen}
        scrollBehavior="inside"
        size="4xl"
        onClose={onHelpClose}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Guia de Gestão de Módulos</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aprenda como gerenciar os módulos do sistema
              </p>
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
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    O que são Módulos?
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Funcionalidades do sistema que podem ser ativadas por plano
                  </p>
                </div>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Módulos são funcionalidades do sistema que podem ser ativadas ou
                desativadas por plano. Cada módulo representa uma área
                específica como "Gestão de Processos", "Financeiro", etc. Eles
                controlam o acesso às rotas do sistema através do middleware de
                autenticação.
              </p>
            </div>

            {/* Cards de Funcionalidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                      <ZapIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                      Detecção Automática
                    </h3>
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                    O sistema detecta automaticamente módulos do código.
                  </p>
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
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                      Sincronização
                    </h3>
                  </div>
                  <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-3">
                    Atualiza o cache do mapeamento de módulos.
                  </p>
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
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    Criar Módulo no Código
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-8">
                    <li>1. Crie uma nova pasta em app/(protected)/</li>
                    <li>2. Adicione os componentes e páginas necessárias</li>
                    <li>3. Implemente as rotas do módulo</li>
                    <li>4. Teste o funcionamento localmente</li>
                  </ol>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Detectar Módulos Automaticamente
                  </h4>
                  <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-1 ml-8">
                    <li>1. Clique em "Detectar Módulos"</li>
                    <li>2. O sistema escaneia app/(protected)/</li>
                    <li>3. Módulos são criados/atualizados no banco</li>
                    <li>4. Rotas são detectadas automaticamente</li>
                  </ol>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                    <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Sincronizar com o Sistema
                  </h4>
                  <ol className="text-sm text-orange-800 dark:text-orange-200 space-y-1 ml-8">
                    <li>1. Use "Sincronizar" para atualizar o cache</li>
                    <li>2. Middleware é atualizado com novas rotas</li>
                    <li>3. Teste o acesso com usuário comum</li>
                    <li>4. Verifique se o controle de acesso funciona</li>
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
                  <HelpCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Slug Único</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      O slug deve ser único e em formato kebab-case (ex:
                      gestao-processos)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <AlertTriangleIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Exclusão Cuidadosa</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Não exclua módulos que estão sendo usados por planos
                      ativos
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Status Ativo</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Apenas módulos ativos aparecem nas opções de planos
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <RouteIcon className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Rotas e Middleware</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sempre sincronize após alterar rotas para que o middleware
                      funcione corretamente
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              startContent={<ArrowRightIcon className="w-4 h-4" />}
              onPress={onHelpClose}
            >
              Entendi!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
