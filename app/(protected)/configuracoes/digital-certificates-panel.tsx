"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Tooltip } from "@heroui/tooltip";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Spinner } from "@heroui/spinner";
import {
  CheckCircle2,
  ShieldCheck,
  UploadCloud,
  AlertTriangle,
  Activity,
  UserCircle2,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";

import {
  activateDigitalCertificate,
  deactivateDigitalCertificate,
  listDigitalCertificateLogs,
  testDigitalCertificate,
  uploadDigitalCertificateFromForm,
} from "@/app/actions/digital-certificates";

interface CertificateResponsible {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface CertificateSummary {
  id: string;
  tenantId: string;
  responsavelUsuarioId: string | null;
  label: string | null;
  tipo: string;
  isActive: boolean;
  validUntil: string | null;
  lastValidatedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  responsavelUsuario: CertificateResponsible | null;
}

interface CertificateLog {
  id: string;
  action: string;
  message: string | null;
  createdAt: string;
  actor: CertificateResponsible | null;
}

interface DigitalCertificatesPanelProps {
  certificates: CertificateSummary[];
}

function formatDate(date: string | null, fallback = "—") {
  if (!date) return fallback;

  try {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fallback;
  }
}

function initialsFromResponsible(responsible: CertificateResponsible | null) {
  if (!responsible) {
    return "—";
  }

  const parts = [responsible.firstName, responsible.lastName]
    .filter(Boolean)
    .map((piece) => piece!.charAt(0).toUpperCase());

  return parts.join("") || responsible.email.charAt(0).toUpperCase();
}

function fullName(responsible: CertificateResponsible | null) {
  if (!responsible) return "Não atribuído";

  if (responsible.firstName || responsible.lastName) {
    return `${responsible.firstName ?? ""} ${responsible.lastName ?? ""}`.trim();
  }

  return responsible.email;
}

export function DigitalCertificatesPanel({
  certificates,
}: DigitalCertificatesPanelProps) {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<CertificateLog[]>([]);
  const [selectedCertificateId, setSelectedCertificateId] = useState<
    string | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);

  const activeCertificate = useMemo(
    () => (Array.isArray(certificates) ? certificates.find((cert) => cert.isActive) : undefined),
    [certificates],
  );

  const hasCertificates = Array.isArray(certificates) && certificates.length > 0;

  const [formState, setFormState] = useState({
    file: null as File | null,
    password: "",
    label: "",
    validUntil: "",
    activate: true,
    tipo: "PJE" as string,
  });

  const resetForm = () => {
    setFormState({
      file: null,
      password: "",
      label: "",
      validUntil: "",
      activate: true,
      tipo: "PJE",
    });
    setFormErrors(null);
  };

  const handleUpload = async () => {
    if (!formState.file) {
      setFormErrors("Selecione um certificado (.pfx/.p12)");

      return;
    }

    if (!formState.password) {
      setFormErrors("Informe a senha do certificado.");

      return;
    }

    setIsSubmitting(true);
    setFormErrors(null);

    try {
      const fd = new FormData();

      fd.set("certificate", formState.file);
      fd.set("password", formState.password);
      fd.set("label", formState.label);
      fd.set("activate", String(formState.activate));
      fd.set("tipo", formState.tipo);

      if (formState.validUntil) {
        fd.set("validUntil", formState.validUntil);
      }

      const result = await uploadDigitalCertificateFromForm(fd);

      if (!result.success) {
        throw new Error(result.error ?? "Falha ao salvar certificado");
      }

      toast.success("Certificado enviado com sucesso.", {
        description: "Atualize a página para ver o status mais recente.",
      });

      setUploadOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Falha no upload", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = (certificateId: string) => {
    startTransition(async () => {
      const result = await deactivateDigitalCertificate({ certificateId });

      if (!result.success) {
        toast.error("Não foi possível desativar o certificado", {
          description: result.error,
        });

        return;
      }

      toast.success("Certificado desativado", {
        description: "Atualize a página para sincronizar a lista.",
      });
    });
  };

  const handleActivate = (certificateId: string) => {
    startTransition(async () => {
      const result = await activateDigitalCertificate({ certificateId });

      if (!result.success) {
        toast.error("Não foi possível ativar o certificado", {
          description: result.error,
        });

        return;
      }

      toast.success("Certificado ativado", {
        description: "Atualize a página para sincronizar a lista.",
      });
    });
  };

  const handleTest = (certificateId: string) => {
    startTransition(async () => {
      const result = await testDigitalCertificate({ certificateId });

      if (!result.success) {
        toast.error("Teste falhou", { description: result.error });

        return;
      }

      toast.success("Teste bem-sucedido", {
        description: result.message ?? "Certificado validado.",
      });
    });
  };

  const handleOpenLogs = async (certificateId: string) => {
    setSelectedCertificateId(certificateId);
    setIsLoadingLogs(true);

    try {
      const { items } = await listDigitalCertificateLogs({
        certificateId,
        take: 20,
      });

      setLogs(
        items.map((item) => ({
          id: item.id,
          action: item.action,
          message: item.message ?? null,
          createdAt: item.createdAt,
          actor: item.actor,
        })),
      );
    } catch (error) {
      toast.error("Não foi possível carregar o histórico", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido.",
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const statusChip = (certificate: CertificateSummary) => {
    if (certificate.isActive) {
      return (
        <Chip color="success" size="sm" variant="dot">
          Ativo
        </Chip>
      );
    }

    if (
      certificate.validUntil &&
      new Date(certificate.validUntil).getTime() < Date.now()
    ) {
      return (
        <Chip color="danger" size="sm" variant="dot">
          Expirado
        </Chip>
      );
    }

    return (
      <Chip color="warning" size="sm" variant="dot">
        Inativo
      </Chip>
    );
  };

  return (
    <>
      <Card className="border border-primary/30 bg-background/80 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-3 pb-0">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Integrações PJe e Certificados A1
              </h2>
              <p className="text-sm text-default-400">
                Gerencie certificados ICP-Brasil do escritório. Somente admins
                e super admins visualizam esta sessão.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <Badge
                color={activeCertificate ? "success" : "warning"}
                variant="flat"
              >
                {activeCertificate
                  ? "Integração habilitada"
                  : "Nenhum certificado ativo"}
              </Badge>
              {activeCertificate?.validUntil && (
                <Badge color="warning" variant="dot">
                  Válido até {formatDate(activeCertificate.validUntil)}
                </Badge>
              )}
              {activeCertificate?.lastValidatedAt && (
                <Badge color="primary" variant="dot">
                  Último teste: {formatDate(activeCertificate.lastValidatedAt)}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                color="primary"
                startContent={<UploadCloud className="h-4 w-4" />}
                onPress={() => {
                  resetForm();
                  setUploadOpen(true);
                }}
              >
                Enviar novo certificado
              </Button>
            </div>
          </div>

          {!hasCertificates ? (
            <Card className="border border-dashed border-default-300 bg-white/5">
              <CardBody className="flex flex-col items-center gap-3 text-center text-default-400">
                <ShieldOff className="h-10 w-10 text-default-300" />
                <p className="text-base text-white">
                  Nenhum certificado cadastrado
                </p>
                <p className="max-w-xl text-sm text-default-400">
                  Faça o upload do certificado A1 (.pfx ou .p12) utilizado para
                  peticionamento no PJe. O arquivo será criptografado
                  imediatamente e somente usuários autorizados podem manipulá-lo.
                </p>
              </CardBody>
            </Card>
          ) : (
            <ScrollShadow className="max-h-[420px]">
              <Table removeWrapper aria-label="Certificados digitais">
                <TableHeader>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>IDENTIFICAÇÃO</TableColumn>
                  <TableColumn>RESPONSÁVEL</TableColumn>
                  <TableColumn>ÚLTIMO USO</TableColumn>
                  <TableColumn>VALIDADE</TableColumn>
                  <TableColumn className="text-right">AÇÕES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Nenhum certificado cadastrado.">
                  {certificates.map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusChip(certificate)}
                          <span className="text-xs text-default-500">
                            {certificate.tipo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-white">
                            {certificate.label || certificate.id.slice(0, 12)}
                          </p>
                          <span className="text-xs text-default-500">
                            Registrado em {formatDate(certificate.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                            {initialsFromResponsible(certificate.responsavelUsuario)}
                          </div>
                          <div>
                            <p className="text-sm text-white">
                              {fullName(certificate.responsavelUsuario)}
                            </p>
                            <p className="text-xs text-default-500">
                              {certificate.responsavelUsuario?.email ?? "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-default-400">
                          <Activity className="h-4 w-4" />
                          <span>{formatDate(certificate.lastUsedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-default-400">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span>{formatDate(certificate.validUntil)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip content="Visualizar histórico">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => handleOpenLogs(certificate.id)}
                            >
                              <UserCircle2 className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Testar acesso">
                            <Button
                              isLoading={
                                isPending && selectedCertificateId === certificate.id
                              }
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => handleTest(certificate.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            </Button>
                          </Tooltip>
                          {certificate.isActive ? (
                            <Tooltip content="Desativar">
                              <Button
                                color="danger"
                                isLoading={
                                  isPending &&
                                  selectedCertificateId === certificate.id
                                }
                                size="sm"
                                variant="flat"
                                onPress={() => handleDeactivate(certificate.id)}
                              >
                                Desativar
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Ativar">
                              <Button
                                color="success"
                                size="sm"
                                variant="flat"
                                onPress={() => handleActivate(certificate.id)}
                              >
                                Ativar
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollShadow>
          )}
        </CardBody>
        <CardFooter className="flex flex-col items-start gap-2 text-xs text-default-500">
          <p>
            Os certificados são criptografados com AES-256-GCM e armazenados em
            repouso com logs de auditoria. Ative somente o que pretende usar no
            PJe para evitar instabilidades.
          </p>
          <p>
            Ao enviar um novo certificado do mesmo tipo, o anterior é arquivado
            automaticamente e permanece disponível apenas para auditoria.
          </p>
        </CardFooter>
      </Card>

      <Modal
        isOpen={isUploadOpen}
        onClose={() => {
          if (!isSubmitting) {
            setUploadOpen(false);
            resetForm();
          }
        }}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-lg font-semibold">
                  Enviar certificado A1
                </span>
                <span className="text-sm text-default-500">
                  Somente formatos .pfx ou .p12 com senha ativa são aceitos.
                </span>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  accept=".pfx,.p12"
                  isDisabled={isSubmitting}
                  label="Arquivo .pfx / .p12"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setFormState((prev) => ({ ...prev, file }));
                    if (formErrors) {
                      setFormErrors(null);
                    }
                  }}
                />

                <Input
                  isDisabled={isSubmitting}
                  label="Senha do certificado"
                  placeholder="Informe a senha utilizada no órgão emissor"
                  type="password"
                  value={formState.password}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                />

                <Input
                  isDisabled={isSubmitting}
                  label="Identificação interna (opcional)"
                  placeholder="Ex: Certificado Dra. Sandra 2025"
                  value={formState.label}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      label: event.target.value,
                    }))
                  }
                />

                <Input
                  isDisabled={isSubmitting}
                  label="Validade (opcional)"
                  type="date"
                  value={formState.validUntil}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      validUntil: event.target.value,
                    }))
                  }
                />

                <div className="flex items-center justify-between rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm text-default-500">
                  <span>Ativar imediatamente após o upload</span>
                  <Switch
                    isDisabled={isSubmitting}
                    isSelected={formState.activate}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, activate: value }))
                    }
                  />
                </div>

                {formErrors && (
                  <p className="text-sm text-danger-400">{formErrors}</p>
                )}

                <Card className="border border-default-200 bg-default-50">
                  <CardBody className="space-y-2 text-xs text-default-500">
                    <p className="font-semibold text-default-600">
                      Boas práticas
                    </p>
                    <ul className="list-disc space-y-1 pl-4">
                      <li>
                        Mantenha uma cópia segura do arquivo original em mídia
                        offline.
                      </li>
                      <li>
                        O Magic Lawyer não exibe o conteúdo do certificado após
                        o upload.
                      </li>
                      <li>
                        Configure alertas de validade para evitar indisponibilidade
                        na integração.
                      </li>
                    </ul>
                  </CardBody>
                </Card>
              </ModalBody>
              <ModalFooter className="flex items-center justify-between">
                <Button
                  isDisabled={isSubmitting}
                  variant="light"
                  onPress={() => {
                    resetForm();
                    onClose();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={isSubmitting}
                  startContent={
                    isSubmitting ? <Spinner size="sm" color="white" /> : null
                  }
                  onPress={handleUpload}
                >
                  Salvar certificado
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={!!selectedCertificateId}
        onClose={() => {
          setSelectedCertificateId(null);
          setLogs([]);
        }}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Histórico do certificado</span>
              </ModalHeader>
              <ModalBody>
                {isLoadingLogs ? (
                  <div className="flex min-h-[160px] items-center justify-center">
                    <Spinner color="primary" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex min-h-[160px] items-center justify-center text-sm text-default-500">
                    Nenhum evento registrado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-default-200 bg-default-50 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <Chip
                            color="primary"
                            size="sm"
                            variant="flat"
                          >
                            {log.action}
                          </Chip>
                          <span className="text-xs text-default-500">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        {log.message && (
                          <>
                            <Divider className="my-2 border-default-200" />
                            <p className="text-sm text-default-600">
                              {log.message}
                            </p>
                          </>
                        )}
                        <div className="mt-3 text-xs text-default-500">
                          <span>Responsável: </span>
                          <span>{fullName(log.actor)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
