"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { ArrowLeft, Save, FileText, User, DollarSign, Calendar, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { title } from "@/components/primitives";
import { createContrato, type ContratoCreateInput } from "@/app/actions/contratos";
import { ContratoStatus } from "@/app/generated/prisma";
import { useClientesParaSelect, useProcuracoesDisponiveis } from "@/app/hooks/use-clientes";
import { Spinner } from "@heroui/spinner";

export default function NovoContratoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId");

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ContratoCreateInput>({
    titulo: "",
    descricao: "",
    status: ContratoStatus.RASCUNHO,
    clienteId: clienteIdParam || "",
    procuracaoId: undefined,
    observacoes: "",
  });

  // Buscar clientes para o select (apenas se não veio de um cliente)
  const { clientes, isLoading: isLoadingClientes } = useClientesParaSelect();
  const { procuracoes, isLoading: isLoadingProcuracoes } = useProcuracoesDisponiveis(formData.clienteId || null);

  if (isLoadingClientes && !clienteIdParam) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" label="Carregando dados..." />
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
          <p className="text-sm text-default-500 mt-1">Cadastrar novo contrato</p>
        </div>
        <Button as={Link} href={clienteIdParam ? `/clientes/${clienteIdParam}` : "/contratos"} variant="light" startContent={<ArrowLeft className="h-4 w-4" />}>
          Voltar
        </Button>
      </div>

      {/* Aviso se veio de um cliente */}
      {clienteIdParam && (
        <Card className="border border-secondary/20 bg-secondary/5">
          <CardBody className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-secondary" />
            <p className="text-sm text-secondary">Este contrato será vinculado ao cliente selecionado</p>
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
            <h3 className="text-sm font-semibold text-default-600">📋 Dados Básicos</h3>

            {/* Select de Cliente (se não veio de um cliente) */}
            {!clienteIdParam && (
              <Select
                label="Cliente *"
                placeholder="Selecione um cliente"
                selectedKeys={formData.clienteId ? [formData.clienteId] : []}
                onSelectionChange={(keys) => setFormData((prev) => ({ ...prev, clienteId: Array.from(keys)[0] as string }))}
                isRequired
                description="Selecione o cliente vinculado a este contrato"
                startContent={<User className="h-4 w-4 text-default-400" />}
              >
                {clientes.map((cliente: any) => (
                  <SelectItem key={cliente.id} value={cliente.id} textValue={cliente.nome}>
                    <div className="flex items-center gap-2">
                      {cliente.tipoPessoa === "JURIDICA" ? <Building2 className="h-4 w-4 text-default-400" /> : <User className="h-4 w-4 text-default-400" />}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{cliente.nome}</span>
                        {cliente.email && <span className="text-xs text-default-400">{cliente.email}</span>}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            )}

            <Input
              label="Título do Contrato *"
              placeholder="Ex: Contrato de Prestação de Serviços Jurídicos"
              value={formData.titulo}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, titulo: value }))}
              isRequired
            />

            {/* Select de Procuração (se cliente foi selecionado) */}
            {formData.clienteId && (
              <Select
                label="Vincular a Procuração (Opcional)"
                placeholder="Selecione uma procuração"
                selectedKeys={formData.procuracaoId ? [formData.procuracaoId] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData((prev) => ({ ...prev, procuracaoId: selectedKey || undefined }));
                }}
                isLoading={isLoadingProcuracoes}
                isDisabled={!formData.clienteId}
                description="Selecione uma procuração para vincular automaticamente ao processo"
                startContent={<FileText className="h-4 w-4 text-default-400" />}
              >
                {procuracoes.map((procuracao: any) => (
                  <SelectItem key={procuracao.id} value={procuracao.id} textValue={procuracao.numero || `Procuração ${procuracao.id.slice(-8)}`}>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{procuracao.numero || `Procuração ${procuracao.id.slice(-8)}`}</span>
                      <span className="text-xs text-default-400">{procuracao.processos.length} processo(s) vinculado(s)</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            )}

            <Textarea
              label="Descrição"
              placeholder="Objeto do contrato..."
              value={formData.descricao || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, descricao: value }))}
              minRows={3}
            />
          </div>

          <Divider />

          {/* Status e Valores */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">💰 Valores e Status</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                placeholder="Selecione o status"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) => setFormData((prev) => ({ ...prev, status: Array.from(keys)[0] as ContratoStatus }))}
              >
                <SelectItem key={ContratoStatus.RASCUNHO} value={ContratoStatus.RASCUNHO}>
                  Rascunho
                </SelectItem>
                <SelectItem key={ContratoStatus.EM_ANALISE} value={ContratoStatus.EM_ANALISE}>
                  Em Análise
                </SelectItem>
                <SelectItem key={ContratoStatus.ATIVO} value={ContratoStatus.ATIVO}>
                  Ativo
                </SelectItem>
                <SelectItem key={ContratoStatus.SUSPENSO} value={ContratoStatus.SUSPENSO}>
                  Suspenso
                </SelectItem>
                <SelectItem key={ContratoStatus.CANCELADO} value={ContratoStatus.CANCELADO}>
                  Cancelado
                </SelectItem>
                <SelectItem key={ContratoStatus.FINALIZADO} value={ContratoStatus.FINALIZADO}>
                  Finalizado
                </SelectItem>
              </Select>

              <Input
                type="number"
                label="Valor (R$)"
                placeholder="0,00"
                value={formData.valor?.toString() || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, valor: parseFloat(value) || undefined }))}
                startContent={<DollarSign className="h-4 w-4 text-default-400" />}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label="Data de Início"
                value={formData.dataInicio ? (typeof formData.dataInicio === "string" ? formData.dataInicio.split("T")[0] : new Date(formData.dataInicio).toISOString().split("T")[0]) : ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, dataInicio: value || undefined }))}
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
              />

              <Input
                type="date"
                label="Data de Término"
                value={formData.dataFim ? (typeof formData.dataFim === "string" ? formData.dataFim.split("T")[0] : new Date(formData.dataFim).toISOString().split("T")[0]) : ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, dataFim: value || undefined }))}
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
              />
            </div>
          </div>

          <Divider />

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">📝 Observações</h3>

            <Textarea
              label="Observações"
              placeholder="Informações adicionais..."
              value={formData.observacoes || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, observacoes: value }))}
              minRows={3}
            />
          </div>

          {/* Informação */}
          <div className="rounded-lg bg-secondary/5 border border-secondary/20 p-4">
            <p className="text-xs text-secondary-600">💡 Após criar o contrato, você poderá anexar documentos e enviar para assinatura digital.</p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            <Button variant="light" onPress={() => router.push(clienteIdParam ? `/clientes/${clienteIdParam}` : "/contratos")}>
              Cancelar
            </Button>
            <Button color="secondary" onPress={handleSubmit} isLoading={isSaving} startContent={!isSaving ? <Save className="h-4 w-4" /> : undefined}>
              Criar Contrato
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
