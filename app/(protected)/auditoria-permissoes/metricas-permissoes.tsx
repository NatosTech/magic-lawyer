import { Card, CardBody, CardHeader } from "@heroui/react";
import { BarChart3, ShieldAlert, TrendingUp, Users } from "lucide-react";

import { getMetricasPermissoesNegadas } from "@/app/actions/auditoria-permissoes";

export async function MetricasPermissoes() {
  const result = await getMetricasPermissoesNegadas();

  if (!result.success || !result.data) {
    return null;
  }

  const metricas = result.data;

  return (
    <>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Negadas</p>
                <p className="text-2xl font-bold">{metricas.totalNegadas}</p>
              </div>
              <ShieldAlert className="w-8 h-8 text-danger" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Últimas 24h</p>
                <p className="text-2xl font-bold">{metricas.ultimas24h}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Módulos Únicos</p>
                <p className="text-2xl font-bold">
                  {Object.keys(metricas.porModulo).length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Usuários Afetados</p>
                <p className="text-2xl font-bold">{metricas.porUsuario.length}</p>
              </div>
              <Users className="w-8 h-8 text-secondary" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos detalhados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Por Módulo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Negadas por Módulo</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {Object.entries(metricas.porModulo)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([modulo, count]) => (
                <div key={modulo} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{modulo}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
          </div>
        </CardBody>
      </Card>

      {/* Por Origem */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Negadas por Origem</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {Object.entries(metricas.porOrigem)
              .sort(([, a], [, b]) => b - a)
              .map(([origem, count]) => (
                <div key={origem} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {origem === "override"
                      ? "Override Individual"
                      : origem === "cargo"
                        ? "Herdado do Cargo"
                        : "Padrão do Role"}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

