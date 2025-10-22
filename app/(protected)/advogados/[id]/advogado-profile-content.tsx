"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Button, Avatar, Chip, Badge, Tabs, Tab, Spinner } from "@heroui/react";
import { ArrowLeft, Mail, Phone, Scale, Calendar, TrendingUp, DollarSign, Clock, XCircle, Bell, History, Edit, BarChart3 } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AdvogadoHistorico } from "../components/advogado-historico";
import { AdvogadoNotificacoes } from "../components/advogado-notificacoes";

import { getAdvogadoById } from "@/app/actions/advogados";
import { useAdvogadoPerformance } from "@/app/hooks/use-advogados-performance";
import { useAdvogadoComissoes } from "@/app/hooks/use-advogados-comissoes";
import { useNotificacoesAdvogado } from "@/app/hooks/use-advogados-notificacoes";
import { EspecialidadeJuridica } from "@/app/generated/prisma";

interface AdvogadoProfileContentProps {
  advogadoId: string;
}

export default function AdvogadoProfileContent({ advogadoId }: AdvogadoProfileContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isNotificacoesModalOpen, setIsNotificacoesModalOpen] = useState(false);

  const { data, error, isLoading } = useSWR(`advogado-${advogadoId}`, () => getAdvogadoById(advogadoId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const { performance, isLoading: isLoadingPerformance } = useAdvogadoPerformance(advogadoId);
  const { comissoes, isLoading: isLoadingComissoes } = useAdvogadoComissoes(advogadoId);
  const { notificacoes, isLoading: isLoadingNotificacoes } = useNotificacoesAdvogado(advogadoId);

  const advogado = data?.data;
  const loading = isLoading || !advogado;

  const getNomeCompleto = (advogado: any) => {
    return `${advogado.usuario?.firstName || ""} ${advogado.usuario?.lastName || ""}`.trim() || advogado.usuario?.email || "Advogado";
  };

  const getOAB = (advogado: any) => {
    return advogado.oabNumero && advogado.oabUf ? `${advogado.oabNumero}/${advogado.oabUf}` : "N/A";
  };

  const getStatusColor = (active: boolean) => {
    return active ? "success" : "danger";
  };

  const getStatusText = (active: boolean) => {
    return active ? "Ativo" : "Inativo";
  };

  const getEspecialidadeColor = (especialidade: EspecialidadeJuridica) => {
    const colors = {
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

    return colors[especialidade] || "default";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando perfil do advogado...</p>
      </div>
    );
  }

  if (error || !advogado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mb-4">
          <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Erro ao carregar perfil</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error?.message || "Advogado não encontrado"}</p>
        <Button as={Link} color="primary" href="/advogados">
          Voltar para Advogados
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button as={Link} href="/advogados" startContent={<ArrowLeft className="h-4 w-4" />} variant="light">
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Perfil do Advogado</h1>
              <p className="text-slate-600 dark:text-slate-400">Informações detalhadas e estatísticas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button color="primary" startContent={<History className="h-4 w-4" />} variant="light" onPress={() => setIsHistoricoModalOpen(true)}>
              Histórico
            </Button>
            <Button color="secondary" startContent={<Bell className="h-4 w-4" />} variant="light" onPress={() => setIsNotificacoesModalOpen(true)}>
              Notificações
              {notificacoes && notificacoes.filter((n) => !n.lida).length > 0 && (
                <Badge color="danger" content={notificacoes.filter((n) => !n.lida).length} size="sm">
                  {notificacoes.filter((n) => !n.lida).length}
                </Badge>
              )}
            </Button>
            <Button color="primary" startContent={<Edit className="h-4 w-4" />} onPress={() => router.push(`/advogados/${advogadoId}/edit`)}>
              Editar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Informações Básicas */}
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="shadow-lg border border-slate-200 dark:border-slate-700">
          <CardBody className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Avatar e Informações Principais */}
              <div className="flex flex-col items-center lg:items-start">
                <Avatar className="w-24 h-24 text-large mb-4" name={getNomeCompleto(advogado)} src={advogado.usuario.avatarUrl || undefined} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center lg:text-left">{getNomeCompleto(advogado)}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-center lg:text-left">OAB {getOAB(advogado)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Chip color={getStatusColor(advogado.usuario.active)} size="sm" variant="flat">
                    {getStatusText(advogado.usuario.active)}
                  </Chip>
                  {advogado.isExterno && (
                    <Chip color="warning" size="sm" variant="flat">
                      Externo
                    </Chip>
                  )}
                </div>
              </div>

              {/* Informações de Contato */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{advogado.usuario.email}</span>
                  </div>
                  {advogado.usuario.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{advogado.usuario.phone}</span>
                    </div>
                  )}
                  {advogado.telefone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{advogado.telefone}</span>
                    </div>
                  )}
                  {advogado.whatsapp && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{advogado.whatsapp}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Scale className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">OAB {getOAB(advogado)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Cadastrado em {advogado.usuario.createdAt ? new Date(advogado.usuario.createdAt).toLocaleDateString("pt-BR") : "Data não disponível"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Especialidades */}
            {advogado.especialidades && advogado.especialidades.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {advogado.especialidades.map((especialidade) => (
                    <Chip key={especialidade} color={getEspecialidadeColor(especialidade) as any} size="sm" variant="flat">
                      {especialidade.replace(/_/g, " ")}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {advogado.bio && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Biografia</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{advogado.bio}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Tabs de Conteúdo */}
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="shadow-lg border border-slate-200 dark:border-slate-700">
          <CardBody className="p-0">
            <Tabs
              className="w-full"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-6 h-12",
                tabContent: "group-data-[selected=true]:text-primary",
              }}
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
            >
              <Tab key="overview" title="Visão Geral">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Estatísticas Básicas */}
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-300 dark:border-blue-600">
                      <CardBody className="p-4 text-center">
                        <div className="p-2 bg-blue-500 rounded-full w-fit mx-auto mb-2">
                          <Scale className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-blue-800 dark:text-blue-200">{performance?.totalProcessos || 0}</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total de Processos</p>
                      </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-300 dark:border-green-600">
                      <CardBody className="p-4 text-center">
                        <div className="p-2 bg-green-500 rounded-full w-fit mx-auto mb-2">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-green-800 dark:text-green-200">{performance?.taxaSucesso || 0}%</h4>
                        <p className="text-sm text-green-600 dark:text-green-400">Taxa de Sucesso</p>
                      </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-300 dark:border-purple-600">
                      <CardBody className="p-4 text-center">
                        <div className="p-2 bg-purple-500 rounded-full w-fit mx-auto mb-2">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-purple-800 dark:text-purple-200">R$ {comissoes?.comissaoCalculada?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}</h4>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Comissões</p>
                      </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-300 dark:border-orange-600">
                      <CardBody className="p-4 text-center">
                        <div className="p-2 bg-orange-500 rounded-full w-fit mx-auto mb-2">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-orange-800 dark:text-orange-200">{performance?.tempoMedioProcesso || 0} dias</h4>
                        <p className="text-sm text-orange-600 dark:text-orange-400">Tempo Médio</p>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </Tab>

              <Tab key="performance" title="Performance">
                <div className="p-6">
                  {isLoadingPerformance ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : performance ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="p-4 text-center">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{performance.processosAtivos}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Processos Ativos</p>
                          </CardBody>
                        </Card>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="p-4 text-center">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{performance.processosFinalizados}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Processos Finalizados</p>
                          </CardBody>
                        </Card>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="p-4 text-center">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{performance.processosVencidos}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Processos Vencidos</p>
                          </CardBody>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhum dado de performance disponível</p>
                    </div>
                  )}
                </div>
              </Tab>

              <Tab key="commissions" title="Comissões">
                <div className="p-6">
                  {isLoadingComissoes ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : comissoes ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="p-4 text-center">
                            <h4 className="text-lg font-bold text-green-600 dark:text-green-400">R$ {comissoes.comissaoCalculada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Calculado</p>
                          </CardBody>
                        </Card>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="p-4 text-center">
                            <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              R${" "}
                              {comissoes.comissaoPaga.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Pago</p>
                          </CardBody>
                        </Card>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="p-4 text-center">
                            <h4 className="text-lg font-bold text-orange-600 dark:text-orange-400">R$ {comissoes.comissaoPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Pendente</p>
                          </CardBody>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <DollarSign className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhum dado de comissão disponível</p>
                    </div>
                  )}
                </div>
              </Tab>

              <Tab key="notifications" title="Notificações">
                <div className="p-6">
                  {isLoadingNotificacoes ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : notificacoes && notificacoes.length > 0 ? (
                    <div className="space-y-4">
                      {notificacoes.slice(0, 5).map((notificacao) => (
                        <Card key={notificacao.id} className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${notificacao.lida ? "bg-slate-200 dark:bg-slate-700" : "bg-blue-100 dark:bg-blue-900"}`}>
                                <Bell className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{notificacao.titulo}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notificacao.mensagem}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{new Date(notificacao.dataCriacao).toLocaleDateString("pt-BR")}</p>
                              </div>
                              {!notificacao.lida && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Bell className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhuma notificação disponível</p>
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </motion.div>

      {/* Modais */}
      {advogado && (
        <>
          <AdvogadoHistorico advogadoId={advogado.id} advogadoNome={getNomeCompleto(advogado)} isOpen={isHistoricoModalOpen} onClose={() => setIsHistoricoModalOpen(false)} />
          <AdvogadoNotificacoes advogadoId={advogado.id} advogadoNome={getNomeCompleto(advogado)} isOpen={isNotificacoesModalOpen} onClose={() => setIsNotificacoesModalOpen(false)} />
        </>
      )}
    </div>
  );
}
