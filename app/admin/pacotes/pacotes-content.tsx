"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import useSWR from "swr";

import { title, subtitle } from "@/components/primitives";
import { getPlanos, getEstatisticasPlanos, getAssinaturas } from "@/app/actions/planos";
import { getPacotesJuiz, getEstatisticasPacotesJuiz } from "@/app/actions/pacotesJuiz";

export function PacotesContent() {
  // Buscar dados reais dos PLANOS e PACOTES DE JUÍZES
  const { data: planosResponse, isLoading: loadingPlanos } = useSWR("planos", getPlanos);
  const { data: pacotesJuizResponse, isLoading: loadingPacotesJuiz } = useSWR("pacotes-juiz", getPacotesJuiz);
  const { data: statsResponse, isLoading: loadingStats } = useSWR("stats-planos", getEstatisticasPlanos);
  const { data: statsPacotesResponse, isLoading: loadingStatsPacotes } = useSWR("stats-pacotes-juiz", getEstatisticasPacotesJuiz);
  const { data: assinaturasResponse, isLoading: loadingAssinaturas } = useSWR("assinaturas", getAssinaturas);

  const planos = planosResponse?.data || [];
  const pacotesJuiz = pacotesJuizResponse?.data || [];
  const assinaturas = assinaturasResponse?.data || [];
  const stats = statsResponse?.data || {
    totalPlanos: 0,
    planosAtivos: 0,
    totalAssinaturas: 0,
    assinaturasAtivas: 0,
    faturamentoMensal: 0,
  };
  const statsPacotes = statsPacotesResponse?.data || {
    totalPacotes: 0,
    pacotesAtivos: 0,
    totalAssinaturas: 0,
    assinaturasAtivas: 0,
    faturamentoMensal: 0,
  };

  // Mock data para juízes premium (será substituído por dados reais)
  const juizesPremium = [
    {
      id: "1",
      nome: "Dr. João Silva",
      nomeCompleto: "João Carlos Silva",
      comarca: "São Paulo",
      vara: "1ª Vara Cível",
      especialidades: ["CIVEL", "FAMILIA", "TRABALHISTA"],
      precoAcesso: 299.9,
      _count: { processos: 45 },
    },
    {
      id: "2",
      nome: "Dra. Maria Santos",
      nomeCompleto: "Maria Fernanda Santos",
      comarca: "Rio de Janeiro",
      vara: "2ª Vara Criminal",
      especialidades: ["CRIMINAL", "EXECUCAO_PENAL"],
      precoAcesso: 399.9,
      _count: { processos: 78 },
    },
    {
      id: "3",
      nome: "Dr. Pedro Costa",
      nomeCompleto: "Pedro Henrique Costa",
      comarca: "Brasília",
      vara: "3ª Vara Federal",
      especialidades: ["TRIBUTARIO", "ADMINISTRATIVO"],
      precoAcesso: 499.9,
      _count: { processos: 32 },
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPlanoColor = (nome: string) => {
    switch (nome.toLowerCase()) {
      case "starter":
        return "success";
      case "professional":
        return "secondary";
      case "enterprise":
        return "primary";
      default:
        return "default";
    }
  };

  const getPlanoIcon = (nome: string) => {
    switch (nome.toLowerCase()) {
      case "starter":
        return "🚀";
      case "professional":
        return "💼";
      case "enterprise":
        return "🏢";
      default:
        return "📦";
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Administração</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>Planos e Pacotes de Juízes</h1>
            <p className={subtitle({ fullWidth: true })}>Gerencie os planos de assinatura e pacotes de juízes premium</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button color="primary" variant="flat">
              📊 Relatórios
            </Button>
            <Button color="secondary" variant="flat">
              ⚙️ Configurar
            </Button>
          </div>
        </div>
      </header>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-purple-600 mr-4">💎</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Juízes Premium</p>
              <p className="text-2xl font-bold text-gray-900">{juizesPremium.length}</p>
              <p className="text-sm text-purple-600">Monetizáveis</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-green-600 mr-4">💰</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Faturamento Mensal</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.faturamentoMensal)}</p>
              <p className="text-sm text-green-600">Receita atual</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-blue-600 mr-4">📦</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Planos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.planosAtivos}</p>
              <p className="text-sm text-blue-600">de {stats.totalPlanos} total</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-yellow-600 mr-4">👥</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Assinaturas Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assinaturasAtivas}</p>
              <p className="text-sm text-yellow-600">de {stats.totalAssinaturas} total</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loadingPlanos ? (
          <div className="col-span-3 text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-white mb-2">Carregando planos...</h3>
            <p className="text-default-400">Buscando dados dos planos disponíveis</p>
          </div>
        ) : planos.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum plano encontrado</h3>
            <p className="text-default-400 mb-4">Crie planos para começar a monetizar o sistema</p>
            <Button color="primary">➕ Criar Primeiro Plano</Button>
          </div>
        ) : (
          planos.map((plano) => (
            <Card key={plano.id} className="border border-white/10 bg-background/70 backdrop-blur-xl hover:border-white/20 transition-colors">
              <CardHeader className="flex flex-col gap-2 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{getPlanoIcon(plano.nome)}</span>
                  <Badge color={getPlanoColor(plano.nome) as any} variant="flat" size="sm">
                    {plano.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-white">{plano.nome}</h3>
                <p className="text-sm text-default-400">{plano.descricao}</p>
              </CardHeader>
              <Divider className="border-white/10" />
              <CardBody className="space-y-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">{plano.valorMensal ? formatCurrency(plano.valorMensal) : "Sob consulta"}</span>
                  {plano.valorMensal && <span className="text-default-400 ml-2">/mês</span>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-default-400">
                    <span className="mr-2">👥</span>
                    <span>{plano.limiteUsuarios || "Ilimitado"} usuários</span>
                  </div>
                  <div className="flex items-center text-sm text-default-400">
                    <span className="mr-2">📄</span>
                    <span>{plano.limiteProcessos || "Ilimitado"} processos</span>
                  </div>
                  <div className="flex items-center text-sm text-default-400">
                    <span className="mr-2">💾</span>
                    <span>{plano.limiteStorageMb ? `${plano.limiteStorageMb} MB` : "Ilimitado"} armazenamento</span>
                  </div>
                  <div className="flex items-center text-sm text-default-400">
                    <span className="mr-2">⚙️</span>
                    <span>Recursos avançados</span>
                  </div>
                </div>

                <Button color={getPlanoColor(plano.nome) as any} variant={plano.valorMensal ? "solid" : "flat"} className="w-full">
                  {plano.valorMensal ? "Editar Plano" : "Configurar Preço"}
                </Button>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Pacotes de Juízes */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">📦 Pacotes de Juízes Premium</h2>
            <p className="text-default-400">Add-ons que escritórios podem comprar para acessar dados específicos de juízes</p>
          </div>
          <Button color="secondary" variant="solid">
            ➕ Novo Pacote de Juízes
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingPacotesJuiz ? (
            <div className="col-span-4 text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-lg font-medium text-white mb-2">Carregando pacotes...</h3>
              <p className="text-default-400">Buscando pacotes de juízes disponíveis</p>
            </div>
          ) : pacotesJuiz.length === 0 ? (
            <div className="col-span-4 text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-white mb-2">Nenhum pacote de juízes encontrado</h3>
              <p className="text-default-400 mb-4">Crie pacotes de juízes para monetizar o acesso a dados específicos</p>
              <Button color="secondary">➕ Criar Primeiro Pacote</Button>
            </div>
          ) : (
            pacotesJuiz.map((pacote) => (
              <Card key={pacote.id} className="border border-white/10 bg-background/70 backdrop-blur-xl hover:border-white/20 transition-colors">
                <CardHeader className="flex flex-col gap-2 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{pacote.icone}</span>
                    <Badge color={getPlanoColor(pacote.cor) as any} variant="flat" size="sm">
                      {pacote.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{pacote.nome}</h3>
                  <p className="text-sm text-default-400">{pacote.descricao}</p>
                </CardHeader>
                <Divider className="border-white/10" />
                <CardBody className="space-y-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">{formatCurrency(pacote.preco)}</span>
                    <span className="text-default-400 ml-2">{pacote.duracaoDias ? `/${pacote.duracaoDias} dias` : "/permanente"}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-default-400">
                      <span className="mr-2">👨‍⚖️</span>
                      <span>{pacote._count?.juizes || 0} juízes incluídos</span>
                    </div>
                    <div className="flex items-center text-sm text-default-400">
                      <span className="mr-2">👥</span>
                      <span>{pacote.limiteUsuarios || "Todos"} usuários</span>
                    </div>
                    <div className="flex items-center text-sm text-default-400">
                      <span className="mr-2">🔍</span>
                      <span>{pacote.limiteConsultas || "Ilimitadas"} consultas/mês</span>
                    </div>
                    <div className="flex items-center text-sm text-default-400">
                      <span className="mr-2">👥</span>
                      <span>{pacote._count?.assinaturas || 0} assinaturas ativas</span>
                    </div>
                  </div>

                  <Button color={getPlanoColor(pacote.cor) as any} variant="solid" className="w-full">
                    Gerenciar Pacote
                  </Button>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Assinaturas Ativas */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">📋 Assinaturas Ativas</h2>
          <p className="text-sm text-default-400">Tenants que possuem planos ativos no sistema.</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {loadingAssinaturas ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-default-400">Carregando assinaturas...</p>
            </div>
          ) : assinaturas.length > 0 ? (
            <Table aria-label="Tabela de Assinaturas">
              <TableHeader>
                <TableColumn>Tenant</TableColumn>
                <TableColumn>Plano</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Início</TableColumn>
                <TableColumn>Fim</TableColumn>
                <TableColumn>Ações</TableColumn>
              </TableHeader>
              <TableBody>
                {assinaturas.map((assinatura) => (
                  <TableRow key={assinatura.id}>
                    <TableCell>{assinatura.tenant.name}</TableCell>
                    <TableCell>{assinatura.plano?.nome || "Sem plano"}</TableCell>
                    <TableCell>
                      <Badge color={assinatura.status === "ACTIVE" ? "success" : "warning"} variant="flat">
                        {assinatura.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(assinatura.dataInicio).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{assinatura.dataFim ? new Date(assinatura.dataFim).toLocaleDateString("pt-BR") : "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="light" color="primary">
                          Editar
                        </Button>
                        <Button size="sm" variant="light" color="danger">
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-white mb-2">Nenhuma assinatura encontrada</h3>
              <p className="text-default-400 mb-4">As assinaturas dos tenants aparecerão aqui</p>
              <Button color="primary">➕ Gerenciar Assinaturas</Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Juízes Premium Table */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">💎 Juízes Premium Disponíveis</h2>
          <p className="text-sm text-default-400">Juízes que podem ser incluídos em pacotes premium.</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {juizesPremium.length > 0 ? (
            <Table aria-label="Tabela de Juízes Premium">
              <TableHeader>
                <TableColumn>Juiz</TableColumn>
                <TableColumn>Comarca</TableColumn>
                <TableColumn>Especialidades</TableColumn>
                <TableColumn>Preço</TableColumn>
                <TableColumn>Processos</TableColumn>
                <TableColumn>Ações</TableColumn>
              </TableHeader>
              <TableBody>
                {juizesPremium.map((juiz) => (
                  <TableRow key={juiz.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{juiz.nome}</span>
                        {juiz.nomeCompleto && <span className="text-xs text-default-400">{juiz.nomeCompleto}</span>}
                        <span className="text-xs text-primary">
                          {juiz.comarca} - {juiz.vara}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{juiz.comarca}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {juiz.especialidades.slice(0, 2).map((esp) => (
                          <Badge key={esp} color="default" variant="flat" size="sm">
                            {esp}
                          </Badge>
                        ))}
                        {juiz.especialidades.length > 2 && (
                          <Badge color="default" variant="flat" size="sm">
                            +{juiz.especialidades.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(juiz.precoAcesso)}</TableCell>
                    <TableCell>{juiz._count.processos}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="light" color="primary">
                          Editar
                        </Button>
                        <Button size="sm" variant="light" color="secondary">
                          Incluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍⚖️</div>
              <h3 className="text-lg font-medium text-white mb-2">Nenhum juiz premium encontrado</h3>
              <p className="text-default-400 mb-4">Configure juízes como premium para criar pacotes pagos</p>
              <Button color="secondary">👨‍⚖️ Gerenciar Juízes</Button>
            </div>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
