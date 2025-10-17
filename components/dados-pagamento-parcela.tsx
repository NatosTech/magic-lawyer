"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, CardHeader, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Divider, Tooltip } from "@heroui/react";
import { CreditCard, Copy, QrCode, Download, Eye, CheckCircle, AlertCircle, Banknote, Smartphone } from "lucide-react";
import { getDadosPagamentoParcela } from "@/app/actions/parcelas-contrato";

interface DadosPagamentoParcelaProps {
  parcelaId: string;
  parcelaNumero: number;
  valor: number;
  status: string;
  className?: string;
}

export function DadosPagamentoParcela({ parcelaId, parcelaNumero, valor, status, className = "" }: DadosPagamentoParcelaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dadosPagamento, setDadosPagamento] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleOpenModal = async () => {
    setIsLoading(true);
    try {
      const result = await getDadosPagamentoParcela(parcelaId);
      if (result.success) {
        setDadosPagamento(result.data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de pagamento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAGA":
        return "success";
      case "PENDENTE":
        return "warning";
      case "ATRASADA":
        return "danger";
      case "CANCELADA":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAGA":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDENTE":
        return <AlertCircle className="h-4 w-4" />;
      case "ATRASADA":
        return <AlertCircle className="h-4 w-4" />;
      case "CANCELADA":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Tooltip content="Ver dados de pagamento" color="primary">
        <Button size="sm" variant="light" color="primary" startContent={<CreditCard className="h-4 w-4" />} onPress={handleOpenModal} isLoading={isLoading} className={className}>
          Pagamento
        </Button>
      </Tooltip>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Dados de Pagamento</h3>
                    <p className="text-sm text-default-500">
                      Parcela {parcelaNumero} - {formatCurrency(valor)}
                    </p>
                  </div>
                </div>
                <Chip color={getStatusColor(status)} variant="flat" startContent={getStatusIcon(status)} size="sm">
                  {status}
                </Chip>
              </ModalHeader>

              <ModalBody>
                {dadosPagamento && (
                  <div className="space-y-6">
                    {/* Informações da Parcela */}
                    <Card className="border border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2">
                        <h4 className="text-sm font-semibold text-primary">Informações da Parcela</h4>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-default-500">Valor</p>
                            <p className="font-semibold">{formatCurrency(dadosPagamento.parcela.valor)}</p>
                          </div>
                          <div>
                            <p className="text-default-500">Vencimento</p>
                            <p className="font-semibold">{formatDate(dadosPagamento.parcela.dataVencimento)}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Dados Bancários */}
                    <Card className="border border-success/20 bg-success/5">
                      <CardHeader className="pb-2">
                        <h4 className="text-sm font-semibold text-success flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          Dados Bancários
                        </h4>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-default-500">Banco</p>
                              <p className="text-sm font-semibold">{dadosPagamento.dadosBancarios.banco}</p>
                            </div>
                            {dadosPagamento.dadosBancarios.principal && (
                              <Chip size="sm" color="success" variant="flat">
                                Principal
                              </Chip>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-default-500">Agência</p>
                              <p className="text-sm font-semibold">{dadosPagamento.dadosBancarios.agencia}</p>
                            </div>
                            <div>
                              <p className="text-xs text-default-500">Conta</p>
                              <p className="text-sm font-semibold">{dadosPagamento.dadosBancarios.conta}</p>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* PIX */}
                    {dadosPagamento.pagamento.pix && (
                      <Card className="border border-secondary/20 bg-secondary/5">
                        <CardHeader className="pb-2">
                          <h4 className="text-sm font-semibold text-secondary flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            PIX
                          </h4>
                        </CardHeader>
                        <CardBody className="pt-0">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-default-500">Chave PIX</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono bg-background/50 px-2 py-1 rounded flex-1">{dadosPagamento.pagamento.pix.chave}</p>
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="secondary"
                                  startContent={copiedField === "pix" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  onPress={() => copyToClipboard(dadosPagamento.pagamento.pix.chave, "pix")}
                                >
                                  {copiedField === "pix" ? "Copiado!" : "Copiar"}
                                </Button>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-default-500">Valor</p>
                              <p className="text-sm font-semibold">{formatCurrency(dadosPagamento.pagamento.pix.valor)}</p>
                            </div>

                            <div>
                              <p className="text-xs text-default-500">Descrição</p>
                              <p className="text-sm">{dadosPagamento.pagamento.pix.descricao}</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {/* Boleto */}
                    <Card className="border border-warning/20 bg-warning/5">
                      <CardHeader className="pb-2">
                        <h4 className="text-sm font-semibold text-warning flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Boleto Bancário
                        </h4>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-default-500">Banco</p>
                              <p className="text-sm font-semibold">{dadosPagamento.pagamento.boleto.banco}</p>
                            </div>
                            <div>
                              <p className="text-xs text-default-500">Vencimento</p>
                              <p className="text-sm font-semibold">{formatDate(dadosPagamento.pagamento.boleto.vencimento)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-default-500">Agência</p>
                              <p className="text-sm font-semibold">{dadosPagamento.pagamento.boleto.agencia}</p>
                            </div>
                            <div>
                              <p className="text-xs text-default-500">Conta</p>
                              <p className="text-sm font-semibold">{dadosPagamento.pagamento.boleto.conta}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-default-500">Valor</p>
                            <p className="text-sm font-semibold">{formatCurrency(dadosPagamento.pagamento.boleto.valor)}</p>
                          </div>

                          <div>
                            <p className="text-xs text-default-500">Instruções</p>
                            <ul className="text-xs space-y-1">
                              {dadosPagamento.pagamento.boleto.instrucoes.map((instrucao: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-warning">•</span>
                                  <span>{instrucao}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Cliente */}
                    <Card className="border border-default/20 bg-default/5">
                      <CardHeader className="pb-2">
                        <h4 className="text-sm font-semibold text-default-700">Dados do Cliente</h4>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-default-500">Nome</p>
                            <p className="font-semibold">{dadosPagamento.cliente.nome}</p>
                          </div>
                          <div>
                            <p className="text-default-500">Documento</p>
                            <p className="font-semibold">{dadosPagamento.cliente.documento}</p>
                          </div>
                          {dadosPagamento.cliente.email && (
                            <div>
                              <p className="text-default-500">Email</p>
                              <p className="font-semibold">{dadosPagamento.cliente.email}</p>
                            </div>
                          )}
                          {dadosPagamento.cliente.telefone && (
                            <div>
                              <p className="text-default-500">Telefone</p>
                              <p className="font-semibold">{dadosPagamento.cliente.telefone}</p>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Fechar
                </Button>
                <Button color="primary" onPress={onClose}>
                  Entendi
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
