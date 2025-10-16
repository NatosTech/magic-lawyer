"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem, Divider, Tooltip } from "@heroui/react";
import { CreditCardIcon, BuildingIcon, UserIcon, MapPinIcon, PhoneIcon, MailIcon, CopyIcon, CheckIcon, QrCodeIcon, EyeIcon, EditIcon } from "lucide-react";
import { toast } from "sonner";

import { useDadosBancariosContrato, useContasDisponiveisContrato, type DadosBancariosContrato } from "@/app/hooks/use-dados-bancarios-contrato";
import { GeradorDadosPagamento } from "@/components/gerador-dados-pagamento";

interface DadosBancariosParcelaProps {
  contratoId: string;
  valor: number;
  onContaChange?: (contaId: string) => void;
  contaSelecionada?: string;
  readonly?: boolean;
  descricao?: string;
  vencimento?: Date;
  parcelaId?: string;
}

export function DadosBancariosParcela({ contratoId, valor, onContaChange, contaSelecionada, readonly = false, descricao = "Pagamento de parcela", vencimento, parcelaId }: DadosBancariosParcelaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { dadosBancarios, isLoading } = useDadosBancariosContrato(contratoId);
  const { contas, isLoading: loadingContas } = useContasDisponiveisContrato(contratoId);

  const contaAtual = contaSelecionada ? contas.find((c) => c.id === contaSelecionada) || dadosBancarios : dadosBancarios;

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

  if (isLoading || loadingContas) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-default-500">Carregando dados bancários...</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!contaAtual) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-4">
            <CreditCardIcon className="h-12 w-12 text-default-300 mx-auto mb-2" />
            <p className="text-default-500">Nenhuma conta bancária configurada</p>
            <p className="text-sm text-default-400">Configure uma conta para receber pagamentos</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Dados para Pagamento</h3>
          </div>
          <div className="flex items-center gap-2">
            {contaAtual.principal && (
              <Chip color="primary" size="sm" variant="flat">
                Conta Principal
              </Chip>
            )}
            {!readonly && contas.length > 1 && (
              <Button size="sm" variant="light" startContent={<EditIcon className="h-4 w-4" />} onPress={() => setModalOpen(true)}>
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
                  <p className="text-sm font-medium">{contaAtual.banco.nome}</p>
                  <p className="text-xs text-default-500">Código: {contaAtual.banco.codigo}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-600">Agência:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{contaAtual.agencia}</span>
                    <Tooltip content="Copiar agência">
                      <Button isIconOnly size="sm" variant="light" onPress={() => handleCopy(contaAtual.agencia, "Agência")}>
                        {copiedField === "Agência" ? <CheckIcon className="h-3 w-3 text-success" /> : <CopyIcon className="h-3 w-3" />}
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-600">Conta:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {contaAtual.conta}
                      {contaAtual.digitoConta ? `-${contaAtual.digitoConta}` : ""}
                    </span>
                    <Tooltip content="Copiar conta">
                      <Button isIconOnly size="sm" variant="light" onPress={() => handleCopy(`${contaAtual.conta}${contaAtual.digitoConta ? `-${contaAtual.digitoConta}` : ""}`, "Conta")}>
                        {copiedField === "Conta" ? <CheckIcon className="h-3 w-3 text-success" /> : <CopyIcon className="h-3 w-3" />}
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
                  <p className="text-sm font-medium">{contaAtual.titularNome}</p>
                  <p className="text-xs text-default-500">{contaAtual.titularDocumento}</p>
                </div>
              </div>

              {contaAtual.titularEmail && (
                <div className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-default-400" />
                  <span className="text-sm">{contaAtual.titularEmail}</span>
                </div>
              )}

              {contaAtual.titularTelefone && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-default-400" />
                  <span className="text-sm">{contaAtual.titularTelefone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dados de Pagamento */}
          <Divider />
          <div className="mt-4">
            <GeradorDadosPagamento dadosBancarios={contaAtual} valor={valor} descricao={descricao} vencimento={vencimento} parcelaId={parcelaId} />
          </div>

          {/* Valor da Parcela */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-700">Valor da Parcela:</span>
              <span className="text-lg font-bold text-primary-800">R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Modal para Selecionar Conta */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Selecionar Conta Bancária</ModalHeader>
          <ModalBody>
            <Select
              label="Conta para Recebimento"
              placeholder="Selecione uma conta"
              selectedKeys={contaSelecionada ? [contaSelecionada] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                if (onContaChange) {
                  onContaChange(selectedKey);
                }
                setModalOpen(false);
              }}
            >
              {contas.map((conta) => (
                <SelectItem key={conta.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{conta.titularNome}</span>
                    <span className="text-xs text-default-500">
                      {conta.banco.nome} - {conta.agencia}/{conta.conta}
                      {conta.principal && " (Principal)"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
