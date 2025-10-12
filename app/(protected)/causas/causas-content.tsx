"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Skeleton } from "@heroui/react";
import { Plus, RefreshCw, Edit3 } from "lucide-react";
import { toast } from "sonner";

import {
  listCausas,
  createCausa,
  updateCausa,
  setCausaAtiva,
} from "@/app/actions/causas";
import { title } from "@/components/primitives";

interface CausaDto {
  id: string;
  nome: string;
  codigoCnj: string | null;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

const causasFetcher = async () => {
  const result = await listCausas();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar causas");
  }

  return result.causas?.map((causa) => ({
    ...causa,
    createdAt: causa.createdAt.toISOString(),
    updatedAt: causa.updatedAt.toISOString(),
  })) as CausaDto[];
};

export function CausasContent() {
  const { data, mutate, isLoading, isValidating } = useSWR(
    "causas",
    causasFetcher,
    {
      revalidateOnFocus: true,
    },
  );

  const [form, setForm] = useState({
    nome: "",
    codigoCnj: "",
    descricao: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingCausa, setEditingCausa] = useState<CausaDto | null>(null);

  const causas = useMemo(() => data ?? [], [data]);

  const handleCreate = useCallback(async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da causa");

      return;
    }

    setIsCreating(true);

    try {
      const result = await createCausa({
        nome: form.nome.trim(),
        codigoCnj: form.codigoCnj.trim() || undefined,
        descricao: form.descricao.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao criar causa");

        return;
      }

      toast.success("Causa criada com sucesso");
      setForm({ nome: "", codigoCnj: "", descricao: "" });
      await mutate();
    } catch {
      toast.error("Erro ao criar causa");
    } finally {
      setIsCreating(false);
    }
  }, [form, mutate]);

  const handleToggleAtiva = useCallback(
    async (causa: CausaDto, ativo: boolean) => {
      const previous = causa.ativo;

      if (previous === ativo) return;

      const result = await setCausaAtiva(causa.id, ativo);

      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar status");

        return;
      }

      await mutate();
      toast.success("Status atualizado");
    },
    [mutate],
  );

  const handleOpenEdit = useCallback((causa: CausaDto) => {
    setEditingCausa(causa);
  }, []);

  const handleEditSave = useCallback(
    async (payload: { nome: string; codigoCnj: string; descricao: string }) => {
      if (!editingCausa) return;

      const result = await updateCausa(editingCausa.id, {
        nome: payload.nome,
        codigoCnj: payload.codigoCnj,
        descricao: payload.descricao,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar causa");

        return;
      }

      toast.success("Causa atualizada");
      setEditingCausa(null);
      await mutate();
    },
    [editingCausa, mutate],
  );

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-10 px-4 sm:px-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Causas</h1>
          <p className="text-sm text-default-500">
            Cadastre e gerencie os assuntos utilizados na classificação dos
            processos.
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
              Nova causa
            </h2>
          </div>
        </CardHeader>
        <Divider className="border-default-100/20" />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Input
            isRequired
            label="Nome"
            placeholder="Ex.: Ameaça"
            value={form.nome}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                nome: value,
              }))
            }
          />
          <Input
            label="Código CNJ"
            placeholder="Opcional"
            value={form.codigoCnj}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                codigoCnj: value,
              }))
            }
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Descrição"
              placeholder="Notas internas sobre a causa"
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
              Salvar causa
            </Button>
          </div>
        </CardBody>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-default-700">
            Causas cadastradas
          </h2>
          <Chip color="primary" size="sm" variant="flat">
            {causas.length}
          </Chip>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={`causa-skeleton-${index}`}
                className="border border-default-100/30 bg-default-50/10"
              >
                <CardBody>
                  <Skeleton className="h-5 w-48 rounded-lg" isLoaded={false} />
                  <Skeleton
                    className="mt-2 h-3 w-64 rounded-lg"
                    isLoaded={false}
                  />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : causas.length ? (
          <div className="space-y-3">
            {causas.map((causa) => (
              <Card
                key={causa.id}
                className="border border-default-100/30 bg-default-50/10"
              >
                <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-default-700">
                        {causa.nome}
                      </h3>
                      <Chip
                        color={causa.ativo ? "success" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {causa.ativo ? "Ativa" : "Arquivada"}
                      </Chip>
                    </div>
                    {causa.codigoCnj && (
                      <p className="text-xs text-default-500">
                        Código CNJ: {causa.codigoCnj}
                      </p>
                    )}
                    {causa.descricao && (
                      <p className="text-xs text-default-500">
                        {causa.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      isSelected={causa.ativo}
                      size="sm"
                      onValueChange={(selected) =>
                        handleToggleAtiva(causa, selected)
                      }
                    >
                      Ativa
                    </Switch>
                    <Button
                      size="sm"
                      startContent={<Edit3 className="h-3.5 w-3.5" />}
                      variant="light"
                      onPress={() => handleOpenEdit(causa)}
                    >
                      Editar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-default-100/30 bg-default-50/10">
            <CardBody className="text-sm text-default-500">
              Nenhuma causa cadastrada até o momento.
            </CardBody>
          </Card>
        )}
      </section>

      <EditCausaModal
        causa={editingCausa}
        onClose={() => setEditingCausa(null)}
        onSave={handleEditSave}
      />
    </section>
  );
}

interface EditCausaModalProps {
  causa: CausaDto | null;
  onClose: () => void;
  onSave: (payload: {
    nome: string;
    codigoCnj: string;
    descricao: string;
  }) => void;
}

function EditCausaModal({ causa, onClose, onSave }: EditCausaModalProps) {
  const [nome, setNome] = useState(causa?.nome ?? "");
  const [codigoCnj, setCodigoCnj] = useState(causa?.codigoCnj ?? "");
  const [descricao, setDescricao] = useState(causa?.descricao ?? "");
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
    if (!causa) return;

    if (!nome.trim()) {
      toast.error("Informe o nome da causa");

      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        nome: nome.trim(),
        codigoCnj: codigoCnj.trim(),
        descricao: descricao.trim(),
      });
    } catch {
      toast.error("Erro ao atualizar causa");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={!!causa} size="md" onOpenChange={handleOpenChange}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-default-900">
                Editar causa
              </h3>
              {causa && (
                <p className="text-sm text-default-400">
                  Criada em{" "}
                  {new Date(causa.createdAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </ModalHeader>
            <ModalBody className="space-y-3">
              <Input
                isRequired
                label="Nome"
                value={nome}
                onValueChange={setNome}
              />
              <Input
                label="Código CNJ"
                value={codigoCnj}
                onValueChange={setCodigoCnj}
              />
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
