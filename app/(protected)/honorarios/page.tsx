"use client";

import { useMemo, useState } from "react";
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
  Divider,
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
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalculatorIcon,
  DollarSignIcon,
  FilterIcon,
  CreditCardIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  useHonorariosContratuais,
  useTiposHonorario,
} from "@/app/hooks/use-honorarios-contratuais";
import { useContratosComParcelas } from "@/app/hooks/use-contratos";
import { useDadosBancariosAtivos } from "@/app/hooks/use-dados-bancarios";
import {
  createHonorarioContratual,
  updateHonorarioContratual,
  deleteHonorarioContratual,
  calcularValorHonorario,
} from "@/app/actions/honorarios-contratuais";
import { DadosBancariosHonorario } from "@/components/dados-bancarios-honorario";
import { title, subtitle } from "@/components/primitives";
import {
  ContratoHonorario,
  ContratoHonorarioTipo,
  Contrato,
  Cliente,
  Advogado,
  Usuario,
} from "@/app/generated/prisma";

const TIPO_CONTA_BANCARIA_LABELS: Record<string, string> = {
  CORRENTE: "Conta Corrente",
  POUPANCA: "Conta Poupança",
  SALARIO: "Conta Salário",
  INVESTIMENTO: "Conta Investimento",
};

interface HonorarioFormData {
  contratoId: string;
  dadosBancariosId?: string;
  tipo: ContratoHonorarioTipo;
  valorFixo?: number;
  percentualSucesso?: number;
  valorMinimoSucesso?: number;
  baseCalculo?: string;
  observacoes?: string;
}

type HonorarioComContrato = ContratoHonorario & {
  contrato: Contrato & {
    cliente: Cliente;
    advogadoResponsavel:
      | (Advogado & {
          usuario: Usuario;
        })
      | null;
  };
};

export default function HonorariosContratuaisPage() {
  // Estados
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cobrancaModalOpen, setCobrancaModalOpen] = useState(false);
  const [honorarioSelecionado, setHonorarioSelecionado] = useState<
    string | null
  >(null);
  const [filters, setFilters] = useState<{
    contratoId?: string;
    tipo?: ContratoHonorarioTipo;
  }>({});

  // Formulário
  const [formData, setFormData] = useState<HonorarioFormData>({
    contratoId: "",
    dadosBancariosId: "",
    tipo: "FIXO",
    valorFixo: undefined,
    percentualSucesso: undefined,
    valorMinimoSucesso: undefined,
    baseCalculo: "",
    observacoes: "",
  });

  // Hooks
  const { honorarios, isLoading, mutate } = useHonorariosContratuais(filters);
  const { tipos } = useTiposHonorario();
  const { contratos, isLoading: loadingContratos } = useContratosComParcelas();
  const { dadosBancarios, isLoading: loadingDadosBancarios } =
    useDadosBancariosAtivos();

  const contaOptions = useMemo(() => {
    const dadosOptions =
      dadosBancarios?.map((conta) => {
        const contaLabel = `${conta.banco?.nome ?? "Banco não informado"} - ${conta.agencia}/${conta.conta}`;
        const tipoContaLabel =
          TIPO_CONTA_BANCARIA_LABELS[conta.tipoContaBancaria] ??
          conta.tipoContaBancaria;
        const descriptionParts = [conta.titularNome, tipoContaLabel].filter(
          (part): part is string => Boolean(part),
        );

        if (conta.principal) {
          descriptionParts.push("Conta Principal");
        }

        return {
          id: conta.id,
          textValue: contaLabel,
          label: contaLabel,
          description: descriptionParts.join(" • "),
        };
      }) ?? [];

    return [
      {
        id: "",
        textValue: "Usar conta do contrato",
        label: "Usar conta do contrato",
        description: "Herda automaticamente a conta bancária do contrato",
      },
      ...dadosOptions,
    ];
  }, [dadosBancarios]);

  // Funções
  const handleContratoChange = (contratoId: string) => {
    const contratoSelecionado = contratos?.find((c) => c.id === contratoId);

    if (contratoSelecionado) {
      setFormData({
        ...formData,
        contratoId,
        // Se o contrato tem conta bancária, usar como padrão
        dadosBancariosId:
          contratoSelecionado.dadosBancariosId || formData.dadosBancariosId,
      });
    } else {
      setFormData({
        ...formData,
        contratoId,
      });
    }
  };

  const getContratoSelecionado = () => {
    return contratos?.find((c) => c.id === formData.contratoId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleOpenModal = (honorario?: HonorarioComContrato) => {
    if (honorario) {
      setEditingId(honorario.id);
      setFormData({
        contratoId: honorario.contratoId,
        dadosBancariosId: honorario.dadosBancariosId || "",
        tipo: honorario.tipo,
        valorFixo: Number(honorario.valorFixo) || undefined,
        percentualSucesso: Number(honorario.percentualSucesso) || undefined,
        valorMinimoSucesso: Number(honorario.valorMinimoSucesso) || undefined,
        baseCalculo: honorario.baseCalculo || "",
        observacoes: honorario.observacoes || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        contratoId: "",
        dadosBancariosId: "",
        tipo: "FIXO",
        valorFixo: undefined,
        percentualSucesso: undefined,
        valorMinimoSucesso: undefined,
        baseCalculo: "",
        observacoes: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({
      contratoId: "",
      dadosBancariosId: "",
      tipo: "FIXO",
      valorFixo: undefined,
      percentualSucesso: undefined,
      valorMinimoSucesso: undefined,
      baseCalculo: "",
      observacoes: "",
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validar campos obrigatórios
      if (!formData.contratoId) {
        toast.error("Selecione um contrato");

        return;
      }

      if (formData.tipo === "FIXO" && !formData.valorFixo) {
        toast.error("Valor fixo é obrigatório");

        return;
      }

      if (
        formData.tipo === "SUCESSO" &&
        (!formData.percentualSucesso || !formData.valorMinimoSucesso)
      ) {
        toast.error("Percentual e valor mínimo são obrigatórios");

        return;
      }

      if (
        formData.tipo === "HIBRIDO" &&
        (!formData.valorFixo || !formData.percentualSucesso)
      ) {
        toast.error("Valor fixo e percentual são obrigatórios");

        return;
      }

      let result;

      if (editingId) {
        result = await updateHonorarioContratual(editingId, formData);
      } else {
        result = await createHonorarioContratual(formData);
      }

      if (result.success) {
        toast.success(result.message || "Honorário salvo com sucesso!");
        mutate();
        handleCloseModal();
      } else {
        toast.error(result.error || "Erro ao salvar honorário");
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar honorário");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteHonorarioContratual(id);

      if (result.success) {
        toast.success("Honorário removido com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao remover honorário");
      }
    } catch (error) {
      toast.error("Erro inesperado ao remover honorário");
    } finally {
      setLoading(false);
    }
  };

  const handleCalcular = async (honorario: HonorarioComContrato) => {
    try {
      setLoading(true);

      // Para demonstração, usar valor base de R$ 100.000
      const valorBase = 100000;
      const result = await calcularValorHonorario(honorario.id, valorBase);

      if (result.success) {
        toast.success(`Valor calculado: ${result.data?.detalhes}`);
      } else {
        toast.error(result.error || "Erro ao calcular valor");
      }
    } catch (error) {
      toast.error("Erro inesperado ao calcular");
    } finally {
      setLoading(false);
    }
  };

  const handleCobrar = (honorario: HonorarioComContrato) => {
    setHonorarioSelecionado(honorario.id);
    setCobrancaModalOpen(true);
  };

  const getTipoIcon = (tipo: ContratoHonorarioTipo) => {
    switch (tipo) {
      case "FIXO":
        return "💰";
      case "SUCESSO":
        return "🎯";
      case "HIBRIDO":
        return "🔄";
      default:
        return "💰";
    }
  };

  const getTipoColor = (tipo: ContratoHonorarioTipo) => {
    switch (tipo) {
      case "FIXO":
        return "success";
      case "SUCESSO":
        return "warning";
      case "HIBRIDO":
        return "primary";
      default:
        return "default";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>
            Honorários Contratuais
          </h1>
          <p className={subtitle({ fullWidth: true })}>
            Gerencie os honorários dos contratos
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon size={20} />}
          onPress={() => handleOpenModal()}
        >
          Novo Honorário
        </Button>
      </div>

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
              label="Tipo de Honorário"
              placeholder="Todos os tipos"
              selectedKeys={filters.tipo ? [filters.tipo] : []}
              onSelectionChange={(keys) => {
                const tipo = Array.from(keys)[0] as ContratoHonorarioTipo;

                setFilters({ ...filters, tipo: tipo || undefined });
              }}
            >
              {tipos.map((tipo) => (
                <SelectItem key={tipo.value} textValue={tipo.label}>
                  <div className="flex items-center gap-2">
                    <span>{tipo.icon}</span>
                    <span>{tipo.label}</span>
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

      {/* Lista de Honorários */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Lista de Honorários</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table aria-label="Lista de honorários contratuais">
              <TableHeader>
                <TableColumn>TIPO</TableColumn>
                <TableColumn>CLIENTE</TableColumn>
                <TableColumn>ADVOGADO</TableColumn>
                <TableColumn>VALOR</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>AÇÕES</TableColumn>
              </TableHeader>
              <TableBody>
                {honorarios.map((honorario: HonorarioComContrato) => (
                  <TableRow key={honorario.id}>
                    <TableCell>
                      <Chip
                        color={getTipoColor(honorario.tipo)}
                        startContent={getTipoIcon(honorario.tipo)}
                        variant="flat"
                      >
                        {tipos.find((t) => t.value === honorario.tipo)?.label}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {honorario.contrato.cliente.nome}
                        </p>
                        <p className="text-sm text-gray-500">
                          {honorario.contrato.cliente.email || "Sem email"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {honorario.contrato.advogadoResponsavel?.usuario
                            ? `${honorario.contrato.advogadoResponsavel.usuario.firstName} ${honorario.contrato.advogadoResponsavel.usuario.lastName}`
                            : "Sem advogado responsável"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {honorario.contrato.advogadoResponsavel?.usuario
                            ?.email || "Sem email"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {honorario.tipo === "FIXO" && honorario.valorFixo && (
                          <p className="font-medium">
                            {formatCurrency(Number(honorario.valorFixo))}
                          </p>
                        )}
                        {honorario.tipo === "SUCESSO" && (
                          <div>
                            <p className="font-medium">
                              {Number(honorario.percentualSucesso || 0)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              Mín:{" "}
                              {formatCurrency(
                                Number(honorario.valorMinimoSucesso || 0),
                              )}
                            </p>
                          </div>
                        )}
                        {honorario.tipo === "HIBRIDO" && (
                          <div>
                            <p className="font-medium">
                              {formatCurrency(Number(honorario.valorFixo || 0))}
                            </p>
                            <p className="text-xs text-gray-500">
                              + {Number(honorario.percentualSucesso || 0)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip color="success" size="sm" variant="flat">
                        Ativo
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
                            onPress={() => handleOpenModal(honorario)}
                          >
                            Ver Detalhes
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<PencilIcon size={16} />}
                            onPress={() => handleOpenModal(honorario)}
                          >
                            Editar
                          </DropdownItem>
                          <DropdownItem
                            key="calculate"
                            startContent={<CalculatorIcon size={16} />}
                            onPress={() => handleCalcular(honorario)}
                          >
                            Calcular Valor
                          </DropdownItem>
                          <DropdownItem
                            key="charge"
                            startContent={<CreditCardIcon size={16} />}
                            onPress={() => handleCobrar(honorario)}
                          >
                            Cobrar Honorário
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<TrashIcon size={16} />}
                            onPress={() => handleDelete(honorario.id)}
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

          {honorarios.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <DollarSignIcon
                className="mx-auto text-gray-400 mb-4"
                size={48}
              />
              <p className="text-gray-500">Nenhum honorário encontrado</p>
              <Button
                className="mt-2"
                color="primary"
                variant="light"
                onPress={() => handleOpenModal()}
              >
                Criar Primeiro Honorário
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Criação/Edição */}
      <Modal isOpen={modalOpen} size="2xl" onClose={handleCloseModal}>
        <ModalContent>
          <ModalHeader>
            {editingId ? "Editar Honorário" : "Novo Honorário"}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                isRequired
                isLoading={loadingContratos}
                label="Contrato"
                placeholder="Selecione um contrato"
                selectedKeys={formData.contratoId ? [formData.contratoId] : []}
                startContent={
                  <CalculatorIcon className="text-default-400" size={16} />
                }
                onSelectionChange={(keys) => {
                  const contratoId = Array.from(keys)[0] as string;

                  if (contratoId) {
                    handleContratoChange(contratoId);
                  }
                }}
              >
                {(contratos || []).map((contrato) => (
                  <SelectItem key={contrato.id} textValue={contrato.titulo}>
                    <div className="flex flex-col">
                      <span className="font-medium">{contrato.titulo}</span>
                      <span className="text-sm text-default-500">
                        {contrato.cliente.nome} -{" "}
                        {formatCurrency(contrato.valor)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
              <Select
                isRequired
                label="Tipo de Honorário"
                placeholder="Selecione o tipo"
                selectedKeys={[formData.tipo]}
                onSelectionChange={(keys) => {
                  const tipo = Array.from(keys)[0] as ContratoHonorarioTipo;

                  setFormData({
                    ...formData,
                    tipo,
                    valorFixo: undefined,
                    percentualSucesso: undefined,
                    valorMinimoSucesso: undefined,
                  });
                }}
              >
                {tipos.map((tipo) => (
                  <SelectItem key={tipo.value} textValue={tipo.label}>
                    <div className="flex items-center gap-2">
                      <span>{tipo.icon}</span>
                      <div>
                        <p className="font-medium">{tipo.label}</p>
                        <p className="text-xs text-gray-500">
                          {tipo.description}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Select de Conta Bancária */}
            <Select
              isLoading={loadingDadosBancarios}
              items={contaOptions}
              label="Conta Bancária para Recebimento"
              placeholder="Selecione uma conta (opcional)"
              selectedKeys={
                formData.dadosBancariosId ? [formData.dadosBancariosId] : []
              }
              startContent={
                <DollarSignIcon className="text-default-400" size={16} />
              }
              onSelectionChange={(keys) => {
                const dadosBancariosId = Array.from(keys)[0] as string;

                setFormData({
                  ...formData,
                  dadosBancariosId: dadosBancariosId || "",
                });
              }}
            >
              {(item) => (
                <SelectItem key={item.id} textValue={item.textValue}>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-sm text-default-500">
                        {item.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              )}
            </Select>

            {/* Informações do Contrato Selecionado */}
            {getContratoSelecionado() && (
              <div className="bg-primary/5 rounded-lg border border-primary/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <CalculatorIcon className="text-primary" size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Informações do Contrato</p>
                    <p className="text-sm text-default-500">
                      Detalhes do contrato selecionado
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-primary-600 font-medium">Cliente</p>
                    <p className="text-default-800">
                      {getContratoSelecionado().cliente.nome}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary-600 font-medium">Valor Total</p>
                    <p className="text-default-800">
                      {formatCurrency(getContratoSelecionado().valor)}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary-600 font-medium">
                      Advogado Responsável
                    </p>
                    <p className="text-default-800">
                      {getContratoSelecionado().advogadoResponsavel?.usuario
                        ? `${getContratoSelecionado().advogadoResponsavel.usuario.firstName} ${getContratoSelecionado().advogadoResponsavel.usuario.lastName}`
                        : "Não definido"}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary-600 font-medium">
                      Conta Bancária
                    </p>
                    <p className="text-default-800">
                      {getContratoSelecionado().dadosBancarios
                        ? `${getContratoSelecionado().dadosBancarios.banco?.nome} - ${getContratoSelecionado().dadosBancarios.agencia}/${getContratoSelecionado().dadosBancarios.conta}`
                        : "Não configurada"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Divider />

            {/* Campos baseados no tipo */}
            {formData.tipo === "FIXO" && (
              <Input
                isRequired
                label="Valor Fixo"
                placeholder="0,00"
                startContent="R$"
                step="0.01"
                type="number"
                value={formData.valorFixo?.toString() || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valorFixo: parseFloat(e.target.value) || undefined,
                  })
                }
              />
            )}

            {formData.tipo === "SUCESSO" && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  endContent="%"
                  label="Percentual de Sucesso"
                  placeholder="0"
                  step="0.01"
                  type="number"
                  value={formData.percentualSucesso?.toString() || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      percentualSucesso:
                        parseFloat(e.target.value) || undefined,
                    })
                  }
                />
                <Input
                  isRequired
                  label="Valor Mínimo"
                  placeholder="0,00"
                  startContent="R$"
                  step="0.01"
                  type="number"
                  value={formData.valorMinimoSucesso?.toString() || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valorMinimoSucesso:
                        parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            )}

            {formData.tipo === "HIBRIDO" && (
              <div className="space-y-4">
                <Input
                  isRequired
                  label="Valor Fixo"
                  placeholder="0,00"
                  startContent="R$"
                  step="0.01"
                  type="number"
                  value={formData.valorFixo?.toString() || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valorFixo: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
                <Input
                  isRequired
                  endContent="%"
                  label="Percentual de Sucesso"
                  placeholder="0"
                  step="0.01"
                  type="number"
                  value={formData.percentualSucesso?.toString() || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      percentualSucesso:
                        parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            )}

            <Input
              label="Base de Cálculo"
              placeholder="Ex: Valor da causa, valor do acordo, etc."
              value={formData.baseCalculo || ""}
              onChange={(e) =>
                setFormData({ ...formData, baseCalculo: e.target.value })
              }
            />

            <Textarea
              label="Observações"
              placeholder="Observações adicionais sobre o honorário"
              rows={3}
              value={formData.observacoes || ""}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
            />
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

      {/* Modal de Cobrança */}
      <Modal
        isOpen={cobrancaModalOpen}
        size="5xl"
        onClose={() => {
          setCobrancaModalOpen(false);
          setHonorarioSelecionado(null);
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-primary" />
              <span>Cobrança de Honorário</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {honorarioSelecionado && (
              <DadosBancariosHonorario
                honorarioId={honorarioSelecionado}
                readonly={false}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setCobrancaModalOpen(false);
                setHonorarioSelecionado(null);
              }}
            >
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
