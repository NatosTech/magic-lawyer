"use client";

import { useState } from "react";
import useSWR from "swr";
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
} from "@heroui/react";
import { PlusIcon, SearchIcon, PuzzleIcon, PencilIcon, TrashIcon, EyeIcon, PowerIcon, ChartBarIcon, SettingsIcon, GlobeIcon, FileTextIcon, KeyIcon } from "lucide-react";
import { toast } from "sonner";

import { listModulos, getDashboardModulos, createModulo, updateModulo, deleteModulo, toggleModuloStatus, type ModuloCreateInput } from "@/app/actions/modulos";
import { syncModuleMap, getModuleMapStatus } from "@/app/actions/sync-module-map";

export default function ModulosAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModulo, setSelectedModulo] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [loading, setLoading] = useState(false);

  // Modals
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  // Form data
  const [formData, setFormData] = useState<ModuloCreateInput & { ativo?: boolean }>({
    slug: "",
    nome: "",
    categoria: "",
    descricao: "",
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

  const modulos = modulosData?.data?.modulos || [];
  const dashboard = dashboardData?.data;
  const syncStatus = syncStatusData?.data;

  // Modal handlers
  const handleOpenModal = (mode: "create" | "edit" | "view", modulo?: any) => {
    setModalMode(mode);
    setSelectedModulo(modulo);

    if (mode === "create") {
      setFormData({
        slug: "",
        nome: "",
        categoria: "",
        descricao: "",
        icone: "",
        ordem: 0,
        ativo: true,
      });
    } else if (modulo) {
      setFormData({
        slug: modulo.slug,
        nome: modulo.nome,
        categoria: modulo.categoria || "",
        descricao: modulo.descricao || "",
        icone: modulo.icone || "",
        ordem: modulo.ordem || 0,
        ativo: modulo.ativo,
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
      categoria: "",
      descricao: "",
      icone: "",
      ordem: 0,
      ativo: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.slug || !formData.nome) {
      toast.error("Slug e nome são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      if (modalMode === "create") {
        const result = await createModulo(formData);

        if (result.success) {
          toast.success("Módulo criado com sucesso!");
          mutateModulos();
          handleCloseModal();
        } else {
          toast.error(result.error || "Erro ao criar módulo");
        }
      } else if (modalMode === "edit" && selectedModulo) {
        const result = await updateModulo(selectedModulo.id, formData);

        if (result.success) {
          toast.success("Módulo atualizado com sucesso!");
          mutateModulos();
          handleCloseModal();
        } else {
          toast.error(result.error || "Erro ao atualizar módulo");
        }
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modulo: any) => {
    if (!confirm(`Tem certeza que deseja excluir o módulo ${modulo.nome}?`)) {
      return;
    }

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
        toast.success(`Module map sincronizado! ${result.data?.totalModules} módulos, ${result.data?.totalRoutes} rotas`);
      } else {
        toast.error(result.error || "Erro ao sincronizar module map");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <PuzzleIcon className="text-primary" size={32} />
            Gestão de Módulos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os módulos disponíveis no sistema</p>
        </div>
        <div className="flex gap-2">
          <Button color="secondary" startContent={<SettingsIcon size={20} />} onPress={handleSyncModuleMap} isLoading={loading} isDisabled={!syncStatus?.needsSync}>
            {syncStatus?.needsSync ? "Sincronizar" : "Sincronizado"}
          </Button>
          <Button color="primary" startContent={<PlusIcon size={20} />} onPress={() => handleOpenModal("create")}>
            Novo Módulo
          </Button>
        </div>
      </div>

      {/* Status de Sincronização */}
      {syncStatus && (
        <Card className={syncStatus.needsSync ? "border-orange-200 bg-orange-50 dark:bg-orange-900/10" : "border-green-200 bg-green-50 dark:bg-green-900/10"}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${syncStatus.needsSync ? "bg-orange-100 dark:bg-orange-900/20" : "bg-green-100 dark:bg-green-900/20"}`}>
                  <SettingsIcon className={syncStatus.needsSync ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"} size={20} />
                </div>
                <div>
                  <p className="font-medium">{syncStatus.needsSync ? "Module Map Desatualizado" : "Module Map Sincronizado"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {syncStatus.totalModules} módulos • {syncStatus.totalRoutes} rotas
                    {syncStatus.lastSync && <span> • Última sincronização: {new Date(syncStatus.lastSync).toLocaleString("pt-BR")}</span>}
                  </p>
                </div>
              </div>
              {syncStatus.needsSync && (
                <Button color="warning" size="sm" onPress={handleSyncModuleMap} isLoading={loading}>
                  Sincronizar Agora
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ChartBarIcon className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold">{dashboard.total}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <PowerIcon className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
                <p className="text-2xl font-bold">{dashboard.ativos}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <PowerIcon className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inativos</p>
                <p className="text-2xl font-bold">{dashboard.inativos}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <SettingsIcon className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Categorias</p>
                <p className="text-2xl font-bold">{dashboard.categorias}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <Input placeholder="Buscar módulos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} startContent={<SearchIcon size={20} />} className="max-w-md" />
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Módulos do Sistema</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="Tabela de módulos">
            <TableHeader>
              <TableColumn>NOME</TableColumn>
              <TableColumn>SLUG</TableColumn>
              <TableColumn>CATEGORIA</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>PLANOS</TableColumn>
              <TableColumn>ROTAS</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody>
              {modulos.map((modulo) => (
                <TableRow key={modulo.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {modulo.icone && (
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <span className="text-sm">{modulo.icone}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{modulo.nome}</p>
                        {modulo.descricao && <p className="text-sm text-gray-500 dark:text-gray-400">{modulo.descricao}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{modulo.slug}</code>
                  </TableCell>
                  <TableCell>
                    {modulo.categoria && (
                      <Chip size="sm" variant="flat">
                        {modulo.categoria}
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={modulo.ativo ? "success" : "danger"} variant="flat">
                      {modulo.ativo ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {modulo._count.planos}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {modulo._count.rotas}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <SettingsIcon size={16} />
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {modalMode === "create" && "Novo Módulo"}
            {modalMode === "edit" && "Editar Módulo"}
            {modalMode === "view" && "Visualizar Módulo"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Slug"
                  placeholder="ex: chat-interno"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  isDisabled={modalMode === "view"}
                  isRequired
                />
                <Input
                  label="Nome"
                  placeholder="ex: Chat Interno"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  isDisabled={modalMode === "view"}
                  isRequired
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Categoria"
                  placeholder="ex: Comunicacao"
                  value={formData.categoria || ""}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  isDisabled={modalMode === "view"}
                />
                <Input
                  label="Ícone"
                  placeholder="ex: MessagesSquare"
                  value={formData.icone || ""}
                  onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                  isDisabled={modalMode === "view"}
                />
              </div>

              <Input
                label="Ordem"
                type="number"
                value={formData.ordem?.toString() || ""}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                isDisabled={modalMode === "view"}
              />

              <Textarea
                label="Descrição"
                placeholder="Descrição do módulo..."
                value={formData.descricao || ""}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                isDisabled={modalMode === "view"}
                rows={3}
              />

              {modalMode !== "view" && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="ativo" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} className="rounded" />
                  <label htmlFor="ativo" className="text-sm">
                    Módulo ativo
                  </label>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseModal}>
              Cancelar
            </Button>
            {modalMode !== "view" && (
              <Button color="primary" onPress={handleSubmit} isLoading={loading}>
                {modalMode === "create" ? "Criar" : "Salvar"}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
