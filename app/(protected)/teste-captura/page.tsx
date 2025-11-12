"use client";

import { useState } from "react";
import { capturarProcessoAction } from "@/app/actions/juridical-capture";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function TesteCapturaPage() {
  const [numeroProcesso, setNumeroProcesso] = useState("0000123-45.2024.8.05.0001");
  const [tribunalId, setTribunalId] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testar = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const resultado = await capturarProcessoAction({
        numeroProcesso,
        tribunalId: tribunalId || undefined,
      });

      if (resultado.success) {
        setResultado(resultado);
      } else {
        setError(resultado.error || "Erro desconhecido");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🧪 Teste de Captura de Processos</h1>
        <p className="text-gray-600">
          Teste a estrutura de captura de processos jurídicos. 
          <strong className="text-orange-600"> Nota:</strong> Os dados ainda são mockados (scraping real não implementado).
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Parâmetros de Teste</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Número do Processo"
            placeholder="0000123-45.2024.8.05.0001"
            value={numeroProcesso}
            onChange={(e) => setNumeroProcesso(e.target.value)}
            description="Número CNJ formatado (ex: 0000123-45.2024.8.05.0001)"
          />

          <Input
            label="ID do Tribunal (Opcional)"
            placeholder="tribunal-id"
            value={tribunalId}
            onChange={(e) => setTribunalId(e.target.value)}
            description="ID do tribunal cadastrado (opcional, será detectado automaticamente)"
          />

          <Button
            color="primary"
            onPress={testar}
            isLoading={loading}
            className="w-full"
          >
            {loading ? "Capturando..." : "Testar Captura"}
          </Button>
        </CardBody>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Erro:</span>
              <span>{error}</span>
            </div>
          </CardBody>
        </Card>
      )}

      {resultado && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">Resultado da Captura</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Status:</h3>
                <div className="flex items-center gap-2">
                  {resultado.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-semibold">Sucesso</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 font-semibold">Falha</span>
                    </>
                  )}
                </div>
              </div>

              {resultado.processo && (
                <div>
                  <h3 className="font-semibold mb-2">Dados do Processo:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div>
                      <strong>Número:</strong> {resultado.processo.numeroProcesso}
                    </div>
                    <div>
                      <strong>Tribunal:</strong> {resultado.processo.tribunalNome} ({resultado.processo.tribunalSigla})
                    </div>
                    <div>
                      <strong>Sistema:</strong> {resultado.processo.sistema}
                    </div>
                    <div>
                      <strong>Esfera:</strong> {resultado.processo.esfera}
                    </div>
                    <div>
                      <strong>UF:</strong> {resultado.processo.uf}
                    </div>
                    <div>
                      <strong>Fonte:</strong> {resultado.processo.fonte}
                    </div>
                    <div>
                      <strong>Capturado em:</strong>{" "}
                      {resultado.processo.capturadoEm
                        ? new Date(resultado.processo.capturadoEm).toLocaleString("pt-BR")
                        : "N/A"}
                    </div>
                  </div>
                </div>
              )}

              {resultado.movimentacoes && resultado.movimentacoes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">
                    Movimentações ({resultado.movimentacoes.length}):
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    {resultado.movimentacoes.map((mov: any, idx: number) => (
                      <div key={idx} className="border-b pb-2 last:border-0">
                        <div>
                          <strong>Data:</strong>{" "}
                          {mov.data ? new Date(mov.data).toLocaleDateString("pt-BR") : "N/A"}
                        </div>
                        <div>
                          <strong>Descrição:</strong> {mov.descricao || "N/A"}
                        </div>
                        {mov.categoria && (
                          <div>
                            <strong>Categoria:</strong> {mov.categoria}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Resposta Completa (JSON):</h3>
                <Textarea
                  value={JSON.stringify(resultado, null, 2)}
                  readOnly
                  className="font-mono text-xs"
                  minRows={10}
                  maxRows={20}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardBody>
          <div className="text-sm text-blue-800">
            <strong>ℹ️ Informações:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Esta página testa a <strong>estrutura</strong> de captura, não dados reais
              </li>
              <li>
                O scraping real (TJBA, TJSP) ainda não está implementado
              </li>
              <li>
                A integração PJe aguarda certificado digital para testes
              </li>
              <li>
                Os dados retornados são <strong>mockados</strong> para validação da estrutura
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

