"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem } from "@heroui/react";
import {
  PlusIcon,
  SearchIcon,
  BuildingIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PowerIcon,
  ChartBarIcon,
  CreditCardIcon,
  GlobeIcon,
  PhoneIcon,
  FileTextIcon,
  KeyIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  listBancos,
  getDashboardBancos,
  createBanco,
  updateBanco,
  deleteBanco,
  toggleBancoStatus,
  type BancoCreateInput,
} from "@/app/actions/bancos";

export default function BancosAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBanco, setSelectedBanco] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [loading, setLoading] = useState(false);

  // Modals
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();

  // Form data
  const [formData, setFormData] = useState<
    BancoCreateInput & { ativo?: boolean }
  >({
    codigo: "",
    nome: "",
    nomeCompleto: "",
    site: "",
    telefone: "",
    cnpj: "",
    ispb: "",
    ativo: true,
  });

  // SWR hooks
  const { data: bancosData, mutate: mutateBancos } = useSWR(
    ["bancos", searchTerm],
    () => listBancos({ search: searchTerm || undefined, limit: 100 }),
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
    },
  );

  const { data: dashboardData } = useSWR(
    "dashboard-bancos",
    getDashboardBancos,
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
    },
  );

  const bancos = bancosData?.bancos || [];
  const dashboard = dashboardData?.dashboard;

  // Modal handlers
  const handleOpenModal = (mode: "create" | "edit" | "view", banco?: any) => {
    setModalMode(mode);
    setSelectedBanco(banco);

    if (mode === "create") {
      setFormData({
        codigo: "",
        nome: "",
        nomeCompleto: "",
        site: "",
        telefone: "",
        cnpj: "",
        ispb: "",
        ativo: true,
      });
    } else if (banco) {
      setFormData({
        codigo: banco.codigo,
        nome: banco.nome,
        nomeCompleto: banco.nomeCompleto || "",
        site: banco.site || "",
        telefone: banco.telefone || "",
        cnpj: banco.cnpj || "",
        ispb: banco.ispb || "",
        ativo: banco.ativo,
      });
    }

    onModalOpen();
  };

  const handleCloseModal = () => {
    onModalClose();
    setSelectedBanco(null);
    setFormData({
      codigo: "",
      nome: "",
      nomeCompleto: "",
      site: "",
      telefone: "",
      cnpj: "",
      ispb: "",
      ativo: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.codigo || !formData.nome) {
      toast.error("Código e nome são obrigatórios");

      return;
    }

    setLoading(true);
    try {
      if (modalMode === "create") {
        const result = await createBanco(formData);

        if (result.success) {
          toast.success("Banco criado com sucesso!");
          mutateBancos();
          handleCloseModal();
        } else {
          toast.error(result.error || "Erro ao criar banco");
        }
      } else if (modalMode === "edit" && selectedBanco) {
        const result = await updateBanco(selectedBanco.codigo, formData);

        if (result.success) {
          toast.success("Banco atualizado com sucesso!");
          mutateBancos();
          handleCloseModal();
        } else {
          toast.error(result.error || "Erro ao atualizar banco");
        }
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (banco: any) => {
    if (!confirm(`Tem certeza que deseja excluir o banco ${banco.nome}?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteBanco(banco.codigo);

      if (result.success) {
        toast.success("Banco excluído com sucesso!");
        mutateBancos();
      } else {
        toast.error(result.error || "Erro ao excluir banco");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (banco: any) => {
    setLoading(true);
    try {
      const result = await toggleBancoStatus(banco.codigo);

      if (result.success) {
        toast.success(
          `Banco ${banco.ativo ? "desativado" : "ativado"} com sucesso!`,
        );
        mutateBancos();
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
            <BuildingIcon className="text-primary" size={32} />
            Gestão de Bancos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os bancos disponíveis no sistema
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon size={20} />}
          onPress={() => handleOpenModal("create")}
        >
          Novo Banco
        </Button>
      </div>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <BuildingIcon
                  className="text-blue-600 dark:text-blue-400"
                  size={24}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Bancos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboard.totalBancos}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <PowerIcon
                  className="text-green-600 dark:text-green-400"
                  size={24}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bancos Ativos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboard.bancosAtivos}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <PowerIcon
                  className="text-red-600 dark:text-red-400"
                  size={24}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bancos Inativos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboard.bancosInativos}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <ChartBarIcon
                  className="text-purple-600 dark:text-purple-400"
                  size={24}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mais Usado
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {dashboard.bancoMaisUsado?.nome || "N/A"}
                </p>
                <p className="text-xs text-gray-500">
                  {dashboard.bancoMaisUsado?._count.dadosBancarios || 0} contas
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <Input
              className="flex-1"
              placeholder="Buscar por código, nome ou CNPJ..."
              startContent={<SearchIcon className="text-gray-400" size={20} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Banks Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Bancos Cadastrados</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="Lista de bancos">
            <TableHeader>
              <TableColumn>CÓDIGO</TableColumn>
              <TableColumn>NOME</TableColumn>
              <TableColumn>CNPJ</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>CONTAS VINCULADAS</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody>
              {bancos.map((banco) => (
                <TableRow key={banco.codigo}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="text-gray-400" size={16} />
                      <span className="font-mono font-medium">
                        {banco.codigo}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{banco.nome}</p>
                      {banco.nomeCompleto && (
                        <p className="text-sm text-gray-500">
                          {banco.nomeCompleto}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {banco.cnpj ? (
                      <span className="font-mono text-sm">{banco.cnpj}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={banco.ativo ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {banco.ativo ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {banco._count.dadosBancarios} contas
                    </span>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          ⋯
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="view"
                          startContent={<EyeIcon size={16} />}
                          onPress={() => handleOpenModal("view", banco)}
                        >
                          Ver Detalhes
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<PencilIcon size={16} />}
                          onPress={() => handleOpenModal("edit", banco)}
                        >
                          Editar
                        </DropdownItem>
                        <DropdownItem
                          key="toggle"
                          startContent={<PowerIcon size={16} />}
                          onPress={() => handleToggleStatus(banco)}
                        >
                          {banco.ativo ? "Desativar" : "Ativar"}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<TrashIcon size={16} />}
                          onPress={() => handleDelete(banco)}
                        >
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
      <Modal
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <BuildingIcon className="text-primary" size={24} />
              {modalMode === "create" && "Novo Banco"}
              {modalMode === "edit" && "Editar Banco"}
              {modalMode === "view" && "Detalhes do Banco"}
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Código */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  isDisabled={modalMode === "view" || modalMode === "edit"}
                  label="Código do Banco"
                  placeholder="Ex: 001"
                  startContent={<KeyIcon className="text-gray-400" size={16} />}
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                />
                <Input
                  isDisabled={modalMode === "view"}
                  label="ISPB (PIX)"
                  placeholder="Ex: 00000000"
                  startContent={
                    <CreditCardIcon className="text-gray-400" size={16} />
                  }
                  value={formData.ispb}
                  onChange={(e) =>
                    setFormData({ ...formData, ispb: e.target.value })
                  }
                />
              </div>

              {/* Nome */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  isDisabled={modalMode === "view"}
                  label="Nome do Banco"
                  placeholder="Ex: Banco do Brasil"
                  startContent={
                    <BuildingIcon className="text-gray-400" size={16} />
                  }
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
                <Input
                  isDisabled={modalMode === "view"}
                  label="Nome Completo"
                  placeholder="Ex: Banco do Brasil S.A."
                  value={formData.nomeCompleto}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeCompleto: e.target.value })
                  }
                />
              </div>

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isDisabled={modalMode === "view"}
                  label="Site"
                  placeholder="https://www.banco.com.br"
                  startContent={
                    <GlobeIcon className="text-gray-400" size={16} />
                  }
                  value={formData.site}
                  onChange={(e) =>
                    setFormData({ ...formData, site: e.target.value })
                  }
                />
                <Input
                  isDisabled={modalMode === "view"}
                  label="Telefone"
                  placeholder="0800 123 4567"
                  startContent={
                    <PhoneIcon className="text-gray-400" size={16} />
                  }
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                />
              </div>

              {/* CNPJ */}
              <Input
                isDisabled={modalMode === "view"}
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                startContent={
                  <FileTextIcon className="text-gray-400" size={16} />
                }
                value={formData.cnpj}
                onChange={(e) =>
                  setFormData({ ...formData, cnpj: e.target.value })
                }
              />

              {/* Status */}
              {modalMode !== "create" && (
                <Select
                  isDisabled={modalMode === "view"}
                  label="Status"
                  selectedKeys={[formData.ativo ? "ativo" : "inativo"]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];

                    setFormData({ ...formData, ativo: selected === "ativo" });
                  }}
                >
                  <SelectItem key="ativo" textValue="Ativo">Ativo</SelectItem>
                  <SelectItem key="inativo" textValue="Inativo">Inativo</SelectItem>
                </Select>
              )}
            </div>
          </ModalBody>
          {modalMode !== "view" && (
            <ModalFooter>
              <Button variant="light" onPress={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={loading}
                onPress={handleSubmit}
              >
                {modalMode === "create" ? "Criar" : "Salvar"}
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
