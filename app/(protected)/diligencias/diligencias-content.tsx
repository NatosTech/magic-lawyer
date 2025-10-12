"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Skeleton } from "@heroui/react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  listDiligencias,
  createDiligencia,
  updateDiligencia,
} from "@/app/actions/diligencias";
import { listCausas } from "@/app/actions/causas";
import { listRegimesPrazo } from "@/app/actions/regimes-prazo";
import { getDocumentExplorerData } from "@/app/actions/documentos-explorer";
import { title } from "@/components/primitives";

interface DiligenciaDto {
  id: string;
  titulo: string;
  tipo: string | null;
  descricao: string | null;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  prazoPrevisto: string | null;
  prazoConclusao: string | null;
  processo?: {
    id: string;
    numero: string;
    titulo: string | null;
  } | null;
  causa?: {
    id: string;
    nome: string;
  } | null;
  contrato?: {
    id: string;
    titulo: string;
  } | null;
  responsavel?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  createdAt: string;
}

const diligenciasFetcher = async () => {
  const result = await listDiligencias();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar diligências");
  }

  return result.diligencias?.map((diligencia) => ({
    ...diligencia,
    createdAt: diligencia.createdAt.toISOString(),
    prazoPrevisto: diligencia.prazoPrevisto
      ? diligencia.prazoPrevisto.toISOString()
      : null,
    prazoConclusao: diligencia.prazoConclusao
      ? diligencia.prazoConclusao.toISOString()
      : null,
  })) as DiligenciaDto[];
};

const causasFetcher = async () => {
  const result = await listCausas();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar causas");
  }

  return result.causas ?? [];
};

const regimesFetcher = async () => {
  const result = await listRegimesPrazo();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar regimes de prazo");
  }

  return result.regimes ?? [];
};

const explorerFetcher = async () => {
  const result = await getDocumentExplorerData();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Erro ao carregar dados auxiliares");
  }

  return result.data;
};

const STATUS_OPTIONS = [
  { key: "PENDENTE", label: "Pendente" },
  { key: "EM_ANDAMENTO", label: "Em andamento" },
  { key: "CONCLUIDA", label: "Concluída" },
  { key: "CANCELADA", label: "Cancelada" },
];

export function DiligenciasContent() {
  const { data, mutate, isLoading, isValidating } = useSWR(
    "diligencias",
    diligenciasFetcher,
  );
  const { data: causas } = useSWR("diligencias-causas", causasFetcher);
  const { data: regimes } = useSWR("diligencias-regimes", regimesFetcher);
  const { data: explorerData } = useSWR(
    "diligencias-explorer",
    explorerFetcher,
  );

  const diligencias = useMemo(() => data ?? [], [data]);
  const clientes = explorerData?.clientes ?? [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createState, setCreateState] = useState({
    clienteId: "",
    processoId: "",
    contratoId: "",
    causaId: "",
    regimePrazoId: "",
    titulo: "",
    tipo: "",
    descricao: "",
    responsavelId: "",
    prazoPrevisto: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const selectedCliente = useMemo(
    () =>
      clientes.find((cliente) => cliente.id === createState.clienteId) ?? null,
    [clientes, createState.clienteId],
  );

  const processosDoCliente = selectedCliente?.processos ?? [];
  const contratosDoCliente = selectedCliente?.contratos ?? [];

  const handleCreateDiligencia = useCallback(async () => {
    if (!createState.titulo.trim()) {
      toast.error("Informe o título da diligência");

      return;
    }

    setIsCreating(true);

    try {
      const result = await createDiligencia({
        titulo: createState.titulo.trim(),
        tipo: createState.tipo.trim() || null,
        descricao: createState.descricao.trim() || null,
        processoId: createState.processoId || undefined,
        causaId: createState.causaId || undefined,
        contratoId: createState.contratoId || undefined,
        regimePrazoId: createState.regimePrazoId || undefined,
        responsavelId: createState.responsavelId || undefined,
        prazoPrevisto: createState.prazoPrevisto || undefined,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao criar diligência");

        return;
      }

      toast.success("Diligência criada com sucesso");
      setIsCreateOpen(false);
      setCreateState({
        clienteId: "",
        processoId: "",
        contratoId: "",
        causaId: "",
        regimePrazoId: "",
        titulo: "",
        tipo: "",
        descricao: "",
        responsavelId: "",
        prazoPrevisto: "",
      });
      await mutate();
    } catch {
      toast.error("Erro ao criar diligência");
    } finally {
      setIsCreating(false);
    }
  }, [createState, mutate]);

  const handleStatusChange = useCallback(
    async (diligencia: DiligenciaDto, status: string) => {
      if (status === diligencia.status) return;

      const result = await updateDiligencia(diligencia.id, {
        status: status as DiligenciaDto["status"],
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar diligência");

        return;
      }

      await mutate();
      toast.success("Status atualizado");
    },
    [mutate],
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-10 px-4 sm:px-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Diligências</h1>
          <p className="text-sm text-default-500">
            Acompanhe diligências internas e externas relacionadas aos
            processos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            radius="full"
            startContent={<Plus className="h-4 w-4" />}
            variant="flat"
            onPress={() => setIsCreateOpen(true)}
          >
            Nova diligência
          </Button>
          <Button
            color="primary"
            isLoading={isValidating}
            radius="full"
            startContent={<RefreshCw className="h-4 w-4" />}
            variant="flat"
            onPress={() => mutate()}
          >
            Atualizar
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card
              key={`diligencia-skeleton-${index}`}
              className="border border-default-100/30 bg-default-50/10"
            >
              <CardBody className="space-y-2">
                <Skeleton className="h-5 w-56 rounded-lg" isLoaded={false} />
                <Skeleton className="h-3 w-64 rounded-lg" isLoaded={false} />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : diligencias.length ? (
        <div className="space-y-3">
          {diligencias.map((diligencia) => {
            return (
              <Card
                key={diligencia.id}
                className="border border-default-100/30 bg-default-50/10"
              >
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-default-700">
                        {diligencia.titulo}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs text-default-500">
                        {diligencia.tipo && (
                          <Chip size="sm">{diligencia.tipo}</Chip>
                        )}
                        {diligencia.processo && (
                          <Chip size="sm" variant="flat">
                            Processo {diligencia.processo.numero}
                          </Chip>
                        )}
                        {diligencia.causa && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {diligencia.causa.nome}
                          </Chip>
                        )}
                        {diligencia.contrato && (
                          <Chip color="primary" size="sm" variant="flat">
                            {diligencia.contrato.titulo}
                          </Chip>
                        )}
                      </div>
                    </div>
                    <Select
                      aria-label="Status da diligência"
                      selectedKeys={[diligencia.status]}
                      size="sm"
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        handleStatusChange(diligencia, value);
                      }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  {diligencia.descricao && (
                    <p className="text-sm text-default-500">
                      {diligencia.descricao}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-default-400">
                    {diligencia.prazoPrevisto && (
                      <span>
                        Prazo previsto: {formatDate(diligencia.prazoPrevisto)}
                      </span>
                    )}
                    {diligencia.prazoConclusao && (
                      <span>
                        Concluída em: {formatDate(diligencia.prazoConclusao)}
                      </span>
                    )}
                    <span>Criada em: {formatDate(diligencia.createdAt)}</span>
                    {diligencia.responsavel && (
                      <span>
                        Responsável:{" "}
                        {[
                          diligencia.responsavel.firstName,
                          diligencia.responsavel.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || diligencia.responsavel.email}
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border border-default-100/30 bg-default-50/10">
          <CardBody className="text-sm text-default-500">
            Nenhuma diligência cadastrada ainda.
          </CardBody>
        </Card>
      )}

      <CreateDiligenciaModal
        causas={causas ?? []}
        clientes={clientes}
        contratos={contratosDoCliente}
        isOpen={isCreateOpen}
        isSubmitting={isCreating}
        processos={processosDoCliente}
        regimes={regimes ?? []}
        setState={setCreateState}
        state={createState}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateDiligencia}
      />
    </section>
  );
}

interface CreateDiligenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  causas: Array<{ id: string; nome: string; codigoCnj?: string | null }>;
  regimes: Array<{
    id: string;
    nome: string;
    tipo: string;
    contarDiasUteis: boolean;
  }>;
  clientes: Array<{
    id: string;
    nome: string;
    processos: Array<{
      id: string;
      numero: string;
      titulo: string | null;
    }>;
    contratos: Array<{
      id: string;
      titulo: string;
    }>;
  }>;
  processos: Array<{
    id: string;
    numero: string;
    titulo: string | null;
  }>;
  contratos: Array<{
    id: string;
    titulo: string;
  }>;
  state: {
    clienteId: string;
    processoId: string;
    contratoId: string;
    causaId: string;
    regimePrazoId: string;
    titulo: string;
    tipo: string;
    descricao: string;
    responsavelId: string;
    prazoPrevisto: string;
  };
  setState: React.Dispatch<
    React.SetStateAction<{
      clienteId: string;
      processoId: string;
      contratoId: string;
      causaId: string;
      regimePrazoId: string;
      titulo: string;
      tipo: string;
      descricao: string;
      responsavelId: string;
      prazoPrevisto: string;
    }>
  >;
  onSubmit: () => void;
}

function CreateDiligenciaModal({
  isOpen,
  onClose,
  isSubmitting,
  causas,
  regimes,
  clientes,
  processos,
  contratos,
  state,
  setState,
  onSubmit,
}: CreateDiligenciaModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      onOpenChange={(open) => !open && onClose()}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-default-900">
                Nova diligência
              </h3>
              <p className="text-sm text-default-500">
                Informe os vínculos e detalhes da nova diligência.
              </p>
            </ModalHeader>
            <ModalBody className="space-y-3">
              <Select
                label="Cliente"
                placeholder="Selecione um cliente"
                selectedKeys={state.clienteId ? [state.clienteId] : []}
                onSelectionChange={(keys) => {
                  const [value] = Array.from(keys) as string[];

                  setState((prev) => ({
                    ...prev,
                    clienteId: value || "",
                    processoId: "",
                    contratoId: "",
                  }));
                }}
              >
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id}>{cliente.nome}</SelectItem>
                ))}
              </Select>

              <Select
                isDisabled={!processos.length}
                label="Processo"
                placeholder="Opcional"
                selectedKeys={state.processoId ? [state.processoId] : []}
                onSelectionChange={(keys) => {
                  const [value] = Array.from(keys) as string[];

                  setState((prev) => ({
                    ...prev,
                    processoId: value || "",
                  }));
                }}
              >
                {processos.map((processo) => (
                  <SelectItem key={processo.id}>
                    {processo.numero}
                    {processo.titulo ? ` · ${processo.titulo}` : ""}
                  </SelectItem>
                ))}
              </Select>

              <Select
                isDisabled={!contratos.length}
                label="Contrato"
                placeholder="Opcional"
                selectedKeys={state.contratoId ? [state.contratoId] : []}
                onSelectionChange={(keys) => {
                  const [value] = Array.from(keys) as string[];

                  setState((prev) => ({
                    ...prev,
                    contratoId: value || "",
                  }));
                }}
              >
                {contratos.map((contrato) => (
                  <SelectItem key={contrato.id}>{contrato.titulo}</SelectItem>
                ))}
              </Select>

              <Select
                label="Causa"
                placeholder="Opcional"
                selectedKeys={state.causaId ? [state.causaId] : []}
                onSelectionChange={(keys) => {
                  const [value] = Array.from(keys) as string[];

                  setState((prev) => ({
                    ...prev,
                    causaId: value || "",
                  }));
                }}
              >
                {causas.map((causa) => (
                  <SelectItem key={causa.id}>{causa.nome}</SelectItem>
                ))}
              </Select>

              <Select
                label="Regime de prazo"
                placeholder="Opcional"
                selectedKeys={state.regimePrazoId ? [state.regimePrazoId] : []}
                onSelectionChange={(keys) => {
                  const [value] = Array.from(keys) as string[];

                  setState((prev) => ({
                    ...prev,
                    regimePrazoId: value || "",
                  }));
                }}
              >
                {regimes.map((regime) => (
                  <SelectItem key={regime.id}>{regime.nome}</SelectItem>
                ))}
              </Select>

              <Input
                isRequired
                label="Título"
                value={state.titulo}
                onValueChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    titulo: value,
                  }))
                }
              />

              <Input
                label="Tipo"
                placeholder="Ex.: Audiência, Protocolo"
                value={state.tipo}
                onValueChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    tipo: value,
                  }))
                }
              />

              <Textarea
                label="Descrição"
                value={state.descricao}
                onValueChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    descricao: value,
                  }))
                }
              />

              <Input
                label="Responsável (ID do usuário)"
                value={state.responsavelId}
                onValueChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    responsavelId: value,
                  }))
                }
              />

              <Input
                label="Prazo previsto"
                placeholder="AAAA-MM-DD"
                type="date"
                value={state.prazoPrevisto}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    prazoPrevisto: event.target.value,
                  }))
                }
              />
            </ModalBody>
            <ModalFooter>
              <Button disabled={isSubmitting} variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={isSubmitting}
                onPress={onSubmit}
              >
                Criar diligência
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
