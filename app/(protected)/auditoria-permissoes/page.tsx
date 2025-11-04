import { Suspense } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { ShieldAlert } from "lucide-react";

import { PermissoesNegadasTable } from "./permissoes-negadas-table";
import { MetricasPermissoes } from "./metricas-permissoes";

export default async function AuditoriaPermissoesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Auditoria de Permissões</h1>
          <p className="text-default-500">
            Visualize tentativas de acesso negadas e métricas de segurança
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardBody className="flex justify-center py-12">
              <Spinner size="lg" />
            </CardBody>
          </Card>
        }
      >
        <MetricasPermissoes />
      </Suspense>

      <div className="mt-8">
        <Suspense
          fallback={
            <Card>
              <CardBody className="flex justify-center py-12">
                <Spinner size="lg" />
              </CardBody>
            </Card>
          }
        >
          <PermissoesNegadasTable />
        </Suspense>
      </div>
    </div>
  );
}
