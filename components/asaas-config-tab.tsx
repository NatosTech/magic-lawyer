"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { toast } from "@/lib/toast";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import useSWR from "swr";

import {
  configurarAsaasTenant,
  testarConexaoAsaas,
  obterConfiguracaoAsaas,
} from "@/app/actions/asaas";
import { Select, SelectItem } from "@heroui/react";

interface AsaasConfigTabProps {
  userRole: string;
}

export function AsaasConfigTab({ userRole }: AsaasConfigTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    asaasApiKey: "",
    asaasAccountId: "",
    asaasWalletId: "",
    ambiente: "SANDBOX" as "SANDBOX" | "PRODUCAO",
  });

  // Buscar configuração atual
  const { data: configResult, mutate: mutateConfig } = useSWR(
    "asaas-config",
    obterConfiguracaoAsaas,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const config = configResult?.success ? configResult.data : null;

  // Verificar se o usuário pode configurar Asaas
  if (userRole !== "ADMIN") {
    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardBody className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-warning/10 rounded-full">
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-warning mb-2">
                Acesso Restrito
              </h3>
              <p className="text-default-500">
                Apenas administradores podem configurar a integração com Asaas.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    if (!config) {
      toast.error("Configure o Asaas primeiro");

      return;
    }

    setIsTesting(true);
    try {
      const result = await testarConexaoAsaas();

      if (result.success) {
        toast.success("Conexão com Asaas estabelecida com sucesso!");
        mutateConfig();
      } else {
        toast.error(result.error || "Falha na conexão com Asaas");
      }
    } catch (error) {
      toast.error("Erro ao testar conexão");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!formData.asaasApiKey || !formData.asaasAccountId) {
      toast.error("Preencha todos os campos obrigatórios");

      return;
    }

    setIsLoading(true);
    try {
      const result = await configurarAsaasTenant(formData);

      if (result.success) {
        toast.success("Configuração Asaas salva com sucesso!");
        setFormData({
          asaasApiKey: "",
          asaasAccountId: "",
          asaasWalletId: "",
          ambiente: "SANDBOX",
        });
        mutateConfig();
      } else {
        toast.error(result.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Status da Configuração */}
      {config && (
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Configuração Atual</h3>
                <p className="text-sm text-default-500">
                  Status da integração Asaas
                </p>
              </div>
            </div>
            <Chip
              color={config.integracaoAtiva ? "success" : "warning"}
              startContent={
                config.integracaoAtiva ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )
              }
              variant="flat"
            >
              {config.integracaoAtiva ? "Ativa" : "Inativa"}
            </Chip>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-default-500">Ambiente</p>
                <p className="font-medium">{config.ambiente}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Configurado em</p>
                <p className="font-medium">
                  {new Date(config.dataConfiguracao).toLocaleDateString(
                    "pt-BR",
                  )}
                </p>
              </div>
              {config.ultimaValidacao && (
                <div>
                  <p className="text-sm text-default-500">Última validação</p>
                  <p className="font-medium">
                    {new Date(config.ultimaValidacao).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                </div>
              )}
            </div>

            <Divider className="my-4" />

            <div className="flex gap-2">
              <Button
                color="primary"
                isLoading={isTesting}
                startContent={isTesting ? <Spinner size="sm" /> : null}
                variant="flat"
                onPress={handleTestConnection}
              >
                {isTesting ? "Testando..." : "Testar Conexão"}
              </Button>
              <Button
                as="a"
                href="https://www.asaas.com"
                startContent={<ExternalLink className="w-4 h-4" />}
                target="_blank"
                variant="bordered"
              >
                Painel Asaas
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Formulário de Configuração */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {config ? "Atualizar Configuração" : "Configurar Asaas"}
              </h3>
              <p className="text-sm text-default-500">
                Configure sua conta Asaas para receber pagamentos
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              isRequired
              description="Começa com $aact_"
              label="API Key"
              placeholder="Cole sua API Key do Asaas"
              type="password"
              value={formData.asaasApiKey}
              onChange={(e) => handleInputChange("asaasApiKey", e.target.value)}
            />
            <Input
              isRequired
              description="ID da conta no painel Asaas"
              label="Account ID"
              placeholder="ID da sua conta Asaas"
              value={formData.asaasAccountId}
              onChange={(e) =>
                handleInputChange("asaasAccountId", e.target.value)
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              description="Para carteiras digitais"
              label="Wallet ID (Opcional)"
              placeholder="ID da carteira digital"
              value={formData.asaasWalletId}
              onChange={(e) =>
                handleInputChange("asaasWalletId", e.target.value)
              }
            />
            <Select
              isRequired
              label="Ambiente"
              placeholder="Selecione o ambiente"
              selectedKeys={[formData.ambiente]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as "SANDBOX" | "PRODUCAO";

                handleInputChange("ambiente", value);
              }}
            >
              <SelectItem key="SANDBOX" textValue="Sandbox (Teste)">Sandbox (Teste)</SelectItem>
              <SelectItem key="PRODUCAO" textValue="Produção">Produção</SelectItem>
            </Select>
          </div>

          <Divider />

          <div className="flex gap-2">
            <Button
              color="primary"
              isLoading={isLoading}
              startContent={isLoading ? <Spinner size="sm" /> : null}
              onPress={handleSaveConfig}
            >
              {isLoading ? "Salvando..." : config ? "Atualizar" : "Configurar"}
            </Button>
            <Button
              variant="light"
              onPress={() => {
                setFormData({
                  asaasApiKey: "",
                  asaasAccountId: "",
                  asaasWalletId: "",
                  ambiente: "SANDBOX",
                });
              }}
            >
              Limpar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Informações de Ajuda */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardBody>
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Como obter suas credenciais Asaas
            </h4>
            <div className="space-y-3 text-sm text-default-600">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <div>
                  <p className="font-medium">Acesse o painel Asaas</p>
                  <p>
                    Acesse{" "}
                    <a
                      className="text-primary hover:underline"
                      href="https://www.asaas.com"
                      rel="noreferrer"
                      target="_blank"
                    >
                      www.asaas.com
                    </a>{" "}
                    e faça login
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <div>
                  <p className="font-medium">
                    Vá em Configurações → Integrações
                  </p>
                  <p>Copie sua API Key e Account ID</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <div>
                  <p className="font-medium">Configure os webhooks</p>
                  <p>
                    Adicione a URL:{" "}
                    <code className="bg-default-100 px-1 rounded text-xs">
                      https://seudominio.com/api/webhooks/asaas
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
