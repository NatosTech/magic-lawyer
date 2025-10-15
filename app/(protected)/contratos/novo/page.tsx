"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import {
  ArrowLeft,
  Save,
  FileText,
  User,
  DollarSign,
  Calendar,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@heroui/spinner";

import { title } from "@/components/primitives";
import {
  createContrato,
  type ContratoCreateInput,
} from "@/app/actions/contratos";
import { ContratoStatus } from "@/app/generated/prisma";
import {
  useClientesParaSelect,
  useProcuracoesDisponiveis,
} from "@/app/hooks/use-clientes";
import { useDadosBancariosAtivos } from "@/app/hooks/use-dados-bancarios";

export default function NovoContratoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId");

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ContratoCreateInput>({
    titulo: "",
    resumo: "",
    status: ContratoStatus.RASCUNHO,
    clienteId: clienteIdParam || "",
    observacoes: "",
  });

  // Buscar clientes para o select (apenas se não veio de um cliente)
  const { clientes, isLoading: isLoadingClientes } = useClientesParaSelect();
  const { procuracoes, isLoading: isLoadingProcuracoes } =
    useProcuracoesDisponiveis(formData.clienteId || null);
  const { dadosBancarios, isLoading: isLoadingDadosBancarios } =
    useDadosBancariosAtivos();

  if (isLoadingClientes && !clienteIdParam) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner label="Carregando dados..." size="lg" />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error("Título do contrato é obrigatório");

      return;
    }

    if (!formData.clienteId) {
      toast.error("Selecione um cliente");

      return;
    }

    setIsSaving(true);

    try {
      const result = await createContrato(formData);

      if (result.success) {
        toast.success("Contrato criado com sucesso!");

        // Redirecionar baseado em onde veio
        if (clienteIdParam) {
          router.push(`/clientes/${clienteIdParam}`);
        } else {
          router.push("/contratos");
        }
      } else {
        toast.error(result.error || "Erro ao criar contrato");
      }
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
      toast.error("Erro ao criar contrato");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={title()}>Novo Contrato</h1>
          <p className="text-sm text-default-500 mt-1">
            Cadastrar novo contrato
          </p>
        </div>
        <Button
          as={Link}
          href={clienteIdParam ? `/clientes/${clienteIdParam}` : "/contratos"}
          startContent={<ArrowLeft className="h-4 w-4" />}
          variant="light"
        >
          Voltar
        </Button>
      </div>

      {/* Aviso se veio de um cliente */}
      {clienteIdParam && (
        <Card className="border border-secondary/20 bg-secondary/5">
          <CardBody className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-secondary" />
            <p className="text-sm text-secondary">
              Este contrato será vinculado ao cliente selecionado
            </p>
          </CardBody>
        </Card>
      )}

      {/* Formulário */}
      <Card className="border border-default-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-semibold">Informações do Contrato</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-6">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">
              📋 Dados Básicos
            </h3>

            {/* Select de Cliente (se não veio de um cliente) */}
            {!clienteIdParam && (
              <Select
                isRequired
                description="Selecione o cliente vinculado a este contrato"
                label="Cliente *"
                placeholder="Selecione um cliente"
                selectedKeys={formData.clienteId ? [formData.clienteId] : []}
                startContent={<User className="h-4 w-4 text-default-400" />}
                onSelectionChange={(keys) =>
                  setFormData((prev) => ({
                    ...prev,
                    clienteId: Array.from(keys)[0] as string,
                  }))
                }
              >
                {clientes.map((cliente: any) => (
                  <SelectItem key={cliente.id} textValue={cliente.nome}>
                    <div className="flex items-center gap-2">
                      {cliente.tipoPessoa === "JURIDICA" ? (
                        <Building2 className="h-4 w-4 text-default-400" />
                      ) : (
                        <User className="h-4 w-4 text-default-400" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {cliente.nome}
                        </span>
                        {cliente.email && (
                          <span className="text-xs text-default-400">
                            {cliente.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            )}

            <Input
              isRequired
              label="Título do Contrato *"
              placeholder="Ex: Contrato de Prestação de Serviços Jurídicos"
              value={formData.titulo}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, titulo: value }))
              }
            />

            {/* Nota sobre vinculação de procuração */}
            {formData.clienteId && (
              <div className="p-4 rounded-lg border border-default-200 bg-default-50">
                <p className="text-sm text-default-600">
                  💡 <strong>Dica:</strong> Após criar o contrato, você poderá
                  vincular uma procuração através da lista de contratos.
                </p>
              </div>
            )}

            <Textarea
              label="Resumo"
              minRows={3}
              placeholder="Resumo do objeto do contrato..."
              value={formData.resumo || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, resumo: value }))
              }
            />
          </div>

          <Divider />

          {/* Status e Valores */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">
              💰 Valores e Status
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                placeholder="Selecione o status"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: Array.from(keys)[0] as ContratoStatus,
                  }))
                }
              >
                <SelectItem key={ContratoStatus.RASCUNHO}>Rascunho</SelectItem>
                <SelectItem key={ContratoStatus.ATIVO}>Ativo</SelectItem>
                <SelectItem key={ContratoStatus.SUSPENSO}>Suspenso</SelectItem>
                <SelectItem key={ContratoStatus.CANCELADO}>
                  Cancelado
                </SelectItem>
                <SelectItem key={ContratoStatus.ENCERRADO}>
                  Encerrado
                </SelectItem>
              </Select>

              <Input
                label="Valor (R$)"
                placeholder="0,00"
                startContent={
                  <DollarSign className="h-4 w-4 text-default-400" />
                }
                type="number"
                value={formData.valor?.toString() || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor: parseFloat(value) || undefined,
                  }))
                }
              />
            </div>

            <Select
              description="Conta onde os pagamentos deste contrato serão recebidos"
              isLoading={isLoadingDadosBancarios}
              label="Conta Bancária para Recebimento"
              placeholder="Selecione uma conta (opcional)"
              selectedKeys={
                formData.dadosBancariosId ? [formData.dadosBancariosId] : []
              }
              onSelectionChange={(keys) =>
                setFormData((prev) => ({
                  ...prev,
                  dadosBancariosId: Array.from(keys)[0] as string,
                }))
              }
            >
              {dadosBancarios.map((conta: any) => (
                <SelectItem
                  key={conta.id}
                  textValue={`${conta.banco} - ${conta.titularNome}`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{conta.banco}</span>
                      {conta.principal && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-default-500">
                      Ag: {conta.agencia} - CC: {conta.conta}
                      {conta.digitoConta && `-${conta.digitoConta}`}
                    </span>
                    <span className="text-xs text-default-400">
                      {conta.titularNome}
                    </span>
                    {conta.chavePix && (
                      <span className="text-xs text-default-400">
                        PIX: {conta.chavePix}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </Select>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Data de Início"
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
                type="date"
                value={
                  formData.dataInicio
                    ? typeof formData.dataInicio === "string"
                      ? formData.dataInicio.split("T")[0]
                      : new Date(formData.dataInicio)
                          .toISOString()
                          .split("T")[0]
                    : ""
                }
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    dataInicio: value || undefined,
                  }))
                }
              />

              <Input
                label="Data de Término"
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
                type="date"
                value={
                  formData.dataFim
                    ? typeof formData.dataFim === "string"
                      ? formData.dataFim.split("T")[0]
                      : new Date(formData.dataFim).toISOString().split("T")[0]
                    : ""
                }
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    dataFim: value || undefined,
                  }))
                }
              />
            </div>
          </div>

          <Divider />

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">
              📝 Observações
            </h3>

            <Textarea
              label="Observações"
              minRows={3}
              placeholder="Informações adicionais..."
              value={formData.observacoes || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, observacoes: value }))
              }
            />
          </div>

          {/* Informação */}
          <div className="rounded-lg bg-secondary/5 border border-secondary/20 p-4">
            <p className="text-xs text-secondary-600">
              💡 Após criar o contrato, você poderá anexar documentos e enviar
              para assinatura digital.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="light"
              onPress={() =>
                router.push(
                  clienteIdParam ? `/clientes/${clienteIdParam}` : "/contratos",
                )
              }
            >
              Cancelar
            </Button>
            <Button
              color="secondary"
              isLoading={isSaving}
              startContent={
                !isSaving ? <Save className="h-4 w-4" /> : undefined
              }
              onPress={handleSubmit}
            >
              Criar Contrato
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
