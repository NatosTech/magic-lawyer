"use client";

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Textarea,
  DatePicker,
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ReceiptIcon,
  CalendarIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FilterIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  useParcelasContrato,
  useDashboardParcelas,
  useStatusParcelas,
} from "@/app/hooks/use-parcelas-contrato";
import {
  createParcelaContrato,
  updateParcelaContrato,
  deleteParcelaContrato,
  gerarParcelasAutomaticamente,
} from "@/app/actions/parcelas-contrato";
import { title, subtitle } from "@/components/primitives";
import { DadosBancariosParcela } from "@/components/dados-bancarios-parcela";
import { ComprovantePagamentoUpload } from "@/components/comprovante-pagamento-upload";
import { ValidacaoContaPrincipal } from "@/components/validacao-conta-principal";

type StatusParcela = "PENDENTE" | "PAGA" | "ATRASADA" | "CANCELADA";

interface ParcelaFormData {
  contratoId: string;
  numeroParcela: number;
  titulo?: string;
  descricao?: string;
  valor: number;
  dataVencimento: Date;
  status: StatusParcela;
  formaPagamento?: string;
  dataPagamento?: Date;
}

export default function ParcelasContratoPage() {
  // Estados
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    contratoId?: string;
    status?: StatusParcela;
  }>({});
  const [contaValida, setContaValida] = useState<boolean | null>(null);

  // Formulário
  const [formData, setFormData] = useState<ParcelaFormData>({
    contratoId: "",
    numeroParcela: 1,
    titulo: "",
    descricao: "",
    valor: 0,
    dataVencimento: new Date(),
    status: "PENDENTE",
    formaPagamento: "",
    dataPagamento: undefined,
  });

  // Hooks
  const { parcelas, isLoading, mutate } = useParcelasContrato(filters);
  const { dashboard, isLoading: loadingDashboard } = useDashboardParcelas();
  const { status: statusList } = useStatusParcelas();

  // Funções
  const handleOpenModal = (parcela?: any) => {
    if (parcela) {
      setEditingId(parcela.id);
      setFormData({
        contratoId: parcela.contratoId,
        numeroParcela: parcela.numeroParcela,
        titulo: parcela.titulo || "",
        descricao: parcela.descricao || "",
        valor: Number(parcela.valor),
        dataVencimento: new Date(parcela.dataVencimento),
        status: parcela.status,
        formaPagamento: parcela.formaPagamento || "",
        dataPagamento: parcela.dataPagamento
          ? new Date(parcela.dataPagamento)
          : undefined,
      });
    } else {
      setEditingId(null);
      setFormData({
        contratoId: "",
        numeroParcela: 1,
        titulo: "",
        descricao: "",
        valor: 0,
        dataVencimento: new Date(),
        status: "PENDENTE",
        formaPagamento: "",
        dataPagamento: undefined,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({
      contratoId: "",
      numeroParcela: 1,
      titulo: "",
      descricao: "",
      valor: 0,
      dataVencimento: new Date(),
      status: "PENDENTE",
      formaPagamento: "",
      dataPagamento: undefined,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validar campos obrigatórios
      if (!formData.contratoId) {
        toast.error("ID do contrato é obrigatório");

        return;
      }

      if (formData.valor <= 0) {
        toast.error("Valor deve ser maior que zero");

        return;
      }

      let result;

      if (editingId) {
        result = await updateParcelaContrato(editingId, formData);
      } else {
        result = await createParcelaContrato(formData);
      }

      if (result.success) {
        toast.success(result.message || "Parcela salva com sucesso!");
        mutate();
        handleCloseModal();
      } else {
        toast.error(result.error || "Erro ao salvar parcela");
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar parcela");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteParcelaContrato(id);

      if (result.success) {
        toast.success("Parcela removida com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao remover parcela");
      }
    } catch (error) {
      toast.error("Erro inesperado ao remover parcela");
    } finally {
      setLoading(false);
    }
  };

  const handleGerarAutomaticamente = async () => {
    try {
      setLoading(true);

      // Para demonstração, usar valores padrão
      const result = await gerarParcelasAutomaticamente(formData.contratoId, {
        valorTotal: formData.valor * 12, // 12 parcelas
        numeroParcelas: 12,
        dataPrimeiroVencimento: formData.dataVencimento,
        intervaloDias: 30,
        tituloBase: "Parcela",
      });

      if (result.success) {
        toast.success(result.message || "Parcelas geradas com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao gerar parcelas");
      }
    } catch (error) {
      toast.error("Erro inesperado ao gerar parcelas");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: StatusParcela) => {
    switch (status) {
      case "PENDENTE":
        return <ClockIcon size={16} />;
      case "PAGA":
        return <CheckCircleIcon size={16} />;
      case "ATRASADA":
        return <AlertTriangleIcon size={16} />;
      case "CANCELADA":
        return <XCircleIcon size={16} />;
      default:
        return <ClockIcon size={16} />;
    }
  };

  const getStatusColor = (status: StatusParcela) => {
    switch (status) {
      case "PENDENTE":
        return "warning";
      case "PAGA":
        return "success";
      case "ATRASADA":
        return "danger";
      case "CANCELADA":
        return "default";
      default:
        return "default";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const isVencida = (dataVencimento: Date | string, status: StatusParcela) => {
    return status === "PENDENTE" && new Date(dataVencimento) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>
            Parcelas de Contrato
          </h1>
          <p className={subtitle({ fullWidth: true })}>
            Gerencie as parcelas dos contratos
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon size={20} />}
          onPress={() => handleOpenModal()}
        >
          Nova Parcela
        </Button>
      </div>

      {/* Dashboard */}
      {loadingDashboard ? (
        <div className="flex justify-center py-4">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ReceiptIcon className="text-blue-500" size={24} />
                <span className="text-2xl font-bold">
                  {dashboard?.totalParcelas || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total de Parcelas</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ClockIcon className="text-yellow-500" size={24} />
                <span className="text-2xl font-bold">
                  {dashboard?.parcelasPendentes || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Pendentes</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircleIcon className="text-green-500" size={24} />
                <span className="text-2xl font-bold">
                  {dashboard?.parcelasPagas || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Pagas</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangleIcon className="text-red-500" size={24} />
                <span className="text-2xl font-bold">
                  {dashboard?.parcelasAtrasadas || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Atrasadas</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex gap-4 items-end">
            <Input
              className="max-w-xs"
              label="ID do Contrato"
              placeholder="Filtrar por contrato"
              value={filters.contratoId || ""}
              onChange={(e) =>
                setFilters({ ...filters, contratoId: e.target.value })
              }
            />
            <Select
              className="max-w-xs"
              label="Status"
              placeholder="Todos os status"
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={(keys) => {
                const status = Array.from(keys)[0] as StatusParcela;

                setFilters({ ...filters, status: status || undefined });
              }}
            >
              {statusList.map((status) => (
                <SelectItem key={status.value} textValue={status.label}>
                  <div className="flex items-center gap-2">
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                  </div>
                </SelectItem>
              ))}
            </Select>
            <Button
              startContent={<FilterIcon size={16} />}
              variant="light"
              onPress={() => setFilters({})}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Parcelas */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Lista de Parcelas</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table aria-label="Lista de parcelas de contrato">
              <TableHeader>
                <TableColumn>CONTRATO</TableColumn>
                <TableColumn>PARCELA</TableColumn>
                <TableColumn>VALOR</TableColumn>
                <TableColumn>VENCIMENTO</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>AÇÕES</TableColumn>
              </TableHeader>
              <TableBody>
                {parcelas.map((parcela) => (
                  <TableRow key={parcela.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {parcela.contrato.cliente.nome}
                        </p>
                        <p className="text-sm text-gray-500">
                          {parcela.contrato.advogado.nome}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {parcela.titulo || `Parcela ${parcela.numeroParcela}`}
                        </p>
                        {parcela.descricao && (
                          <p className="text-sm text-gray-500">
                            {parcela.descricao}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {formatCurrency(Number(parcela.valor))}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="text-gray-400" size={16} />
                        <span
                          className={
                            isVencida(parcela.dataVencimento, parcela.status)
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {formatDate(parcela.dataVencimento)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getStatusColor(parcela.status)}
                        startContent={getStatusIcon(parcela.status)}
                        variant="flat"
                      >
                        {
                          statusList.find((s) => s.value === parcela.status)
                            ?.label
                        }
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button size="sm" variant="light">
                            Ações
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="view"
                            startContent={<EyeIcon size={16} />}
                            onPress={() => handleOpenModal(parcela)}
                          >
                            Ver Detalhes
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<PencilIcon size={16} />}
                            onPress={() => handleOpenModal(parcela)}
                          >
                            Editar
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<TrashIcon size={16} />}
                            onPress={() => handleDelete(parcela.id)}
                          >
                            Remover
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {parcelas.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <ReceiptIcon className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Nenhuma parcela encontrada</p>
              <Button
                className="mt-2"
                color="primary"
                variant="light"
                onPress={() => handleOpenModal()}
              >
                Criar Primeira Parcela
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Criação/Edição */}
      <Modal isOpen={modalOpen} size="4xl" onClose={handleCloseModal}>
        <ModalContent>
          <ModalHeader>
            {editingId ? "Editar Parcela" : "Nova Parcela"}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                isRequired
                label="ID do Contrato"
                placeholder="Digite o ID do contrato"
                value={formData.contratoId}
                onChange={(e) =>
                  setFormData({ ...formData, contratoId: e.target.value })
                }
              />
              <Input
                isRequired
                label="Número da Parcela"
                min="1"
                placeholder="1"
                type="number"
                value={formData.numeroParcela.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numeroParcela: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <Input
              label="Título"
              placeholder="Ex: Parcela 1/12"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                isRequired
                label="Valor"
                placeholder="0,00"
                startContent="R$"
                step="0.01"
                type="number"
                value={formData.valor.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valor: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Select
                isRequired
                label="Status"
                placeholder="Selecione o status"
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const status = Array.from(keys)[0] as StatusParcela;

                  setFormData({ ...formData, status });
                }}
              >
                {statusList.map((status) => (
                  <SelectItem key={status.value} textValue={status.label}>
                    <div className="flex items-center gap-2">
                      <span>{status.icon}</span>
                      <span>{status.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            <DatePicker
              isRequired
              label="Data de Vencimento"
              value={formData.dataVencimento}
              onChange={(date) =>
                setFormData({ ...formData, dataVencimento: date })
              }
            />

            {formData.status === "PAGA" && (
              <DatePicker
                label="Data de Pagamento"
                value={formData.dataPagamento}
                onChange={(date) =>
                  setFormData({ ...formData, dataPagamento: date })
                }
              />
            )}

            <Input
              label="Forma de Pagamento"
              placeholder="Ex: PIX, Transferência, Boleto"
              value={formData.formaPagamento}
              onChange={(e) =>
                setFormData({ ...formData, formaPagamento: e.target.value })
              }
            />

            <Textarea
              label="Descrição"
              placeholder="Descrição opcional da parcela"
              rows={3}
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
            />

            {/* Validação da Conta - apenas se contrato selecionado */}
            {formData.contratoId && (
              <div className="space-y-4">
                <Divider />
                <ValidacaoContaPrincipal
                  contratoId={formData.contratoId}
                  onContaValidada={setContaValida}
                />
              </div>
            )}

            {/* Dados Bancários - apenas se contrato selecionado e valor > 0 */}
            {formData.contratoId && formData.valor > 0 && contaValida && (
              <div className="space-y-4">
                <Divider />
                <DadosBancariosParcela
                  contratoId={formData.contratoId}
                  valor={formData.valor}
                  descricao={formData.descricao || formData.titulo || "Pagamento de parcela"}
                  vencimento={formData.dataVencimento}
                  parcelaId={editingId || undefined}
                />
              </div>
            )}

            {/* Aviso se conta inválida */}
            {formData.contratoId && formData.valor > 0 && contaValida === false && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircleIcon className="h-5 w-5 text-danger" />
                  <span className="text-sm font-medium text-danger-700">
                    Conta Bancária Inválida
                  </span>
                </div>
                <p className="text-sm text-danger-600">
                  A conta bancária do contrato não passou na validação. 
                  Corrija os problemas antes de prosseguir com o pagamento.
                </p>
              </div>
            )}

            {/* Comprovante de Pagamento - apenas para parcelas existentes */}
            {editingId && (
              <div className="space-y-4">
                <Divider />
                <ComprovantePagamentoUpload
                  parcelaId={editingId}
                  readonly={formData.status === "PAGA"}
                />
              </div>
            )}

            {!editingId && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Gerar Parcelas Automaticamente
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Crie múltiplas parcelas baseadas nos valores informados
                </p>
                <Button
                  color="primary"
                  isLoading={loading}
                  startContent={<RefreshCwIcon size={16} />}
                  variant="flat"
                  onPress={handleGerarAutomaticamente}
                >
                  Gerar 12 Parcelas
                </Button>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseModal}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={loading} onPress={handleSubmit}>
              {editingId ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
