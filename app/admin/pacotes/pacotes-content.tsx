"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";

import { title, subtitle } from "@/components/primitives";

export function PacotesContent() {
  // Mock data - em produção viria de actions
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

  // Calcular estatísticas
  const totalFaturamento = juizesPremium.reduce((sum, juiz) => {
    return sum + (Number(juiz.precoAcesso) || 0) * juiz._count.processos;
  }, 0);

  // Definir pacotes
  const pacotes = [
    {
      id: "gratuito",
      nome: "Pacote Gratuito",
      descricao: "Acesso a juízes públicos básicos",
      preco: 0,
      juizes: 12,
      cor: "success",
      icone: "🆓",
    },
    {
      id: "premium",
      nome: "Pacote Premium",
      descricao: "Acesso a juízes especialistas premium",
      preco: 99.9,
      juizes: juizesPremium.length,
      cor: "secondary",
      icone: "💎",
    },
    {
      id: "enterprise",
      nome: "Pacote Enterprise",
      descricao: "Acesso completo a todos os juízes",
      preco: 199.9,
      juizes: 15,
      cor: "primary",
      icone: "🏢",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPacoteColor = (cor: string) => {
    switch (cor) {
      case "success":
        return "success";
      case "secondary":
        return "secondary";
      case "primary":
        return "primary";
      default:
        return "default";
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Administração</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>Pacotes Premium</h1>
            <p className={subtitle({ fullWidth: true })}>Gerencie os pacotes de juízes e monetização do sistema</p>
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
              <p className="text-sm font-medium text-gray-500">Faturamento Potencial</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalFaturamento)}</p>
              <p className="text-sm text-green-600">Baseado em acessos</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-blue-600 mr-4">📦</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Pacotes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{pacotes.length}</p>
              <p className="text-sm text-blue-600">Disponíveis</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-yellow-600 mr-4">👥</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Tenants Premium</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-yellow-600">Assinantes</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pacotes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pacotes.map((pacote) => (
          <Card key={pacote.id} className="border border-white/10 bg-background/70 backdrop-blur-xl hover:border-white/20 transition-colors">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{pacote.icone}</span>
                <Badge color={getPacoteColor(pacote.cor) as any} variant="flat" size="sm">
                  {pacote.id.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-white">{pacote.nome}</h3>
              <p className="text-sm text-default-400">{pacote.descricao}</p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="space-y-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">{formatCurrency(pacote.preco)}</span>
                <span className="text-default-400 ml-2">/mês</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-default-400">
                  <span className="mr-2">👨‍⚖️</span>
                  <span>{pacote.juizes} juízes disponíveis</span>
                </div>
                <div className="flex items-center text-sm text-default-400">
                  <span className="mr-2">📊</span>
                  <span>Relatórios básicos</span>
                </div>
                <div className="flex items-center text-sm text-default-400">
                  <span className="mr-2">💬</span>
                  <span>Suporte por email</span>
                </div>
              </div>

              <Button color={getPacoteColor(pacote.cor) as any} variant={pacote.preco === 0 ? "flat" : "solid"} className="w-full">
                {pacote.preco === 0 ? "Gratuito" : "Configurar Preço"}
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Juízes Premium Table */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">💎 Juízes Premium Disponíveis</h2>
          <p className="text-sm text-default-400">Configure os preços e disponibilidade dos juízes premium</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {juizesPremium.length > 0 ? (
            <Table aria-label="Tabela de Juízes Premium">
              <TableHeader>
                <TableColumn>Juiz</TableColumn>
                <TableColumn>Especialidades</TableColumn>
                <TableColumn>Preço Atual</TableColumn>
                <TableColumn>Acessos</TableColumn>
                <TableColumn>Faturamento</TableColumn>
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
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {juiz.especialidades.slice(0, 2).map((esp, index) => (
                          <Badge key={index} color="secondary" variant="flat" size="sm">
                            {esp.replace("_", " ")}
                          </Badge>
                        ))}
                        {juiz.especialidades.length > 2 && <span className="text-xs text-default-400">+{juiz.especialidades.length - 2}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{formatCurrency(juiz.precoAcesso)}</span>
                        <span className="text-xs text-default-400">por acesso</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{juiz._count.processos}</span>
                        <span className="text-xs text-default-400">processos</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-success">{formatCurrency((Number(juiz.precoAcesso) || 0) * juiz._count.processos)}</span>
                        <span className="text-xs text-default-400">potencial</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" color="primary" variant="flat">
                          ✏️ Editar
                        </Button>
                        <Button size="sm" variant="light">
                          👁️ Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💎</div>
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
