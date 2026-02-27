"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Spinner,
  Tab,
  Tabs,
} from "@heroui/react";
import { Pagination } from "@heroui/pagination";
import {
  ArrowLeft,
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  FileSignature,
  FileText,
  History,
  Mail,
  MessageSquareText,
  Phone,
  Scale,
  ShieldCheck,
  Star,
  User,
  Users,
  Wallet,
  Briefcase,
  TrendingUp,
  DollarSign,
  Building2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import useSWR from "swr";

import { AdvogadoHistorico } from "../components/advogado-historico";
import { AdvogadoNotificacoes } from "../components/advogado-notificacoes";

import {
  getAdvogadoPerfilById,
  getAdvogadoCompleto,
  type AdvogadoCompleto,
  type AdvogadoProfileData,
} from "@/app/actions/advogados";
import { useAdvogadoPerformance } from "@/app/hooks/use-advogados-performance";
import { useAdvogadoComissoes } from "@/app/hooks/use-advogados-comissoes";
import { useNotificacoesAdvogado } from "@/app/hooks/use-advogados-notificacoes";
import { EspecialidadeJuridica } from "@/generated/prisma";

interface AdvogadoProfileContentProps {
  advogadoId: string;
}

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type AdvogadoProfileFull = AdvogadoProfileData & {
  enderecos?: AdvogadoCompleto["enderecos"];
  dadosBancarios?: AdvogadoCompleto["dadosBancarios"];
};

const TAB_PAGE_SIZES = {
  clientes: 6,
  processos: 6,
  contratos: 6,
  procuracoes: 6,
  tarefas: 6,
  eventos: 6,
  assinaturas: 6,
} as const;

type DateInput = string | Date | null | undefined;

function getTotalPages(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;

  return items.slice(start, start + pageSize);
}

function getPageRange(totalItems: number, page: number, pageSize: number) {
  if (totalItems === 0) {
    return { start: 0, end: 0 };
  }

  const start = (Math.max(1, page) - 1) * pageSize + 1;
  const end = Math.min(Math.max(1, page) * pageSize, totalItems);

  return { start, end };
}

function TabPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onChange: (page: number) => void;
}) {
  if (totalItems <= pageSize) {
    return null;
  }

  const range = getPageRange(totalItems, page, pageSize);

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-divider pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-default-500 sm:text-sm">
        Mostrando {range.start}-{range.end} de {totalItems} {itemLabel}
      </p>
      <Pagination
        color="primary"
        isCompact
        page={page}
        showControls
        size="sm"
        total={totalPages}
        onChange={onChange}
      />
    </div>
  );
}

function formatDate(value?: DateInput) {
  if (!value) {
    return "Não informada";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Data inválida";
  }

  return parsed.toLocaleDateString("pt-BR");
}

function formatDateTime(value?: DateInput) {
  if (!value) {
    return "Não informada";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Data inválida";
  }

  return parsed.toLocaleString("pt-BR");
}

function getNomeCompleto(advogado: AdvogadoProfileData) {
  const firstName = advogado.usuario.firstName || "";
  const lastName = advogado.usuario.lastName || "";

  return `${firstName} ${lastName}`.trim() || "Nome não informado";
}

function getIniciais(nome: string) {
  const parts = nome.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return nome.slice(0, 2).toUpperCase();
}

function getOAB(advogado: AdvogadoProfileData) {
  if (advogado.oabNumero && advogado.oabUf) {
    return `${advogado.oabUf}/${advogado.oabNumero}`;
  }

  return "Não informada";
}

function getEspecialidadeColor(especialidade: EspecialidadeJuridica) {
  const colors: Record<string, string> = {
    CIVIL: "primary",
    CRIMINAL: "danger",
    TRABALHISTA: "warning",
    TRIBUTARIO: "secondary",
    ADMINISTRATIVO: "success",
    CONSTITUCIONAL: "default",
    EMPRESARIAL: "primary",
    FAMILIA: "secondary",
    CONSUMIDOR: "warning",
    AMBIENTAL: "success",
    PREVIDENCIARIO: "default",
    ELETORAL: "primary",
    MILITAR: "danger",
    INTERNACIONAL: "success",
    OUTROS: "default",
  };

  return (colors[especialidade] || "default") as never;
}

function getStatusColor(active: boolean) {
  return active ? "success" : "danger";
}

function getStatusText(active: boolean) {
  return active ? "Ativo" : "Inativo";
}

function getChipStatusColor(status: string) {
  switch (status) {
    case "ATIVO":
    case "ATIVA":
    case "VIGENTE":
    case "EM_ANDAMENTO":
    case "ABERTO":
    case "PENDENTE":
      return "success";
    case "ARQUIVADO":
    case "INATIVO":
    case "CONCLUIDO":
    case "CONCLUÍDO":
    case "CANCELADO":
    case "CANCELADA":
      return "default";
    case "SUSPENSO":
    case "AGUARDANDO":
      return "warning";
    default:
      return "primary";
  }
}

function getTipoContaLabel(tipo: string) {
  switch (tipo) {
    case "PESSOA_FISICA":
      return "Pessoa Física";
    case "PESSOA_JURIDICA":
      return "Pessoa Jurídica";
    default:
      return tipo || "Tipo não informado";
  }
}

function getTipoContaBancariaLabel(tipo: string) {
  switch (tipo) {
    case "CORRENTE":
      return "Corrente";
    case "POUPANCA":
      return "Poupança";
    case "SALARIO":
      return "Salário";
    case "INVESTIMENTO":
      return "Investimento";
    default:
      return tipo || "Conta";
  }
}

function getTipoEnderecoLabel(tipo: string) {
  if (!tipo) {
    return "Endereço";
  }

  return tipo.replaceAll("_", " ");
}

export default function AdvogadoProfileContent({ advogadoId }: AdvogadoProfileContentProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [clientesPage, setClientesPage] = useState(1);
  const [processosPage, setProcessosPage] = useState(1);
  const [contratosPage, setContratosPage] = useState(1);
  const [procuracoesPage, setProcuracoesPage] = useState(1);
  const [tarefasPage, setTarefasPage] = useState(1);
  const [eventosPage, setEventosPage] = useState(1);
  const [assinaturasPage, setAssinaturasPage] = useState(1);

  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isNotificacoesModalOpen, setIsNotificacoesModalOpen] = useState(false);

  const { data, error, isLoading } = useSWR<ActionResponse<AdvogadoProfileData>>(
    ["advogado-perfil", advogadoId],
    () => getAdvogadoPerfilById(advogadoId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  const { data: dataCompleto, isLoading: isLoadingCompleto } = useSWR<
    ActionResponse<AdvogadoCompleto>
  >(
    ["advogado-completo", advogadoId],
    () => getAdvogadoCompleto(advogadoId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  const isLoadingAll = isLoading || isLoadingCompleto;

  const advogado = useMemo<AdvogadoProfileFull | null>(() => {
    if (!data?.success || !data.data) {
      return null;
    }

    const base = data.data;
    const completo = dataCompleto?.success ? dataCompleto.data : null;

    if (!completo) {
      return {
        ...base,
        enderecos: [],
        dadosBancarios: [],
      } as AdvogadoProfileFull;
    }

    return {
      ...base,
      enderecos: completo.enderecos || [],
      dadosBancarios: completo.dadosBancarios || [],
    };
  }, [data?.success, data?.data, dataCompleto]);

  const { performance, isLoading: isLoadingPerformance } = useAdvogadoPerformance(
    advogado?.id || "",
    undefined,
    { enabled: activeTab === "overview" || activeTab === "performance" },
  );

  const { comissoes, isLoading: isLoadingComissoes } = useAdvogadoComissoes(
    advogado?.id || "",
    undefined,
    { enabled: activeTab === "overview" || activeTab === "comissoes" },
  );

  const { notificacoes, isLoading: isLoadingNotificacoes } = useNotificacoesAdvogado(
    advogado?.id || "",
    { enabled: activeTab === "notificacoes" },
  );

  const totalNotificacoesNaoLidas = (notificacoes || []).filter(
    (n) => !n.lida,
  ).length;

  const clientesVinculados = useMemo(
    () => (advogado?.clientesVinculados || []),
    [advogado],
  );
  const processos = useMemo(() => (advogado?.processos || []), [advogado]);
  const contratos = useMemo(() => (advogado?.contratos || []), [advogado]);
  const procuracoes = useMemo(() => (advogado?.procuracoes || []), [advogado]);
  const tarefas = useMemo(() => (advogado?.tarefas || []), [advogado]);
  const eventos = useMemo(() => (advogado?.eventos || []), [advogado]);
  const assinaturas = useMemo(
    () => (advogado?.documentoAssinaturas || []),
    [advogado],
  );
  const enderecos = useMemo(() => (advogado?.enderecos || []), [advogado]);
  const dadosBancarios = useMemo(
    () => (advogado?.dadosBancarios || []),
    [advogado],
  );

  const clientesTotalPages = useMemo(
    () => getTotalPages(clientesVinculados.length, TAB_PAGE_SIZES.clientes),
    [clientesVinculados.length],
  );
  const processosTotalPages = useMemo(
    () => getTotalPages(processos.length, TAB_PAGE_SIZES.processos),
    [processos.length],
  );
  const contratosTotalPages = useMemo(
    () => getTotalPages(contratos.length, TAB_PAGE_SIZES.contratos),
    [contratos.length],
  );
  const procuracoesTotalPages = useMemo(
    () => getTotalPages(procuracoes.length, TAB_PAGE_SIZES.procuracoes),
    [procuracoes.length],
  );
  const tarefasTotalPages = useMemo(
    () => getTotalPages(tarefas.length, TAB_PAGE_SIZES.tarefas),
    [tarefas.length],
  );
  const eventosTotalPages = useMemo(
    () => getTotalPages(eventos.length, TAB_PAGE_SIZES.eventos),
    [eventos.length],
  );
  const assinaturasTotalPages = useMemo(
    () => getTotalPages(assinaturas.length, TAB_PAGE_SIZES.assinaturas),
    [assinaturas.length],
  );

  const clientesPageItems = paginateItems(
    clientesVinculados,
    clientesPage,
    TAB_PAGE_SIZES.clientes,
  );
  const processosPageItems = paginateItems(
    processos,
    processosPage,
    TAB_PAGE_SIZES.processos,
  );
  const contratosPageItems = paginateItems(
    contratos,
    contratosPage,
    TAB_PAGE_SIZES.contratos,
  );
  const procuracoesPageItems = paginateItems(
    procuracoes,
    procuracoesPage,
    TAB_PAGE_SIZES.procuracoes,
  );
  const tarefasPageItems = paginateItems(
    tarefas,
    tarefasPage,
    TAB_PAGE_SIZES.tarefas,
  );
  const eventosPageItems = paginateItems(
    eventos,
    eventosPage,
    TAB_PAGE_SIZES.eventos,
  );
  const assinaturasPageItems = paginateItems(
    assinaturas,
    assinaturasPage,
    TAB_PAGE_SIZES.assinaturas,
  );

  useEffect(() => {
    setClientesPage(1);
    setProcessosPage(1);
    setContratosPage(1);
    setProcuracoesPage(1);
    setTarefasPage(1);
    setEventosPage(1);
    setAssinaturasPage(1);
  }, [activeTab]);

  useEffect(() => {
    setClientesPage((prev) => Math.min(prev, clientesTotalPages));
  }, [clientesTotalPages]);

  useEffect(() => {
    setProcessosPage((prev) => Math.min(prev, processosTotalPages));
  }, [processosTotalPages]);

  useEffect(() => {
    setContratosPage((prev) => Math.min(prev, contratosTotalPages));
  }, [contratosTotalPages]);

  useEffect(() => {
    setProcuracoesPage((prev) => Math.min(prev, procuracoesTotalPages));
  }, [procuracoesTotalPages]);

  useEffect(() => {
    setTarefasPage((prev) => Math.min(prev, tarefasTotalPages));
  }, [tarefasTotalPages]);

  useEffect(() => {
    setEventosPage((prev) => Math.min(prev, eventosTotalPages));
  }, [eventosTotalPages]);

  useEffect(() => {
    setAssinaturasPage((prev) => Math.min(prev, assinaturasTotalPages));
  }, [assinaturasTotalPages]);

  if (isLoadingAll) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-default-500">Carregando perfil do advogado...</p>
      </div>
    );
  }

  if (error || !advogado || !data?.success) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
        <div className="rounded-full bg-danger/10 p-3 text-danger">
          <XCircle className="h-6 w-6" />
        </div>
        <h4 className="text-lg font-semibold">Não foi possível abrir o perfil</h4>
        <p className="text-sm text-default-500">
          {error?.message || data?.error || "Verifique a permissão ou o ID informado."}
        </p>
        <Button
          as={Link}
          href="/advogados"
          color="primary"
          variant="flat"
        >
          Voltar para Advogados
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-6 pt-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            as={Link}
            href="/advogados"
            startContent={<ArrowLeft className="h-4 w-4" />}
            variant="light"
          >
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Detalhes do Advogado</h1>
            <p className="text-sm text-default-500">
              Visão completa, relações e trilha de execução.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            color="primary"
            startContent={<History className="h-4 w-4" />}
            variant="flat"
            onPress={() => setIsHistoricoModalOpen(true)}
          >
            Histórico
          </Button>
          <Button
            color="secondary"
            startContent={<Bell className="h-4 w-4" />}
            variant="flat"
            onPress={() => setIsNotificacoesModalOpen(true)}
          >
            Notificações
            {totalNotificacoesNaoLidas > 0 ? (
              <Badge
                color="danger"
                content={totalNotificacoesNaoLidas}
                size="sm"
              >
                <span />
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      <Card className="border border-default-200">
        <CardBody className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <Avatar
                className="h-20 w-20 text-large"
                name={getIniciais(getNomeCompleto(advogado))}
                src={advogado.usuario.avatarUrl || undefined}
              />
              <div className="text-center lg:text-left">
                <h2 className="text-lg font-bold">{getNomeCompleto(advogado)}</h2>
                <p className="text-sm text-default-500">OAB {getOAB(advogado)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <Chip
                  color={getStatusColor(advogado.usuario.active)}
                  size="sm"
                  variant="flat"
                >
                  {getStatusText(advogado.usuario.active)}
                </Chip>
                {advogado.isExterno && (
                  <Chip color="warning" size="sm" variant="flat">
                    Externo
                  </Chip>
                )}
              </div>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-default-200 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-default-500">CPF</p>
                <p className="mt-1 text-sm font-semibold break-all">
                  {advogado.usuario.cpf || "Não informado"}
                </p>
              </div>
              <div className="rounded-lg border border-default-200 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-default-500">Email</p>
                <p className="mt-1 text-sm font-semibold break-all">
                  {advogado.usuario.email}
                </p>
              </div>
              <div className="rounded-lg border border-default-200 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-default-500">Telefone</p>
                <p className="mt-1 text-sm font-semibold">
                  {advogado.usuario.phone || advogado.telefone || "Não informado"}
                </p>
              </div>
              <div className="rounded-lg border border-default-200 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-default-500">WhatsApp</p>
                <p className="mt-1 text-sm font-semibold">
                  {advogado.whatsapp || "Não informado"}
                </p>
              </div>
              <div className="rounded-lg border border-default-200 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-default-500">Cadastro</p>
                <p className="mt-1 text-sm font-semibold">
                  {formatDate(advogado.usuario.createdAt)}
                </p>
              </div>
              <div className="rounded-lg border border-default-200 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-default-500">Tipo</p>
                <p className="mt-1 text-sm font-semibold">
                  {advogado.isExterno ? "Externo" : "Interno"}
                </p>
              </div>
            </div>
          </div>

          <Divider className="my-4" />

          <div className="space-y-3">
            <p className="text-sm font-semibold">Especialidades</p>
            {advogado.especialidades.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {advogado.especialidades.map((especialidade) => (
                  <Chip
                    key={especialidade}
                    color={getEspecialidadeColor(especialidade)}
                    size="sm"
                    variant="flat"
                  >
                    {especialidade.replaceAll("_", " ")}
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Nenhuma especialidade cadastrada.
              </p>
            )}
          </div>

          {advogado.bio ? (
            <>
              <Divider className="my-4" />
              <div>
                <p className="text-sm font-semibold">Biografia</p>
                <p className="mt-1 text-sm text-default-600">{advogado.bio}</p>
              </div>
            </>
          ) : null}
        </CardBody>
      </Card>

      <Tabs
        aria-label="Detalhes do advogado"
        color="primary"
        selectedKey={activeTab}
        variant="underlined"
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
          <Tab
            key="overview"
            title={<div className="flex items-center gap-2">Visão geral</div>}
          >
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <Scale className="h-4 w-4" />
                    <p className="text-sm">Processos</p>
                  </div>
                  <p className="text-2xl font-bold">{processos.length}</p>
                  <p className="text-xs text-default-500">Total de vínculos</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <Briefcase className="h-4 w-4" />
                    <p className="text-sm">Contratos</p>
                  </div>
                  <p className="text-2xl font-bold">{contratos.length}</p>
                  <p className="text-xs text-default-500">Responsável / vinculado</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <FileSignature className="h-4 w-4" />
                    <p className="text-sm">Procurações</p>
                  </div>
                  <p className="text-2xl font-bold">{procuracoes.length}</p>
                  <p className="text-xs text-default-500">Em carteira</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <Users className="h-4 w-4" />
                    <p className="text-sm">Clientes</p>
                  </div>
                  <p className="text-2xl font-bold">{clientesVinculados.length}</p>
                  <p className="text-xs text-default-500">Vínculos ativos</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <CalendarDays className="h-4 w-4" />
                    <p className="text-sm">Eventos</p>
                  </div>
                  <p className="text-2xl font-bold">{eventos.length}</p>
                  <p className="text-xs text-default-500">Relacionados no período</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <CheckCircle className="h-4 w-4" />
                    <p className="text-sm">Tarefas</p>
                  </div>
                  <p className="text-2xl font-bold">{tarefas.length}</p>
                  <p className="text-xs text-default-500">Pendentes + concluídas</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-sm">Assinaturas</p>
                  </div>
                  <p className="text-2xl font-bold">{assinaturas.length}</p>
                  <p className="text-xs text-default-500">Fluxos de assinatura</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <Building2 className="h-4 w-4" />
                    <p className="text-sm">Endereços</p>
                  </div>
                  <p className="text-2xl font-bold">{enderecos.length}</p>
                  <p className="text-xs text-default-500">Cadastro de endereço</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <Wallet className="h-4 w-4" />
                    <p className="text-sm">Contas bancárias</p>
                  </div>
                  <p className="text-2xl font-bold">{dadosBancarios.length}</p>
                  <p className="text-xs text-default-500">Dados bancários</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <DollarSign className="h-4 w-4" />
                    <p className="text-sm">Comissões (estim.)</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {isLoadingComissoes
                      ? "..."
                      : `R$ ${comissoes?.comissaoCalculada?.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        }) || "0,00"}`}
                  </p>
                  <p className="text-xs text-default-500">Total calculado</p>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardBody className="space-y-1">
                  <div className="flex items-center gap-2 text-default-500">
                    <TrendingUp className="h-4 w-4" />
                    <p className="text-sm">Taxa sucesso</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {isLoadingPerformance
                      ? "..."
                      : `${performance?.taxaSucesso || 0}%`}
                  </p>
                  <p className="text-xs text-default-500">Processos em andamento</p>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab
            key="cadastro"
            title={
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Cadastro</span>
              </div>
            }
          >
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Card className="border border-default-200">
                <CardHeader>
                  <p className="text-sm font-semibold">Dados pessoais</p>
                </CardHeader>
                <Divider />
                    <CardBody className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Mail className="mt-0.5 h-4 w-4 text-default-400" />
                    <div>
                      <p className="text-xs uppercase text-default-500">Email de login</p>
                      <p className="font-medium">{advogado.usuario.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="mt-0.5 h-4 w-4 text-default-400" />
                    <div>
                      <p className="text-xs uppercase text-default-500">Usuário criado</p>
                      <p className="font-medium">{formatDate(advogado.usuario.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Phone className="mt-0.5 h-4 w-4 text-default-400" />
                    <div>
                      <p className="text-xs uppercase text-default-500">RG / CPF</p>
                      <p className="font-medium">
                        {advogado.usuario.rg || "-"} / {advogado.usuario.cpf || "-"}
                      </p>
                    </div>
                  </div>
                  {advogado.usuario.observacoes ? (
                    <div className="rounded-md bg-default-50 p-2 text-sm text-default-700">
                      <p className="text-xs uppercase text-default-500">Observações</p>
                      <p className="mt-1">{advogado.usuario.observacoes}</p>
                    </div>
                  ) : null}
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardHeader>
                  <p className="text-sm font-semibold">Configurações de acesso e operação</p>
                </CardHeader>
                <Divider />
                <CardBody className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-default-500">Notificações</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Chip color={advogado.notificarEmail ? "success" : "default"} size="sm" variant="flat">
                        Email
                      </Chip>
                      <Chip color={advogado.notificarWhatsapp ? "success" : "default"} size="sm" variant="flat">
                        WhatsApp
                      </Chip>
                      <Chip color={advogado.notificarSistema ? "success" : "default"} size="sm" variant="flat">
                        Sistema
                      </Chip>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-default-500">Permissões</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Chip color={advogado.podeCriarProcessos ? "success" : "default"} size="sm" variant="flat">
                        Criar processos
                      </Chip>
                      <Chip color={advogado.podeEditarProcessos ? "success" : "default"} size="sm" variant="flat">
                        Editar processos
                      </Chip>
                      <Chip color={advogado.podeGerenciarClientes ? "success" : "default"} size="sm" variant="flat">
                        Gerenciar clientes
                      </Chip>
                      <Chip color={advogado.podeAcessarFinanceiro ? "success" : "default"} size="sm" variant="flat">
                        Financeiro
                      </Chip>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase text-default-500">Comissões</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-md border border-default-200 p-2">
                        <p className="text-xs text-default-500">Padrão</p>
                        <p className="text-sm font-semibold">{advogado.comissaoPadrao}%</p>
                      </div>
                      <div className="rounded-md border border-default-200 p-2">
                        <p className="text-xs text-default-500">Ação ganha</p>
                        <p className="text-sm font-semibold">{advogado.comissaoAcaoGanha}%</p>
                      </div>
                      <div className="rounded-md border border-default-200 p-2">
                        <p className="text-xs text-default-500">Honorários</p>
                        <p className="text-sm font-semibold">{advogado.comissaoHonorarios}%</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardHeader>
                  <p className="text-sm font-semibold">Endereços</p>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-2">
                  {enderecos.length === 0 ? (
                    <p className="text-sm text-default-500">
                      Nenhum endereço cadastrado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {enderecos.map((endereco, index) => (
                        <div
                          key={`${endereco.apelido}-${endereco.cidade}-${endereco.estado}-${index}`}
                          className="rounded-md border border-default-200 p-2"
                        >
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              {endereco.apelido || "Endereço principal"}
                            </p>
                            <Chip
                              color={endereco.principal ? "success" : "default"}
                              size="sm"
                              variant="flat"
                            >
                              {endereco.principal ? "Principal" : "Secundário"}
                            </Chip>
                          </div>
                          <p className="text-xs text-default-500">
                            {getTipoEnderecoLabel(endereco.tipo)}
                          </p>
                          <p className="text-xs text-default-600">
                            {endereco.logradouro}
                            {endereco.numero ? `, ${endereco.numero}` : ""}
                            {endereco.complemento ? ` - ${endereco.complemento}` : ""}
                          </p>
                          <p className="text-xs text-default-500">
                            {endereco.bairro ? `${endereco.bairro}, ` : ""}
                            {endereco.cidade}/{endereco.estado}
                            {endereco.cep ? ` • CEP ${endereco.cep}` : ""}
                          </p>
                          {endereco.observacoes ? (
                            <p className="text-xs text-default-400">
                              {endereco.observacoes}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardHeader>
                  <p className="text-sm font-semibold">Dados bancários</p>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-2">
                  {dadosBancarios.length === 0 ? (
                    <p className="text-sm text-default-500">
                      Nenhum dado bancário cadastrado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dadosBancarios.map((conta, index) => (
                        <div
                          key={`${conta.bancoCodigo}-${conta.agencia}-${conta.conta}-${index}`}
                          className="rounded-md border border-default-200 p-2"
                        >
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <Chip color={conta.principal ? "success" : "default"} size="sm" variant="flat">
                              {conta.principal ? "Conta principal" : "Conta adicional"}
                            </Chip>
                            <div className="flex flex-wrap gap-1">
                              <Chip size="sm" variant="flat">
                                Banco {conta.bancoCodigo}
                              </Chip>
                              <Chip size="sm" variant="flat">
                                {getTipoContaLabel(conta.tipoConta)}
                              </Chip>
                            </div>
                          </div>
                          <p className="text-sm text-default-600">
                            {getTipoContaBancariaLabel(conta.tipoContaBancaria)}
                            {conta.agencia ? ` • Ag ${conta.agencia}` : ""}
                          </p>
                          <p className="text-sm text-default-700">
                            Conta {conta.conta}
                            {conta.digitoConta ? `-${conta.digitoConta}` : ""}
                          </p>
                          <p className="text-xs text-default-500">
                            Titular: {conta.titularNome || "Não informado"} ({conta.titularDocumento || "N/A"})
                          </p>
                          {conta.chavePix ? (
                            <p className="text-xs text-default-500">
                              PIX: {conta.tipoChavePix || "CHAVE"} {conta.chavePix}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab
            key="clientes"
            title={
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Clientes</span>
                {clientesVinculados.length > 0 ? (
                  <Chip color="primary" size="sm" variant="flat">
                    {clientesVinculados.length}
                  </Chip>
                ) : null}
              </div>
            }
          >
            <div className="mt-4">
              {clientesVinculados.length === 0 ? (
                <Card className="border border-default-200">
                  <CardBody className="py-8 text-center">
                    <Users className="mx-auto h-10 w-10 text-default-400" />
                    <p className="mt-3 text-sm text-default-500">Sem clientes vinculados</p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {clientesPageItems.map((item) => (
                      <Card
                        key={item.id}
                        as={Link}
                        className="border border-default-200 transition-all hover:border-primary hover:shadow-md"
                        href={`/clientes/${item.cliente.id}`}
                      >
                        <CardBody className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{item.cliente.nome}</p>
                              <p className="text-xs text-default-500">
                                {item.cliente.documento || "Documento não informado"}
                              </p>
                            </div>
                            <Chip color="primary" size="sm" variant="flat">
                              {item.relacionamento || "Vínculo"}
                            </Chip>
                          </div>
                          <div className="text-xs text-default-500">
                            {item.cliente.tipoPessoa || "Sem tipo"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-default-500">
                            <Calendar className="h-3 w-3" />
                            <span>Vinculado em {formatDate(item.createdAt)}</span>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <TabPagination
                    itemLabel="clientes"
                    page={clientesPage}
                    pageSize={TAB_PAGE_SIZES.clientes}
                    totalItems={clientesVinculados.length}
                    totalPages={clientesTotalPages}
                    onChange={setClientesPage}
                  />
                </>
              )}
            </div>
          </Tab>

          <Tab
            key="processos"
            title={
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                <span>Processos</span>
                {processos.length > 0 ? (
                  <Chip color="primary" size="sm" variant="flat">
                    {processos.length}
                  </Chip>
                ) : null}
              </div>
            }
          >
            <div className="mt-4">
              {processos.length === 0 ? (
                <Card className="border border-default-200">
                  <CardBody className="py-8 text-center">
                    <Scale className="mx-auto h-10 w-10 text-default-400" />
                    <p className="mt-3 text-sm text-default-500">Nenhum processo vinculado</p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {processosPageItems.map((processo) => (
                      <Card
                        key={processo.id}
                        className="border border-default-200 transition-all hover:border-primary hover:shadow-md"
                      >
                        <CardHeader className="flex-col gap-2 pb-1">
                          <div className="flex w-full items-start justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                              <Chip
                                color={getChipStatusColor(processo.status)}
                                size="sm"
                                variant="flat"
                              >
                                {processo.status}
                              </Chip>
                              {processo.fase ? (
                                <Chip color="default" size="sm" variant="flat">
                                  {processo.fase}
                                </Chip>
                              ) : null}
                              {processo.grau ? (
                                <Chip color="secondary" size="sm" variant="flat">
                                  {processo.grau}
                                </Chip>
                              ) : null}
                            </div>
                            <Chip color="primary" size="sm" variant="flat">
                              {processo.participacao}
                            </Chip>
                          </div>
                          <div>
                            <p className="font-semibold">{processo.numero}</p>
                            {processo.numeroCnj ? (
                              <p className="text-xs text-default-500">CNJ {processo.numeroCnj}</p>
                            ) : null}
                            {processo.titulo ? (
                              <p className="mt-1 text-xs text-default-600">{processo.titulo}</p>
                            ) : null}
                          </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Building2 className="h-3 w-3 text-default-400" />
                            <span>{processo.area?.nome || "Sem área"}</span>
                          </div>
                          {processo.cliente ? (
                            <div className="flex items-center gap-2 text-xs">
                              <Users className="h-3 w-3 text-default-400" />
                              <p className="text-default-600">
                                {processo.cliente.nome}
                              </p>
                            </div>
                          ) : null}
                          {processo.advogadoResponsavel ? (
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3 w-3 text-default-400" />
                              <p className="text-default-600">
                                {processo.advogadoResponsavel.usuario?.firstName}{" "}
                                {processo.advogadoResponsavel.usuario?.lastName}
                              </p>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Chip size="sm" variant="flat">
                              {processo._count.documentos} docs
                            </Chip>
                            <Chip size="sm" variant="flat">
                              {processo._count.eventos} eventos
                            </Chip>
                            <Chip size="sm" variant="flat">
                              {processo._count.movimentacoes} movs
                            </Chip>
                            <Chip size="sm" variant="flat">
                              {processo._count.tarefas} tarefas
                            </Chip>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              className="text-xs"
                              color="primary"
                              size="sm"
                              startContent={<Eye className="h-3 w-3" />}
                              variant="flat"
                              onPress={() => router.push(`/processos/${processo.id}`)}
                            >
                              Abrir processo
                            </Button>
                            {processo.cliente ? (
                              <Button
                                className="text-xs"
                                size="sm"
                                variant="light"
                                onPress={() => router.push(`/clientes/${processo.cliente.id}`)}
                              >
                                Abrir cliente
                              </Button>
                            ) : null}
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <TabPagination
                    itemLabel="processos"
                    page={processosPage}
                    pageSize={TAB_PAGE_SIZES.processos}
                    totalItems={processos.length}
                    totalPages={processosTotalPages}
                    onChange={setProcessosPage}
                  />
                </>
              )}
            </div>
          </Tab>

          <Tab
            key="contratos"
            title={
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Contratos</span>
                {contratos.length > 0 ? (
                  <Chip color="primary" size="sm" variant="flat">
                    {contratos.length}
                  </Chip>
                ) : null}
              </div>
            }
          >
            <div className="mt-4">
              {contratos.length === 0 ? (
                <Card className="border border-default-200">
                  <CardBody className="py-8 text-center">
                    <FileText className="mx-auto h-10 w-10 text-default-400" />
                    <p className="mt-3 text-sm text-default-500">Sem contratos vinculados</p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {contratosPageItems.map((contrato) => (
                      <Card
                        as={Link}
                        href={`/contratos/${contrato.id}`}
                        key={contrato.id}
                        className="cursor-pointer border border-default-200 transition-all hover:border-primary hover:shadow-md"
                      >
                        <CardBody className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{contrato.titulo}</p>
                              <p className="text-xs text-default-500">
                                {contrato.tipo?.nome || "Contrato sem tipo"}
                              </p>
                            </div>
                            <Chip color={getChipStatusColor(contrato.status)} size="sm" variant="flat">
                              {contrato.status}
                            </Chip>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Chip size="sm" variant="flat">
                              {contrato._count?.documentos || 0} documentos
                            </Chip>
                            <Chip size="sm" variant="flat">
                              {contrato._count?.faturas || 0} faturas
                            </Chip>
                            <Chip size="sm" variant="flat">
                              {contrato._count?.parcelas || 0} parcelas
                            </Chip>
                            <Chip size="sm" variant="flat">
                              {contrato._count?.honorarios || 0} honorários
                            </Chip>
                          </div>

                          <div className="grid gap-1 text-xs text-default-600 sm:grid-cols-2">
                            <p>Cliente: {contrato.cliente?.nome || "Sem cliente"}</p>
                            <p>Valor: {contrato.valor ? `R$ ${Number(contrato.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00"}</p>
                            <p>Início: {formatDate(contrato.dataInicio)}</p>
                            <p>Assinatura: {formatDate(contrato.dataAssinatura)}</p>
                            <p>Processo: {contrato.processo?.numero || "N/D"}</p>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <TabPagination
                    itemLabel="contratos"
                    page={contratosPage}
                    pageSize={TAB_PAGE_SIZES.contratos}
                    totalItems={contratos.length}
                    totalPages={contratosTotalPages}
                    onChange={setContratosPage}
                  />
                </>
              )}
            </div>
          </Tab>

          <Tab
            key="procuracoes"
            title={
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                <span>Procurações</span>
                {procuracoes.length > 0 ? (
                  <Chip color="success" size="sm" variant="flat">
                    {procuracoes.length}
                  </Chip>
                ) : null}
              </div>
            }
          >
            <div className="mt-4">
              {procuracoes.length === 0 ? (
                <Card className="border border-default-200">
                  <CardBody className="py-8 text-center">
                    <FileSignature className="mx-auto h-10 w-10 text-default-400" />
                    <p className="mt-3 text-sm text-default-500">Sem procurações vinculadas</p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {procuracoesPageItems.map((procuracao) => (
                      <Card
                        as={Link}
                        href={`/procuracoes/${procuracao.id}`}
                        key={procuracao.id}
                        className="border border-default-200 transition-all hover:border-success hover:shadow-md"
                      >
                        <CardHeader className="pb-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">Procuração {procuracao.numero || procuracao.id.slice(0, 8)}</p>
                              <p className="text-xs text-default-500">{procuracao.cliente?.nome || "Cliente não informado"}</p>
                            </div>
                            <Chip
                              color={procuracao.ativa ? "success" : "default"}
                              size="sm"
                              variant="flat"
                            >
                              {procuracao.ativa ? "Ativa" : "Inativa"}
                            </Chip>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Chip color={getChipStatusColor(procuracao.status)} size="sm" variant="flat">
                              {procuracao.status}
                            </Chip>
                            {procuracao.emitidaEm ? (
                              <Chip size="sm" variant="flat">
                                Emitida {formatDate(procuracao.emitidaEm)}
                              </Chip>
                            ) : null}
                          </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Chip size="sm" variant="flat">{procuracao._count.poderes} poderes</Chip>
                            <Chip size="sm" variant="flat">{procuracao.processos.length} processos</Chip>
                            <Chip size="sm" variant="flat">{procuracao._count.assinaturas} assinaturas</Chip>
                          </div>
                          <div className="text-xs text-default-500">
                            Outorgados: {procuracao.outorgados.length || 0}
                          </div>
                          {procuracao.cliente?.id ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                as={Link}
                                href={`/clientes/${procuracao.cliente.id}`}
                                size="sm"
                                variant="flat"
                              >
                                Cliente
                              </Button>
                              {procuracao.processos.length > 0 ? (
                                <Button
                                  as={Link}
                                  href={`/processos/${procuracao.processos[0].processo.id}`}
                                  size="sm"
                                  variant="light"
                                >
                                  Processo principal
                                </Button>
                              ) : null}
                            </div>
                          ) : null}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <TabPagination
                    itemLabel="procurações"
                    page={procuracoesPage}
                    pageSize={TAB_PAGE_SIZES.procuracoes}
                    totalItems={procuracoes.length}
                    totalPages={procuracoesTotalPages}
                    onChange={setProcuracoesPage}
                  />
                </>
              )}
            </div>
          </Tab>

          <Tab
            key="tarefas"
            title={
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Tarefas</span>
                {tarefas.length > 0 ? (
                  <Chip color="primary" size="sm" variant="flat">
                    {tarefas.length}
                  </Chip>
                ) : null}
              </div>
            }
          >
            <div className="mt-4">
              {tarefas.length === 0 ? (
                <Card className="border border-default-200">
                  <CardBody className="py-8 text-center">
                    <MessageSquareText className="mx-auto h-10 w-10 text-default-400" />
                    <p className="mt-3 text-sm text-default-500">Sem tarefas vinculadas</p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tarefasPageItems.map((tarefa) => (
                      <Card key={tarefa.id} className="border border-default-200">
                        <CardBody className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold">{tarefa.titulo}</p>
                            <Chip
                              color={getChipStatusColor(tarefa.status)}
                              size="sm"
                              variant="flat"
                            >
                              {tarefa.status}
                            </Chip>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tarefa.prioridade ? (
                              <Chip size="sm" variant="flat">Prioridade: {tarefa.prioridade}</Chip>
                            ) : null}
                            {tarefa.dataLimite ? (
                              <Chip size="sm" variant="flat">
                                Limite: {formatDate(tarefa.dataLimite)}
                              </Chip>
                            ) : null}
                          </div>
                          <p className="text-xs text-default-500">
                            Processo: {tarefa.processo?.numero || "Não informado"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {tarefa.processo ? (
                              <Button
                                as={Link}
                                href={`/processos/${tarefa.processo.id}`}
                                size="sm"
                                variant="light"
                              >
                                Processo
                              </Button>
                              ) : null}
                            {tarefa.cliente ? (
                              <Button
                                as={Link}
                                href={`/clientes/${tarefa.cliente.id}`}
                                size="sm"
                                variant="light"
                              >
                                Cliente
                              </Button>
                            ) : null}
                            <Button
                              as={Link}
                              href="/tarefas"
                              size="sm"
                              variant="light"
                              startContent={<Eye className="h-4 w-4" />}
                            >
                              Abrir tarefas
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <TabPagination
                    itemLabel="tarefas"
                    page={tarefasPage}
                    pageSize={TAB_PAGE_SIZES.tarefas}
                    totalItems={tarefas.length}
                    totalPages={tarefasTotalPages}
                    onChange={setTarefasPage}
                  />
                </>
              )}
            </div>
          </Tab>

          <Tab
            key="operacao"
            title={
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Operação</span>
              </div>
            }
          >
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Card className="border border-default-200">
                <CardHeader>
                  <p className="text-sm font-semibold">Indicadores de performance</p>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-default-200 p-2">
                    <p className="text-sm">Processos em andamento</p>
                    <p className="text-sm font-semibold">
                      {performance?.processosAtivos || 0} de {performance?.totalProcessos || 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-default-200 p-2">
                    <p className="text-sm">Processos finalizados</p>
                    <p className="text-sm font-semibold">
                      {performance?.processosFinalizados || 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-default-200 p-2">
                    <p className="text-sm">Última atividade</p>
                    <p className="text-sm font-semibold">
                      {formatDate(performance?.ultimaAtividade)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-default-200 p-2">
                    <p className="text-sm">Tempo médio do ciclo (dias)</p>
                    <p className="text-sm font-semibold">
                      {performance?.tempoMedioProcesso || 0}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-default-200">
                <CardHeader>
                  <p className="text-sm font-semibold">Comissões</p>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-default-200 p-2">
                    <p className="text-sm">Comissão calculada</p>
                    <p className="text-sm font-semibold">
                      {isLoadingComissoes
                        ? "..."
                        : `R$ ${Number(comissoes?.comissaoCalculada || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-default-200 p-2">
                    <p className="text-sm">Comissão paga</p>
                    <p className="text-sm font-semibold">
                      {`R$ ${Number(comissoes?.comissaoPaga || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-default-200 p-2">
                    <p className="text-sm">Comissão pendente</p>
                    <p className="text-sm font-semibold">
                      {`R$ ${Number(comissoes?.comissaoPendente || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-default-200 p-2">
                    <p className="text-sm">Status da comissão</p>
                    <Chip
                      color={
                        comissoes?.statusComissao === "ATRASADO"
                          ? "danger"
                          : comissoes?.statusComissao === "PENDENTE"
                            ? "warning"
                            : "success"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {comissoes?.statusComissao || "EM DIA"}
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab
            key="eventos"
            title={
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Eventos</span>
                {eventos.length > 0 ? (
                  <Chip color="warning" size="sm" variant="flat">
                    {eventos.length}
                  </Chip>
                ) : null}
              </div>
            }
          >
            <div className="mt-4">
              {eventos.length === 0 ? (
                <Card className="border border-default-200">
                  <CardBody className="py-8 text-center">
                    <CalendarDays className="mx-auto h-10 w-10 text-default-400" />
                    <p className="mt-3 text-sm text-default-500">Sem eventos vinculados</p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {eventosPageItems.map((evento) => (
                      <Card key={evento.id} className="border border-default-200">
                        <CardBody className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{evento.titulo}</p>
                              <p className="text-xs text-default-500">
                                {formatDateTime(evento.dataInicio)} - {formatDateTime(evento.dataFim)}
                              </p>
                            </div>
                            <Chip color={getChipStatusColor(evento.status)} size="sm" variant="flat">
                              {evento.status}
                            </Chip>
                          </div>
                          <p className="text-xs text-default-600">Tipo: {evento.tipo}</p>
                          <div className="flex flex-wrap gap-2">
                            {evento.cliente ? (
                              <Button
                                as={Link}
                                href={`/clientes/${evento.cliente.id}`}
                                size="sm"
                                variant="flat"
                              >
                                Cliente
                              </Button>
                            ) : null}
                            {evento.processo ? (
                              <Button
                                as={Link}
                                href={`/processos/${evento.processo.id}`}
                                size="sm"
                                variant="flat"
                              >
                                Processo
                              </Button>
                            ) : null}
                            <Button
                              as={Link}
                              href={`/agenda?evento=${evento.id}`}
                              size="sm"
                              variant="light"
                              startContent={<Eye className="h-3 w-3" />}
                            >
                              Abrir na agenda
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <TabPagination
                    itemLabel="eventos"
                    page={eventosPage}
                    pageSize={TAB_PAGE_SIZES.eventos}
                    totalItems={eventos.length}
                    totalPages={eventosTotalPages}
                    onChange={setEventosPage}
                  />
                </>
              )}
            </div>
          </Tab>

          <Tab
            key="assinaturas"
            title={
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span>Assinaturas</span>
                {assinaturas.length > 0 ? (
                  <Chip color="success" size="sm" variant="flat">
                    {assinaturas.length}
                  </Chip>
                ) : null}
              </div>
            }
          >
            <div className="mt-4">
              {assinaturas.length === 0 ? (
                <Card className="border border-default-200">
                  <CardBody className="py-8 text-center">
                    <Wallet className="mx-auto h-10 w-10 text-default-400" />
                    <p className="mt-3 text-sm text-default-500">Sem assinaturas de documentos</p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {assinaturasPageItems.map((assinatura) => (
                      <Card key={assinatura.id} className="border border-default-200">
                        <CardBody className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{assinatura.titulo}</p>
                              <p className="text-xs text-default-500">Documento: {assinatura.documento?.nome || "N/D"}</p>
                            </div>
                            <Chip color={getChipStatusColor(assinatura.status)} size="sm" variant="flat">
                              {assinatura.status}
                            </Chip>
                          </div>
                          <div className="grid gap-1 text-xs text-default-500 sm:grid-cols-2">
                            <p>Processo: {assinatura.processo?.numero || "Sem processo"}</p>
                            <p>Cliente: {assinatura.cliente?.nome || "Sem cliente"}</p>
                            <p>Enviado: {formatDateTime(assinatura.dataEnvio)}</p>
                            <p>Assinado: {formatDateTime(assinatura.dataAssinatura)}</p>
                            <p>Expira: {formatDateTime(assinatura.dataExpiracao)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {assinatura.urlDocumento ? (
                              <Button
                                as="a"
                                href={assinatura.urlDocumento}
                                rel="noopener noreferrer"
                                size="sm"
                                target="_blank"
                                variant="flat"
                                startContent={<Eye className="h-3 w-3" />}
                              >
                                Abrir documento
                              </Button>
                            ) : null}
                            {assinatura.urlAssinado ? (
                              <Button
                                as="a"
                                href={assinatura.urlAssinado}
                                rel="noopener noreferrer"
                                size="sm"
                                target="_blank"
                                variant="flat"
                                startContent={<Eye className="h-3 w-3" />}
                              >
                                Abrir assinado
                              </Button>
                            ) : null}
                            {assinatura.processo ? (
                              <Button
                                as={Link}
                                href={`/processos/${assinatura.processo.id}`}
                                size="sm"
                                variant="light"
                              >
                                Processo
                              </Button>
                            ) : null}
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <TabPagination
                    itemLabel="assinaturas"
                    page={assinaturasPage}
                    pageSize={TAB_PAGE_SIZES.assinaturas}
                    totalItems={assinaturas.length}
                    totalPages={assinaturasTotalPages}
                    onChange={setAssinaturasPage}
                  />
                </>
              )}
            </div>
          </Tab>
        </Tabs>

      {isHistoricoModalOpen && advogado ? (
        <AdvogadoHistorico
          advogadoId={advogado.id}
          advogadoNome={getNomeCompleto(advogado)}
          isOpen={isHistoricoModalOpen}
          onClose={() => setIsHistoricoModalOpen(false)}
        />
      ) : null}

      {isNotificacoesModalOpen && advogado ? (
        <AdvogadoNotificacoes
          advogadoId={advogado.id}
          advogadoNome={getNomeCompleto(advogado)}
          isOpen={isNotificacoesModalOpen}
          onClose={() => setIsNotificacoesModalOpen(false)}
        />
      ) : null}

    </div>
  );
}
