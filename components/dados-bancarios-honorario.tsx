"use client";

import { useState } from "react";
import {
  Card, CardBody, CardHeader, Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Divider, Tooltip, Select, SelectItem } from "@heroui/react";
import {
  CreditCardIcon,
  BuildingIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CopyIcon,
  CheckIcon,
  EditIcon,
  DollarSignIcon,
} from "lucide-react";
import { toast } from "@/lib/toast";

import { useDadosPagamentoHonorario } from "@/app/hooks/use-honorarios-contratuais";
import { useDadosBancariosAtivos } from "@/app/hooks/use-dados-bancarios";
import { GeradorDadosPagamento } from "@/components/gerador-dados-pagamento";
import { updateHonorarioContratual } from "@/app/actions/honorarios-contratuais";

interface DadosBancariosHonorarioProps {
  honorarioId: string;
  readonly?: boolean;
}

export function DadosBancariosHonorario({
  honorarioId,
  readonly = false,
}: DadosBancariosHonorarioProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const { dadosPagamento, isLoading, recarregar } =
    useDadosPagamentoHonorario(honorarioId);
  const { dadosBancarios } = useDadosBancariosAtivos();

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copiado!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const handleContaChange = async (newDadosBancariosId: string) => {
    setLoadingUpdate(true);
    try {
      const result = await updateHonorarioContratual(honorarioId, {
        dadosBancariosId: newDadosBancariosId,
      });

      if (result.success) {
        toast.success("Conta bancária do honorário atualizada!");
        recarregar(); // Re-fetch payment data
        setModalOpen(false);
      } else {
        toast.error(result.error || "Erro ao atualizar conta bancária");
      }
    } catch (error) {
      toast.error("Erro inesperado ao atualizar conta bancária");
    } finally {
      setLoadingUpdate(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-default-500">
                Carregando dados bancários...
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Type guard para verificar se é dados de pagamento completos
  const isDadosPagamentoCompletos = (
    data: any,
  ): data is {
    honorario: any;
    contaBancaria: any;
    cliente: any;
    contrato: any;
  } => {
    return (
      data &&
      data.contaBancaria &&
      data.honorario &&
      data.cliente &&
      data.contrato
    );
  };

  if (!dadosPagamento || !isDadosPagamentoCompletos(dadosPagamento)) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-4">
            <CreditCardIcon className="h-12 w-12 text-default-300 mx-auto mb-2" />
            <p className="text-default-500">
              Nenhuma conta bancária configurada
            </p>
            <p className="text-sm text-default-400">
              Configure uma conta para receber pagamentos
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { contaBancaria, honorario, cliente, contrato } = dadosPagamento;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <DollarSignIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Dados para Pagamento</h3>
          </div>
          <div className="flex items-center gap-2">
            <Chip color="success" size="sm" variant="flat">
              {honorario.tipo}
            </Chip>
            {!readonly && dadosBancarios.length > 1 && (
              <Button
                size="sm"
                startContent={<EditIcon className="h-4 w-4" />}
                variant="light"
                onPress={() => setModalOpen(true)}
              >
                Alterar Conta
              </Button>
            )}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {/* Dados do Banco */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BuildingIcon className="h-4 w-4 text-default-400" />
                <div>
                  <p className="text-sm font-medium">{contaBancaria.banco}</p>
                  <p className="text-xs text-default-500">
                    {contaBancaria.tipoConta}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-600">Agência:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {contaBancaria.agencia}
                    </span>
                    <Tooltip content="Copiar agência">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() =>
                          handleCopy(contaBancaria.agencia, "Agência")
                        }
                      >
                        {copiedField === "Agência" ? (
                          <CheckIcon className="h-3 w-3 text-success" />
                        ) : (
                          <CopyIcon className="h-3 w-3" />
                        )}
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-600">Conta:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {contaBancaria.conta}
                    </span>
                    <Tooltip content="Copiar conta">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleCopy(contaBancaria.conta, "Conta")}
                      >
                        {copiedField === "Conta" ? (
                          <CheckIcon className="h-3 w-3 text-success" />
                        ) : (
                          <CopyIcon className="h-3 w-3" />
                        )}
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Titular */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-default-400" />
                <div>
                  <p className="text-sm font-medium">{contaBancaria.titular}</p>
                  <p className="text-xs text-default-500">
                    {contaBancaria.documento}
                  </p>
                </div>
              </div>

              {cliente.email && (
                <div className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-default-400" />
                  <span className="text-sm">{cliente.email}</span>
                </div>
              )}

              {cliente.telefone && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-default-400" />
                  <span className="text-sm">{cliente.telefone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dados de Pagamento */}
          <Divider />
          <div className="mt-4">
            <GeradorDadosPagamento
              dadosBancarios={
                {
                  id: contaBancaria.id,
                  banco: { codigo: "001", nome: contaBancaria.banco },
                  agencia: contaBancaria.agencia,
                  conta: contaBancaria.conta,
                  tipoContaBancaria: contaBancaria.tipoContaBancaria as
                    | "CORRENTE"
                    | "POUPANCA"
                    | "SALARIO"
                    | "INVESTIMENTO",
                  chavePix: contaBancaria.chavePix || undefined,
                  tipoChavePix: contaBancaria.tipoChavePix || undefined,
                  titularNome: contaBancaria.titular,
                  titularDocumento: contaBancaria.documento,
                  titularEmail: cliente.email || undefined,
                  titularTelefone: cliente.telefone || undefined,
                  principal: false,
                  ativo: true,
                } as any
              }
              descricao={`Honorário - ${contrato.titulo}`}
              valor={honorario.valorCalculado}
            />
          </div>

          {/* Valor do Honorário */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-700">
                Valor do Honorário:
              </span>
              <span className="text-lg font-bold text-primary-800">
                R${" "}
                {honorario.valorCalculado.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            {honorario.detalhes && (
              <p className="text-xs text-primary-600 mt-1">
                {honorario.detalhes}
              </p>
            )}
          </div>

          {/* Informações do Cliente */}
          <div className="bg-default-50 border border-default-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <UserIcon className="h-4 w-4 text-default-500" />
              <span className="text-sm font-medium text-default-700">
                Cliente: {cliente.nome}
              </span>
            </div>
            <p className="text-xs text-default-600">
              Contrato: {contrato.titulo}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Modal para Selecionar Conta */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Selecionar Conta Bancária para o Honorário</ModalHeader>
          <ModalBody>
            <Select
              isLoading={loadingUpdate}
              label="Conta para Recebimento"
              placeholder="Selecione uma conta"
              selectedKeys={contaBancaria.id ? [contaBancaria.id] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;

                handleContaChange(selectedKey);
              }}
            >
              {(dadosBancarios || []).map((conta) => (
                <SelectItem
                  key={conta.id}
                  textValue={`${conta.titularNome} - ${conta.banco?.nome} - ${conta.agencia}/${conta.conta}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{conta.titularNome}</span>
                    <span className="text-xs text-default-500">
                      {conta.banco?.nome} - {conta.agencia}/{conta.conta}
                      {conta.principal && " (Principal)"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={loadingUpdate}
              variant="light"
              onPress={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              isDisabled={loadingUpdate}
              onPress={() => {
                /* Ação de salvar já está no onSelectionChange */
              }}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
