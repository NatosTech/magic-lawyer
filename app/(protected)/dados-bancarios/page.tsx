"use client";

import React, { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Textarea, Switch, Tabs, Tab, Pagination, Select, SelectItem } from "@heroui/react";
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
  SearchIcon,
  RotateCcwIcon,
  XCircle,
  CheckCircle,
  Star,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import {
  useDadosBancarios,
  useTiposConta,
  useTiposContaBancaria,
  useTiposChavePix,
} from "@/app/hooks/use-dados-bancarios";
import { useBancosDisponiveis } from "@/app/hooks/use-bancos";
import {
  createDadosBancarios,
  updateDadosBancarios,
  deleteDadosBancarios,
} from "@/app/actions/dados-bancarios";
import { getClientesParaSelect } from "@/app/actions/clientes";
import { getAdvogados } from "@/app/actions/advogados";
import { CepInput } from "@/components/cep-input";
import { type CepData } from "@/types/brazil";
import { title, subtitle } from "@/components/primitives";

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
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filtros básicos (mantidos para compatibilidade)
  const [filters, setFilters] = useState<{
    ativo?: boolean;
    principal?: boolean;
    usuarioId?: string;
    clienteId?: string;
  }>({});

  // Filtros avançados
  const [filtroTitular, setFiltroTitular] = useState<string>("");
  const [filtroBanco, setFiltroBanco] = useState<string>("");
  const [filtroTipoConta, setFiltroTipoConta] = useState<string>("");
  const [filtroTipoContaBancaria, setFiltroTipoContaBancaria] =
    useState<string>("");
  const [filtroDocumento, setFiltroDocumento] = useState<string>("");
  const [filtroChavePix, setFiltroChavePix] = useState<string>("");
  const [filtroCliente, setFiltroCliente] = useState<string>("");
  const [filtroAdvogado, setFiltroAdvogado] = useState<string>("");

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
  const { data: session } = useSession();
  const { dadosBancarios, isLoading, mutate } = useDadosBancarios(filters);
  const { bancos } = useBancosDisponiveis();
  const { tipos: tiposConta } = useTiposConta();
  const { tipos: tiposContaBancaria } = useTiposContaBancaria();
  const { tipos: tiposChavePix } = useTiposChavePix();

  // Buscar clientes e advogados para filtros
  const [clientes, setClientes] = useState<any[]>([]);
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingAdvogados, setLoadingAdvogados] = useState(false);

  // Carregar clientes e advogados
  React.useEffect(() => {
    const loadClientes = async () => {
      setLoadingClientes(true);
      try {
        const result = await getClientesParaSelect();

        if (result.success) {
          setClientes(result.clientes || []);
        }
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      } finally {
        setLoadingClientes(false);
      }
    };

    const loadAdvogados = async () => {
      setLoadingAdvogados(true);
      try {
        const result = await getAdvogados();

        if (result.success) {
          setAdvogados(result.data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar advogados:", error);
      } finally {
        setLoadingAdvogados(false);
      }
    };

    loadClientes();
    loadAdvogados();
  }, []);

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setFilters({});
    setFiltroTitular("");
    setFiltroBanco("");
    setFiltroTipoConta("");
    setFiltroTipoContaBancaria("");
    setFiltroDocumento("");
    setFiltroChavePix("");
    setFiltroCliente("");
    setFiltroAdvogado("");
    setCurrentPage(1);
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.ativo !== undefined ||
      filters.principal !== undefined ||
      filters.usuarioId ||
      filters.clienteId ||
      filtroTitular ||
      filtroBanco ||
      filtroTipoConta ||
      filtroTipoContaBancaria ||
      filtroDocumento ||
      filtroChavePix ||
      filtroCliente ||
      filtroAdvogado
    );
  }, [
    filters,
    filtroTitular,
    filtroBanco,
    filtroTipoConta,
    filtroTipoContaBancaria,
    filtroDocumento,
    filtroChavePix,
    filtroCliente,
    filtroAdvogado,
  ]);

  // Filtrar dados bancários localmente
  const dadosBancariosFiltrados = useMemo(() => {
    if (!dadosBancarios) return [];

    return dadosBancarios.filter((dados) => {
      // Filtro por titular
      if (
        filtroTitular &&
        !dados.titularNome.toLowerCase().includes(filtroTitular.toLowerCase())
      ) {
        return false;
      }

      // Filtro por banco
      if (filtroBanco && dados.bancoCodigo !== filtroBanco) {
        return false;
      }

      // Filtro por tipo de conta
      if (filtroTipoConta && dados.tipoConta !== filtroTipoConta) {
        return false;
      }

      // Filtro por tipo de conta bancária
      if (
        filtroTipoContaBancaria &&
        dados.tipoContaBancaria !== filtroTipoContaBancaria
      ) {
        return false;
      }

      // Filtro por documento
      if (
        filtroDocumento &&
        !dados.titularDocumento.includes(filtroDocumento)
      ) {
        return false;
      }

      // Filtro por chave PIX
      if (
        filtroChavePix &&
        (!dados.chavePix ||
          !dados.chavePix.toLowerCase().includes(filtroChavePix.toLowerCase()))
      ) {
        return false;
      }

      // Filtro por cliente
      if (filtroCliente && dados.clienteId !== filtroCliente) {
        return false;
      }

      // Filtro por advogado (usuarioId)
      if (filtroAdvogado && dados.usuarioId !== filtroAdvogado) {
        return false;
      }

      return true;
    });
  }, [
    dadosBancarios,
    filtroTitular,
    filtroBanco,
    filtroTipoConta,
    filtroTipoContaBancaria,
    filtroDocumento,
    filtroChavePix,
    filtroCliente,
    filtroAdvogado,
  ]);

  // Paginação
  const totalPages = Math.ceil(dadosBancariosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const dadosBancariosPaginados = dadosBancariosFiltrados.slice(
    startIndex,
    endIndex,
  );

  // Resetar página quando filtros mudarem
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (filters.ativo !== undefined) count++;
    if (filters.principal !== undefined) count++;
    if (filters.usuarioId) count++;
    if (filters.clienteId) count++;
    if (filtroTitular) count++;
    if (filtroBanco) count++;
    if (filtroTipoConta) count++;
    if (filtroTipoContaBancaria) count++;
    if (filtroDocumento) count++;
    if (filtroChavePix) count++;
    if (filtroCliente) count++;
    if (filtroAdvogado) count++;

    return count;
  }, [
    filters,
    filtroTitular,
    filtroBanco,
    filtroTipoConta,
    filtroTipoContaBancaria,
    filtroDocumento,
    filtroChavePix,
    filtroCliente,
    filtroAdvogado,
  ]);

  // Obter bancos únicos dos dados bancários
  const bancosUnicos = useMemo(() => {
    if (!dadosBancarios || !bancos) return [];

    const bancosUsados = new Set(dadosBancarios.map((d) => d.bancoCodigo));

    return bancos.filter((banco) => bancosUsados.has(banco.codigo));
  }, [dadosBancarios, bancos]);

  // Calcular métricas
  const metricas = useMemo(() => {
    if (!dadosBancarios) return null;

    const total = dadosBancarios.length;
    const ativos = dadosBancarios.filter((d) => d.ativo).length;
    const principais = dadosBancarios.filter((d) => d.principal).length;
    const comPix = dadosBancarios.filter((d) => d.chavePix).length;
    const usuarios = new Set(
      dadosBancarios.map((d) => d.usuarioId).filter(Boolean),
    ).size;
    const clientes = new Set(
      dadosBancarios.map((d) => d.clienteId).filter(Boolean),
    ).size;

    return {
      total,
      ativos,
      principais,
      comPix,
      usuarios,
      clientes,
      percentualAtivos: total > 0 ? Math.round((ativos / total) * 100) : 0,
      percentualPrincipais:
        total > 0 ? Math.round((principais / total) * 100) : 0,
    };
  }, [dadosBancarios]);

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

      // Validar campos obrigatórios
      if (!formData.bancoCodigo || !formData.agencia || !formData.conta) {
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
        if (!formData.titularNome) {
          toast.error("Nome do titular é obrigatório");
        } else if (!formData.titularDocumento) {
          toast.error("CPF/CNPJ do titular é obrigatório");
        }

        return;
      }

      let result;

      if (editingId) {
        result = await updateDadosBancarios(editingId, formData);
      } else {
        result = await createDadosBancarios(formData);
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
      return documento.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5",
      );
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
          <h1 className={title({ size: "lg", color: "blue" })}>
            Dados Bancários
          </h1>
          <p className={subtitle({ fullWidth: true })}>
            Gerencie os dados bancários de usuários e clientes
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon size={20} />}
          onPress={() => handleOpenModal()}
        >
          Novo Dados Bancários
        </Button>
      </div>

      {/* Cards de Métricas */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-success/20 bg-success/5">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/20">
                  <CreditCardIcon className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-success/70">
                    Total de Contas
                  </p>
                  <p className="text-xl font-bold text-success">
                    {metricas.total}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary/70">
                    Contas Ativas
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {metricas.ativos}
                  </p>
                  <p className="text-xs text-primary/60">
                    {metricas.percentualAtivos}% do total
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-warning/20 bg-warning/5">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/20">
                  <Star className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-warning/70">
                    Contas Principais
                  </p>
                  <p className="text-xl font-bold text-warning">
                    {metricas.principais}
                  </p>
                  <p className="text-xs text-warning/60">
                    {metricas.percentualPrincipais}% do total
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-secondary/20 bg-secondary/5">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/20">
                  <Smartphone className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-secondary/70">
                    Com PIX
                  </p>
                  <p className="text-xl font-bold text-secondary">
                    {metricas.comPix}
                  </p>
                  <p className="text-xs text-secondary/60">
                    {metricas.total > 0
                      ? Math.round((metricas.comPix / metricas.total) * 100)
                      : 0}
                    % do total
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filtros Avançados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Filtros</h3>
            {hasActiveFilters && (
              <Chip color="primary" size="sm" variant="flat">
                {activeFiltersCount} ativo(s)
              </Chip>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              isDisabled={!hasActiveFilters}
              size="sm"
              startContent={<RotateCcwIcon className="w-4 h-4" />}
              variant="light"
              onPress={clearAllFilters}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              startContent={
                showFilters ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <FilterIcon className="w-4 h-4" />
                )
              }
              variant="light"
              onPress={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Filtro por Titular */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="titular"
                >
                  <UserIcon className="w-4 h-4" />
                  Titular
                </label>
                <Input
                  color="primary"
                  placeholder="Buscar por titular..."
                  size="sm"
                  startContent={<SearchIcon className="w-4 h-4 text-primary" />}
                  value={filtroTitular}
                  variant="bordered"
                  onChange={(e) => setFiltroTitular(e.target.value)}
                />
              </div>

              {/* Filtro por Banco */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="banco"
                >
                  <BuildingIcon className="w-4 h-4" />
                  Banco
                </label>
                <Select
                  color="secondary"
                  placeholder="Selecione um banco"
                  selectedKeys={filtroBanco ? [filtroBanco] : []}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFiltroBanco((Array.from(keys)[0] as string) || "")
                  }
                >
                  <SelectItem key="" textValue="Todos os bancos">
                    Todos os bancos
                  </SelectItem>
                  {
                    bancosUnicos.map((banco) => (
                      <SelectItem key={banco.codigo} textValue={banco.nome}>
                        {banco.nome}
                      </SelectItem>
                    )) as any
                  }
                </Select>
              </div>

              {/* Filtro por Tipo de Conta */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="tipoConta"
                >
                  <ShieldIcon className="w-4 h-4" />
                  Tipo de Conta
                </label>
                <Select
                  color="success"
                  placeholder="Selecione um tipo"
                  selectedKeys={filtroTipoConta ? [filtroTipoConta] : []}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFiltroTipoConta((Array.from(keys)[0] as string) || "")
                  }
                >
                  <SelectItem key="" textValue="Todos os tipos">
                    Todos os tipos
                  </SelectItem>
                  {
                    tiposConta.map((tipo) => (
                      <SelectItem key={tipo.value} textValue={tipo.label}>
                        {tipo.label}
                      </SelectItem>
                    )) as any
                  }
                </Select>
              </div>

              {/* Filtro por Tipo de Conta Bancária */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="tipoContaBancaria"
                >
                  <WalletIcon className="w-4 h-4" />
                  Tipo de Conta Bancária
                </label>
                <Select
                  color="warning"
                  placeholder="Selecione um tipo"
                  selectedKeys={
                    filtroTipoContaBancaria ? [filtroTipoContaBancaria] : []
                  }
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFiltroTipoContaBancaria(
                      (Array.from(keys)[0] as string) || "",
                    )
                  }
                >
                  <SelectItem key="" textValue="Todos os tipos">
                    Todos os tipos
                  </SelectItem>
                  {
                    tiposContaBancaria.map((tipo) => (
                      <SelectItem key={tipo.value} textValue={tipo.label}>
                        {tipo.label}
                      </SelectItem>
                    )) as any
                  }
                </Select>
              </div>

              {/* Filtro por Documento */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="documento"
                >
                  <ShieldIcon className="w-4 h-4" />
                  CPF/CNPJ
                </label>
                <Input
                  color="danger"
                  placeholder="Buscar por documento..."
                  size="sm"
                  startContent={<SearchIcon className="w-4 h-4 text-danger" />}
                  value={filtroDocumento}
                  variant="bordered"
                  onChange={(e) => setFiltroDocumento(e.target.value)}
                />
              </div>

              {/* Filtro por Chave PIX */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="chavePix"
                >
                  <CreditCardIcon className="w-4 h-4" />
                  Chave PIX
                </label>
                <Input
                  color="secondary"
                  placeholder="Buscar por chave PIX..."
                  size="sm"
                  startContent={
                    <SearchIcon className="w-4 h-4 text-secondary" />
                  }
                  value={filtroChavePix}
                  variant="bordered"
                  onChange={(e) => setFiltroChavePix(e.target.value)}
                />
              </div>

              {/* Filtro por Cliente */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="cliente"
                >
                  <UserIcon className="w-4 h-4" />
                  Cliente
                </label>
                <Select
                  color="success"
                  isLoading={loadingClientes}
                  placeholder="Selecione um cliente"
                  selectedKeys={filtroCliente ? [filtroCliente] : []}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFiltroCliente((Array.from(keys)[0] as string) || "")
                  }
                >
                  <SelectItem key="" textValue="Todos os clientes">
                    Todos os clientes
                  </SelectItem>
                  {
                    clientes.map((cliente) => (
                      <SelectItem key={cliente.id} textValue={cliente.nome}>
                        {cliente.nome}
                      </SelectItem>
                    )) as any
                  }
                </Select>
              </div>

              {/* Filtro por Advogado */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="advogado"
                >
                  <ShieldIcon className="w-4 h-4" />
                  Advogado
                </label>
                <Select
                  color="primary"
                  isLoading={loadingAdvogados}
                  placeholder="Selecione um advogado"
                  selectedKeys={filtroAdvogado ? [filtroAdvogado] : []}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFiltroAdvogado((Array.from(keys)[0] as string) || "")
                  }
                >
                  <SelectItem key="" textValue="Todos os advogados">
                    Todos os advogados
                  </SelectItem>
                  {
                    advogados.map((advogado) => (
                      <SelectItem
                        key={advogado.usuarioId}
                        textValue={`${advogado.usuario.firstName} ${advogado.usuario.lastName}`}
                      >
                        {advogado.usuario.firstName} {advogado.usuario.lastName}
                      </SelectItem>
                    )) as any
                  }
                </Select>
              </div>
            </div>
          </CardBody>
        )}
      </Card>

      {/* Filtros Rápidos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div>
              <h2 className="text-lg font-semibold">Filtros Rápidos</h2>
              {(filters.ativo ||
                filters.principal ||
                filters.usuarioId ||
                filters.clienteId) && (
                <div className="flex gap-2 mt-2">
                  {filters.ativo && (
                    <Chip color="success" size="sm" variant="flat">
                      Apenas Ativos
                    </Chip>
                  )}
                  {filters.principal && (
                    <Chip color="primary" size="sm" variant="flat">
                      Apenas Principais
                    </Chip>
                  )}
                  {filters.usuarioId && (
                    <Chip color="secondary" size="sm" variant="flat">
                      Meus Dados
                    </Chip>
                  )}
                  {filters.clienteId && (
                    <Chip color="warning" size="sm" variant="flat">
                      Dados do Cliente
                    </Chip>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                color={filters.ativo === true ? "primary" : "default"}
                startContent={<CheckCircleIcon size={16} />}
                variant={filters.ativo === true ? "solid" : "light"}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    ativo: prev.ativo === true ? undefined : true,
                  }))
                }
              >
                Apenas Ativos
              </Button>
              <Button
                color={filters.principal === true ? "primary" : "default"}
                startContent={<StarIcon size={16} />}
                variant={filters.principal === true ? "solid" : "light"}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    principal: prev.principal === true ? undefined : true,
                  }))
                }
              >
                Apenas Principais
              </Button>
              <Button
                color={filters.usuarioId ? "secondary" : "default"}
                startContent={<UserIcon size={16} />}
                variant={filters.usuarioId ? "solid" : "light"}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    usuarioId: prev.usuarioId ? undefined : session?.user?.id,
                  }))
                }
              >
                Meus Dados
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
                {dadosBancariosPaginados.map((dados) => (
                  <TableRow key={dados.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{dados.titularNome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Chip
                            size="sm"
                            startContent={getTipoContaIcon(dados.tipoConta)}
                            variant="flat"
                          >
                            {
                              tiposConta.find(
                                (t) => t.value === dados.tipoConta,
                              )?.label
                            }
                          </Chip>
                          <span className="text-sm text-gray-500">
                            {formatDocumento(dados.titularDocumento)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {dados.banco?.nome || dados.bancoCodigo}
                        </p>
                        <p className="text-sm text-gray-500">
                          Código: {dados.bancoCodigo}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          Ag: {dados.agencia} - CC: {dados.conta}
                          {dados.digitoConta && `-${dados.digitoConta}`}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-sm">
                            {getTipoContaBancariaIcon(dados.tipoContaBancaria)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {
                              tiposContaBancaria.find(
                                (t) => t.value === dados.tipoContaBancaria,
                              )?.label
                            }
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dados.chavePix ? (
                        <div>
                          <p className="font-medium text-sm">
                            {dados.chavePix}
                          </p>
                          <p className="text-xs text-gray-500">
                            {
                              tiposChavePix.find(
                                (t) => t.value === dados.tipoChavePix,
                              )?.label
                            }
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Não cadastrado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {dados.principal && (
                          <Chip
                            color="primary"
                            size="sm"
                            startContent={<StarIcon size={12} />}
                            variant="flat"
                          >
                            Principal
                          </Chip>
                        )}
                        <Chip
                          color={dados.ativo ? "success" : "default"}
                          size="sm"
                          startContent={
                            dados.ativo ? (
                              <CheckCircleIcon size={12} />
                            ) : (
                              <XCircleIcon size={12} />
                            )
                          }
                          variant="flat"
                        >
                          {dados.ativo ? "Ativo" : "Inativo"}
                        </Chip>
                      </div>
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
                            onPress={() => handleOpenModal(dados)}
                          >
                            Ver Detalhes
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<PencilIcon size={16} />}
                            onPress={() => handleOpenModal(dados)}
                          >
                            Editar
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<TrashIcon size={16} />}
                            onPress={() => handleDelete(dados.id)}
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

          {dadosBancariosFiltrados.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <CreditCardIcon
                className="mx-auto text-gray-400 mb-4"
                size={48}
              />
              <p className="text-gray-500">
                {hasActiveFilters
                  ? "Nenhum dado bancário encontrado com os filtros aplicados"
                  : "Nenhum dado bancário encontrado"}
              </p>
              {hasActiveFilters ? (
                <Button
                  className="mt-2"
                  color="primary"
                  variant="light"
                  onPress={clearAllFilters}
                >
                  Limpar Filtros
                </Button>
              ) : (
                <Button
                  className="mt-2"
                  color="primary"
                  variant="light"
                  onPress={() => handleOpenModal()}
                >
                  Cadastrar Primeiro Dados Bancários
                </Button>
              )}
            </div>
          )}

          {/* Paginação */}
          {dadosBancariosFiltrados.length > 0 && totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                showControls
                color="primary"
                page={currentPage}
                total={totalPages}
                variant="flat"
                onChange={setCurrentPage}
              />
            </div>
          )}

          {/* Informações de paginação */}
          {dadosBancariosFiltrados.length > 0 && (
            <div className="flex justify-between items-center mt-4 text-sm text-default-500">
              <span>
                Mostrando {startIndex + 1} a{" "}
                {Math.min(endIndex, dadosBancariosFiltrados.length)} de{" "}
                {dadosBancariosFiltrados.length} registros
              </span>
              {hasActiveFilters && (
                <span>
                  {dadosBancariosFiltrados.length} de{" "}
                  {dadosBancarios?.length || 0} registros após filtros
                </span>
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
                <CreditCardIcon className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {editingId
                    ? "Editar Dados Bancários"
                    : "Novos Dados Bancários"}
                </h3>
                <p className="text-sm text-default-500">
                  Complete as informações bancárias
                </p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="px-0">
            <Tabs
              aria-label="Formulário de dados bancários"
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
                key="banco"
                title={
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                      <BuildingIcon
                        className="text-blue-600 dark:text-blue-400"
                        size={16}
                      />
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
                        isRequired
                        label="Banco"
                        placeholder="Selecione o banco"
                        selectedKeys={
                          formData.bancoCodigo ? [formData.bancoCodigo] : []
                        }
                        startContent={
                          <BuildingIcon
                            className="text-default-400"
                            size={16}
                          />
                        }
                        onSelectionChange={(keys) => {
                          const codigo = Array.from(keys)[0] as string;

                          handleBancoChange(codigo);
                        }}
                      >
                        {bancos.map((banco) => (
                          <SelectItem key={banco.codigo} textValue={banco.nome}>
                            <div>
                              <p className="font-medium">{banco.nome}</p>
                              <p className="text-sm text-gray-500">
                                Código: {banco.codigo}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>

                      <Select
                        isRequired
                        label="Tipo de Conta"
                        placeholder="Selecione o tipo"
                        selectedKeys={[formData.tipoConta]}
                        startContent={
                          <UserIcon className="text-default-400" size={16} />
                        }
                        onSelectionChange={(keys) => {
                          const tipo = Array.from(keys)[0] as TipoConta;

                          setFormData({ ...formData, tipoConta: tipo });
                        }}
                      >
                        {tiposConta.map((tipo) => (
                          <SelectItem key={tipo.value} textValue={tipo.label}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <Input
                        isRequired
                        label="Agência"
                        placeholder="0000"
                        startContent={
                          <span className="text-default-400 text-sm">Ag:</span>
                        }
                        value={formData.agencia}
                        onChange={(e) =>
                          setFormData({ ...formData, agencia: e.target.value })
                        }
                      />
                      <Input
                        isRequired
                        label="Conta"
                        placeholder="00000000"
                        startContent={
                          <span className="text-default-400 text-sm">CC:</span>
                        }
                        value={formData.conta}
                        onChange={(e) =>
                          setFormData({ ...formData, conta: e.target.value })
                        }
                      />
                      <Input
                        label="Dígito"
                        placeholder="0"
                        startContent={
                          <span className="text-default-400 text-sm">DV:</span>
                        }
                        value={formData.digitoConta}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            digitoConta: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <Select
                        isRequired
                        label="Tipo de Conta Bancária"
                        placeholder="Selecione o tipo"
                        selectedKeys={[formData.tipoContaBancaria]}
                        startContent={
                          <WalletIcon className="text-default-400" size={16} />
                        }
                        onSelectionChange={(keys) => {
                          const tipo = Array.from(keys)[0] as TipoContaBancaria;

                          setFormData({ ...formData, tipoContaBancaria: tipo });
                        }}
                      >
                        {tiposContaBancaria.map((tipo) => (
                          <SelectItem key={tipo.value} textValue={tipo.label}>
                            {tipo.label}
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
                      <CreditCardIcon
                        className="text-green-600 dark:text-green-400"
                        size={16}
                      />
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
                        selectedKeys={
                          formData.tipoChavePix ? [formData.tipoChavePix] : []
                        }
                        startContent={
                          <ShieldIcon className="text-default-400" size={16} />
                        }
                        onSelectionChange={(keys) => {
                          const tipo = Array.from(keys)[0] as TipoChavePix;

                          setFormData({ ...formData, tipoChavePix: tipo });
                        }}
                      >
                        {tiposChavePix.map((tipo) => (
                          <SelectItem key={tipo.value} textValue={tipo.label}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </Select>

                      <Input
                        label="Chave PIX"
                        placeholder="Digite a chave PIX"
                        startContent={
                          <CreditCardIcon
                            className="text-default-400"
                            size={16}
                          />
                        }
                        value={formData.chavePix}
                        onChange={(e) =>
                          setFormData({ ...formData, chavePix: e.target.value })
                        }
                      />
                    </div>

                    {formData.chavePix && (
                      <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircleIcon size={16} />
                          <span className="text-sm font-medium">
                            Chave PIX configurada:
                          </span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-mono">
                          {formData.chavePix}
                        </p>
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
                      <UserIcon
                        className="text-purple-600 dark:text-purple-400"
                        size={16}
                      />
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
                        isRequired
                        label="Nome do Titular"
                        placeholder="Nome completo"
                        startContent={
                          <UserIcon className="text-default-400" size={16} />
                        }
                        value={formData.titularNome}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            titularNome: e.target.value,
                          })
                        }
                      />
                      <Input
                        isRequired
                        label="CPF/CNPJ"
                        placeholder="000.000.000-00"
                        startContent={
                          <ShieldIcon className="text-default-400" size={16} />
                        }
                        value={formData.titularDocumento}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            titularDocumento: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Input
                        label="E-mail"
                        placeholder="email@exemplo.com"
                        startContent={
                          <MailIcon className="text-default-400" size={16} />
                        }
                        type="email"
                        value={formData.titularEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            titularEmail: e.target.value,
                          })
                        }
                      />
                      <Input
                        label="Telefone"
                        placeholder="(11) 99999-9999"
                        startContent={
                          <PhoneIcon className="text-default-400" size={16} />
                        }
                        value={formData.titularTelefone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            titularTelefone: e.target.value,
                          })
                        }
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
                      <MapPinIcon
                        className="text-orange-600 dark:text-orange-400"
                        size={16}
                      />
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        💡 Digite o CEP e pressione Enter para preencher
                        automaticamente os campos de endereço
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <CepInput
                        label="CEP"
                        placeholder="00000-000"
                        value={formData.cep || ""}
                        onCepFound={handleCepFound}
                        onChange={(cep) => setFormData({ ...formData, cep })}
                      />
                      <Input
                        description={
                          formData.cidade
                            ? "✅ Preenchido automaticamente"
                            : undefined
                        }
                        label="Cidade"
                        placeholder="São Paulo"
                        startContent={
                          <HomeIcon className="text-default-400" size={16} />
                        }
                        value={formData.cidade}
                        onChange={(e) =>
                          setFormData({ ...formData, cidade: e.target.value })
                        }
                      />
                      <Input
                        description={
                          formData.estado
                            ? "✅ Preenchido automaticamente"
                            : undefined
                        }
                        label="Estado"
                        placeholder="SP"
                        startContent={
                          <span className="text-default-400 text-sm">UF</span>
                        }
                        value={formData.estado}
                        onChange={(e) =>
                          setFormData({ ...formData, estado: e.target.value })
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <Input
                        description={
                          formData.endereco
                            ? "✅ Preenchido automaticamente"
                            : undefined
                        }
                        label="Endereço"
                        placeholder="Rua, número, complemento"
                        startContent={
                          <HomeIcon className="text-default-400" size={16} />
                        }
                        value={formData.endereco}
                        onChange={(e) =>
                          setFormData({ ...formData, endereco: e.target.value })
                        }
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
                      <SettingsIcon
                        className="text-gray-600 dark:text-gray-400"
                        size={16}
                      />
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
                            <StarIcon className="text-primary" size={16} />
                          </div>
                          <div>
                            <p className="font-medium">Conta Principal</p>
                            <p className="text-sm text-default-500">
                              Marque se esta é a conta principal para
                              recebimentos
                            </p>
                          </div>
                        </div>
                        <Switch
                          color="primary"
                          isSelected={formData.principal}
                          onValueChange={(principal) =>
                            setFormData({ ...formData, principal })
                          }
                        />
                      </div>

                      <Textarea
                        classNames={{
                          input: "resize-none",
                        }}
                        label="Observações"
                        placeholder="Observações adicionais sobre os dados bancários..."
                        rows={4}
                        value={formData.observacoes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            observacoes: e.target.value,
                          })
                        }
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
