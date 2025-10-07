"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { ArrowLeft, Save, FileSignature, User, Calendar, Upload, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { title } from "@/components/primitives";
import { createProcuracao, type ProcuracaoCreateInput } from "@/app/actions/procuracoes";
import { ProcuracaoStatus, ProcuracaoEmitidaPor } from "@/app/generated/prisma";
import { useClientesParaSelect } from "@/app/hooks/use-clientes";
import { Spinner } from "@heroui/spinner";

export default function NovaProcuracaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId");

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProcuracaoCreateInput>({
    numero: "",
    observacoes: "",
    status: ProcuracaoStatus.RASCUNHO,
    emitidaPor: ProcuracaoEmitidaPor.ESCRITORIO,
    ativa: true,
    clienteId: clienteIdParam || "",
    processosIds: [],
    outorgadosIds: [],
  });

  // Buscar clientes para o select (apenas se não veio de um cliente)
  const { clientes, isLoading: isLoadingClientes } = useClientesParaSelect();

  if (isLoadingClientes && !clienteIdParam) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" label="Carregando dados..." />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!formData.clienteId) {
      toast.error("Selecione um cliente");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createProcuracao(formData);

      if (result.success) {
        toast.success("Procuração criada com sucesso!");

        // Redirecionar baseado em onde veio
        if (clienteIdParam) {
          router.push(`/clientes/${clienteIdParam}`);
        } else {
          router.push("/procuracoes");
        }
      } else {
        toast.error(result.error || "Erro ao criar procuração");
      }
    } catch (error) {
      console.error("Erro ao criar procuração:", error);
      toast.error("Erro ao criar procuração");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={title()}>Nova Procuração</h1>
          <p className="text-sm text-default-500 mt-1">Cadastrar nova procuração</p>
        </div>
        <Button as={Link} href={clienteIdParam ? `/clientes/${clienteIdParam}` : "/procuracoes"} variant="light" startContent={<ArrowLeft className="h-4 w-4" />}>
          Voltar
        </Button>
      </div>

      {/* Aviso se veio de um cliente */}
      {clienteIdParam && (
        <Card className="border border-success/20 bg-success/5">
          <CardBody className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-success" />
            <p className="text-sm text-success">Esta procuração será vinculada ao cliente selecionado</p>
          </CardBody>
        </Card>
      )}

      {/* Formulário */}
      <Card className="border border-default-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold">Informações da Procuração</h2>
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
                description="Selecione o cliente outorgante"
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
              label="Número da Procuração"
              placeholder="Ex: PROC-2024-001"
              value={formData.numero || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, numero: value }))}
              description="Número de controle interno (opcional)"
            />

            <Textarea
              label="Observações"
              placeholder="Poderes outorgados, observações especiais..."
              value={formData.observacoes || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, observacoes: value }))}
              minRows={4}
            />
          </div>

          <Divider />

          {/* Status e Datas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">📅 Status e Validade</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                placeholder="Selecione o status"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) => setFormData((prev) => ({ ...prev, status: Array.from(keys)[0] as ProcuracaoStatus }))}
              >
                <SelectItem key={ProcuracaoStatus.RASCUNHO} value={ProcuracaoStatus.RASCUNHO}>
                  Rascunho
                </SelectItem>
                <SelectItem key={ProcuracaoStatus.VIGENTE} value={ProcuracaoStatus.VIGENTE}>
                  Vigente
                </SelectItem>
                <SelectItem key={ProcuracaoStatus.REVOGADA} value={ProcuracaoStatus.REVOGADA}>
                  Revogada
                </SelectItem>
                <SelectItem key={ProcuracaoStatus.EXPIRADA} value={ProcuracaoStatus.EXPIRADA}>
                  Expirada
                </SelectItem>
              </Select>

              <Select
                label="Emitida Por"
                placeholder="Selecione"
                selectedKeys={formData.emitidaPor ? [formData.emitidaPor] : []}
                onSelectionChange={(keys) => setFormData((prev) => ({ ...prev, emitidaPor: Array.from(keys)[0] as ProcuracaoEmitidaPor }))}
              >
                <SelectItem key={ProcuracaoEmitidaPor.ESCRITORIO} value={ProcuracaoEmitidaPor.ESCRITORIO}>
                  Escritório
                </SelectItem>
                <SelectItem key={ProcuracaoEmitidaPor.CLIENTE} value={ProcuracaoEmitidaPor.CLIENTE}>
                  Cliente
                </SelectItem>
                <SelectItem key={ProcuracaoEmitidaPor.TRIBUNAL} value={ProcuracaoEmitidaPor.TRIBUNAL}>
                  Tribunal
                </SelectItem>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label="Data de Emissão"
                value={formData.emitidaEm ? (typeof formData.emitidaEm === "string" ? formData.emitidaEm.split("T")[0] : new Date(formData.emitidaEm).toISOString().split("T")[0]) : ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, emitidaEm: value || undefined }))}
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
              />

              <Input
                type="date"
                label="Válida Até"
                value={formData.validaAte ? (typeof formData.validaAte === "string" ? formData.validaAte.split("T")[0] : new Date(formData.validaAte).toISOString().split("T")[0]) : ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, validaAte: value || undefined }))}
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
              />
            </div>

            <Checkbox isSelected={formData.ativa ?? true} onValueChange={(checked) => setFormData((prev) => ({ ...prev, ativa: checked }))}>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Procuração Ativa</span>
                <span className="text-xs text-default-400">Marque se a procuração está em vigor</span>
              </div>
            </Checkbox>
          </div>

          {/* Informação */}
          <div className="rounded-lg bg-success/5 border border-success/20 p-4">
            <p className="text-xs text-success-600">
              💡 Após criar a procuração, você poderá:
              <br />
              • Vincular processos específicos
              <br />
              • Adicionar advogados outorgados
              <br />• Fazer upload do documento da procuração
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            <Button variant="light" onPress={() => router.push(clienteIdParam ? `/clientes/${clienteIdParam}` : "/procuracoes")}>
              Cancelar
            </Button>
            <Button color="success" onPress={handleSubmit} isLoading={isSaving} startContent={!isSaving ? <Save className="h-4 w-4" /> : undefined}>
              Criar Procuração
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
