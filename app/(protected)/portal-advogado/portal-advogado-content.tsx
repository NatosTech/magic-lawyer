"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Chip, Spinner } from "@heroui/react";
import { Building2, Calendar, FileText, Link as LinkIcon, Info, ExternalLink } from "lucide-react";
import useSWR from "swr";
import { UFSelector } from "./uf-selector";
import {
  getTribunaisPorUF,
  type getTribunaisPorUF as GetTribunaisPorUFFn,
} from "@/app/actions/portal-advogado";

export function PortalAdvogadoContent() {
  const [ufSelecionada, setUfSelecionada] = useState<string | undefined>();

  // Buscar tribunais da UF selecionada
  const { data: tribunais, isLoading: isLoadingTribunais } = useSWR<
    Awaited<ReturnType<typeof getTribunaisPorUF>>,
    Error
  >(
    ufSelecionada ? [`portal-advogado-tribunais`, ufSelecionada] : null,
    async ([, uf]) => {
      return await getTribunaisPorUF(uf);
    },
  );

  return (
    <div className="space-y-6">
      {/* Seletor de UF */}
      <Card>
        <CardBody>
          <UFSelector
            value={ufSelecionada}
            onChange={(uf) => setUfSelecionada(uf)}
            label="Filtrar por UF"
          />
        </CardBody>
      </Card>

      {/* Links para Tribunais */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Links para Tribunais</h2>
        </CardHeader>
        <CardBody>
          {!ufSelecionada ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
                <p className="text-default-500">
                  Selecione uma UF para ver os tribunais disponíveis
                </p>
              </div>
            </div>
          ) : isLoadingTribunais ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : tribunais && tribunais.length > 0 ? (
            <div className="space-y-3">
              {tribunais.map((tribunal) => (
                <div
                  key={tribunal.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {tribunal.nome}
                      </h3>
                      {tribunal.sigla && (
                        <Chip size="sm" variant="flat">
                          {tribunal.sigla}
                        </Chip>
                      )}
                      {tribunal.tipo && (
                        <Chip size="sm" variant="flat" color="secondary">
                          {tribunal.tipo}
                        </Chip>
                      )}
                    </div>
                    {tribunal.uf && (
                      <p className="text-sm text-default-500">
                        UF: {tribunal.uf}
                      </p>
                    )}
                  </div>
                  {tribunal.siteUrl ? (
                    <Button
                      as="a"
                      href={tribunal.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      variant="flat"
                      endContent={<ExternalLink className="w-4 h-4" />}
                    >
                      Acessar
                    </Button>
                  ) : (
                    <Chip size="sm" variant="flat" color="default">
                      Sem portal
                    </Chip>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
                <p className="text-default-500">
                  Nenhum tribunal encontrado para esta UF
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Calendário de Recessos */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <Calendar className="w-5 h-5 text-warning" />
          <h2 className="text-xl font-semibold">Calendário de Recessos</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
              <p className="text-default-500">
                Em breve: calendário com recessos forenses por tribunal
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Comunicados e Editais */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <FileText className="w-5 h-5 text-success" />
          <h2 className="text-xl font-semibold">Comunicados e Editais</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
              <p className="text-default-500">
                Em breve: comunicados importantes dos tribunais e editais
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Links Úteis */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <LinkIcon className="w-5 h-5 text-secondary" />
          <h2 className="text-xl font-semibold">Links Úteis</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <a
              href="https://www.cnj.jus.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
            >
              <span className="text-primary font-medium">
                Conselho Nacional de Justiça (CNJ)
              </span>
            </a>
            <a
              href="https://www.oab.org.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
            >
              <span className="text-primary font-medium">OAB Nacional</span>
            </a>
            <a
              href="https://pje.jf.jus.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
            >
              <span className="text-primary font-medium">PJe</span>
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

