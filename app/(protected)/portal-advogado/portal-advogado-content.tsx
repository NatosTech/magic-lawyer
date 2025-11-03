"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { Building2, Calendar, FileText, Link as LinkIcon, Info } from "lucide-react";

export function PortalAdvogadoContent() {
  return (
    <div className="space-y-6">
      {/* Links para Tribunais */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Links para Tribunais</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
              <p className="text-default-500">
                Em breve: links diretos para portais dos tribunais (TJBA, TRT5,
                TRF1, etc.)
              </p>
            </div>
          </div>
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

