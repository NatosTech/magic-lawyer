"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
import useSWR from "swr";
import {
  Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Tooltip, Textarea, Divider, Progress, Select, SelectItem } from "@heroui/react";
import {
  PlusIcon,
  SearchIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  LayersIcon,
  TagIcon,
  PaletteIcon,
  HashIcon,
  CalendarIcon,
  BarChartIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  SettingsIcon,
  FilterIcon,
} from "lucide-react";

import {
  listModuloCategorias,
  createModuloCategoria,
  updateModuloCategoria,
  deleteModuloCategoria,
  toggleModuloCategoriaStatus,
  getDashboardModuloCategorias,
  type ModuloCategoriaCreateInput,
  type ModuloCategoriaWithStats,
} from "@/app/actions/modulo-categorias";
import {
  getCategoryIcon,
  getCategoryColor,
  getCategoryClasses,
  getAvailableIcons,
  getAvailableColors,
} from "@/app/lib/category-utils";

// ==================== COMPONENTE PRINCIPAL ====================

export default function ModuloCategoriasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modals
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();
  const {
    isOpen: isHelpOpen,
    onOpen: onHelpOpen,
    onClose: onHelpClose,
  } = useDisclosure();

  // Form states
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<ModuloCategoriaCreateInput>({
    nome: "",
    slug: "",
    descricao: "",
    icone: "",
    cor: "#3B82F6",
    ordem: 0,
  });
  const [selectedCategoria, setSelectedCategoria] =
    useState<ModuloCategoriaWithStats | null>(null);

  // ==================== FETCH DATA ====================

  const {
    data: categoriasData,
    mutate: mutateCategorias,
    isLoading,
  } = useSWR(
    "modulo-categorias",
    () =>
      listModuloCategorias({
        search: searchTerm,
        ativo: filterStatus === "all" ? undefined : filterStatus === "active",
      }),
      {
      revalidateOnFocus: false,
      refreshInterval: 0,
    },
  );

  const { data: dashboardData, mutate: mutateDashboard } = useSWR(
    "dashboard-categorias",
    getDashboardModuloCategorias,
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
    },
  );

  const categorias = categoriasData?.data?.categorias || [];
  const total = categoriasData?.data?.total || 0;
  const dashboard = dashboardData?.data;

  // ==================== HANDLERS ====================

  const handleOpenModal = (
    mode: "create" | "edit",
    categoria?: ModuloCategoriaWithStats,
  ) => {
    setModalMode(mode);
    if (mode === "create") {
      setFormData({
        nome: "",
        slug: "",
        descricao: "",
        icone: "",
        cor: "#3B82F6",
        ordem: 0,
      });
      setSelectedCategoria(null);
    } else if (categoria) {
      setFormData({
        nome: categoria.nome,
        slug: categoria.slug,
        descricao: categoria.descricao || "",
        icone: categoria.icone || "",
        cor: categoria.cor || "#3B82F6",
        ordem: categoria.ordem,
      });
      setSelectedCategoria(categoria);
    }
    onModalOpen();
  };

  const handleCloseModal = () => {
    onModalClose();
    setFormData({
      nome: "",
      slug: "",
      descricao: "",
      icone: "",
      cor: "#3B82F6",
      ordem: 0,
    });
    setSelectedCategoria(null);
  };

  const handleSubmit = async () => {
    if (!formData.nome?.trim()) {
      toast.error("Nome é obrigatório");

      return;
    }

    if (!formData.slug?.trim()) {
      toast.error("Slug é obrigatório");

      return;
    }

    setLoading(true);

    try {
      let result;

      if (modalMode === "create") {
        result = await createModuloCategoria(formData);
      } else if (selectedCategoria) {
        result = await updateModuloCategoria(selectedCategoria.id, formData);
      }

      if (result?.success) {
        toast.success(
          modalMode === "create"
            ? "Categoria criada com sucesso!"
            : "Categoria atualizada com sucesso!",
        );
        handleCloseModal();
        mutateCategorias();
        mutateDashboard();
      } else {
        toast.error(result?.error || "Erro ao salvar categoria");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoria: ModuloCategoriaWithStats) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir a categoria "${categoria.nome}"?`,
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const result = await deleteModuloCategoria(categoria.id);

      if (result.success) {
        toast.success("Categoria excluída com sucesso!");
        mutateCategorias();
        mutateDashboard();
      } else {
        toast.error(result.error || "Erro ao excluir categoria");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (categoria: ModuloCategoriaWithStats) => {
    setLoading(true);

    try {
      const result = await toggleModuloCategoriaStatus(categoria.id);

      if (result.success) {
        toast.success(
          categoria.ativo
            ? "Categoria desativada com sucesso!"
            : "Categoria ativada com sucesso!",
        );
        mutateCategorias();
        mutateDashboard();
      } else {
        toast.error(result.error || "Erro ao alterar status da categoria");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    mutateCategorias();
    mutateDashboard();
    toast.success("Dados atualizados!");
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categorias de Módulos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie as categorias que organizam os módulos do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip content="Atualizar dados" placement="top">
            <Button
              isIconOnly
              isLoading={isLoading}
              variant="light"
              onPress={handleRefresh}
            >
              <RefreshCwIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Ajuda e instruções" placement="top">
            <Button isIconOnly variant="light" onPress={onHelpOpen}>
              <InfoIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => handleOpenModal("create")}
          >
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      Total de Categorias
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {dashboard.total}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <LayersIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                      Categorias Ativas
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {dashboard.ativos}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                      Categorias Inativas
                    </p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {dashboard.inativos}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-lg">
                    <XCircleIcon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                className="max-w-sm"
                placeholder="Buscar categorias..."
                startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
            </div>
            <div className="flex gap-2">
              <Select
                className="w-40"
                placeholder="Status"
                selectedKeys={[filterStatus]}
                startContent={<FilterIcon className="w-4 h-4" />}
                onSelectionChange={(keys) =>
                  setFilterStatus(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all" textValue="Todos">Todos</SelectItem>
                <SelectItem key="active" textValue="Ativos">Ativos</SelectItem>
                <SelectItem key="inactive" textValue="Inativos">Inativos</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <TagIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Categorias</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {total} categoria{total !== 1 ? "s" : ""} encontrada
                {total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Progress
                isIndeterminate
                className="max-w-md mx-auto"
                size="sm"
              />
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Carregando categorias...
              </p>
            </div>
          ) : categorias.length === 0 ? (
            <div className="p-8 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TagIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma categoria encontrada
              </p>
            </div>
          ) : (
            <Table aria-label="Tabela de categorias">
              <TableHeader>
                <TableColumn>CATEGORIA</TableColumn>
                <TableColumn>SLUG</TableColumn>
                <TableColumn>MÓDULOS</TableColumn>
                <TableColumn>ORDEM</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>CRIADO</TableColumn>
                <TableColumn>AÇÕES</TableColumn>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria, index) => {
                  const CategoryIcon = getCategoryIcon(categoria);
                  const categoryColor = getCategoryColor(categoria);
                  const categoryClasses = getCategoryClasses(categoria);

                  return (
                    <TableRow key={categoria.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${categoryClasses.bg}`}
                          >
                            <CategoryIcon
                              className={`w-4 h-4 ${categoryClasses.text}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{categoria.nome}</p>
                            {categoria.descricao && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {categoria.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {categoria.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color="primary"
                          size="sm"
                          startContent={<LayersIcon className="w-3 h-3" />}
                          variant="flat"
                        >
                          {categoria._count.modulos}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color="default"
                          size="sm"
                          startContent={<HashIcon className="w-3 h-3" />}
                          variant="flat"
                        >
                          {categoria.ordem}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={categoria.ativo ? "success" : "danger"}
                          size="sm"
                          startContent={
                            categoria.ativo ? (
                              <CheckCircleIcon className="w-3 h-3" />
                            ) : (
                              <XCircleIcon className="w-3 h-3" />
                            )
                          }
                          variant="flat"
                        >
                          {categoria.ativo ? "Ativa" : "Inativa"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(categoria.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVerticalIcon className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit"
                              startContent={<EditIcon className="w-4 h-4" />}
                              onPress={() => handleOpenModal("edit", categoria)}
                            >
                              Editar
                            </DropdownItem>
                            <DropdownItem
                              key="toggle"
                              startContent={
                                categoria.ativo ? (
                                  <EyeOffIcon className="w-4 h-4" />
                                ) : (
                                  <EyeIcon className="w-4 h-4" />
                                )
                              }
                              onPress={() => handleToggleStatus(categoria)}
                            >
                              {categoria.ativo ? "Desativar" : "Ativar"}
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDelete(categoria)}
                            >
                              Excluir
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal de Categoria */}
      <Modal
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <TagIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {modalMode === "create" ? "Nova Categoria" : "Editar Categoria"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {modalMode === "create"
                  ? "Crie uma nova categoria para organizar os módulos"
                  : "Edite as informações da categoria"}
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isRequired
                label="Nome da Categoria"
                placeholder="Ex: Gestão de Clientes"
                value={formData.nome}
                onValueChange={(value) =>
                  setFormData({ ...formData, nome: value })
                }
              />
              <Input
                isRequired
                label="Slug"
                placeholder="Ex: gestao-clientes"
                value={formData.slug}
                onValueChange={(value) =>
                  setFormData({ ...formData, slug: value })
                }
              />
            </div>

            <Textarea
              label="Descrição"
              minRows={2}
              placeholder="Descreva o propósito desta categoria..."
              value={formData.descricao}
              onValueChange={(value) =>
                setFormData({ ...formData, descricao: value })
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Ícone"
                placeholder="Selecione um ícone"
                startContent={<TagIcon className="w-4 h-4" />}
                value={formData.icone}
                onSelectionChange={(value) =>
                  setFormData({ ...formData, icone: value as string })
                }
              >
                {getAvailableIcons().map((icon) => {
                  const IconComponent = getCategoryIcon({ icone: icon });

                  return (
                    <SelectItem
                      key={icon}
                      startContent={<IconComponent className="w-4 h-4" />}
                      textValue={icon}
                    >
                      {icon}
                    </SelectItem>
                  );
                })}
              </Select>

              <Select
                label="Cor"
                placeholder="Selecione uma cor"
                startContent={<PaletteIcon className="w-4 h-4" />}
                value={formData.cor}
                onSelectionChange={(value) =>
                  setFormData({ ...formData, cor: value as string })
                }
              >
                {getAvailableColors().map((color) => (
                  <SelectItem key={color} textValue={color}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                      <span>{color}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Input
              label="Ordem"
              placeholder="0"
              type="number"
              value={formData.ordem?.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, ordem: parseInt(value) || 0 })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={loading}
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={handleSubmit}
            >
              {modalMode === "create" ? "Criar Categoria" : "Salvar Alterações"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Ajuda */}
      <Modal
        isOpen={isHelpOpen}
        scrollBehavior="inside"
        size="4xl"
        onClose={onHelpClose}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <InfoIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Gestão de Categorias de Módulos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Como organizar e gerenciar as categorias do sistema
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />O que são Categorias?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                As categorias são uma forma de organizar e agrupar os módulos do
                sistema por funcionalidade ou área de negócio. Isso facilita a
                navegação e a compreensão da estrutura do sistema.
              </p>
            </div>

            <Divider />

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                Como Criar Categorias
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium">
                      Clique em &quot;Nova Categoria&quot;
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Preencha o nome e slug da categoria
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Configure a aparência</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Escolha um ícone, cor e ordem de exibição
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Salve a categoria</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A categoria estará disponível para associar aos módulos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                Benefícios das Categorias
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Organização Visual
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Agrupa módulos relacionados em uma interface mais limpa e
                    intuitiva
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Navegação Facilitada
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Usuários encontram funcionalidades mais rapidamente
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    Gestão de Planos
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Facilita a criação de planos por categoria de
                    funcionalidades
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    Escalabilidade
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Sistema cresce de forma organizada e estruturada
                  </p>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <EyeIcon className="w-5 h-5" />
                Dicas Importantes
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Slug:</strong> Deve ser único e em formato
                    URL-friendly (sem espaços, acentos)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Ordem:</strong> Números menores aparecem primeiro na
                    listagem
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Ícones:</strong> Use nomes de ícones do Lucide React
                    (ex: Users, FileText, Settings)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Exclusão:</strong> Só é possível excluir categorias
                    sem módulos associados
                  </p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onHelpClose}>
              Entendi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
