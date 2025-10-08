"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  ArrowLeft,
  Save,
  FileText,
  User,
  DollarSign,
  Calendar,
  Building2,
  AlertCircle,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Spinner } from "@heroui/spinner";

import { title } from "@/components/primitives";
import {
  getContratoById,
  updateContrato,
  vincularContratoProcuracao,
  type ContratoCreateInput,
} from "@/app/actions/contratos";
import { ContratoStatus } from "@/app/generated/prisma";
import {
  useClientesParaSelect,
  useProcuracoesDisponiveis,
} from "@/app/hooks/use-clientes";
import { useContratoDetalhado } from "@/app/hooks/use-contratos";

export default function EditarContratoPage({
  params,
}: {
  params: Promise<{ contratoId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const contratoId = resolvedParams.contratoId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContratoCreateInput>({
    titulo: "",
    resumo: "",
    status: ContratoStatus.RASCUNHO,
    clienteId: "",
    observacoes: "",
  });

  const [selectedProcuracao, setSelectedProcuracao] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const { clientes, isLoading: isLoadingClientes } = useClientesParaSelect();
  const { procuracoes, isLoading: isLoadingProcuracoes } =
    useProcuracoesDisponiveis(formData.clienteId || null);
  const { contrato, mutate } = useContratoDetalhado(contratoId);

  useEffect(() => {
    async function loadContrato() {
      setIsLoading(true);
      try {
        const result = await getContratoById(contratoId);

        if (result.success && result.contrato) {
          const contrato = result.contrato;

          setFormData({
            titulo: contrato.titulo,
            resumo: contrato.resumo || "",
            status: contrato.status,
            valor: contrato.valor,
            dataInicio: contrato.dataInicio
              ? new Date(contrato.dataInicio).toISOString().split("T")[0]
              : undefined,
            dataFim: contrato.dataFim
              ? new Date(contrato.dataFim).toISOString().split("T")[0]
              : undefined,
            clienteId: contrato.clienteId,
            observacoes: contrato.observacoes || "",
          });
        } else {
          setError(result.error || "Erro ao carregar contrato");
        }
      } catch (err) {
        setError("Erro ao carregar contrato");
      } finally {
        setIsLoading(false);
      }
    }

    loadContrato();
  }, [contratoId]);

  const handleVincularProcuracao = async () => {
    if (!selectedProcuracao) {
      toast.error("Selecione uma procuração");

      return;
    }

    setIsLinking(true);
    try {
      const result = await vincularContratoProcuracao(
        contratoId,
        selectedProcuracao,
      );

      if (result.success) {
        toast.success(
          result.message || "Contrato vinculado à procuração com sucesso!",
        );
        mutate(); // Atualizar dados do contrato
        onOpenChange();
        setSelectedProcuracao("");
      } else {
        toast.error(result.error || "Erro ao vincular procuração");
      }
    } catch (error) {
      console.error("Erro ao vincular procuração:", error);
      toast.error("Erro ao processar vinculação");
    } finally {
      setIsLinking(false);
    }
  };

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
      const result = await updateContrato(contratoId, formData);

      if (result.success) {
        toast.success("Contrato atualizado com sucesso!");
        router.push(`/contratos/${contratoId}`);
      } else {
        toast.error(result.error || "Erro ao atualizar contrato");
      }
    } catch (error) {
      console.error("Erro ao atualizar contrato:", error);
      toast.error("Erro ao atualizar contrato");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingClientes) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner label="Carregando dados..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-lg font-semibold text-danger">{error}</p>
        <Button color="primary" onPress={() => router.push("/contratos")}>
          Voltar para Contratos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={title()}>Editar Contrato</h1>
          <p className="text-sm text-default-500 mt-1">
            Atualizar informações do contrato
          </p>
        </div>
        <Button
          as={Link}
          href={`/contratos/${contratoId}`}
          startContent={<ArrowLeft className="h-4 w-4" />}
          variant="light"
        >
          Voltar
        </Button>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader className="flex gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <p className="text-md font-semibold">Informações do Contrato</p>
            <p className="text-small text-default-500">
              Preencha as informações básicas do contrato
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">
              📋 Dados Básicos
            </h3>

            {/* Cliente */}
            <Select
              isRequired
              label="Cliente"
              placeholder="Selecione o cliente"
              selectedKeys={formData.clienteId ? [formData.clienteId] : []}
              startContent={<User className="h-4 w-4 text-default-400" />}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;

                setFormData((prev) => ({ ...prev, clienteId: selected }));
              }}
            >
              {clientes?.map((cliente) => (
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

            {/* Título */}
            <Input
              isRequired
              label="Título do Contrato"
              placeholder="Ex: Contrato de Prestação de Serviços"
              startContent={<FileText className="h-4 w-4 text-default-400" />}
              value={formData.titulo}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, titulo: value }))
              }
            />

            {/* Status e Valor */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                isRequired
                label="Status"
                placeholder="Selecione o status"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as ContratoStatus;

                  setFormData((prev) => ({ ...prev, status: selected }));
                }}
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
                value={formData.valor ? String(formData.valor) : ""}
                onValueChange={(value) => {
                  const numericValue = value ? parseFloat(value) : undefined;

                  setFormData((prev) => ({ ...prev, valor: numericValue }));
                }}
              />
            </div>

            {/* Datas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Data de Início"
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
                type="date"
                value={
                  formData.dataInicio
                    ? formData.dataInicio instanceof Date
                      ? formData.dataInicio.toISOString().split("T")[0]
                      : formData.dataInicio.toString().split("T")[0]
                    : ""
                }
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, dataInicio: value }))
                }
              />

              <Input
                label="Data de Término"
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
                type="date"
                value={
                  formData.dataFim
                    ? formData.dataFim instanceof Date
                      ? formData.dataFim.toISOString().split("T")[0]
                      : formData.dataFim.toString().split("T")[0]
                    : ""
                }
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, dataFim: value }))
                }
              />
            </div>

            {/* Resumo */}
            <Textarea
              label="Resumo"
              minRows={3}
              placeholder="Breve resumo do contrato..."
              value={formData.resumo || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, resumo: value }))
              }
            />

            {/* Observações */}
            <Textarea
              label="Observações"
              minRows={3}
              placeholder="Observações adicionais..."
              value={formData.observacoes || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, observacoes: value }))
              }
            />

            {/* Procuração Vinculada */}
            <div className="p-4 rounded-lg border border-default-200 bg-default-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-default-700">
                  Vinculação de Procuração
                </h4>
                {contrato?.processo && (
                  <Button
                    color="primary"
                    size="sm"
                    startContent={<LinkIcon className="h-3 w-3" />}
                    variant="flat"
                    onPress={onOpen}
                  >
                    {contrato.processo.procuracoesVinculadas &&
                    contrato.processo.procuracoesVinculadas.length > 0
                      ? "Vincular Outra Procuração"
                      : "Vincular Procuração"}
                  </Button>
                )}
              </div>

              {contrato?.processo ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-default-600">
                        Este contrato está vinculado ao processo:
                      </p>
                      <p className="font-semibold text-default-900">
                        {contrato.processo.numero}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-default-200 pt-2">
                    {contrato.processo.procuracoesVinculadas &&
                    contrato.processo.procuracoesVinculadas.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-success">
                          <span className="font-medium">
                            ✓ {contrato.processo.procuracoesVinculadas.length}{" "}
                            procuração(ões) vinculada(s):
                          </span>
                        </div>
                        <div className="ml-4 space-y-1">
                          {contrato.processo.procuracoesVinculadas.map(
                            (pp: any, index: number) => (
                              <div
                                key={pp.procuracao.id}
                                className="flex items-center gap-2 text-xs text-default-600"
                              >
                                <span className="w-2 h-2 rounded-full bg-success" />
                                <span>
                                  {pp.procuracao.numero ||
                                    `Procuração ${index + 1}`}
                                </span>
                                {pp.procuracao.ativa ? (
                                  <span className="px-1 py-0.5 bg-success/20 text-success rounded text-xs">
                                    Ativa
                                  </span>
                                ) : (
                                  <span className="px-1 py-0.5 bg-warning/20 text-warning rounded text-xs">
                                    Inativa
                                  </span>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                        <p className="text-xs text-default-500 mt-2">
                          💡 Você pode vincular mais procurações ao mesmo
                          processo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-warning">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">
                            Este processo ainda não possui procurações
                            vinculadas
                          </span>
                        </div>
                        <p className="text-xs text-default-500 ml-6">
                          Clique em "Vincular Procuração" para conectar uma
                          procuração ao processo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-default-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">
                      Este contrato não está vinculado a nenhum processo
                    </span>
                  </div>
                  <p className="text-xs text-default-400 ml-6">
                    Para vincular uma procuração, primeiro é necessário vincular
                    o contrato a um processo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="light"
              onPress={() => router.push(`/contratos/${contratoId}`)}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={isSaving}
              startContent={
                !isSaving ? <Save className="h-4 w-4" /> : undefined
              }
              onPress={handleSubmit}
            >
              Salvar Alterações
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Modal Vincular Procuração */}
      <Modal isOpen={isOpen} size="md" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Vincular Procuração</h3>
                <p className="text-sm text-default-500">
                  {contrato?.processo ? (
                    <>
                      Verificar vinculação da procuração ao processo{" "}
                      <strong>{contrato.processo.numero}</strong>
                    </>
                  ) : (
                    <>
                      Selecione uma procuração para vincular ao contrato através
                      de um processo
                    </>
                  )}
                </p>
              </ModalHeader>
              <ModalBody>
                {isLoadingProcuracoes ? (
                  <div className="flex justify-center py-8">
                    <Spinner label="Carregando procurações..." size="lg" />
                  </div>
                ) : procuracoes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-default-500">
                      Nenhuma procuração ativa encontrada para este cliente.
                    </p>
                  </div>
                ) : (
                  <Select
                    label="Selecione uma procuração"
                    placeholder="Escolha uma procuração"
                    selectedKeys={
                      selectedProcuracao ? [selectedProcuracao] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;

                      setSelectedProcuracao(selectedKey || "");
                    }}
                  >
                    {procuracoes.map((procuracao: any) => (
                      <SelectItem
                        key={procuracao.id}
                        textValue={
                          procuracao.numero ||
                          `Procuração ${procuracao.id.slice(-8)}`
                        }
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {procuracao.numero ||
                              `Procuração ${procuracao.id.slice(-8)}`}
                          </span>
                          <span className="text-xs text-default-400">
                            {procuracao.processos.length} processo(s)
                            vinculado(s)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isDisabled={!selectedProcuracao || isLoadingProcuracoes}
                  isLoading={isLinking}
                  onPress={handleVincularProcuracao}
                >
                  Vincular
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
