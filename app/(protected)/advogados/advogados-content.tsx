"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Avatar,
  Spinner,
} from "@heroui/react";
import { UserIcon, MailIcon, ScaleIcon, CalendarIcon } from "lucide-react";
import useSWR from "swr";

import { getAdvogadosDoTenant, type Advogado } from "@/app/actions/advogados";
import { title, subtitle } from "@/components/primitives";

export default function AdvogadosContent() {
  const { data, error, isLoading, mutate } = useSWR(
    "advogados-do-tenant",
    getAdvogadosDoTenant,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
    },
  );

  const advogados = data?.advogados || [];
  const loading = isLoading;
  const errorMessage = error?.message || data?.error;

  const getNomeCompleto = (advogado: Advogado) => {
    const firstName = advogado.usuario.firstName || "";
    const lastName = advogado.usuario.lastName || "";

    return `${firstName} ${lastName}`.trim() || "Nome não informado";
  };

  const getOAB = (advogado: Advogado) => {
    if (advogado.oabNumero && advogado.oabUf) {
      return `${advogado.oabUf} ${advogado.oabNumero}`;
    }

    return "OAB não informada";
  };

  const getStatusColor = (active: boolean) => {
    return active ? "success" : "danger";
  };

  const getStatusText = (active: boolean) => {
    return active ? "Ativo" : "Inativo";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner label="Carregando advogados..." size="lg" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-danger text-center">
          <p className="text-lg font-semibold">Erro ao carregar advogados</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
        <Button color="primary" onClick={() => mutate()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className={title({ size: "lg", color: "blue" })}>
          Advogados do Escritório
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Gerencie os advogados do seu escritório de advocacia
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex flex-row items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-default-500">Total de Advogados</p>
              <p className="text-2xl font-bold">{advogados.length}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center space-x-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <ScaleIcon className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-default-500">Advogados Ativos</p>
              <p className="text-2xl font-bold">
                {advogados.filter((a) => a.usuario.active).length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center space-x-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-default-500">Com OAB</p>
              <p className="text-2xl font-bold">
                {advogados.filter((a) => a.oabNumero && a.oabUf).length}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Lista de Advogados */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Lista de Advogados</h2>
        </CardHeader>
        <CardBody>
          {advogados.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 text-default-300 mx-auto mb-4" />
              <p className="text-default-500">Nenhum advogado encontrado</p>
              <p className="text-sm text-default-400">
                Os advogados do seu escritório aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {advogados.map((advogado) => (
                <Card key={advogado.id} className="border border-default-200">
                  <CardBody>
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <Avatar
                        className="flex-shrink-0"
                        name={getNomeCompleto(advogado)}
                        size="lg"
                        src={advogado.usuario.avatarUrl || undefined}
                      />

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {getNomeCompleto(advogado)}
                          </h3>
                          <Chip
                            color={getStatusColor(advogado.usuario.active)}
                            size="sm"
                            variant="flat"
                          >
                            {getStatusText(advogado.usuario.active)}
                          </Chip>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-default-500">
                          <div className="flex items-center space-x-1">
                            <MailIcon className="w-4 h-4" />
                            <span className="truncate">
                              {advogado.usuario.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ScaleIcon className="w-4 h-4" />
                            <span>{getOAB(advogado)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex-shrink-0">
                        <Button color="primary" size="sm" variant="light">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
