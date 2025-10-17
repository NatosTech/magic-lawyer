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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Textarea,
  Tabs,
  Tab,
  DateRangePicker,
  Switch,
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
  TrendingUpIcon,
  DollarSignIcon,
  UsersIcon,
  FileTextIcon,
  CreditCardIcon,
  ArrowUpDownIcon,
  ShieldIcon,
  ChevronDownIcon,
  SettingsIcon,
  CalendarDaysIcon,
  HashIcon,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

import {
  useParcelasContrato,
  useDashboardParcelas,
  useStatusParcelas,
  useProcessosComParcelas,
} from "@/app/hooks/use-parcelas-contrato";
import { useContratosComParcelas } from "@/app/hooks/use-contratos";
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
import {
  ContratoParcela,
  ContratoParcelaStatus,
  Contrato,
  Cliente,
  Advogado,
  Usuario,
} from "@/app/generated/prisma";

interface ProcessoComParcelas {
  id: string;
  numero: string;
  titulo: string;
  _count: {
    contratos: number;
  };
}

interface ParcelaFormData {
  contratoId: string;
  numeroParcela: number;
  titulo?: string;
  descricao?: string;
  valor: number;
  dataVencimento: Date;
  status: ContratoParcelaStatus;
  formaPagamento?: string;
  dataPagamento?: Date;
}

type ParcelaComContrato = ContratoParcela & {
  contrato: Contrato & {
    cliente: Cliente;
    advogadoResponsavel?: Advogado & {
      usuario: Usuario;
    };
  };
};

export default function ParcelasContratoPage() {
  // Estados
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    contratoId?: string;
    status?: ContratoParcelaStatus;
    processoId?: string;
    valorMinimo?: number;
    valorMaximo?: number;
    dataVencimentoInicio?: Date;
    dataVencimentoFim?: Date;
    formaPagamento?: string;
    apenasVencidas?: boolean;
  }>({});
  const [contaValida, setContaValida] = useState<boolean | null>(null);
  const [filtrosAvancados, setFiltrosAvancados] = useState(false);

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
  const { contratos, isLoading: loadingContratos } = useContratosComParcelas();
  const { processos, isLoading: loadingProcessos } = useProcessosComParcelas();

  // Funções auxiliares
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formasPagamento = [
    { key: "PIX", label: "PIX" },
    { key: "TED", label: "TED" },
    { key: "BOLETO", label: "Boleto" },
    { key: "DINHEIRO", label: "Dinheiro" },
    { key: "CARTAO", label: "Cartão" },
    { key: "CHEQUE", label: "Cheque" },
  ];

  const handleLimparFiltros = () => {
    setFilters({});
    setFiltrosAvancados(false);
  };

  // Funções
  const handleContratoChange = (contratoId: string) => {
    const contratoSelecionado = contratos?.find((c) => c.id === contratoId);

    if (contratoSelecionado) {
      setFormData({
        ...formData,
        contratoId,
        valor: contratoSelecionado.valorDisponivel || 0,
      });
    } else {
      setFormData({
        ...formData,
        contratoId,
        valor: 0,
      });
    }
  };

  const getContratoSelecionado = () => {
    return contratos?.find((c) => c.id === formData.contratoId);
  };

  const handleOpenModal = (parcela?: ParcelaComContrato) => {
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

      // Validar se o valor não excede o disponível no contrato
      const contratoSelecionado = getContratoSelecionado();

      if (
        contratoSelecionado &&
        formData.valor > contratoSelecionado.valorDisponivel
      ) {
        toast.error(
          `Valor da parcela (${formatCurrency(formData.valor)}) não pode ser maior que o valor disponível no contrato (${formatCurrency(contratoSelecionado.valorDisponivel)})`,
        );

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

  const getStatusIcon = (status: ContratoParcelaStatus) => {
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

  const getStatusColor = (status: ContratoParcelaStatus) => {
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const isVencida = (
    dataVencimento: Date | string,
    status: ContratoParcelaStatus,
  ) => {
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
        <div className="flex justify-center py-8">
          <Spinner color="primary" size="lg" />
        </div>
      ) : (
        <Card className="border border-white/10 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-xl overflow-hidden">
          <CardHeader className="relative pb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 opacity-50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
                <ReceiptIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Dashboard de Parcelas
                </h2>
                <p className="text-sm text-primary-300">
                  Visão geral das parcelas de contratos
                </p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total de Parcelas */}
              <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-400/30 transition-colors">
                    <ReceiptIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h5 className="font-semibold text-white">
                    Total de Parcelas
                  </h5>
                </div>
                <p className="text-2xl font-bold text-blue-400 mb-1">
                  {dashboard?.totalParcelas || 0}
                </p>
                <p className="text-sm text-blue-300">
                  Todas as parcelas cadastradas
                </p>
              </div>

              {/* Pendentes */}
              <div className="group p-4 rounded-xl bg-gradient-to-br from-warning-500/10 to-warning-600/5 border border-warning-500/20 hover:border-warning-400/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-warning-500/20 group-hover:bg-warning-400/30 transition-colors">
                    <ClockIcon className="w-5 h-5 text-warning-400" />
                  </div>
                  <h5 className="font-semibold text-white">Pendentes</h5>
                </div>
                <p className="text-2xl font-bold text-warning-400 mb-1">
                  {dashboard?.parcelasPendentes || 0}
                </p>
                <p className="text-sm text-warning-300">Aguardando pagamento</p>
              </div>

              {/* Pagas */}
              <div className="group p-4 rounded-xl bg-gradient-to-br from-success-500/10 to-success-600/5 border border-success-500/20 hover:border-success-400/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-success-500/20 group-hover:bg-success-400/30 transition-colors">
                    <CheckCircleIcon className="w-5 h-5 text-success-400" />
                  </div>
                  <h5 className="font-semibold text-white">Pagas</h5>
                </div>
                <p className="text-2xl font-bold text-success-400 mb-1">
                  {dashboard?.parcelasPagas || 0}
                </p>
                <p className="text-sm text-success-300">Parcelas quitadas</p>
              </div>

              {/* Atrasadas */}
              <div className="group p-4 rounded-xl bg-gradient-to-br from-danger-500/10 to-danger-600/5 border border-danger-500/20 hover:border-danger-400/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-danger-500/20 group-hover:bg-danger-400/30 transition-colors">
                    <AlertTriangleIcon className="w-5 h-5 text-danger-400" />
                  </div>
                  <h5 className="font-semibold text-white">Atrasadas</h5>
                </div>
                <p className="text-2xl font-bold text-danger-400 mb-1">
                  {dashboard?.parcelasAtrasadas || 0}
                </p>
                <p className="text-sm text-danger-300">Parcelas vencidas</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filtros Avançados */}
      <Card className="border-default-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <FilterIcon className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-default-700">
                  Filtros Inteligentes
                </h3>
                <p className="text-sm text-default-500">
                  Encontre exatamente o que você procura
                </p>
              </div>
            </div>
            <Button
              color="primary"
              size="sm"
              startContent={
                filtrosAvancados ? (
                  <ChevronDownIcon size={16} />
                ) : (
                  <SettingsIcon size={16} />
                )
              }
              variant="flat"
              onPress={() => setFiltrosAvancados(!filtrosAvancados)}
            >
              {filtrosAvancados ? "Simplificar" : "Avançado"}
            </Button>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {/* Filtros Básicos */}
          <div className="flex flex-wrap gap-4 items-end mb-4">
            <Select
              className="max-w-xs"
              isLoading={loadingProcessos}
              label="Processo"
              placeholder="Selecione um processo"
              selectedKeys={filters.processoId ? [filters.processoId] : []}
              startContent={
                <FileTextIcon className="text-default-400" size={16} />
              }
              variant="bordered"
              onSelectionChange={(keys) => {
                const processoId = Array.from(keys)[0] as string;

                setFilters({ ...filters, processoId: processoId || undefined });
              }}
            >
              {processos.map((processo: ProcessoComParcelas) => (
                <SelectItem
                  key={processo.id}
                  textValue={`${processo.numero} - ${processo.titulo}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{processo.numero}</span>
                    <span className="text-xs text-default-500 truncate max-w-[200px]">
                      {processo.titulo}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </Select>

            <Select
              className="max-w-xs"
              label="Status"
              placeholder="Todos os status"
              selectedKeys={filters.status ? [filters.status] : []}
              startContent={
                <ArrowUpDownIcon className="text-default-400" size={16} />
              }
              variant="bordered"
              onSelectionChange={(keys) => {
                const status = Array.from(keys)[0] as ContratoParcelaStatus;

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
              className="font-medium"
              color="primary"
              startContent={<RefreshCwIcon size={16} />}
              variant="flat"
              onPress={handleLimparFiltros}
            >
              Limpar
            </Button>
          </div>

          {/* Filtros Avançados */}
          <AnimatePresence>
            {filtrosAvancados && (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                className="border-t border-default-200 pt-4 overflow-hidden"
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <motion.div
                  animate={{ y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial={{ y: -20 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {/* Filtro de Valor */}
                  <Card className="border-default-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <DollarSignIcon className="text-green-600" size={14} />
                        <span className="text-xs font-medium">
                          Faixa de Valor
                        </span>
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0 space-y-2">
                      <Input
                        label="Valor mínimo"
                        placeholder="Ex: 1000"
                        size="sm"
                        startContent={
                          <DollarSignIcon
                            className="text-default-400"
                            size={12}
                          />
                        }
                        type="number"
                        value={filters.valorMinimo?.toString() || ""}
                        variant="bordered"
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            valorMinimo: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                      <Input
                        label="Valor máximo"
                        placeholder="Ex: 5000"
                        size="sm"
                        startContent={
                          <DollarSignIcon
                            className="text-default-400"
                            size={12}
                          />
                        }
                        type="number"
                        value={filters.valorMaximo?.toString() || ""}
                        variant="bordered"
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            valorMaximo: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </CardBody>
                  </Card>

                  {/* Filtro de Data */}
                  <Card className="border-default-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="text-blue-600" size={14} />
                        <span className="text-xs font-medium">
                          Data de Vencimento
                        </span>
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <DateRangePicker
                        label="Período de vencimento"
                        placeholder="Selecione o período"
                        size="sm"
                        startContent={
                          <CalendarDaysIcon
                            className="text-default-400"
                            size={12}
                          />
                        }
                        variant="bordered"
                        onChange={(range) => {
                          if (range && range.start && range.end) {
                            setFilters({
                              ...filters,
                              dataVencimentoInicio: new Date(
                                range.start.toString(),
                              ),
                              dataVencimentoFim: new Date(range.end.toString()),
                            });
                          } else {
                            setFilters({
                              ...filters,
                              dataVencimentoInicio: undefined,
                              dataVencimentoFim: undefined,
                            });
                          }
                        }}
                      />
                    </CardBody>
                  </Card>

                  {/* Filtro de Forma de Pagamento */}
                  <Card className="border-default-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="text-purple-600" size={14} />
                        <span className="text-xs font-medium">
                          Forma de Pagamento
                        </span>
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <Select
                        label="Forma de pagamento"
                        placeholder="Todas as formas"
                        selectedKeys={
                          filters.formaPagamento ? [filters.formaPagamento] : []
                        }
                        size="sm"
                        startContent={
                          <CreditCardIcon
                            className="text-default-400"
                            size={12}
                          />
                        }
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const forma = Array.from(keys)[0] as string;

                          setFilters({
                            ...filters,
                            formaPagamento: forma || undefined,
                          });
                        }}
                      >
                        {formasPagamento.map((forma) => (
                          <SelectItem key={forma.key} textValue={forma.label}>
                            {forma.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </CardBody>
                  </Card>

                  {/* Filtros Especiais */}
                  <div className="mt-4 flex flex-wrap gap-3 items-center col-span-full">
                    <Switch
                      isSelected={filters.apenasVencidas || false}
                      size="sm"
                      onValueChange={(value) =>
                        setFilters({ ...filters, apenasVencidas: value })
                      }
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon
                          className="text-orange-600"
                          size={14}
                        />
                        <span className="text-xs">
                          Apenas parcelas vencidas
                        </span>
                      </div>
                    </Switch>

                    <Chip
                      color="primary"
                      size="sm"
                      startContent={<HashIcon size={10} />}
                      variant="flat"
                    >
                      <span className="text-xs">
                        {parcelas.length} resultado
                        {parcelas.length !== 1 ? "s" : ""}
                      </span>
                    </Chip>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>

      {/* Lista de Parcelas */}
      <Card className="shadow-lg border-none">
        <CardHeader className="border-b border-default-200">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <ReceiptIcon className="text-blue-600" size={16} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-default-800">
                  Lista de Parcelas
                </h2>
                <p className="text-xs text-default-600">
                  Gerencie todas as parcelas dos contratos
                </p>
              </div>
            </div>
            <Chip
              color="primary"
              size="sm"
              startContent={<ReceiptIcon size={12} />}
              variant="flat"
            >
              <span className="text-xs">{parcelas.length} parcelas</span>
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner color="primary" size="lg" />
              <p className="text-default-500 mt-4">Carregando parcelas...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parcelas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-default-100 to-default-50 rounded-2xl p-8 border border-default-200">
                    <ReceiptIcon
                      className="mx-auto text-default-300 mb-4"
                      size={48}
                    />
                    <h3 className="text-lg font-bold text-default-700 mb-2">
                      Nenhuma parcela encontrada
                    </h3>
                    <p className="text-sm text-default-500 mb-6 max-w-md mx-auto">
                      Comece criando sua primeira parcela para gerenciar os
                      pagamentos dos contratos
                    </p>
                    <Button
                      className="font-semibold"
                      color="primary"
                      size="md"
                      startContent={<PlusIcon size={16} />}
                      onPress={() => handleOpenModal()}
                    >
                      Criar Primeira Parcela
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {parcelas.map(
                    (parcela: ParcelaComContrato, index: number) => (
                      <Card
                        key={parcela.id}
                        className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      >
                        <CardBody className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            {/* Cliente e Contrato */}
                            <div className="lg:col-span-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-2 rounded-xl">
                                  <UsersIcon
                                    className="text-primary-600"
                                    size={16}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-default-800 text-base truncate">
                                    {parcela.contrato.cliente.nome}
                                  </h4>
                                  <p className="text-xs text-default-500 truncate">
                                    {parcela.contrato.advogadoResponsavel
                                      ?.usuario
                                      ? `${parcela.contrato.advogadoResponsavel.usuario.firstName} ${parcela.contrato.advogadoResponsavel.usuario.lastName}`
                                      : "Sem advogado responsável"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Parcela */}
                            <div className="lg:col-span-2">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-secondary-100 to-secondary-200 p-1.5 rounded-lg">
                                  <FileTextIcon
                                    className="text-secondary-600"
                                    size={14}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-default-800 text-sm">
                                    {parcela.titulo ||
                                      `Parcela ${parcela.numeroParcela}`}
                                  </p>
                                  {parcela.descricao && (
                                    <p className="text-xs text-default-500 truncate max-w-[200px]">
                                      {parcela.descricao}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Valor */}
                            <div className="lg:col-span-2">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-success-100 to-success-200 p-1.5 rounded-lg">
                                  <DollarSignIcon
                                    className="text-success-600"
                                    size={14}
                                  />
                                </div>
                                <div>
                                  <p className="font-bold text-success-700 text-base">
                                    {formatCurrency(Number(parcela.valor))}
                                  </p>
                                  <p className="text-xs text-success-600">
                                    Valor da parcela
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Vencimento */}
                            <div className="lg:col-span-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg ${isVencida(parcela.dataVencimento, parcela.status) ? "bg-gradient-to-br from-danger-100 to-danger-200" : "bg-gradient-to-br from-warning-100 to-warning-200"}`}
                                >
                                  <CalendarIcon
                                    className={`${isVencida(parcela.dataVencimento, parcela.status) ? "text-danger-600" : "text-warning-600"}`}
                                    size={16}
                                  />
                                </div>
                                <div>
                                  <p
                                    className={`font-semibold ${isVencida(parcela.dataVencimento, parcela.status) ? "text-danger-600" : "text-default-800"}`}
                                  >
                                    {formatDate(parcela.dataVencimento)}
                                  </p>
                                  {isVencida(
                                    parcela.dataVencimento,
                                    parcela.status,
                                  ) ? (
                                    <p className="text-xs text-danger-500 font-medium">
                                      Vencida
                                    </p>
                                  ) : (
                                    <p className="text-xs text-warning-600">
                                      Data limite
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="lg:col-span-2">
                              <Chip
                                className="font-semibold text-sm"
                                color={getStatusColor(parcela.status)}
                                size="lg"
                                startContent={getStatusIcon(parcela.status)}
                                variant="flat"
                              >
                                {
                                  statusList.find(
                                    (s) => s.value === parcela.status,
                                  )?.label
                                }
                              </Chip>
                            </div>

                            {/* Ações */}
                            <div className="lg:col-span-1">
                              <div className="flex justify-end">
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      className="font-semibold min-w-[100px]"
                                      color="primary"
                                      size="sm"
                                      startContent={
                                        <ArrowUpDownIcon size={16} />
                                      }
                                      variant="flat"
                                    >
                                      Ações
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu
                                    aria-label="Ações da parcela"
                                    variant="flat"
                                  >
                                    <DropdownItem
                                      key="view"
                                      className="text-default-700"
                                      startContent={<EyeIcon size={16} />}
                                      onPress={() => handleOpenModal(parcela)}
                                    >
                                      Ver Detalhes
                                    </DropdownItem>
                                    <DropdownItem
                                      key="edit"
                                      className="text-primary"
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
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Criação/Edição com Tabs */}
      <Modal
        isOpen={modalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ReceiptIcon className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {editingId ? "Editar Parcela" : "Nova Parcela"}
                </h3>
                <p className="text-sm text-default-500">
                  Complete as informações da parcela
                </p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="px-0">
            <Tabs
              aria-label="Formulário de parcela"
              classNames={{
                tabList:
                  "gap-8 w-full relative rounded-none p-6 pb-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-4 h-12",
                tabContent:
                  "group-data-[selected=true]:text-primary font-medium",
                panel: "pt-6",
              }}
              color="primary"
              variant="underlined"
            >
              <Tab
                key="basico"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                      <FileTextIcon
                        className="text-blue-600 dark:text-blue-400"
                        size={16}
                      />
                    </div>
                    <span>Básico</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <FileTextIcon size={20} />
                      Informações Básicas
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        isRequired
                        isLoading={loadingContratos}
                        label="Contrato"
                        placeholder="Selecione um contrato"
                        selectedKeys={
                          formData.contratoId ? [formData.contratoId] : []
                        }
                        startContent={
                          <FileTextIcon
                            className="text-default-400"
                            size={16}
                          />
                        }
                        onSelectionChange={(keys) => {
                          const contratoId = Array.from(keys)[0] as string;

                          if (contratoId) {
                            handleContratoChange(contratoId);
                          }
                        }}
                      >
                        {(contratos || []).map((contrato) => (
                          <SelectItem
                            key={contrato.id}
                            textValue={contrato.titulo}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {contrato.titulo}
                              </span>
                              <span className="text-sm text-default-500">
                                {contrato.cliente.nome} -{" "}
                                {formatCurrency(contrato.valorDisponivel)}{" "}
                                disponível
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        isRequired
                        label="Número da Parcela"
                        min="1"
                        placeholder="1"
                        startContent={
                          <TrendingUpIcon
                            className="text-default-400"
                            size={16}
                          />
                        }
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

                    <div className="mt-4">
                      <Input
                        label="Título"
                        placeholder="Ex: Parcela 1/12"
                        startContent={
                          <FileTextIcon
                            className="text-default-400"
                            size={16}
                          />
                        }
                        value={formData.titulo}
                        onChange={(e) =>
                          setFormData({ ...formData, titulo: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab
                key="valores"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-green-100 dark:bg-green-900">
                      <DollarSignIcon
                        className="text-green-600 dark:text-green-400"
                        size={16}
                      />
                    </div>
                    <span>Valores</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700 dark:text-green-300">
                      <DollarSignIcon size={20} />
                      Valores e Status
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input
                          isRequired
                          className="font-semibold"
                          label="Valor"
                          max={
                            getContratoSelecionado()?.valorDisponivel ||
                            undefined
                          }
                          placeholder="0,00"
                          startContent={
                            <DollarSignIcon
                              className="text-green-500"
                              size={16}
                            />
                          }
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
                        {getContratoSelecionado() && (
                          <div className="text-xs space-y-1">
                            <p className="text-green-600 flex items-center gap-1">
                              <DollarSignIcon size={12} />
                              <strong>Valor disponível:</strong>{" "}
                              {formatCurrency(
                                getContratoSelecionado().valorDisponivel,
                              )}
                            </p>
                            <p className="text-blue-600 flex items-center gap-1">
                              <FileTextIcon size={12} />
                              Total do contrato:{" "}
                              {formatCurrency(getContratoSelecionado().valor)}
                            </p>
                            <p className="text-orange-600 flex items-center gap-1">
                              <ReceiptIcon size={12} />
                              Valor comprometido (pendentes):{" "}
                              {formatCurrency(
                                getContratoSelecionado().valorComprometido || 0,
                              )}
                            </p>
                            <p className="text-gray-600 flex items-center gap-1">
                              <ReceiptIcon size={12} />
                              Parcelas existentes:{" "}
                              {getContratoSelecionado().totalParcelas} (
                              {formatCurrency(
                                getContratoSelecionado().valorTotalParcelas,
                              )}
                              )
                            </p>
                          </div>
                        )}
                      </div>
                      <Select
                        isRequired
                        label="Status"
                        placeholder="Selecione o status"
                        selectedKeys={[formData.status]}
                        startContent={
                          <TrendingUpIcon
                            className="text-default-400"
                            size={16}
                          />
                        }
                        onSelectionChange={(keys) => {
                          const status = Array.from(
                            keys,
                          )[0] as ContratoParcelaStatus;

                          setFormData({ ...formData, status });
                        }}
                      >
                        {statusList.map((status) => (
                          <SelectItem
                            key={status.value}
                            textValue={status.label}
                          >
                            <div className="flex items-center gap-2">
                              <span>{status.icon}</span>
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab
                key="datas"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-orange-100 dark:bg-orange-900">
                      <CalendarIcon
                        className="text-orange-600 dark:text-orange-400"
                        size={16}
                      />
                    </div>
                    <span>Datas</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-700 dark:text-orange-300">
                      <CalendarIcon size={20} />
                      Datas e Pagamento
                    </h3>

                    <div className="space-y-4">
                      <Input
                        isRequired
                        label="Data de Vencimento"
                        startContent={
                          <CalendarIcon className="text-orange-500" size={16} />
                        }
                        type="date"
                        value={
                          formData.dataVencimento.toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dataVencimento: new Date(e.target.value),
                          })
                        }
                      />

                      {formData.status === "PAGA" && (
                        <Input
                          label="Data de Pagamento"
                          startContent={
                            <CheckCircleIcon
                              className="text-success-500"
                              size={16}
                            />
                          }
                          type="date"
                          value={
                            formData.dataPagamento
                              ? formData.dataPagamento
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dataPagamento: e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      )}

                      <Input
                        label="Forma de Pagamento"
                        placeholder="Ex: PIX, Transferência, Boleto"
                        startContent={
                          <CreditCardIcon
                            className="text-default-400"
                            size={16}
                          />
                        }
                        value={formData.formaPagamento}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            formaPagamento: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab
                key="adicional"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900">
                      <FileTextIcon
                        className="text-purple-600 dark:text-purple-400"
                        size={16}
                      />
                    </div>
                    <span>Adicional</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <FileTextIcon size={20} />
                      Informações Adicionais
                    </h3>

                    <Textarea
                      classNames={{ input: "resize-none" }}
                      label="Descrição"
                      placeholder="Descrição opcional da parcela"
                      rows={4}
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                    />

                    {!editingId && (
                      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-md bg-primary/10">
                            <RefreshCwIcon className="text-primary" size={16} />
                          </div>
                          <div>
                            <p className="font-medium">
                              Gerar Parcelas Automaticamente
                            </p>
                            <p className="text-sm text-default-500">
                              Crie múltiplas parcelas baseadas nos valores
                              informados
                            </p>
                          </div>
                        </div>
                        <Button
                          color="primary"
                          isLoading={loading}
                          startContent={
                            !loading ? <RefreshCwIcon size={16} /> : undefined
                          }
                          variant="flat"
                          onPress={handleGerarAutomaticamente}
                        >
                          {loading ? "Gerando..." : "Gerar 12 Parcelas"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Tab>

              {/* Aba de Integração - apenas se contrato selecionado */}
              {formData.contratoId && (
                <Tab
                  key="integracao"
                  title={
                    <div className="flex items-center space-x-3">
                      <div className="p-1 rounded-md bg-cyan-100 dark:bg-cyan-900">
                        <CreditCardIcon
                          className="text-cyan-600 dark:text-cyan-400"
                          size={16}
                        />
                      </div>
                      <span>Integração</span>
                    </div>
                  }
                >
                  <div className="px-6 pb-6 space-y-6">
                    {/* Validação da Conta */}
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                        <ShieldIcon className="text-cyan-600" size={20} />
                        Validação da Conta Bancária
                      </h3>
                      <ValidacaoContaPrincipal
                        contratoId={formData.contratoId}
                        onContaValidada={setContaValida}
                      />
                    </div>

                    {/* Dados Bancários - apenas se valor > 0 e conta válida */}
                    {formData.valor > 0 && contaValida && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CreditCardIcon size={20} />
                          Dados Bancários para Pagamento
                        </h3>
                        <DadosBancariosParcela
                          contratoId={formData.contratoId}
                          descricao={
                            formData.descricao ||
                            formData.titulo ||
                            "Pagamento de parcela"
                          }
                          parcelaId={editingId || undefined}
                          valor={formData.valor}
                          vencimento={formData.dataVencimento}
                        />
                      </div>
                    )}

                    {/* Aviso se conta inválida */}
                    {formData.valor > 0 && contaValida === false && (
                      <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircleIcon className="h-5 w-5 text-danger" />
                          <span className="text-sm font-medium text-danger-700">
                            Conta Bancária Inválida
                          </span>
                        </div>
                        <p className="text-sm text-danger-600">
                          A conta bancária do contrato não passou na validação.
                          Corrija os problemas antes de prosseguir com o
                          pagamento.
                        </p>
                      </div>
                    )}

                    {/* Comprovante de Pagamento - apenas para parcelas existentes */}
                    {editingId && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                          <FileTextIcon size={20} />
                          Comprovante de Pagamento
                        </h3>
                        <ComprovantePagamentoUpload
                          parcelaId={editingId}
                          readonly={formData.status === "PAGA"}
                        />
                      </div>
                    )}
                  </div>
                </Tab>
              )}
            </Tabs>
          </ModalBody>

          <ModalFooter className="px-6">
            <Button variant="light" onPress={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={loading}
              startContent={
                !loading ? <CheckCircleIcon size={16} /> : undefined
              }
              onPress={handleSubmit}
            >
              {editingId ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
