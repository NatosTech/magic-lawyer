"use client";

import { useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Card, CardBody, Chip, Spinner, Tabs, Tab, Select, SelectItem } from "@heroui/react";
import { toast } from "sonner";

import {
  gerarPixDinamico,
  gerarBoletoAsaas,
  gerarCobrancaCartao,
} from "@/app/actions/cobranca-asaas";

interface Parcela {
  id: string;
  numero: number;
  valor: number;
  dataVencimento: Date;
  status: string;
  contrato: {
    cliente: {
      nome: string;
      cpfCnpj: string;
    };
  };
}

interface ModalPagamentoParcelaProps {
  parcela: Parcela;
  isOpen: boolean;
  onClose: () => void;
}

export function ModalPagamentoParcela({
  parcela,
  isOpen,
  onClose,
}: ModalPagamentoParcelaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<
    "PIX" | "DINHEIRO" | "CARTAO"
  >("PIX");
  const [dadosCartao, setDadosCartao] = useState({
    numero: "",
    nome: "",
    cvv: "",
    mes: "",
    ano: "",
  });
  const [dadosPagamento, setDadosPagamento] = useState<any>(null);

  const handleGerarCobranca = async () => {
    setIsLoading(true);
    try {
      let result;

      switch (formaPagamento) {
        case "PIX":
          result = await gerarPixDinamico({
            parcelaId: parcela.id,
            valor: parcela.valor,
            descricao: `Parcela ${parcela.numero} - ${parcela.contrato.cliente.nome}`,
            vencimento: parcela.dataVencimento,
          });
          break;

        case "DINHEIRO":
          result = await gerarBoletoAsaas({
            parcelaId: parcela.id,
            valor: parcela.valor,
            descricao: `Parcela ${parcela.numero} - ${parcela.contrato.cliente.nome}`,
            vencimento: parcela.dataVencimento,
          });
          break;

        case "CARTAO":
          result = await gerarCobrancaCartao({
            parcelaId: parcela.id,
            valor: parcela.valor,
            descricao: `Parcela ${parcela.numero} - ${parcela.contrato.cliente.nome}`,
            vencimento: parcela.dataVencimento,
            dadosCartao,
          });
          break;

        default:
          throw new Error("Forma de pagamento inválida");
      }

      if (result.success) {
        setDadosPagamento(result.data);
        toast.success("Cobrança gerada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar cobrança");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmarPagamento = async () => {
    setIsLoading(true);
    try {
      // Aqui você pode implementar a lógica para confirmar pagamento em dinheiro
      // Por exemplo, marcar a parcela como paga diretamente
      toast.success("Pagamento em dinheiro confirmado!");
      onClose();
    } catch (error) {
      toast.error("Erro ao confirmar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <Modal
      classNames={{
        base: "bg-background/95 backdrop-blur-xl border border-white/10",
        header: "border-b border-white/10",
        footer: "border-t border-white/10",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="4xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Gerar Cobrança</h2>
              <p className="text-sm text-default-400">
                Parcela {parcela.numero} - {parcela.contrato.cliente.nome}
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                {/* Resumo da Parcela */}
                <Card className="bg-primary/5 border border-primary/20">
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-primary">
                          Parcela {parcela.numero}
                        </h3>
                        <p className="text-sm text-default-400">
                          Cliente: {parcela.contrato.cliente.nome}
                        </p>
                        <p className="text-sm text-default-400">
                          CPF/CNPJ: {parcela.contrato.cliente.cpfCnpj}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(parcela.valor)}
                        </p>
                        <p className="text-xs text-default-500">
                          Vencimento: {formatDate(parcela.dataVencimento)}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {!dadosPagamento ? (
                  <>
                    {/* Seleção da Forma de Pagamento */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Forma de Pagamento</h3>
                      <Select
                        label="Selecione a forma de pagamento"
                        selectedKeys={[formaPagamento]}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;

                          setFormaPagamento(
                            selected as "PIX" | "DINHEIRO" | "CARTAO",
                          );
                        }}
                      >
                        <SelectItem key="PIX" textValue="PIX (Recomendado)">PIX (Recomendado)</SelectItem>
                        <SelectItem key="DINHEIRO" textValue="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem key="CARTAO" textValue="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      </Select>
                    </div>

                    {/* Dados do Cartão (se selecionado) */}
                    {formaPagamento === "CARTAO" && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Dados do Cartão</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            isRequired
                            label="Número do Cartão"
                            placeholder="0000 0000 0000 0000"
                            value={dadosCartao.numero}
                            onChange={(e) =>
                              setDadosCartao({
                                ...dadosCartao,
                                numero: e.target.value,
                              })
                            }
                          />
                          <Input
                            isRequired
                            label="Nome no Cartão"
                            placeholder="Nome como está no cartão"
                            value={dadosCartao.nome}
                            onChange={(e) =>
                              setDadosCartao({
                                ...dadosCartao,
                                nome: e.target.value,
                              })
                            }
                          />
                          <Input
                            isRequired
                            label="CVV"
                            placeholder="000"
                            value={dadosCartao.cvv}
                            onChange={(e) =>
                              setDadosCartao({
                                ...dadosCartao,
                                cvv: e.target.value,
                              })
                            }
                          />
                          <Input
                            isRequired
                            label="Mês"
                            placeholder="MM"
                            value={dadosCartao.mes}
                            onChange={(e) =>
                              setDadosCartao({
                                ...dadosCartao,
                                mes: e.target.value,
                              })
                            }
                          />
                          <Input
                            isRequired
                            label="Ano"
                            placeholder="AAAA"
                            value={dadosCartao.ano}
                            onChange={(e) =>
                              setDadosCartao({
                                ...dadosCartao,
                                ano: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Dados de Pagamento Gerados */}
                    <Tabs aria-label="Dados de Pagamento" color="primary">
                      {formaPagamento === "PIX" && (
                        <Tab key="pix" title="PIX">
                          <div className="space-y-4">
                            <Card className="bg-success/5 border border-success/20">
                              <CardBody className="p-4 text-center">
                                <h3 className="font-semibold text-success mb-2">
                                  PIX Gerado com Sucesso!
                                </h3>
                                <p className="text-sm text-default-600 mb-4">
                                  Escaneie o QR Code ou copie a chave PIX
                                </p>

                                {/* QR Code */}
                                {dadosPagamento.qrCodeImage && (
                                  <div className="flex justify-center mb-4">
                                    <img
                                      alt="QR Code PIX"
                                      className="w-48 h-48 border border-success/20 rounded-lg"
                                      src={dadosPagamento.qrCodeImage}
                                    />
                                  </div>
                                )}

                                {/* Chave PIX */}
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">
                                    Chave PIX:
                                  </p>
                                  <div className="flex gap-2">
                                    <Input
                                      readOnly
                                      className="flex-1"
                                      value={dadosPagamento.chavePix}
                                    />
                                    <Button
                                      color="success"
                                      variant="flat"
                                      onPress={() =>
                                        copyToClipboard(dadosPagamento.chavePix)
                                      }
                                    >
                                      Copiar
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-4 p-3 bg-success/10 rounded-lg">
                                  <p className="text-sm text-success">
                                    <strong>Valor:</strong>{" "}
                                    {formatCurrency(dadosPagamento.valor)}
                                  </p>
                                  <p className="text-sm text-success">
                                    <strong>Vencimento:</strong>{" "}
                                    {formatDate(dadosPagamento.vencimento)}
                                  </p>
                                </div>
                              </CardBody>
                            </Card>
                          </div>
                        </Tab>
                      )}

                      {formaPagamento === "DINHEIRO" && (
                        <Tab key="dinheiro" title="Dinheiro">
                          <div className="space-y-4">
                            <Card className="bg-success/5 border border-success/20">
                              <CardBody className="p-4 text-center">
                                <h3 className="font-semibold text-success mb-2">
                                  Pagamento em Dinheiro
                                </h3>
                                <p className="text-sm text-default-600 mb-4">
                                  Registre o pagamento recebido em dinheiro
                                </p>

                                <div className="space-y-4">
                                  <Button
                                    className="w-full"
                                    color="success"
                                    isLoading={isLoading}
                                    size="lg"
                                    variant="solid"
                                    onPress={handleConfirmarPagamento}
                                  >
                                    Confirmar Pagamento em Dinheiro
                                  </Button>

                                  <div className="mt-4 p-3 bg-success/10 rounded-lg">
                                    <p className="text-sm text-success">
                                      <strong>Valor:</strong>{" "}
                                      {formatCurrency(parcela.valor)}
                                    </p>
                                    <p className="text-sm text-success">
                                      <strong>Vencimento:</strong>{" "}
                                      {formatDate(parcela.dataVencimento)}
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </div>
                        </Tab>
                      )}

                      {formaPagamento === "CARTAO" && (
                        <Tab key="cartao" title="Cartão">
                          <div className="space-y-4">
                            <Card className="bg-primary/5 border border-primary/20">
                              <CardBody className="p-4 text-center">
                                <h3 className="font-semibold text-primary mb-2">
                                  Pagamento Processado!
                                </h3>
                                <p className="text-sm text-default-600 mb-4">
                                  Status do pagamento via cartão de crédito
                                </p>

                                <div className="space-y-4">
                                  <Chip
                                    color={
                                      dadosPagamento.status === "CONFIRMED"
                                        ? "success"
                                        : "warning"
                                    }
                                    size="lg"
                                    variant="flat"
                                  >
                                    {dadosPagamento.status === "CONFIRMED"
                                      ? "Pago"
                                      : "Processando"}
                                  </Chip>

                                  <div className="p-3 bg-primary/10 rounded-lg">
                                    <p className="text-sm text-primary">
                                      <strong>Valor:</strong>{" "}
                                      {formatCurrency(dadosPagamento.valor)}
                                    </p>
                                    <p className="text-sm text-primary">
                                      <strong>Vencimento:</strong>{" "}
                                      {formatDate(dadosPagamento.vencimento)}
                                    </p>
                                    <p className="text-sm text-primary">
                                      <strong>Status:</strong>{" "}
                                      {dadosPagamento.status}
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </div>
                        </Tab>
                      )}
                    </Tabs>
                  </>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              {!dadosPagamento ? (
                <>
                  <Button
                    disabled={isLoading}
                    variant="light"
                    onPress={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    disabled={isLoading}
                    startContent={isLoading ? <Spinner size="sm" /> : null}
                    onPress={handleGerarCobranca}
                  >
                    {isLoading ? "Gerando..." : "Gerar Cobrança"}
                  </Button>
                </>
              ) : (
                <Button color="primary" onPress={onClose}>
                  Fechar
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
