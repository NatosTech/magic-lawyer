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
  Switch,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CreditCardIcon,
  BuildingIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  FilterIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  SettingsIcon,
  HomeIcon,
  WalletIcon,
  ShieldIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useDadosBancarios, useTiposConta, useTiposContaBancaria, useTiposChavePix } from "@/app/hooks/use-dados-bancarios";
import { useBancosDisponiveis } from "@/app/hooks/use-bancos";
import { createDadosBancarios, updateDadosBancarios, deleteDadosBancarios } from "@/app/actions/dados-bancarios";
import { CepInput } from "@/components/cep-input";
import { type CepData } from "@/types/brazil";

type TipoConta = "PESSOA_FISICA" | "PESSOA_JURIDICA";
type TipoContaBancaria = "CORRENTE" | "POUPANCA" | "SALARIO" | "INVESTIMENTO";
type TipoChavePix = "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "ALEATORIA";

interface DadosBancariosFormData {
  usuarioId?: string;
  clienteId?: string;
  tipoConta: TipoConta;
  bancoCodigo: string;
  agencia: string;
  conta: string;
  digitoConta?: string;
  tipoContaBancaria: TipoContaBancaria;
  chavePix?: string;
  tipoChavePix?: TipoChavePix;
  titularNome: string;
  titularDocumento: string;
  titularEmail?: string;
  titularTelefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  principal: boolean;
  observacoes?: string;
}

export default function DadosBancariosPage() {
  // Estados
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");
  const [filters, setFilters] = useState<{
    ativo?: boolean;
    principal?: boolean;
  }>({});

  // Formulário
  const [formData, setFormData] = useState<DadosBancariosFormData>({
    tipoConta: "PESSOA_FISICA",
    bancoCodigo: "",
    agencia: "",
    conta: "",
    digitoConta: "",
    tipoContaBancaria: "CORRENTE",
    chavePix: "",
    tipoChavePix: "CPF",
    titularNome: "",
    titularDocumento: "",
    titularEmail: "",
    titularTelefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    principal: false,
    observacoes: "",
  });

  // Hooks
  const { dadosBancarios, isLoading, mutate } = useDadosBancarios(filters);
  const { bancos } = useBancosDisponiveis();
  const { tipos: tiposConta } = useTiposConta();
  const { tipos: tiposContaBancaria } = useTiposContaBancaria();
  const { tipos: tiposChavePix } = useTiposChavePix();

  // Funções
  const handleCepFound = (cepData: CepData) => {
    setFormData((prev) => ({
      ...prev,
      cep: cepData.cep,
      cidade: cepData.localidade,
      estado: cepData.uf,
      endereco: cepData.logradouro,
    }));
  };

  const handleOpenModal = (dados?: any) => {
    if (dados) {
      setEditingId(dados.id);
      setFormData({
        usuarioId: dados.usuarioId,
        clienteId: dados.clienteId,
        tipoConta: dados.tipoConta,
        bancoCodigo: dados.bancoCodigo,
        agencia: dados.agencia,
        conta: dados.conta,
        digitoConta: dados.digitoConta || "",
        tipoContaBancaria: dados.tipoContaBancaria,
        chavePix: dados.chavePix || "",
        tipoChavePix: dados.tipoChavePix || "CPF",
        titularNome: dados.titularNome,
        titularDocumento: dados.titularDocumento,
        titularEmail: dados.titularEmail || "",
        titularTelefone: dados.titularTelefone || "",
        endereco: dados.endereco || "",
        cidade: dados.cidade || "",
        estado: dados.estado || "",
        cep: dados.cep || "",
        principal: dados.principal,
        observacoes: dados.observacoes || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        tipoConta: "PESSOA_FISICA",
        bancoCodigo: "",
        agencia: "",
        conta: "",
        digitoConta: "",
        tipoContaBancaria: "CORRENTE",
        chavePix: "",
        tipoChavePix: "CPF",
        titularNome: "",
        titularDocumento: "",
        titularEmail: "",
        titularTelefone: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        principal: false,
        observacoes: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({
      tipoConta: "PESSOA_FISICA",
      bancoCodigo: "",
      agencia: "",
      conta: "",
      digitoConta: "",
      tipoContaBancaria: "CORRENTE",
      chavePix: "",
      tipoChavePix: "CPF",
      titularNome: "",
      titularDocumento: "",
      titularEmail: "",
      titularTelefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      principal: false,
      observacoes: "",
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Debug: Verificar dados do formulário
      console.log("🔍 DEBUG - Dados do formulário:", {
        bancoCodigo: formData.bancoCodigo,
        agencia: formData.agencia,
        conta: formData.conta,
        titularNome: formData.titularNome,
        titularDocumento: formData.titularDocumento,
        formDataCompleto: formData,
      });

      // Validar campos obrigatórios
      if (!formData.bancoCodigo || !formData.agencia || !formData.conta) {
        console.error("❌ ERRO - Campos bancários obrigatórios não preenchidos:", {
          bancoCodigo: formData.bancoCodigo,
          agencia: formData.agencia,
          conta: formData.conta,
        });

        if (!formData.bancoCodigo) {
          toast.error("Selecione um banco");
        } else if (!formData.agencia) {
          toast.error("Agência é obrigatória");
        } else if (!formData.conta) {
          toast.error("Conta é obrigatória");
        }
        return;
      }

      if (!formData.titularNome || !formData.titularDocumento) {
        console.error("❌ ERRO - Dados do titular obrigatórios não preenchidos:", {
          titularNome: formData.titularNome,
          titularDocumento: formData.titularDocumento,
        });

        if (!formData.titularNome) {
          toast.error("Nome do titular é obrigatório");
        } else if (!formData.titularDocumento) {
          toast.error("CPF/CNPJ do titular é obrigatório");
        }
        return;
      }

      let result;
      if (editingId) {
        result = await updateDadosBancarios(editingId, {
          ...formData,
          codigoBanco: formData.bancoCodigo,
        });
      } else {
        result = await createDadosBancarios({
          ...formData,
          codigoBanco: formData.bancoCodigo,
        });
      }

      if (result.success) {
        toast.success(result.message || "Dados bancários salvos com sucesso!");
        mutate();
        handleCloseModal();
      } else {
        toast.error(result.error || "Erro ao salvar dados bancários");
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar dados bancários");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteDadosBancarios(id);

      if (result.success) {
        toast.success("Dados bancários removidos com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao remover dados bancários");
      }
    } catch (error) {
      toast.error("Erro inesperado ao remover dados bancários");
    } finally {
      setLoading(false);
    }
  };

  const handleBancoChange = (bancoCodigo: string) => {
    setFormData({
      ...formData,
      bancoCodigo: bancoCodigo,
    });
  };

  const getTipoContaIcon = (tipo: TipoConta) => {
    return tipo === "PESSOA_FISICA" ? "👤" : "🏢";
  };

  const getTipoContaBancariaIcon = (tipo: TipoContaBancaria) => {
    const icons: Record<TipoContaBancaria, string> = {
      CORRENTE: "💳",
      POUPANCA: "🐷",
      SALARIO: "💰",
      INVESTIMENTO: "📈",
    };
    return icons[tipo] || "💳";
  };

  const formatDocumento = (documento: string) => {
    if (documento.length === 11) {
      return documento.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (documento.length === 14) {
      return documento.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return documento;
  };

  const formatTelefone = (telefone: string) => {
    if (telefone.length === 11) {
      return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (telefone.length === 10) {
      return telefone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return telefone;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCardIcon size={28} />
            Dados Bancários
          </h1>
          <p className="text-gray-600">Gerencie os dados bancários de usuários e clientes</p>
        </div>
        <Button color="primary" startContent={<PlusIcon size={20} />} onPress={() => handleOpenModal()}>
          Novo Dados Bancários
        </Button>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="todos" title="Todos" startContent={<CreditCardIcon size={16} />}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-semibold">Todos os Dados Bancários</h2>
                <div className="flex gap-2">
                  <Button variant="light" startContent={<FilterIcon size={16} />} onPress={() => setFilters({ ativo: true })}>
                    Apenas Ativos
                  </Button>
                  <Button variant="light" startContent={<StarIcon size={16} />} onPress={() => setFilters({ principal: true })}>
                    Apenas Principais
                  </Button>
                  <Button variant="light" onPress={() => setFilters({})}>
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table aria-label="Lista de dados bancários">
                  <TableHeader>
                    <TableColumn>TITULAR</TableColumn>
                    <TableColumn>BANCO</TableColumn>
                    <TableColumn>CONTA</TableColumn>
                    <TableColumn>PIX</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>AÇÕES</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {dadosBancarios.map((dados) => (
                      <TableRow key={dados.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dados.titularNome}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Chip size="sm" variant="flat" startContent={getTipoContaIcon(dados.tipoConta)}>
                                {tiposConta.find((t) => t.value === dados.tipoConta)?.label}
                              </Chip>
                              <span className="text-sm text-gray-500">{formatDocumento(dados.titularDocumento)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dados.banco?.nome || dados.bancoCodigo}</p>
                            <p className="text-sm text-gray-500">Código: {dados.bancoCodigo}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              Ag: {dados.agencia} - CC: {dados.conta}
                              {dados.digitoConta && `-${dados.digitoConta}`}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-sm">{getTipoContaBancariaIcon(dados.tipoContaBancaria)}</span>
                              <span className="text-sm text-gray-500">{tiposContaBancaria.find((t) => t.value === dados.tipoContaBancaria)?.label}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dados.chavePix ? (
                            <div>
                              <p className="font-medium text-sm">{dados.chavePix}</p>
                              <p className="text-xs text-gray-500">{tiposChavePix.find((t) => t.value === dados.tipoChavePix)?.label}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Não cadastrado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {dados.principal && (
                              <Chip size="sm" color="primary" variant="flat" startContent={<StarIcon size={12} />}>
                                Principal
                              </Chip>
                            )}
                            <Chip size="sm" color={dados.ativo ? "success" : "default"} variant="flat" startContent={dados.ativo ? <CheckCircleIcon size={12} /> : <XCircleIcon size={12} />}>
                              {dados.ativo ? "Ativo" : "Inativo"}
                            </Chip>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="light" size="sm">
                                Ações
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem key="view" startContent={<EyeIcon size={16} />} onPress={() => handleOpenModal(dados)}>
                                Ver Detalhes
                              </DropdownItem>
                              <DropdownItem key="edit" startContent={<PencilIcon size={16} />} onPress={() => handleOpenModal(dados)}>
                                Editar
                              </DropdownItem>
                              <DropdownItem key="delete" startContent={<TrashIcon size={16} />} className="text-danger" color="danger" onPress={() => handleDelete(dados.id)}>
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

              {dadosBancarios.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <CreditCardIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum dado bancário encontrado</p>
                  <Button color="primary" variant="light" className="mt-2" onPress={() => handleOpenModal()}>
                    Cadastrar Primeiro Dados Bancários
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal de Criação/Edição com Tabs */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCardIcon size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{editingId ? "Editar Dados Bancários" : "Novos Dados Bancários"}</h3>
                <p className="text-sm text-default-500">Complete as informações bancárias</p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="px-0">
            <Tabs
              aria-label="Formulário de dados bancários"
              color="primary"
              variant="underlined"
              classNames={{
                tabList: "gap-8 w-full relative rounded-none p-6 pb-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-4 h-12",
                tabContent: "group-data-[selected=true]:text-primary font-medium",
                panel: "pt-6",
              }}
            >
              <Tab
                key="banco"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                      <BuildingIcon size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Banco</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <BuildingIcon size={20} />
                      Informações do Banco
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Banco"
                        placeholder="Selecione o banco"
                        selectedKeys={formData.bancoCodigo ? [formData.bancoCodigo] : []}
                        onSelectionChange={(keys) => {
                          const codigo = Array.from(keys)[0] as string;
                          handleBancoChange(codigo);
                        }}
                        isRequired
                        startContent={<BuildingIcon size={16} className="text-default-400" />}
                      >
                        {bancos.map((banco) => (
                          <SelectItem key={banco.codigo} textValue={banco.nome}>
                            <div>
                              <p className="font-medium">{banco.nome}</p>
                              <p className="text-sm text-gray-500">Código: {banco.codigo}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Tipo de Conta"
                        placeholder="Selecione o tipo"
                        selectedKeys={[formData.tipoConta]}
                        onSelectionChange={(keys) => {
                          const tipo = Array.from(keys)[0] as TipoConta;
                          setFormData({ ...formData, tipoConta: tipo });
                        }}
                        isRequired
                        startContent={<UserIcon size={16} className="text-default-400" />}
                      >
                        {tiposConta.map((tipo) => (
                          <SelectItem key={tipo.value} textValue={tipo.label}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{tipo.icon}</span>
                              <span>{tipo.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <Input
                        label="Agência"
                        placeholder="0000"
                        value={formData.agencia}
                        onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                        isRequired
                        startContent={<span className="text-default-400 text-sm">Ag:</span>}
                      />
                      <Input
                        label="Conta"
                        placeholder="00000000"
                        value={formData.conta}
                        onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                        isRequired
                        startContent={<span className="text-default-400 text-sm">CC:</span>}
                      />
                      <Input
                        label="Dígito"
                        placeholder="0"
                        value={formData.digitoConta}
                        onChange={(e) => setFormData({ ...formData, digitoConta: e.target.value })}
                        startContent={<span className="text-default-400 text-sm">DV:</span>}
                      />
                    </div>

                    <div className="mt-4">
                      <Select
                        label="Tipo de Conta Bancária"
                        placeholder="Selecione o tipo"
                        selectedKeys={[formData.tipoContaBancaria]}
                        onSelectionChange={(keys) => {
                          const tipo = Array.from(keys)[0] as TipoContaBancaria;
                          setFormData({ ...formData, tipoContaBancaria: tipo });
                        }}
                        isRequired
                        startContent={<WalletIcon size={16} className="text-default-400" />}
                      >
                        {tiposContaBancaria.map((tipo) => (
                          <SelectItem key={tipo.value} textValue={tipo.label}>
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{tipo.icon}</span>
                              <div>
                                <p className="font-medium">{tipo.label}</p>
                                <p className="text-xs text-gray-500">{tipo.description}</p>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab
                key="pix"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-green-100 dark:bg-green-900">
                      <CreditCardIcon size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span>PIX</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CreditCardIcon size={20} />
                      Chave PIX (Opcional)
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Tipo da Chave PIX"
                        placeholder="Selecione o tipo"
                        selectedKeys={formData.tipoChavePix ? [formData.tipoChavePix] : []}
                        onSelectionChange={(keys) => {
                          const tipo = Array.from(keys)[0] as TipoChavePix;
                          setFormData({ ...formData, tipoChavePix: tipo });
                        }}
                        startContent={<ShieldIcon size={16} className="text-default-400" />}
                      >
                        {tiposChavePix.map((tipo) => (
                          <SelectItem key={tipo.value} textValue={tipo.label}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{tipo.icon}</span>
                              <span>{tipo.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>

                      <Input
                        label="Chave PIX"
                        placeholder="Digite a chave PIX"
                        value={formData.chavePix}
                        onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                        startContent={<CreditCardIcon size={16} className="text-default-400" />}
                      />
                    </div>

                    {formData.chavePix && (
                      <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircleIcon size={16} />
                          <span className="text-sm font-medium">Chave PIX configurada:</span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-mono">{formData.chavePix}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Tab>

              <Tab
                key="titular"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900">
                      <UserIcon size={16} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Titular</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <UserIcon size={20} />
                      Dados do Titular
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Nome do Titular"
                        placeholder="Nome completo"
                        value={formData.titularNome}
                        onChange={(e) => setFormData({ ...formData, titularNome: e.target.value })}
                        isRequired
                        startContent={<UserIcon size={16} className="text-default-400" />}
                      />
                      <Input
                        label="CPF/CNPJ"
                        placeholder="000.000.000-00"
                        value={formData.titularDocumento}
                        onChange={(e) => setFormData({ ...formData, titularDocumento: e.target.value })}
                        isRequired
                        startContent={<ShieldIcon size={16} className="text-default-400" />}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Input
                        label="E-mail"
                        placeholder="email@exemplo.com"
                        type="email"
                        value={formData.titularEmail}
                        onChange={(e) => setFormData({ ...formData, titularEmail: e.target.value })}
                        startContent={<MailIcon size={16} className="text-default-400" />}
                      />
                      <Input
                        label="Telefone"
                        placeholder="(11) 99999-9999"
                        value={formData.titularTelefone}
                        onChange={(e) => setFormData({ ...formData, titularTelefone: e.target.value })}
                        startContent={<PhoneIcon size={16} className="text-default-400" />}
                      />
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab
                key="endereco"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-orange-100 dark:bg-orange-900">
                      <MapPinIcon size={16} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <span>Endereço</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-300">
                        <MapPinIcon size={20} />
                        Endereço (Opcional)
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">💡 Digite o CEP e pressione Enter para preencher automaticamente os campos de endereço</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <CepInput label="CEP" placeholder="00000-000" value={formData.cep || ""} onChange={(cep) => setFormData({ ...formData, cep })} onCepFound={handleCepFound} />
                      <Input
                        label="Cidade"
                        placeholder="São Paulo"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        startContent={<HomeIcon size={16} className="text-default-400" />}
                        description={formData.cidade ? "✅ Preenchido automaticamente" : undefined}
                      />
                      <Input
                        label="Estado"
                        placeholder="SP"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        startContent={<span className="text-default-400 text-sm">UF</span>}
                        description={formData.estado ? "✅ Preenchido automaticamente" : undefined}
                      />
                    </div>

                    <div className="mt-4">
                      <Input
                        label="Endereço"
                        placeholder="Rua, número, complemento"
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                        startContent={<HomeIcon size={16} className="text-default-400" />}
                        description={formData.endereco ? "✅ Preenchido automaticamente" : undefined}
                      />
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab
                key="configuracoes"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-800">
                      <SettingsIcon size={16} className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <span>Configurações</span>
                  </div>
                }
              >
                <div className="px-6 pb-6 space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <SettingsIcon size={20} />
                      Configurações
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-primary/10">
                            <StarIcon size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Conta Principal</p>
                            <p className="text-sm text-default-500">Marque se esta é a conta principal para recebimentos</p>
                          </div>
                        </div>
                        <Switch isSelected={formData.principal} onValueChange={(principal) => setFormData({ ...formData, principal })} color="primary" />
                      </div>

                      <Textarea
                        label="Observações"
                        placeholder="Observações adicionais sobre os dados bancários..."
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={4}
                        classNames={{
                          input: "resize-none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>

          <ModalFooter className="px-6">
            <Button variant="light" onPress={handleCloseModal}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={loading} startContent={!loading ? <CheckCircleIcon size={16} /> : undefined}>
              {editingId ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
