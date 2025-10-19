"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import { configurarAsaasTenant, testarConexaoAsaas, obterConfiguracaoAsaas } from "@/app/actions/asaas";

export default function ConfiguracaoAsaasPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    asaasApiKey: "",
    asaasAccountId: "",
    asaasWalletId: "",
    ambiente: "SANDBOX" as "SANDBOX" | "PRODUCAO",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const result = await obterConfiguracaoAsaas();
      if (result.success && result.data) {
        setConfig(result.data);
        setFormData((prev) => ({
          ...prev,
          ambiente: result.data.ambiente,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await configurarAsaasTenant(formData);
      if (result.success) {
        toast.success("Configuração Asaas salva com sucesso!");
        await loadConfig();
      } else {
        toast.error(result.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testarConexaoAsaas();
      if (result.success) {
        toast.success("Conexão com Asaas estabelecida com sucesso!");
        await loadConfig();
      } else {
        toast.error(result.error || "Falha na conexão com Asaas");
      }
    } catch (error) {
      toast.error("Erro ao testar conexão");
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? "success" : "danger";
  };

  const getStatusText = (status: boolean) => {
    return status ? "Ativo" : "Inativo";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuração Asaas</h1>
        <p className="text-default-500">Configure sua conta Asaas para receber pagamentos dos seus clientes</p>
      </div>

      {/* Status Atual */}
      {config && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Status da Integração</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Chip color={getStatusColor(config.integracaoAtiva)} variant="flat">
                {getStatusText(config.integracaoAtiva)}
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <span>Ambiente:</span>
              <Chip color={config.ambiente === "PRODUCAO" ? "warning" : "default"} variant="flat">
                {config.ambiente}
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <span>Configurado em:</span>
              <span className="text-sm text-default-500">{new Date(config.dataConfiguracao).toLocaleDateString("pt-BR")}</span>
            </div>
            {config.ultimaValidacao && (
              <div className="flex items-center justify-between">
                <span>Última validação:</span>
                <span className="text-sm text-default-500">{new Date(config.ultimaValidacao).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            <Button color="primary" variant="flat" onPress={handleTestConnection} isLoading={isTesting} startContent={isTesting ? <Spinner size="sm" /> : null}>
              {isTesting ? "Testando..." : "Testar Conexão"}
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Formulário de Configuração */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{config ? "Atualizar Configuração" : "Configurar Asaas"}</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="API Key do Asaas"
                placeholder="$aact_prod_..."
                type="password"
                value={formData.asaasApiKey}
                onChange={(e) => setFormData({ ...formData, asaasApiKey: e.target.value })}
                description="Sua chave de API do Asaas (começa com $aact_)"
                isRequired
              />

              <Input
                label="ID da Conta Asaas"
                placeholder="conta_123456"
                value={formData.asaasAccountId}
                onChange={(e) => setFormData({ ...formData, asaasAccountId: e.target.value })}
                description="ID da sua conta no Asaas"
                isRequired
              />

              <Input
                label="ID da Carteira (Opcional)"
                placeholder="carteira_123456"
                value={formData.asaasWalletId}
                onChange={(e) => setFormData({ ...formData, asaasWalletId: e.target.value })}
                description="ID da carteira específica (deixe vazio para usar a padrão)"
              />

              <Select
                label="Ambiente"
                selectedKeys={[formData.ambiente]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData({ ...formData, ambiente: selected as "SANDBOX" | "PRODUCAO" });
                }}
                description="Use SANDBOX para testes e PRODUCAO para ambiente real"
              >
                <SelectItem key="SANDBOX">Sandbox (Teste)</SelectItem>
                <SelectItem key="PRODUCAO">Produção (Real)</SelectItem>
              </Select>
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className="font-semibold">Como obter suas credenciais:</h3>
              <div className="space-y-2 text-sm text-default-600">
                <p>1. Acesse o painel do Asaas</p>
                <p>2. Vá em "Configurações" → "Integrações"</p>
                <p>3. Copie sua API Key e Account ID</p>
                <p>4. Para ambiente de teste, use o Sandbox do Asaas</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" color="primary" isLoading={isLoading} startContent={isLoading ? <Spinner size="sm" /> : null}>
                {isLoading ? "Salvando..." : config ? "Atualizar" : "Configurar"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Informações Importantes */}
      <Card className="bg-warning/5 border border-warning/20">
        <CardHeader>
          <h3 className="font-semibold text-warning">Informações Importantes</h3>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <p>• Suas credenciais são criptografadas e armazenadas com segurança</p>
          <p>• Use o ambiente Sandbox para testes antes de ir para produção</p>
          <p>• A API Key deve começar com "$aact_"</p>
          <p>• Você pode testar a conexão a qualquer momento</p>
          <p>• Em caso de dúvidas, consulte a documentação do Asaas</p>
        </CardBody>
      </Card>
    </div>
  );
}
