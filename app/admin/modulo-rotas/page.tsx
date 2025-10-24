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
import { PlusIcon, SearchIcon, RouteIcon, PencilIcon, TrashIcon, EyeIcon, PowerIcon, ChartBarIcon, SettingsIcon, GlobeIcon, FileTextIcon, KeyIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { listModuloRotas, createModuloRota, updateModuloRota, deleteModuloRota, toggleModuloRotaStatus, createBulkModuloRotas, type ModuloRotaCreateInput } from "@/app/actions/modulo-rotas";
import { listModulos } from "@/app/actions/modulos";

export default function ModuloRotasAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModulo, setSelectedModulo] = useState<string>("");
  const [selectedRota, setSelectedRota] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | "bulk">("create");
  const [loading, setLoading] = useState(false);

  // Modals
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  // Form data
  const [formData, setFormData] = useState<ModuloRotaCreateInput & { ativo?: boolean }>({
    moduloId: "",
    rota: "",
    descricao: "",
    ativo: true,
  });

  // Bulk form data
  const [bulkRotas, setBulkRotas] = useState<string>("");

  // SWR hooks
  const { data: rotasData, mutate: mutateRotas } = useSWR(
    ["modulo-rotas", searchTerm, selectedModulo],
    () =>
      listModuloRotas({
        search: searchTerm || undefined,
        moduloId: selectedModulo || undefined,
        limit: 100,
      }),
    { refreshInterval: 30000 }
  );

  const { data: modulosData } = useSWR("modulos", () => listModulos({ limit: 100 }), { refreshInterval: 60000 });

  const rotas = rotasData?.data?.rotas || [];
  const modulos = modulosData?.data?.modulos || [];

  // Modal handlers
  const handleOpenModal = (mode: "create" | "edit" | "view" | "bulk", rota?: any) => {
    setModalMode(mode);
    setSelectedRota(rota);

    if (mode === "create") {
      setFormData({
        moduloId: selectedModulo || "",
        rota: "",
        descricao: "",
        ativo: true,
      });
    } else if (mode === "bulk") {
      setBulkRotas("");
    } else if (rota) {
      setFormData({
        moduloId: rota.moduloId,
        rota: rota.rota,
        descricao: rota.descricao || "",
        ativo: rota.ativo,
      });
    }

    onModalOpen();
  };

  const handleCloseModal = () => {
    onModalClose();
    setSelectedRota(null);
    setFormData({
      moduloId: "",
      rota: "",
      descricao: "",
      ativo: true,
    });
    setBulkRotas("");
  };

  const handleSubmit = async () => {
    if (!formData.moduloId || !formData.rota) {
      toast.error("Módulo e rota são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      if (modalMode === "create") {
        const result = await createModuloRota(formData);

        if (result.success) {
          toast.success("Rota criada com sucesso!");
          mutateRotas();
          handleCloseModal();
        } else {
          toast.error(result.error || "Erro ao criar rota");
        }
      } else if (modalMode === "edit" && selectedRota) {
        const result = await updateModuloRota(selectedRota.id, formData);

        if (result.success) {
          toast.success("Rota atualizada com sucesso!");
          mutateRotas();
          handleCloseModal();
        } else {
          toast.error(result.error || "Erro ao atualizar rota");
        }
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!selectedModulo || !bulkRotas.trim()) {
      toast.error("Módulo e rotas são obrigatórios");
      return;
    }

    const rotasArray = bulkRotas
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (rotasArray.length === 0) {
      toast.error("Nenhuma rota válida encontrada");
      return;
    }

    setLoading(true);
    try {
      const result = await createBulkModuloRotas(selectedModulo, rotasArray);

      if (result.success) {
        toast.success(`${result.data?.length || 0} rotas criadas com sucesso!`);
        mutateRotas();
        handleCloseModal();
      } else {
        toast.error(result.error || "Erro ao criar rotas");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rota: any) => {
    if (!confirm(`Tem certeza que deseja excluir a rota ${rota.rota}?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteModuloRota(rota.id);

      if (result.success) {
        toast.success("Rota excluída com sucesso!");
        mutateRotas();
      } else {
        toast.error(result.error || "Erro ao excluir rota");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (rota: any) => {
    setLoading(true);
    try {
      const result = await toggleModuloRotaStatus(rota.id);

      if (result.success) {
        toast.success(`Rota ${rota.ativo ? "desativada" : "ativada"} com sucesso!`);
        mutateRotas();
      } else {
        toast.error(result.error || "Erro ao alterar status");
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
            <RouteIcon className="text-primary" size={32} />
            Gestão de Rotas de Módulos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie as rotas associadas aos módulos do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button color="secondary" startContent={<UploadIcon size={20} />} onPress={() => handleOpenModal("bulk")}>
            Criar em Lote
          </Button>
          <Button color="primary" startContent={<PlusIcon size={20} />} onPress={() => handleOpenModal("create")}>
            Nova Rota
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <Input placeholder="Buscar rotas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} startContent={<SearchIcon size={20} />} className="max-w-md" />
            <Select placeholder="Filtrar por módulo" value={selectedModulo} onChange={(e) => setSelectedModulo(e.target.value)} className="max-w-xs">
              <SelectItem key="" value="">
                Todos os módulos
              </SelectItem>
              {modulos.map((modulo) => (
                <SelectItem key={modulo.id} value={modulo.id}>
                  {modulo.nome}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Rotas dos Módulos</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="Tabela de rotas de módulos">
            <TableHeader>
              <TableColumn>MÓDULO</TableColumn>
              <TableColumn>ROTA</TableColumn>
              <TableColumn>DESCRIÇÃO</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody>
              {rotas.map((rota) => (
                <TableRow key={rota.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{rota.modulo.nome}</p>
                        <code className="text-sm text-gray-500 dark:text-gray-400">{rota.modulo.slug}</code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{rota.rota}</code>
                  </TableCell>
                  <TableCell>{rota.descricao && <p className="text-sm text-gray-600 dark:text-gray-400">{rota.descricao}</p>}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={rota.ativo ? "success" : "danger"} variant="flat">
                      {rota.ativo ? "Ativa" : "Inativa"}
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
                        <DropdownItem key="view" startContent={<EyeIcon size={16} />} onPress={() => handleOpenModal("view", rota)}>
                          Visualizar
                        </DropdownItem>
                        <DropdownItem key="edit" startContent={<PencilIcon size={16} />} onPress={() => handleOpenModal("edit", rota)}>
                          Editar
                        </DropdownItem>
                        <DropdownItem key="toggle" startContent={<PowerIcon size={16} />} onPress={() => handleToggleStatus(rota)}>
                          {rota.ativo ? "Desativar" : "Ativar"}
                        </DropdownItem>
                        <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon size={16} />} onPress={() => handleDelete(rota)}>
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
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size={modalMode === "bulk" ? "3xl" : "2xl"} scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {modalMode === "create" && "Nova Rota"}
            {modalMode === "edit" && "Editar Rota"}
            {modalMode === "view" && "Visualizar Rota"}
            {modalMode === "bulk" && "Criar Rotas em Lote"}
          </ModalHeader>
          <ModalBody>
            {modalMode === "bulk" ? (
              <div className="space-y-4">
                <Select label="Módulo" placeholder="Selecione o módulo" value={selectedModulo} onChange={(e) => setSelectedModulo(e.target.value)} isRequired>
                  {modulos.map((modulo) => (
                    <SelectItem key={modulo.id} value={modulo.id}>
                      {modulo.nome}
                    </SelectItem>
                  ))}
                </Select>
                <Textarea
                  label="Rotas (uma por linha)"
                  placeholder="/nova-rota&#10;/outra-rota&#10;/mais-uma-rota"
                  value={bulkRotas}
                  onChange={(e) => setBulkRotas(e.target.value)}
                  rows={10}
                  isRequired
                />
                <p className="text-sm text-gray-500">Digite uma rota por linha. Exemplo: /nova-rota, /outra-rota, etc.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Select
                  label="Módulo"
                  placeholder="Selecione o módulo"
                  value={formData.moduloId}
                  onChange={(e) => setFormData({ ...formData, moduloId: e.target.value })}
                  isDisabled={modalMode === "view"}
                  isRequired
                >
                  {modulos.map((modulo) => (
                    <SelectItem key={modulo.id} value={modulo.id}>
                      {modulo.nome}
                    </SelectItem>
                  ))}
                </Select>

                <Input label="Rota" placeholder="/nova-rota" value={formData.rota} onChange={(e) => setFormData({ ...formData, rota: e.target.value })} isDisabled={modalMode === "view"} isRequired />

                <Textarea
                  label="Descrição"
                  placeholder="Descrição da rota..."
                  value={formData.descricao || ""}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  isDisabled={modalMode === "view"}
                  rows={3}
                />

                {modalMode !== "view" && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ativo" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} className="rounded" />
                    <label htmlFor="ativo" className="text-sm">
                      Rota ativa
                    </label>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseModal}>
              Cancelar
            </Button>
            {modalMode !== "view" && (
              <Button color="primary" onPress={modalMode === "bulk" ? handleBulkSubmit : handleSubmit} isLoading={loading}>
                {modalMode === "create" ? "Criar" : modalMode === "bulk" ? "Criar Rotas" : "Salvar"}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
