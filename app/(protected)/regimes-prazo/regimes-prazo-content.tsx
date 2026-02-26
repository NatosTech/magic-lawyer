"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Skeleton } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Plus, RefreshCw, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  listRegimesPrazo,
  createRegimePrazo,
  updateRegimePrazo,
  deleteRegimePrazo,
  type RegimePrazoPayload,
} from "@/app/actions/regimes-prazo";
import { title } from "@/components/primitives";

interface RegimePrazoDto {
  id: string;
  tenantId: string | null;
  nome: string;
  tipo: string;
  contarDiasUteis: boolean;
  descricao: string | null;
  createdAt: string;
  updatedAt: string;
}

const regimeFetcher = async () => {
  const result = await listRegimesPrazo();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar regimes de prazo");
  }

  return result.regimes?.map((regime) => ({
    ...regime,
    createdAt: regime.createdAt.toISOString(),
    updatedAt: regime.updatedAt.toISOString(),
  })) as RegimePrazoDto[];
};

const TIPO_OPTIONS = [
  { key: "JUSTICA_COMUM", label: "Justiça Comum" },
  { key: "JUIZADO_ESPECIAL", label: "Juizado Especial" },
  { key: "TRABALHISTA", label: "Trabalhista" },
  { key: "FEDERAL", label: "Federal" },
  { key: "OUTRO", label: "Outro" },
];

export function RegimesPrazoContent() {
  const { data, mutate, isLoading, isValidating } = useSWR(
    "regimes-prazo",
    regimeFetcher,
  );

  const [form, setForm] = useState({
    nome: "",
    tipo: "JUSTICA_COMUM",
    contarDiasUteis: true,
    descricao: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingRegime, setEditingRegime] = useState<RegimePrazoDto | null>(
    null,
  );

  const regimes = useMemo(() => data ?? [], [data]);

  const handleCreate = useCallback(async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do regime");

      return;
    }

    setIsCreating(true);

    try {
      const result = await createRegimePrazo({
        nome: form.nome.trim(),
        tipo: form.tipo as RegimePrazoPayload["tipo"],
        contarDiasUteis: form.contarDiasUteis,
        descricao: form.descricao.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao criar regime");

        return;
      }

      toast.success("Regime criado com sucesso");
      setForm({
        nome: "",
        tipo: form.tipo,
        contarDiasUteis: true,
        descricao: "",
      });
      await mutate();
    } catch {
      toast.error("Erro ao criar regime");
    } finally {
      setIsCreating(false);
    }
  }, [form, mutate]);

  const handleOpenEdit = useCallback((regime: RegimePrazoDto) => {
    setEditingRegime(regime);
  }, []);

  const handleSaveEdit = useCallback(
    async (payload: {
      nome: string;
      tipo: RegimePrazoPayload["tipo"];
      contarDiasUteis: boolean;
      descricao: string;
    }) => {
      if (!editingRegime) return;

      const result = await updateRegimePrazo(editingRegime.id, {
        nome: payload.nome,
        tipo: payload.tipo,
        contarDiasUteis: payload.contarDiasUteis,
        descricao: payload.descricao,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar regime");

        return;
      }

      toast.success("Regime atualizado");
      setEditingRegime(null);
      await mutate();
    },
    [editingRegime, mutate],
  );

  const handleDelete = useCallback(
    async (regime: RegimePrazoDto) => {
      if (
        !confirm(
          "Deseja realmente remover este regime? Certifique-se de que não há prazos vinculados.",
        )
      ) {
        return;
      }

      const result = await deleteRegimePrazo(regime.id);

      if (!result.success) {
        toast.error(result.error || "Não foi possível remover o regime");

        return;
      }

      toast.success("Regime removido");
      await mutate();
    },
    [mutate],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 py-10 px-4 sm:px-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>
            Regimes de prazo
          </h1>
          <p className="text-sm text-default-500">
            Controle de regras de contagem aplicadas aos prazos processuais.
          </p>
        </div>
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
      </header>

      <Card className="border border-default-100/30 bg-default-50/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-default-700">
              Novo regime
            </h2>
          </div>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Input
            isRequired
            label="Nome"
            placeholder="Ex.: Justiça Comum"
            value={form.nome}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                nome: value,
              }))
            }
          />
          <Select
            label="Tipo"
            selectedKeys={[form.tipo]}
            onSelectionChange={(keys) => {
              const [value] = Array.from(keys) as string[];

              setForm((prev) => ({
                ...prev,
                tipo: (value as RegimePrazoPayload["tipo"]) || "JUSTICA_COMUM",
              }));
            }}
          >
            {TIPO_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
          <div className="sm:col-span-2 flex items-center justify-between">
            <Switch
              isSelected={form.contarDiasUteis}
              onValueChange={(selected) =>
                setForm((prev) => ({
                  ...prev,
                  contarDiasUteis: selected,
                }))
              }
            >
              Contar apenas dias úteis
            </Switch>
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Descrição"
              placeholder="Notas internas sobre quando utilizar este regime"
              value={form.descricao}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  descricao: value,
                }))
              }
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              color="primary"
              isLoading={isCreating}
              onPress={handleCreate}
            >
              Salvar regime
            </Button>
          </div>
        </CardBody>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-default-700">
            Regimes cadastrados
          </h2>
          <Chip color="primary" size="sm" variant="flat">
            {regimes.length}
          </Chip>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={`regime-skeleton-${index}`}
                className="border border-default-100/30 bg-default-50/10"
              >
                <CardBody className="space-y-2">
                  <Skeleton className="h-5 w-52 rounded-lg" isLoaded={false} />
                  <Skeleton className="h-3 w-64 rounded-lg" isLoaded={false} />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : regimes.length ? (
          <div className="space-y-3">
            {regimes.map((regime) => {
              const tipoLabel =
                TIPO_OPTIONS.find((option) => option.key === regime.tipo)
                  ?.label ?? regime.tipo;

              return (
                <Card
                  key={regime.id}
                  className="border border-default-100/30 bg-default-50/10"
                >
                  <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-default-700">
                          {regime.nome}
                        </h3>
                        <Chip color="secondary" size="sm" variant="flat">
                          {tipoLabel}
                        </Chip>
                      </div>
                      <p className="text-xs text-default-500">
                        Contagem{" "}
                        {regime.contarDiasUteis ? "em dias úteis" : "contínua"}
                      </p>
                      {regime.descricao && (
                        <p className="text-xs text-default-500">
                          {regime.descricao}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        startContent={<Edit3 className="h-3.5 w-3.5" />}
                        variant="light"
                        onPress={() => handleOpenEdit(regime)}
                      >
                        Editar
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<Trash2 className="h-3.5 w-3.5" />}
                        variant="light"
                        onPress={() => handleDelete(regime)}
                      >
                        Remover
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border border-default-100/30 bg-default-50/10">
            <CardBody className="text-sm text-default-500">
              Nenhum regime cadastrado até o momento.
            </CardBody>
          </Card>
        )}
      </section>

      <EditRegimeModal
        regime={editingRegime}
        onClose={() => setEditingRegime(null)}
        onSave={handleSaveEdit}
      />
    </section>
  );
}

interface EditRegimeModalProps {
  regime: RegimePrazoDto | null;
  onClose: () => void;
  onSave: (payload: {
    nome: string;
    tipo: RegimePrazoPayload["tipo"];
    contarDiasUteis: boolean;
    descricao: string;
  }) => void;
}

function EditRegimeModal({ regime, onClose, onSave }: EditRegimeModalProps) {
  const [nome, setNome] = useState(regime?.nome ?? "");
  const [tipo, setTipo] = useState<RegimePrazoPayload["tipo"]>(
    (regime?.tipo as RegimePrazoPayload["tipo"]) ?? "JUSTICA_COMUM",
  );
  const [contarDiasUteis, setContarDiasUteis] = useState(
    regime?.contarDiasUteis ?? true,
  );
  const [descricao, setDescricao] = useState(regime?.descricao ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  const handleConfirm = async () => {
    if (!regime) return;

    if (!nome.trim()) {
      toast.error("Informe o nome do regime");

      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        nome: nome.trim(),
        tipo,
        contarDiasUteis,
        descricao: descricao.trim(),
      });
    } catch {
      toast.error("Erro ao atualizar regime");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={!!regime} size="md" onOpenChange={handleOpenChange}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader>
              <h3 className="text-lg font-semibold text-default-900">
                Editar regime de prazo
              </h3>
            </ModalHeader>
            <ModalBody className="space-y-3">
              <Input
                isRequired
                label="Nome"
                value={nome}
                onValueChange={setNome}
              />
              <Select
                label="Tipo"
                selectedKeys={[tipo]}
                onSelectionChange={(keys) => {
                  const [value] = Array.from(keys) as string[];

                  setTipo(
                    (value as RegimePrazoPayload["tipo"]) || "JUSTICA_COMUM",
                  );
                }}
              >
                {TIPO_OPTIONS.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
              <Switch
                isSelected={contarDiasUteis}
                onValueChange={setContarDiasUteis}
              >
                Contar apenas dias úteis
              </Switch>
              <Textarea
                label="Descrição"
                value={descricao}
                onValueChange={setDescricao}
              />
            </ModalBody>
            <ModalFooter>
              <Button disabled={isSaving} variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={isSaving}
                onPress={handleConfirm}
              >
                Salvar alterações
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
