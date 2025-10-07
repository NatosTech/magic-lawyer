"use client";

import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { Scale, Briefcase, Calendar, Clock, AlertCircle, CheckCircle, XCircle, User, FileText, Plus, Search, Filter, X, Eye, Edit, Trash2, DollarSign, MapPin, Shield, Building2 } from "lucide-react";
import Link from "next/link";
import { useAllProcessos } from "@/app/hooks/use-processos";
import { useClientesParaSelect } from "@/app/hooks/use-clientes";
import { title } from "@/components/primitives";
import { ProcessoStatus } from "@/app/generated/prisma";
import { DateUtils } from "@/app/lib/date-utils";

interface ProcessoFiltros {
  busca: string;
  status: string[];
  areaId: string;
  advogadoId: string;
  clienteId: string;
  comarca: string;
  segredoJustica: boolean | null;
  valorMinimo: string;
  valorMaximo: string;
  dataDistribuicaoInicio: string;
  dataDistribuicaoFim: string;
  prazoVencimento: string;
}

export function ProcessosContent() {
  const { processos, isLoading, isError } = useAllProcessos();
  const { clientes } = useClientesParaSelect();

  const [filtros, setFiltros] = useState<ProcessoFiltros>({
    busca: "",
    status: [],
    areaId: "",
    advogadoId: "",
    clienteId: "",
    comarca: "",
    segredoJustica: null,
    valorMinimo: "",
    valorMaximo: "",
    dataDistribuicaoInicio: "",
    dataDistribuicaoFim: "",
    prazoVencimento: "",
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const getStatusColor = (status: ProcessoStatus) => {
    switch (status) {
      case ProcessoStatus.EM_ANDAMENTO:
        return "primary";
      case ProcessoStatus.ENCERRADO:
        return "success";
      case ProcessoStatus.ARQUIVADO:
        return "default";
      case ProcessoStatus.SUSPENSO:
        return "warning";
      case ProcessoStatus.RASCUNHO:
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: ProcessoStatus) => {
    switch (status) {
      case ProcessoStatus.EM_ANDAMENTO:
        return "Em Andamento";
      case ProcessoStatus.ENCERRADO:
        return "Encerrado";
      case ProcessoStatus.ARQUIVADO:
        return "Arquivado";
      case ProcessoStatus.SUSPENSO:
        return "Suspenso";
      case ProcessoStatus.RASCUNHO:
        return "Rascunho";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: ProcessoStatus) => {
    switch (status) {
      case ProcessoStatus.EM_ANDAMENTO:
        return <Clock className="h-4 w-4" />;
      case ProcessoStatus.ENCERRADO:
        return <CheckCircle className="h-4 w-4" />;
      case ProcessoStatus.ARQUIVADO:
        return <FileText className="h-4 w-4" />;
      case ProcessoStatus.SUSPENSO:
        return <AlertCircle className="h-4 w-4" />;
      case ProcessoStatus.RASCUNHO:
        return <Edit className="h-4 w-4" />;
      default:
        return <Scale className="h-4 w-4" />;
    }
  };

  // Extrair dados únicos para filtros
  const areasUnicas = useMemo(() => {
    if (!processos || !Array.isArray(processos)) return [];
    const areas = processos.map((p) => p.area?.nome).filter(Boolean);
    return [...new Set(areas)];
  }, [processos]);

  const advogadosUnicos = useMemo(() => {
    if (!processos || !Array.isArray(processos)) return [];
    const advogados = processos.map((p) => p.advogadoResponsavel?.nome).filter(Boolean);
    return [...new Set(advogados)];
  }, [processos]);

  const comarcasUnicas = useMemo(() => {
    if (!processos || !Array.isArray(processos)) return [];
    const comarcas = processos.map((p) => p.comarca).filter(Boolean);
    return [...new Set(comarcas)];
  }, [processos]);

  // Filtrar processos
  const processosFiltrados = useMemo(() => {
    if (!processos || !Array.isArray(processos)) return [];
    return processos.filter((processo) => {
      // Busca geral
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const matchBusca =
          processo.numero.toLowerCase().includes(busca) ||
          processo.titulo?.toLowerCase().includes(busca) ||
          processo.cliente.nome.toLowerCase().includes(busca) ||
          processo.advogadoResponsavel?.nome?.toLowerCase().includes(busca);
        if (!matchBusca) return false;
      }

      // Status
      if (filtros.status.length > 0 && !filtros.status.includes(processo.status)) {
        return false;
      }

      // Área
      if (filtros.areaId && processo.area?.nome !== filtros.areaId) {
        return false;
      }

      // Advogado
      if (filtros.advogadoId && processo.advogadoResponsavel?.nome !== filtros.advogadoId) {
        return false;
      }

      // Cliente
      if (filtros.clienteId && processo.clienteId !== filtros.clienteId) {
        return false;
      }

      // Comarca
      if (filtros.comarca && processo.comarca !== filtros.comarca) {
        return false;
      }

      // Segredo de justiça
      if (filtros.segredoJustica !== null && processo.segredoJustica !== filtros.segredoJustica) {
        return false;
      }

      // Valor da causa
      if (filtros.valorMinimo && processo.valorCausa && Number(processo.valorCausa) < Number(filtros.valorMinimo)) {
        return false;
      }
      if (filtros.valorMaximo && processo.valorCausa && Number(processo.valorCausa) > Number(filtros.valorMaximo)) {
        return false;
      }

      // Data de distribuição
      if (filtros.dataDistribuicaoInicio && processo.dataDistribuicao) {
        const dataInicio = new Date(filtros.dataDistribuicaoInicio);
        const dataProcesso = new Date(processo.dataDistribuicao);
        if (dataProcesso < dataInicio) return false;
      }
      if (filtros.dataDistribuicaoFim && processo.dataDistribuicao) {
        const dataFim = new Date(filtros.dataDistribuicaoFim);
        const dataProcesso = new Date(processo.dataDistribuicao);
        if (dataProcesso > dataFim) return false;
      }

      // Prazo de vencimento
      if (filtros.prazoVencimento && processo.prazoPrincipal) {
        const hoje = new Date();
        const prazo = new Date(processo.prazoPrincipal);
        const diasRestantes = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        switch (filtros.prazoVencimento) {
          case "vencido":
            if (diasRestantes >= 0) return false;
            break;
          case "vencendo_hoje":
            if (diasRestantes !== 0) return false;
            break;
          case "vencendo_7_dias":
            if (diasRestantes < 0 || diasRestantes > 7) return false;
            break;
          case "vencendo_30_dias":
            if (diasRestantes < 0 || diasRestantes > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [processos, filtros]);

  const limparFiltros = () => {
    setFiltros({
      busca: "",
      status: [],
      areaId: "",
      advogadoId: "",
      clienteId: "",
      comarca: "",
      segredoJustica: null,
      valorMinimo: "",
      valorMaximo: "",
      dataDistribuicaoInicio: "",
      dataDistribuicaoFim: "",
      prazoVencimento: "",
    });
  };

  const temFiltrosAtivos = Object.values(filtros).some((valor) => (Array.isArray(valor) ? valor.length > 0 : valor !== "" && valor !== null));

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" label="Carregando processos..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-danger mb-2">Erro ao carregar processos</h3>
          <p className="text-default-500">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  // Se ainda não temos dados, mostrar loading
  if (!processos) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" label="Carregando processos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={title({ size: "lg" })}>Processos</h1>
          <p className="text-default-500">
            {processosFiltrados.length} de {processos?.length || 0} processos
            {temFiltrosAtivos && " (filtrados)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="bordered" startContent={<Filter className="h-4 w-4" />} onPress={() => setMostrarFiltros(!mostrarFiltros)}>
            Filtros
          </Button>
          <Button color="primary" startContent={<Plus className="h-4 w-4" />} as={Link} href="/processos/novo">
            Novo Processo
          </Button>
        </div>
      </div>

      {/* Barra de Busca */}
      <Card>
        <CardBody>
          <Input
            placeholder="Buscar por número, título, cliente ou advogado..."
            value={filtros.busca}
            onChange={(e) => setFiltros((prev) => ({ ...prev, busca: e.target.value }))}
            startContent={<Search className="h-4 w-4 text-default-400" />}
            endContent={
              filtros.busca && (
                <Button isIconOnly variant="light" size="sm" onPress={() => setFiltros((prev) => ({ ...prev, busca: "" }))}>
                  <X className="h-4 w-4" />
                </Button>
              )
            }
          />
        </CardBody>
      </Card>

      {/* Filtros Avançados */}
      {mostrarFiltros && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Filtros Avançados</h3>
              <Button variant="light" size="sm" onPress={limparFiltros} isDisabled={!temFiltrosAtivos}>
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(ProcessoStatus).map((status) => (
                    <Checkbox
                      key={status}
                      isSelected={filtros.status.includes(status)}
                      onValueChange={(checked) => {
                        setFiltros((prev) => ({
                          ...prev,
                          status: checked ? [...prev.status, status] : prev.status.filter((s) => s !== status),
                        }));
                      }}
                    >
                      {getStatusLabel(status)}
                    </Checkbox>
                  ))}
                </div>
              </div>

              {/* Área */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Área</label>
                <Select
                  placeholder="Todas as áreas"
                  selectedKeys={filtros.areaId ? [filtros.areaId] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFiltros((prev) => ({ ...prev, areaId: selectedKey || "" }));
                  }}
                >
                  {areasUnicas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Advogado */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Advogado</label>
                <Select
                  placeholder="Todos os advogados"
                  selectedKeys={filtros.advogadoId ? [filtros.advogadoId] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFiltros((prev) => ({ ...prev, advogadoId: selectedKey || "" }));
                  }}
                >
                  {advogadosUnicos.map((advogado) => (
                    <SelectItem key={advogado} value={advogado}>
                      {advogado}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Select
                  placeholder="Todos os clientes"
                  selectedKeys={filtros.clienteId ? [filtros.clienteId] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFiltros((prev) => ({ ...prev, clienteId: selectedKey || "" }));
                  }}
                >
                  {(clientes || []).map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      <div className="flex items-center gap-2">
                        {cliente.tipoPessoa === "JURIDICA" ? <Building2 className="h-4 w-4 text-default-400" /> : <User className="h-4 w-4 text-default-400" />}
                        <span>{cliente.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Comarca */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Comarca</label>
                <Select
                  placeholder="Todas as comarcas"
                  selectedKeys={filtros.comarca ? [filtros.comarca] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFiltros((prev) => ({ ...prev, comarca: selectedKey || "" }));
                  }}
                >
                  {comarcasUnicas.map((comarca) => (
                    <SelectItem key={comarca} value={comarca}>
                      {comarca}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Segredo de Justiça */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Segredo de Justiça</label>
                <Select
                  placeholder="Todos"
                  selectedKeys={filtros.segredoJustica !== null ? [filtros.segredoJustica.toString()] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFiltros((prev) => ({
                      ...prev,
                      segredoJustica: selectedKey === "" ? null : selectedKey === "true",
                    }));
                  }}
                >
                  <SelectItem key="true" value="true">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-warning" />
                      <span>Em Segredo</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="false" value="false">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-success" />
                      <span>Público</span>
                    </div>
                  </SelectItem>
                </Select>
              </div>

              {/* Valor da Causa */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da Causa</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Mínimo"
                    value={filtros.valorMinimo}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, valorMinimo: e.target.value }))}
                    startContent={<DollarSign className="h-4 w-4 text-default-400" />}
                    type="number"
                  />
                  <Input
                    placeholder="Máximo"
                    value={filtros.valorMaximo}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, valorMaximo: e.target.value }))}
                    startContent={<DollarSign className="h-4 w-4 text-default-400" />}
                    type="number"
                  />
                </div>
              </div>

              {/* Data de Distribuição */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Distribuição</label>
                <div className="flex gap-2">
                  <Input type="date" value={filtros.dataDistribuicaoInicio} onChange={(e) => setFiltros((prev) => ({ ...prev, dataDistribuicaoInicio: e.target.value }))} placeholder="De" />
                  <Input type="date" value={filtros.dataDistribuicaoFim} onChange={(e) => setFiltros((prev) => ({ ...prev, dataDistribuicaoFim: e.target.value }))} placeholder="Até" />
                </div>
              </div>

              {/* Prazo de Vencimento */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Prazo de Vencimento</label>
                <Select
                  placeholder="Todos os prazos"
                  selectedKeys={filtros.prazoVencimento ? [filtros.prazoVencimento] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFiltros((prev) => ({ ...prev, prazoVencimento: selectedKey || "" }));
                  }}
                >
                  <SelectItem key="vencido" value="vencido">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-danger" />
                      <span>Vencido</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="vencendo_hoje" value="vencendo_hoje">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span>Vencendo Hoje</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="vencendo_7_dias" value="vencendo_7_dias">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span>Vencendo em 7 dias</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="vencendo_30_dias" value="vencendo_30_dias">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Vencendo em 30 dias</span>
                    </div>
                  </SelectItem>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Lista de Processos */}
      <div className="grid gap-4">
        {processosFiltrados.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <FileText className="h-12 w-12 text-default-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-default-500 mb-2">{temFiltrosAtivos ? "Nenhum processo encontrado" : "Nenhum processo cadastrado"}</h3>
              <p className="text-default-400 mb-4">{temFiltrosAtivos ? "Tente ajustar os filtros ou limpar para ver todos os processos" : "Comece criando seu primeiro processo"}</p>
              {temFiltrosAtivos ? (
                <Button variant="light" onPress={limparFiltros}>
                  Limpar Filtros
                </Button>
              ) : (
                <Button color="primary" as={Link} href="/processos/novo">
                  Criar Primeiro Processo
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processosFiltrados.map((processo: any) => (
              <Card key={processo.id} className="border border-default-200 hover:border-primary transition-all hover:shadow-lg cursor-pointer" isPressable as={Link} href={`/processos/${processo.id}`}>
                <CardHeader className="flex flex-col items-start gap-2 pb-2">
                  <div className="flex w-full items-start justify-between">
                    <Chip size="sm" variant="flat" color={getStatusColor(processo.status)} startContent={getStatusIcon(processo.status)}>
                      {getStatusLabel(processo.status)}
                    </Chip>
                    {processo.segredoJustica && <Shield className="h-4 w-4 text-warning" />}
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-semibold text-default-700">{processo.numero}</p>
                    {processo.titulo && <p className="mt-1 text-xs text-default-500 line-clamp-2">{processo.titulo}</p>}
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="gap-3 pt-3">
                  {processo.area && (
                    <div className="flex items-center gap-2 text-xs">
                      <Briefcase className="h-3 w-3 text-default-400" />
                      <span className="text-default-600">{processo.area.nome}</span>
                    </div>
                  )}
                  {processo.advogadoResponsavel && (
                    <div className="flex items-center gap-2 text-xs">
                      <User className="h-3 w-3 text-default-400" />
                      <span className="text-default-600">
                        {processo.advogadoResponsavel.usuario.firstName} {processo.advogadoResponsavel.usuario.lastName}
                      </span>
                    </div>
                  )}
                  {processo.cliente && (
                    <div className="flex items-center gap-2 text-xs">
                      {processo.cliente.tipoPessoa === "JURIDICA" ? <Building2 className="h-3 w-3 text-default-400" /> : <User className="h-3 w-3 text-default-400" />}
                      <span className="text-default-600">{processo.cliente.nome}</span>
                    </div>
                  )}
                  {processo.comarca && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-3 w-3 text-default-400" />
                      <span className="text-default-600">{processo.comarca}</span>
                    </div>
                  )}
                  {processo.dataDistribuicao && (
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3 text-default-400" />
                      <span className="text-default-600">{DateUtils.formatDate(processo.dataDistribuicao)}</span>
                    </div>
                  )}
                  {processo.prazoPrincipal && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 text-warning" />
                      <span className="text-warning-600">Prazo: {DateUtils.formatDate(processo.prazoPrincipal)}</span>
                    </div>
                  )}
                  {processo.valorCausa && (
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="h-3 w-3 text-success" />
                      <span className="text-success-600">R$ {Number(processo.valorCausa).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <Divider className="my-2" />

                  <div className="flex flex-wrap gap-2">
                    <Chip size="sm" variant="flat">
                      {processo._count.documentos} docs
                    </Chip>
                    <Chip size="sm" variant="flat">
                      {processo._count.eventos} eventos
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
