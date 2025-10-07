"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import { title, subtitle } from "@/components/primitives";

export function JuizesContent() {
  // Mock data - em produção viria de actions
  const juizes = [
    {
      id: "1",
      nome: "Dr. João Silva",
      nomeCompleto: "João Carlos Silva",
      comarca: "São Paulo",
      vara: "1ª Vara Cível",
      tribunal: { nome: "TJSP", sigla: "TJSP" },
      especialidades: ["CIVEL", "FAMILIA", "TRABALHISTA"],
      status: "ATIVO",
      isPublico: true,
      isPremium: false,
      precoAcesso: null,
      nivel: "DESEMBARGADOR",
      _count: { processos: 45, julgamentos: 23 },
    },
    {
      id: "2",
      nome: "Dra. Maria Santos",
      nomeCompleto: "Maria Fernanda Santos",
      comarca: "Rio de Janeiro",
      vara: "2ª Vara Criminal",
      tribunal: { nome: "TJRJ", sigla: "TJRJ" },
      especialidades: ["CRIMINAL", "EXECUCAO_PENAL"],
      status: "ATIVO",
      isPublico: true,
      isPremium: true,
      precoAcesso: 299.9,
      nivel: "JUIZ",
      _count: { processos: 78, julgamentos: 41 },
    },
    {
      id: "3",
      nome: "Dr. Pedro Costa",
      nomeCompleto: "Pedro Henrique Costa",
      comarca: "Brasília",
      vara: "3ª Vara Federal",
      tribunal: { nome: "TRF1", sigla: "TRF1" },
      especialidades: ["TRIBUTARIO", "ADMINISTRATIVO"],
      status: "ATIVO",
      isPublico: false,
      isPremium: true,
      precoAcesso: 499.9,
      nivel: "DESEMBARGADOR",
      _count: { processos: 32, julgamentos: 18 },
    },
  ];

  // Separar juízes globais dos privados
  const juizesGlobais = juizes.filter((j) => j.isPublico || j.isPremium);
  const juizesPrivados = juizes.filter((j) => !j.isPublico && !j.isPremium);

  const getStatusColor = (status: string) => {
    return status === "ATIVO" ? "success" : "default";
  };

  const getNivelColor = (nivel: string) => {
    return nivel === "DESEMBARGADOR" ? "secondary" : "primary";
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Gratuito";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              Gerenciar Juízes Globais
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              Administre os juízes públicos e pacotes premium do sistema
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button color="primary" variant="flat">
              ➕ Novo Juiz
            </Button>
            <Button color="secondary" variant="flat">
              📊 Relatórios
            </Button>
          </div>
        </div>
      </header>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-blue-600 mr-4">👨‍⚖️</span>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total de Juízes
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {juizes.length}
              </p>
              <p className="text-sm text-blue-600">Globais e privados</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-green-600 mr-4">🌐</span>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Juízes Globais
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {juizesGlobais.length}
              </p>
              <p className="text-sm text-green-600">Públicos + Premium</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-purple-600 mr-4">💎</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Premium</p>
              <p className="text-2xl font-bold text-gray-900">
                {juizesGlobais.filter((j) => j.isPremium).length}
              </p>
              <p className="text-sm text-purple-600">Monetizáveis</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-yellow-600 mr-4">📊</span>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Processos Totais
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {juizes.reduce((sum, j) => sum + j._count.processos, 0)}
              </p>
              <p className="text-sm text-yellow-600">Ativos</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Lista de Juízes Globais */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            🌐 Juízes Globais
          </h2>
          <p className="text-sm text-default-400">
            Estes juízes são visíveis para todos os tenants e podem ser vendidos
            como pacotes premium
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {juizesGlobais.length > 0 ? (
            <Table aria-label="Tabela de Juízes Globais">
              <TableHeader>
                <TableColumn>Juiz</TableColumn>
                <TableColumn>Comarca/Vara</TableColumn>
                <TableColumn>Especialidades</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Preço</TableColumn>
                <TableColumn>Processos</TableColumn>
                <TableColumn>Ações</TableColumn>
              </TableHeader>
              <TableBody>
                {juizesGlobais.map((juiz) => (
                  <TableRow key={juiz.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {juiz.nome}
                        </span>
                        {juiz.nomeCompleto && (
                          <span className="text-xs text-default-400">
                            {juiz.nomeCompleto}
                          </span>
                        )}
                        <Badge
                          color={getNivelColor(juiz.nivel) as any}
                          size="sm"
                          variant="flat"
                        >
                          {juiz.nivel.replace("_", " ")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-white">
                          {juiz.comarca}
                        </span>
                        {juiz.vara && (
                          <span className="text-xs text-default-400">
                            {juiz.vara}
                          </span>
                        )}
                        {juiz.tribunal && (
                          <span className="text-xs text-primary">
                            {juiz.tribunal.nome}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {juiz.especialidades.slice(0, 2).map((esp, index) => (
                          <Badge
                            key={index}
                            color="primary"
                            size="sm"
                            variant="flat"
                          >
                            {esp.replace("_", " ")}
                          </Badge>
                        ))}
                        {juiz.especialidades.length > 2 && (
                          <span className="text-xs text-default-400">
                            +{juiz.especialidades.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          color={getStatusColor(juiz.status) as any}
                          size="sm"
                          variant="flat"
                        >
                          {juiz.status === "ATIVO" ? "✅ Ativo" : "❌ Inativo"}
                        </Badge>
                        <div className="flex gap-1">
                          {juiz.isPublico && (
                            <Badge color="success" size="sm" variant="flat">
                              🌐 Público
                            </Badge>
                          )}
                          {juiz.isPremium && (
                            <Badge color="secondary" size="sm" variant="flat">
                              💎 Premium
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {formatCurrency(juiz.precoAcesso)}
                        </span>
                        {juiz.precoAcesso && (
                          <span className="text-xs text-default-400">
                            por acesso
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {juiz._count.processos}
                        </span>
                        <span className="text-xs text-default-400">
                          processos
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button color="primary" size="sm" variant="flat">
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
              <div className="text-6xl mb-4">👨‍⚖️</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum juiz global encontrado
              </h3>
              <p className="text-default-400 mb-4">
                Os juízes globais aparecerão aqui quando forem criados
              </p>
              <Button color="primary">➕ Criar Primeiro Juiz</Button>
            </div>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
