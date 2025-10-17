"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
  Progress,
} from "@heroui/react";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  SettingsIcon,
  CreditCardIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useDadosBancariosContrato } from "@/app/hooks/use-dados-bancarios-contrato";

interface ValidacaoContaPrincipalProps {
  contratoId: string;
  onContaValidada?: (isValid: boolean) => void;
}

interface ValidacaoItem {
  id: string;
  titulo: string;
  descricao: string;
  status: "pendente" | "aprovado" | "rejeitado" | "aviso";
  obrigatorio: boolean;
  acao?: () => void;
}

export function ValidacaoContaPrincipal({
  contratoId,
  onContaValidada,
}: ValidacaoContaPrincipalProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [validacoes, setValidacoes] = useState<ValidacaoItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const { dadosBancarios, isLoading, mutate } =
    useDadosBancariosContrato(contratoId);

  useEffect(() => {
    if (dadosBancarios) {
      executarValidacoes();
    }
  }, [dadosBancarios]);

  const executarValidacoes = async () => {
    if (!dadosBancarios) return;

    setIsValidating(true);
    setProgresso(0);

    const novasValidacoes: ValidacaoItem[] = [];

    // Validação 1: Conta ativa
    setProgresso(20);
    novasValidacoes.push({
      id: "conta-ativa",
      titulo: "Conta Bancária Ativa",
      descricao: "Verificando se a conta está ativa e funcionando",
      status: dadosBancarios.ativo ? "aprovado" : "rejeitado",
      obrigatorio: true,
    });

    // Validação 2: Dados completos
    setProgresso(40);
    const dadosCompletos = !!(
      dadosBancarios.banco &&
      dadosBancarios.agencia &&
      dadosBancarios.conta &&
      dadosBancarios.titularNome &&
      dadosBancarios.titularDocumento
    );

    novasValidacoes.push({
      id: "dados-completos",
      titulo: "Dados Completos",
      descricao: "Verificando se todos os dados bancários estão preenchidos",
      status: dadosCompletos ? "aprovado" : "rejeitado",
      obrigatorio: true,
    });

    // Validação 3: Chave PIX configurada
    setProgresso(60);
    const pixConfigurado = !!dadosBancarios.chavePix;

    novasValidacoes.push({
      id: "pix-configurado",
      titulo: "Chave PIX Configurada",
      descricao: "Verificando se há uma chave PIX configurada",
      status: pixConfigurado ? "aprovado" : "aviso",
      obrigatorio: false,
    });

    // Validação 4: Conta principal
    setProgresso(80);
    novasValidacoes.push({
      id: "conta-principal",
      titulo: "Conta Principal",
      descricao: "Verificando se esta é a conta principal do escritório",
      status: dadosBancarios.principal ? "aprovado" : "aviso",
      obrigatorio: false,
    });

    // Validação 5: Documento válido
    setProgresso(100);
    const documentoValido = validarDocumento(dadosBancarios.titularDocumento);

    novasValidacoes.push({
      id: "documento-valido",
      titulo: "Documento Válido",
      descricao: "Verificando se o CPF/CNPJ está válido",
      status: documentoValido ? "aprovado" : "rejeitado",
      obrigatorio: true,
    });

    setValidacoes(novasValidacoes);
    setIsValidating(false);

    // Calcular status geral
    const validacoesObrigatorias = novasValidacoes.filter((v) => v.obrigatorio);
    const aprovadas = validacoesObrigatorias.filter(
      (v) => v.status === "aprovado",
    );
    const isValid = aprovadas.length === validacoesObrigatorias.length;

    onContaValidada?.(isValid);
  };

  const validarDocumento = (documento: string): boolean => {
    // Remover caracteres não numéricos
    const numeros = documento.replace(/\D/g, "");

    // Verificar se é CPF (11 dígitos) ou CNPJ (14 dígitos)
    if (numeros.length === 11) {
      return validarCPF(numeros);
    } else if (numeros.length === 14) {
      return validarCNPJ(numeros);
    }

    return false;
  };

  const validarCPF = (cpf: string): boolean => {
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validar dígitos verificadores
    let soma = 0;

    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);

    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const validarCNPJ = (cnpj: string): boolean => {
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    // Validar primeiro dígito verificador
    let soma = 0;
    let peso = 2;

    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    let resto = soma % 11;
    let dv1 = resto < 2 ? 0 : 11 - resto;

    if (dv1 !== parseInt(cnpj.charAt(12))) return false;

    // Validar segundo dígito verificador
    soma = 0;
    peso = 2;
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    resto = soma % 11;
    let dv2 = resto < 2 ? 0 : 11 - resto;

    if (dv2 !== parseInt(cnpj.charAt(13))) return false;

    return true;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
        return <CheckCircleIcon className="h-4 w-4 text-success" />;
      case "rejeitado":
        return <XCircleIcon className="h-4 w-4 text-danger" />;
      case "aviso":
        return <AlertTriangleIcon className="h-4 w-4 text-warning" />;
      default:
        return <InfoIcon className="h-4 w-4 text-default" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado":
        return "success";
      case "rejeitado":
        return "danger";
      case "aviso":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aprovado":
        return "Aprovado";
      case "rejeitado":
        return "Rejeitado";
      case "aviso":
        return "Atenção";
      default:
        return "Pendente";
    }
  };

  const validacoesObrigatorias = validacoes.filter((v) => v.obrigatorio);
  const aprovadas = validacoesObrigatorias.filter(
    (v) => v.status === "aprovado",
  );
  const rejeitadas = validacoes.filter((v) => v.status === "rejeitado");
  const avisos = validacoes.filter((v) => v.status === "aviso");

  const isValid = aprovadas.length === validacoesObrigatorias.length;

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-default-500">
                Validando conta bancária...
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!dadosBancarios) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-4">
            <CreditCardIcon className="h-12 w-12 text-default-300 mx-auto mb-2" />
            <p className="text-default-500">
              Nenhuma conta bancária configurada
            </p>
            <p className="text-sm text-default-400">
              Configure uma conta para validar
            </p>
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
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Validação da Conta</h3>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              color={
                isValid
                  ? "success"
                  : rejeitadas.length > 0
                    ? "danger"
                    : "warning"
              }
              size="sm"
              startContent={getStatusIcon(
                isValid
                  ? "aprovado"
                  : rejeitadas.length > 0
                    ? "rejeitado"
                    : "aviso",
              )}
              variant="flat"
            >
              {isValid
                ? "Válida"
                : rejeitadas.length > 0
                  ? "Inválida"
                  : "Atenção"}
            </Chip>
            <Button
              size="sm"
              startContent={<InfoIcon className="h-4 w-4" />}
              variant="light"
              onPress={() => setModalOpen(true)}
            >
              Ver Detalhes
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {/* Resumo das Validações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircleIcon className="h-4 w-4 text-success" />
                <span className="text-lg font-bold text-success">
                  {aprovadas.length}
                </span>
              </div>
              <p className="text-xs text-default-500">Aprovadas</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <XCircleIcon className="h-4 w-4 text-danger" />
                <span className="text-lg font-bold text-danger">
                  {rejeitadas.length}
                </span>
              </div>
              <p className="text-xs text-default-500">Rejeitadas</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangleIcon className="h-4 w-4 text-warning" />
                <span className="text-lg font-bold text-warning">
                  {avisos.length}
                </span>
              </div>
              <p className="text-xs text-default-500">Avisos</p>
            </div>
          </div>

          {/* Progresso da Validação */}
          {isValidating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Validando conta...</span>
                <span>{progresso}%</span>
              </div>
              <Progress color="primary" value={progresso} />
            </div>
          )}

          {/* Ações */}
          {!isValidating && (
            <div className="flex gap-2">
              <Button
                color="primary"
                size="sm"
                startContent={<RefreshCwIcon className="h-4 w-4" />}
                variant="flat"
                onPress={executarValidacoes}
              >
                Revalidar
              </Button>

              {rejeitadas.length > 0 && (
                <Button
                  color="warning"
                  size="sm"
                  startContent={<SettingsIcon className="h-4 w-4" />}
                  variant="light"
                  onPress={() => setModalOpen(true)}
                >
                  Corrigir Problemas
                </Button>
              )}
            </div>
          )}

          {/* Notificações */}
          {rejeitadas.length > 0 && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <XCircleIcon className="h-4 w-4 text-danger" />
                <span className="text-sm font-medium text-danger-700">
                  Problemas Encontrados
                </span>
              </div>
              <p className="text-xs text-danger-600">
                {rejeitadas.length} validação(ões) obrigatória(s) falharam.
                Clique em &quot;Corrigir Problemas&quot; para ver detalhes.
              </p>
            </div>
          )}

          {avisos.length > 0 && rejeitadas.length === 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangleIcon className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning-700">
                  Recomendações
                </span>
              </div>
              <p className="text-xs text-warning-600">
                {avisos.length} recomendação(ões) para melhorar a conta
                bancária.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Detalhes */}
      <Modal isOpen={modalOpen} size="2xl" onClose={() => setModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Detalhes da Validação</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {validacoes.map((validacao) => (
                <div
                  key={validacao.id}
                  className="flex items-start gap-3 p-3 border border-default-200 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(validacao.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">
                        {validacao.titulo}
                      </h4>
                      <Chip
                        color={getStatusColor(validacao.status)}
                        size="sm"
                        variant="flat"
                      >
                        {getStatusLabel(validacao.status)}
                      </Chip>
                      {validacao.obrigatorio && (
                        <Chip color="default" size="sm" variant="flat">
                          Obrigatório
                        </Chip>
                      )}
                    </div>
                    <p className="text-xs text-default-500">
                      {validacao.descricao}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setModalOpen(false)}>
              Fechar
            </Button>
            {rejeitadas.length > 0 && (
              <Button
                color="primary"
                onPress={() => {
                  setModalOpen(false);
                  // Aqui poderia abrir um modal para configurar a conta
                  toast.info("Redirecionando para configuração da conta...");
                }}
              >
                Configurar Conta
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
