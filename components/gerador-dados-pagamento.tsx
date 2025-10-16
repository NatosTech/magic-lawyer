"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Chip, Divider, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Tooltip, CopyIcon, CheckIcon } from "@heroui/react";
import { QrCodeIcon, CreditCardIcon, BanknoteIcon, CopyIcon as CopyIconLucide, CheckIcon as CheckIconLucide, DownloadIcon, EyeIcon } from "lucide-react";
import { toast } from "sonner";

import { type DadosBancariosContrato } from "@/app/hooks/use-dados-bancarios-contrato";

interface GeradorDadosPagamentoProps {
  dadosBancarios: DadosBancariosContrato;
  valor: number;
  descricao?: string;
  vencimento?: Date;
  parcelaId?: string;
}

interface DadosPix {
  chave: string;
  valor: string;
  descricao: string;
  beneficiario: string;
  cpfCnpj: string;
  cidade: string;
}

interface DadosBoleto {
  banco: string;
  agencia: string;
  conta: string;
  cedente: string;
  valor: string;
  vencimento: string;
  codigoBarras: string;
  linhaDigitavel: string;
}

export function GeradorDadosPagamento({ dadosBancarios, valor, descricao = "Pagamento de parcela", vencimento, parcelaId }: GeradorDadosPagamentoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>("");

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

  const gerarDadosPix = (): DadosPix => {
    return {
      chave: dadosBancarios.chavePix || "",
      valor: valor.toFixed(2),
      descricao: `${descricao} - ${dadosBancarios.titularNome}`,
      beneficiario: dadosBancarios.titularNome,
      cpfCnpj: dadosBancarios.titularDocumento,
      cidade: "São Paulo", // Pode ser configurável
    };
  };

  const gerarDadosBoleto = (): DadosBoleto => {
    // Simulação de dados de boleto
    const codigoBarras = `${dadosBancarios.banco.codigo}${Math.random().toString().slice(2, 15)}${Math.random().toString().slice(2, 15)}`;
    const linhaDigitavel =
      codigoBarras.slice(0, 4) +
      "." +
      codigoBarras.slice(4, 9) +
      "." +
      codigoBarras.slice(9, 14) +
      " " +
      codigoBarras.slice(14, 19) +
      "." +
      codigoBarras.slice(19, 24) +
      "." +
      codigoBarras.slice(24, 29) +
      " " +
      codigoBarras.slice(29, 34) +
      " " +
      codigoBarras.slice(34, 39);

    return {
      banco: dadosBancarios.banco.nome,
      agencia: dadosBancarios.agencia,
      conta: `${dadosBancarios.conta}${dadosBancarios.digitoConta ? `-${dadosBancarios.digitoConta}` : ""}`,
      cedente: dadosBancarios.titularNome,
      valor: valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      vencimento: vencimento?.toLocaleDateString("pt-BR") || "Não informado",
      codigoBarras,
      linhaDigitavel,
    };
  };

  const gerarQrCodePix = () => {
    const dadosPix = gerarDadosPix();
    const qrCodeData = {
      pix: dadosPix,
      tipo: "pix",
      parcelaId,
      timestamp: new Date().toISOString(),
    };

    setModalContent(JSON.stringify(qrCodeData, null, 2));
    setModalOpen(true);
  };

  const gerarQrCodeBoleto = () => {
    const dadosBoleto = gerarDadosBoleto();
    const qrCodeData = {
      boleto: dadosBoleto,
      tipo: "boleto",
      parcelaId,
      timestamp: new Date().toISOString(),
    };

    setModalContent(JSON.stringify(qrCodeData, null, 2));
    setModalOpen(true);
  };

  const dadosPix = gerarDadosPix();
  const dadosBoleto = gerarDadosBoleto();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <BanknoteIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Dados para Pagamento</h3>
          </div>
          <Chip color="primary" size="sm" variant="flat">
            R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody>
          <Tabs aria-label="Opções de pagamento" color="primary">
            {/* PIX */}
            <Tab
              key="pix"
              title={
                <div className="flex items-center space-x-2">
                  <QrCodeIcon className="h-4 w-4" />
                  <span>PIX</span>
                </div>
              }
            >
              <div className="space-y-4">
                {dadosBancarios.chavePix ? (
                  <>
                    <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-success-700">Chave PIX:</span>
                          <Tooltip content="Copiar chave PIX">
                            <Button isIconOnly size="sm" variant="light" onPress={() => handleCopy(dadosPix.chave, "Chave PIX")}>
                              {copiedField === "Chave PIX" ? <CheckIconLucide className="h-3 w-3 text-success" /> : <CopyIconLucide className="h-3 w-3" />}
                            </Button>
                          </Tooltip>
                        </div>
                        <p className="font-mono text-sm text-success-800">{dadosPix.chave}</p>
                        <p className="text-xs text-success-600">Tipo: {dadosBancarios.tipoChavePix?.replace("_", " ")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-default-600">Valor:</span>
                          <span className="font-mono text-sm font-medium">R$ {dadosPix.valor}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-default-600">Beneficiário:</span>
                          <span className="text-sm font-medium">{dadosPix.beneficiario}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-default-600">CPF/CNPJ:</span>
                          <span className="font-mono text-sm">{dadosPix.cpfCnpj}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-default-600">Descrição:</span>
                          <span className="text-sm text-right">{dadosPix.descricao}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button color="success" variant="flat" startContent={<QrCodeIcon className="h-4 w-4" />} onPress={gerarQrCodePix}>
                        Gerar QR Code PIX
                      </Button>
                      <Button
                        color="success"
                        variant="light"
                        startContent={<DownloadIcon className="h-4 w-4" />}
                        onPress={() => {
                          const dadosCompletos = {
                            tipo: "PIX",
                            dados: dadosPix,
                            instrucoes: ["1. Abra o aplicativo do seu banco", "2. Selecione a opção PIX", "3. Escaneie o QR Code ou copie a chave PIX", "4. Confirme os dados e efetue o pagamento"],
                          };
                          const blob = new Blob([JSON.stringify(dadosCompletos, null, 2)], {
                            type: "application/json",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `pix-parcela-${parcelaId || "nova"}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Baixar Dados
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <QrCodeIcon className="h-12 w-12 text-default-300 mx-auto mb-4" />
                    <p className="text-default-500">PIX não configurado</p>
                    <p className="text-sm text-default-400">Configure uma chave PIX na conta bancária</p>
                  </div>
                )}
              </div>
            </Tab>

            {/* Boleto */}
            <Tab
              key="boleto"
              title={
                <div className="flex items-center space-x-2">
                  <CreditCardIcon className="h-4 w-4" />
                  <span>Boleto</span>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-medium text-primary-700 mb-3">Dados do Boleto</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-600">Banco:</span>
                      <span className="text-sm font-medium text-primary-800">{dadosBoleto.banco}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-600">Agência:</span>
                      <span className="font-mono text-sm text-primary-800">{dadosBoleto.agencia}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-600">Conta:</span>
                      <span className="font-mono text-sm text-primary-800">{dadosBoleto.conta}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-600">Cedente:</span>
                      <span className="text-sm font-medium text-primary-800">{dadosBoleto.cedente}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-600">Valor:</span>
                      <span className="text-sm font-bold text-primary-800">R$ {dadosBoleto.valor}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-600">Vencimento:</span>
                      <span className="text-sm text-primary-800">{dadosBoleto.vencimento}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Linha Digitável:</span>
                    <Tooltip content="Copiar linha digitável">
                      <Button isIconOnly size="sm" variant="light" onPress={() => handleCopy(dadosBoleto.linhaDigitavel, "Linha Digitável")}>
                        {copiedField === "Linha Digitável" ? <CheckIconLucide className="h-3 w-3 text-success" /> : <CopyIconLucide className="h-3 w-3" />}
                      </Button>
                    </Tooltip>
                  </div>
                  <p className="font-mono text-sm bg-default-100 p-2 rounded">{dadosBoleto.linhaDigitavel}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Código de Barras:</span>
                    <Tooltip content="Copiar código de barras">
                      <Button isIconOnly size="sm" variant="light" onPress={() => handleCopy(dadosBoleto.codigoBarras, "Código de Barras")}>
                        {copiedField === "Código de Barras" ? <CheckIconLucide className="h-3 w-3 text-success" /> : <CopyIconLucide className="h-3 w-3" />}
                      </Button>
                    </Tooltip>
                  </div>
                  <p className="font-mono text-sm bg-default-100 p-2 rounded">{dadosBoleto.codigoBarras}</p>
                </div>

                <div className="flex gap-2">
                  <Button color="primary" variant="flat" startContent={<QrCodeIcon className="h-4 w-4" />} onPress={gerarQrCodeBoleto}>
                    Gerar QR Code Boleto
                  </Button>
                  <Button
                    color="primary"
                    variant="light"
                    startContent={<DownloadIcon className="h-4 w-4" />}
                    onPress={() => {
                      const dadosCompletos = {
                        tipo: "Boleto",
                        dados: dadosBoleto,
                        instrucoes: [
                          "1. Acesse o site ou app do seu banco",
                          "2. Selecione 'Pagamento de Boleto'",
                          "3. Digite o código de barras ou linha digitável",
                          "4. Confirme os dados e efetue o pagamento",
                        ],
                      };
                      const blob = new Blob([JSON.stringify(dadosCompletos, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `boleto-parcela-${parcelaId || "nova"}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Baixar Dados
                  </Button>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Modal QR Code */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="2xl">
        <ModalContent>
          <ModalHeader>Dados do QR Code</ModalHeader>
          <ModalBody>
            <Textarea value={modalContent} readOnly minRows={10} placeholder="Dados do QR Code aparecerão aqui..." />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setModalOpen(false)}>
              Fechar
            </Button>
            <Button
              color="primary"
              onPress={() => {
                handleCopy(modalContent, "Dados QR Code");
                setModalOpen(false);
              }}
            >
              Copiar Dados
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
