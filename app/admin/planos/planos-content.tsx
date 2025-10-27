"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import useSWR from "swr";
import clsx from "clsx";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Skeleton,
  Switch,
  Tooltip,
} from "@heroui/react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  GripVertical,
  History,
  Layers,
  Puzzle,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Save,
  Send,
  ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";

import {
  createPlanoVersaoDraft,
  createPlanoVersaoReview,
  getPlanoConfiguracao,
  getPlanos,
  getPlanosMatrix,
  publishPlanoVersao,
  syncPlanoModulos,
  setPlanoModulos,
  type GetPlanoConfiguracaoResponse,
  type GetPlanoMatrixResponse,
  type PlanoMatrixModuleRow,
  type Plano,
} from "@/app/actions/planos";
import { title, subtitle } from "@/components/primitives";

type PlanoConfiguracaoData = NonNullable<GetPlanoConfiguracaoResponse["data"]>;
type PlanoMatrixData = NonNullable<GetPlanoMatrixResponse["data"]>;

const statusTone: Record<
  string,
  "default" | "primary" | "secondary" | "success" | "warning" | "danger"
> = {
  DRAFT: "default",
  REVIEW: "warning",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
};

const statusLabel: Record<string, string> = {
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

async function fetchPlanos() {
  const response = await getPlanos();

  if (!response.success || !response.data) {
    throw new Error(response.error ?? "Não foi possível carregar os planos");
  }

  return response.data as Plano[];
}

async function fetchPlanoConfiguracao(planoId: string) {
  const response = await getPlanoConfiguracao(planoId);

  if (!response.success || !response.data) {
    throw new Error(
      response.error ?? "Não foi possível carregar a configuração do plano",
    );
  }

  return response.data as PlanoConfiguracaoData;
}

async function fetchPlanosMatrix() {
  const response = await getPlanosMatrix();

  if (!response.success || !response.data) {
    throw new Error(
      response.error ?? "Não foi possível carregar a matriz de planos",
    );
  }

  return response.data as PlanoMatrixData;
}

function PlanosSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[460px,1fr]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={`skeleton-plano-${index}`}
            className="border border-white/10 bg-background/60 backdrop-blur"
          >
            <CardBody className="space-y-4">
              <Skeleton className="h-4 w-24 rounded-lg" isLoaded={false} />
              <Skeleton className="h-4 w-32 rounded-lg" isLoaded={false} />
              <Skeleton className="h-8 w-full rounded-xl" isLoaded={false} />
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="border border-white/10 bg-background/60 backdrop-blur">
        <CardBody className="space-y-6">
          <Skeleton className="h-9 w-64 rounded-xl" isLoaded={false} />
          <Skeleton className="h-5 w-1/2 rounded-lg" isLoaded={false} />
          <Divider />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={`skeleton-module-${index}`}
                className="h-24 rounded-xl"
                isLoaded={false}
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function PlanoConfiguracaoSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border border-white/5 bg-background/50 backdrop-blur">
        <CardBody className="space-y-4">
          <Skeleton className="h-6 w-52 rounded-lg" isLoaded={false} />
          <Skeleton className="h-6 w-64 rounded-lg" isLoaded={false} />
          <Skeleton className="h-8 w-40 rounded-full" isLoaded={false} />
        </CardBody>
      </Card>
      <Card className="border border-white/5 bg-background/50 backdrop-blur">
        <CardBody className="space-y-4">
          <Skeleton className="h-5 w-40 rounded-lg" isLoaded={false} />
          <Divider />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={`config-skeleton-${index}`}
                className="h-24 rounded-xl"
                isLoaded={false}
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

type PlanoModuloItem = PlanoConfiguracaoData["modulos"][number];

const ACTIVE_CONTAINER_ID = "active-modules";
const AVAILABLE_CONTAINER_ID = "available-modules";

type ModuleContainerProps = {
  id: typeof ACTIVE_CONTAINER_ID | typeof AVAILABLE_CONTAINER_ID;
  title: string;
  description: string;
  emptyLabel: string;
  items: PlanoModuloItem[];
  isLoading?: boolean;
  isSyncing?: boolean;
  pendingModuloId?: string | null;
  icon: ReactNode;
  onToggle: (moduloId: string, nextValue: boolean) => void;
};

function ModuleContainer({
  id,
  title,
  description,
  emptyLabel,
  items,
  isLoading,
  isSyncing,
  pendingModuloId,
  icon,
  onToggle,
}: ModuleContainerProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "container", containerId: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "relative flex h-full flex-col gap-4 rounded-xl border border-white/5 bg-background/60 p-4 transition-all duration-200",
        isOver ? "border-primary/70 shadow-lg shadow-primary/20" : null,
        isSyncing ? "pointer-events-none opacity-70" : null,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/80">
              {title}
            </h4>
          </div>
        </div>
        <p className="text-xs text-default-500">{description}</p>
      </div>
      <Divider />
      <div className="flex-1 space-y-3">
        {isLoading ? (
          <Skeleton className="h-20 rounded-xl" isLoaded={false} />
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-background/50 px-4 py-12 text-sm text-default-400">
            {emptyLabel}
          </div>
        ) : (
          <SortableContext
            items={items.map((item) => item.moduloId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item: PlanoModuloItem) => (
                <SortableModuleCard
                  key={item.moduloId}
                  containerId={id}
                  disabled={isSyncing || pendingModuloId === item.moduloId}
                  item={item}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
      {isSyncing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 text-xs font-medium text-default-400 backdrop-blur-sm">
          Sincronizando...
        </div>
      ) : null}
    </div>
  );
}

type SortableModuleCardProps = {
  item: PlanoModuloItem;
  containerId: typeof ACTIVE_CONTAINER_ID | typeof AVAILABLE_CONTAINER_ID;
  disabled?: boolean;
  onToggle: (moduloId: string, nextValue: boolean) => void;
};

function SortableModuleCard({
  item,
  containerId,
  disabled,
  onToggle,
}: SortableModuleCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: item.moduloId,
    data: {
      type: "item",
      containerId,
      modulo: item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "group flex cursor-grab flex-col gap-3 rounded-xl border border-white/5 bg-background/70 p-4 transition-all duration-200 active:cursor-grabbing",
        item.habilitado
          ? "shadow-lg shadow-primary/10"
          : "border-dashed opacity-90",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <GripVertical className="mt-1 h-4 w-4 text-default-500/70" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-white">{item.nome}</p>
            <p className="text-xs uppercase tracking-wider text-default-500">
              {item.slug}
            </p>
          </div>
        </div>
        <Switch
          isDisabled={disabled}
          isSelected={item.habilitado}
          size="sm"
          onValueChange={(checked) => onToggle(item.moduloId, checked)}
        />
      </div>
      {item.descricao ? (
        <p className="text-sm text-default-400">{item.descricao}</p>
      ) : null}
      <Chip
        className="w-fit"
        color={containerId === ACTIVE_CONTAINER_ID ? "success" : "default"}
        size="sm"
        variant="flat"
      >
        {containerId === ACTIVE_CONTAINER_ID ? "No plano" : "Disponível"}
      </Chip>
    </div>
  );
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) {
    return "Sob consulta";
  }

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

export function PlanosContent() {
  const {
    data: planos,
    error: planosError,
    isLoading: isLoadingPlanos,
    mutate: mutatePlanos,
  } = useSWR<Plano[]>("admin-planos", fetchPlanos, {
    revalidateOnFocus: false,
  });

  const [selectedPlanoId, setSelectedPlanoId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlanoId && planos?.length) {
      setSelectedPlanoId(planos[0].id);
    }
  }, [planos, selectedPlanoId]);

  const {
    data: planoConfig,
    error: configError,
    isLoading: isLoadingConfig,
    isValidating: isValidatingConfig,
    mutate: mutatePlanoConfig,
  } = useSWR<PlanoConfiguracaoData>(
    selectedPlanoId ? ["admin-plano-config", selectedPlanoId] : null,
    () => fetchPlanoConfiguracao(selectedPlanoId!),
    {
      revalidateOnFocus: false,
    },
  );

  const {
    data: matrixData,
    error: matrixError,
    isLoading: isLoadingMatrix,
    mutate: mutateMatrix,
  } = useSWR<PlanoMatrixData>("admin-planos-matrix", fetchPlanosMatrix, {
    revalidateOnFocus: false,
  });

  const [pendingModuloId, setPendingModuloId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSyncingDnD, setIsSyncingDnD] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSendingReview, setIsSendingReview] = useState(false);
  const [activeModules, setActiveModules] = useState<PlanoModuloItem[]>([]);
  const [availableModules, setAvailableModules] = useState<PlanoModuloItem[]>(
    [],
  );

  useEffect(() => {
    if (!planoConfig) {
      setActiveModules([]);
      setAvailableModules([]);

      return;
    }

    const ativos = planoConfig.modulos
      .filter((modulo) => modulo.habilitado)
      .sort(
        (a, b) =>
          (a.ordem ?? 999) - (b.ordem ?? 999) || a.nome.localeCompare(b.nome),
      );

    const disponiveis = planoConfig.modulos
      .filter((modulo) => !modulo.habilitado)
      .sort(
        (a, b) =>
          (a.ordem ?? 999) - (b.ordem ?? 999) || a.nome.localeCompare(b.nome),
      );

    setActiveModules(ativos);

    setAvailableModules(disponiveis);
  }, [planoConfig]);

  const groupedModules = useMemo(() => {
    if (!activeModules.length) {
      return [];
    }

    const groups = new Map<
      string,
      {
        categoria: string;
        itens: PlanoModuloItem[];
      }
    >();

    activeModules.forEach((modulo) => {
      const categoria = modulo.categoriaInfo?.nome ?? "Outros módulos";
      const existing = groups.get(categoria);

      if (existing) {
        existing.itens.push(modulo);
      } else {
        groups.set(categoria, { categoria, itens: [modulo] });
      }
    });

    return Array.from(groups.values()).map((group) => ({
      categoria: group.categoria,
      itens: group.itens
        .slice()
        .sort(
          (a, b) =>
            (a.ordem ?? 999) - (b.ordem ?? 999) || a.nome.localeCompare(b.nome),
        ),
      ativos: group.itens.length,
    }));
  }, [activeModules]);

  const totalModulos = activeModules.length + availableModules.length;
  const totalModulosAtivos = activeModules.length;

  const ultimaVersao = planoConfig?.ultimaVersao;

  const overviewStats = useMemo(() => {
    if (!planoConfig) {
      return [] as Array<{
        id: string;
        label: string;
        value: string;
        caption: string;
        icon: ReactNode;
        accentClass: string;
      }>;
    }

    return [
      {
        id: "active-modules",
        label: "Módulos ativos",
        value: String(totalModulosAtivos),
        caption: `de ${totalModulos} habilitados`,
        icon: <ToggleLeft className="h-5 w-5" />,
        accentClass:
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      },
      {
        id: "available-modules",
        label: "Disponíveis",
        value: String(availableModules.length),
        caption: "aguardando ativação",
        icon: <Puzzle className="h-5 w-5" />,
        accentClass: "border border-blue-500/20 bg-blue-500/10 text-blue-200",
      },
      {
        id: "latest-version",
        label: "Última versão",
        value: ultimaVersao ? `v${ultimaVersao.numero}` : "Sem versão",
        caption: ultimaVersao
          ? (statusLabel[ultimaVersao.status] ?? ultimaVersao.status)
          : "publique para aplicar aos tenants",
        icon: <History className="h-5 w-5" />,
        accentClass:
          "border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200",
      },
      {
        id: "mensalidade",
        label: "Mensalidade",
        value: formatCurrency(planoConfig.plano.valorMensal),
        caption: "valor de cobrança recorrente",
        icon: <Boxes className="h-5 w-5" />,
        accentClass:
          "border border-amber-500/20 bg-amber-500/10 text-amber-200",
      },
    ];
  }, [
    availableModules.length,
    planoConfig,
    totalModulos,
    totalModulosAtivos,
    ultimaVersao,
  ]);

  const matrixRows = useMemo(() => {
    if (!matrixData) {
      return [] as Array<
        | { tipo: "categoria"; categoria: string }
        | { tipo: "modulo"; modulo: PlanoMatrixModuleRow }
      >;
    }

    const rows: Array<
      | { tipo: "categoria"; categoria: string }
      | { tipo: "modulo"; modulo: PlanoMatrixModuleRow }
    > = [];

    let categoriaAtual: string | undefined;

    matrixData.modulos.forEach((modulo) => {
      const categoria = modulo.categoriaInfo?.nome ?? "Outros módulos";

      if (categoria !== categoriaAtual) {
        rows.push({ tipo: "categoria", categoria });
        categoriaAtual = categoria;
      }
      rows.push({ tipo: "modulo", modulo });
    });

    return rows;
  }, [matrixData]);

  const handleToggleModulo = useCallback(
    async (moduloId: string, habilitado: boolean) => {
      if (!selectedPlanoId) {
        return;
      }

      setPendingModuloId(moduloId);

      try {
        const response = await setPlanoModulos(selectedPlanoId, [
          { moduloId, habilitado },
        ]);

        if (!response.success) {
          throw new Error(
            response.error ?? "Não foi possível atualizar o módulo",
          );
        }

        toast.success(
          habilitado
            ? "Módulo habilitado no plano"
            : "Módulo desabilitado no plano",
        );

        await Promise.all([
          mutatePlanoConfig(),
          mutatePlanos(),
          mutateMatrix(),
        ]);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erro ao atualizar módulo do plano",
        );
        await mutatePlanoConfig();
      } finally {
        setPendingModuloId(null);
      }
    },
    [mutatePlanoConfig, mutatePlanos, mutateMatrix, selectedPlanoId],
  );

  const syncActiveModules = useCallback(
    async (nextActiveIds: string[], showToast = false) => {
      if (!selectedPlanoId) {
        return;
      }

      setIsSyncingDnD(true);
      try {
        const response = await syncPlanoModulos(selectedPlanoId, nextActiveIds);

        if (!response.success) {
          throw new Error(
            response.error ?? "Não foi possível sincronizar os módulos",
          );
        }

        if (showToast) {
          toast.success("Matriz de módulos atualizada com sucesso");
        }

        await Promise.all([
          mutatePlanoConfig(),
          mutatePlanos(),
          mutateMatrix(),
        ]);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erro ao sincronizar módulos do plano",
        );
        await mutatePlanoConfig();
      } finally {
        setIsSyncingDnD(false);
      }
    },
    [mutatePlanoConfig, mutatePlanos, mutateMatrix, selectedPlanoId],
  );

  const handlePublicarVersao = useCallback(async () => {
    if (!selectedPlanoId) {
      toast.error("Selecione um plano para publicar uma nova versão");

      return;
    }

    setIsPublishing(true);

    try {
      const versaoParaPublicar =
        planoConfig?.versoes.find((versao) => versao.status === "REVIEW") ??
        planoConfig?.versoes.find((versao) => versao.status === "DRAFT");

      const response = await publishPlanoVersao(selectedPlanoId, {
        versaoId:
          versaoParaPublicar && versaoParaPublicar.status !== "PUBLISHED"
            ? versaoParaPublicar.id
            : undefined,
      });

      if (!response.success || !response.data) {
        throw new Error(
          response.error ?? "Não foi possível publicar a nova versão",
        );
      }

      toast.success(
        `Versão ${response.data.numero} publicada com sucesso para o plano.`,
      );

      await Promise.all([mutatePlanoConfig(), mutatePlanos(), mutateMatrix()]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao publicar a nova versão do plano",
      );
    } finally {
      setIsPublishing(false);
    }
  }, [
    mutatePlanoConfig,
    mutatePlanos,
    mutateMatrix,
    planoConfig,
    selectedPlanoId,
  ]);

  const handleSalvarRascunho = useCallback(async () => {
    if (!selectedPlanoId) {
      toast.error("Selecione um plano para salvar um rascunho");

      return;
    }

    setIsSavingDraft(true);

    try {
      const response = await createPlanoVersaoDraft(selectedPlanoId);

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Não foi possível salvar o rascunho");
      }

      toast.success(`Rascunho v${response.data.numero} salvo com sucesso.`);

      await Promise.all([mutatePlanoConfig(), mutatePlanos(), mutateMatrix()]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao salvar rascunho da versão",
      );
    } finally {
      setIsSavingDraft(false);
    }
  }, [mutatePlanoConfig, mutatePlanos, mutateMatrix, selectedPlanoId]);

  const handleEnviarRevisao = useCallback(async () => {
    if (!selectedPlanoId) {
      toast.error("Selecione um plano para enviar para revisão");

      return;
    }

    setIsSendingReview(true);

    try {
      const response = await createPlanoVersaoReview(selectedPlanoId);

      if (!response.success || !response.data) {
        throw new Error(
          response.error ?? "Não foi possível enviar para revisão",
        );
      }

      toast.success(
        `Versão v${response.data.numero} enviada para revisão com sucesso.`,
      );

      await Promise.all([mutatePlanoConfig(), mutatePlanos(), mutateMatrix()]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao enviar versão para revisão",
      );
    } finally {
      setIsSendingReview(false);
    }
  }, [mutatePlanoConfig, mutatePlanos, mutateMatrix, selectedPlanoId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = useCallback((_: DragStartEvent) => {
    // reserved for future visual feedback
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || !active.data.current) {
        return;
      }

      const activeContainer = active.data.current?.containerId as
        | typeof ACTIVE_CONTAINER_ID
        | typeof AVAILABLE_CONTAINER_ID
        | undefined;

      let overContainer =
        (over.data.current?.containerId as
          | typeof ACTIVE_CONTAINER_ID
          | typeof AVAILABLE_CONTAINER_ID
          | undefined) ?? (typeof over.id === "string" ? over.id : undefined);

      if (
        overContainer !== ACTIVE_CONTAINER_ID &&
        overContainer !== AVAILABLE_CONTAINER_ID
      ) {
        overContainer = activeContainer;
      }

      if (!activeContainer || !overContainer) {
        return;
      }

      if (
        activeContainer === ACTIVE_CONTAINER_ID &&
        overContainer === ACTIVE_CONTAINER_ID
      ) {
        const oldIndex = activeModules.findIndex(
          (item) => item.moduloId === active.id,
        );
        const newIndex =
          over.data.current?.type === "item"
            ? activeModules.findIndex((item) => item.moduloId === over.id)
            : activeModules.length - 1;

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(activeModules, oldIndex, newIndex);

          setActiveModules(reordered);

          void syncActiveModules(
            reordered.map((modulo) => modulo.moduloId),
            false,
          );
        }

        return;
      }

      if (
        activeContainer === AVAILABLE_CONTAINER_ID &&
        overContainer === AVAILABLE_CONTAINER_ID
      ) {
        const oldIndex = availableModules.findIndex(
          (item) => item.moduloId === active.id,
        );
        const newIndex =
          over.data.current?.type === "item"
            ? availableModules.findIndex((item) => item.moduloId === over.id)
            : availableModules.length - 1;

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(availableModules, oldIndex, newIndex);

          setAvailableModules(reordered);
        }

        return;
      }

      if (
        activeContainer === ACTIVE_CONTAINER_ID &&
        overContainer === AVAILABLE_CONTAINER_ID
      ) {
        const movingItem = activeModules.find(
          (item) => item.moduloId === active.id,
        );

        if (!movingItem) {
          return;
        }

        const nextActive = activeModules.filter(
          (item) => item.moduloId !== active.id,
        );

        const nextAvailable = availableModules.slice();
        const targetIndex =
          over.data.current?.type === "item"
            ? nextAvailable.findIndex((item) => item.moduloId === over.id)
            : nextAvailable.length;

        nextAvailable.splice(targetIndex, 0, {
          ...movingItem,
          habilitado: false,
        });

        setActiveModules(nextActive);
        setAvailableModules(nextAvailable);

        void syncActiveModules(
          nextActive.map((modulo) => modulo.moduloId),
          true,
        );

        return;
      }

      if (
        activeContainer === AVAILABLE_CONTAINER_ID &&
        overContainer === ACTIVE_CONTAINER_ID
      ) {
        const movingItem = availableModules.find(
          (item) => item.moduloId === active.id,
        );

        if (!movingItem) {
          return;
        }

        const nextAvailable = availableModules.filter(
          (item) => item.moduloId !== active.id,
        );

        const nextActive = activeModules.slice();
        const targetIndex =
          over.data.current?.type === "item"
            ? nextActive.findIndex((item) => item.moduloId === over.id)
            : nextActive.length;

        nextActive.splice(targetIndex, 0, {
          ...movingItem,
          habilitado: true,
        });

        setAvailableModules(nextAvailable);
        setActiveModules(nextActive);

        void syncActiveModules(
          nextActive.map((modulo) => modulo.moduloId),
          true,
        );
      }
    },
    [activeModules, availableModules, syncActiveModules],
  );

  return (
    <section className="flex w-full flex-col gap-8 py-12 px-3 sm:px-0">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className={title({ size: "lg", color: "blue" })}>
              <span className="inline-flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary" />
                Controle de planos & módulos
              </span>
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              Defina quais módulos cada plano comercial pode acessar, publique
              novas versões e mantenha uma trilha de auditoria completa.
            </p>
          </div>
          <Chip
            className="h-9 rounded-full text-sm font-semibold"
            color="primary"
            size="lg"
            variant="flat"
          >
            {String(planos?.length ?? 0)} planos ativos
          </Chip>
        </div>
      </header>

      {planosError ? (
        <Card className="border border-danger/30 bg-danger/10 text-danger">
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">
                  Não foi possível carregar os planos cadastrados.
                </p>
                <p className="text-sm text-danger/80">
                  {planosError instanceof Error
                    ? planosError.message
                    : "Erro inesperado. Tente novamente em instantes."}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {isLoadingPlanos || !planos ? (
        <PlanosSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[460px,1fr]">
          <aside className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {planos.map((plano) => {
              const selecionado = plano.id === selectedPlanoId;

              return (
                <Card
                  key={plano.id}
                  isPressable
                  className={clsx(
                    "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-background/60 backdrop-blur transition-all duration-200",
                    selecionado
                      ? "border-primary/70 shadow-lg shadow-primary/40"
                      : "border-white/10 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/30",
                  )}
                  onPress={() => setSelectedPlanoId(plano.id)}
                >
                  <div
                    className={clsx(
                      "pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300",
                      selecionado
                        ? "bg-primary/20"
                        : "group-hover:bg-primary/10",
                    )}
                  />
                  <CardBody className="relative space-y-3">
                    <span
                      className={clsx(
                        "block h-1 w-full rounded-full",
                        selecionado
                          ? "bg-gradient-to-r from-primary/80 via-primary/60 to-primary/80"
                          : "bg-gradient-to-r from-default-600/40 via-default-500/20 to-default-600/40",
                      )}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-widest text-primary/80">
                          Plano
                        </p>
                        <h3 className="truncate text-base font-semibold text-white">
                          {plano.nome}
                        </h3>
                      </div>
                      <Chip
                        className="shrink-0 border border-white/10"
                        color={plano.ativo ? "success" : "default"}
                        size="sm"
                        variant={plano.ativo ? "flat" : "dot"}
                      >
                        {plano.ativo ? "Ativo" : "Inativo"}
                      </Chip>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-default-400">
                      <span>{formatCurrency(plano.valorMensal)} / mês</span>
                      <Divider className="h-4" orientation="vertical" />
                      <span className="text-xs uppercase tracking-wide text-default-500">
                        {plano.slug}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-default-500">
                      {plano.limiteUsuarios ? (
                        <Chip color="secondary" size="sm" variant="flat">
                          👥 Até {plano.limiteUsuarios} usuários
                        </Chip>
                      ) : (
                        <Chip color="secondary" size="sm" variant="flat">
                          👥 Usuários ilimitados
                        </Chip>
                      )}
                      {plano.limiteProcessos ? (
                        <Chip color="default" size="sm" variant="flat">
                          ⚖️ Até {plano.limiteProcessos} processos
                        </Chip>
                      ) : null}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </aside>

          <div className="space-y-6">
            {configError ? (
              <Card className="border border-danger/30 bg-danger/10 text-danger">
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">
                        Não foi possível carregar a configuração deste plano.
                      </p>
                      <p className="text-sm text-danger/80">
                        {configError instanceof Error
                          ? configError.message
                          : "Erro inesperado. Tente novamente em instantes."}
                      </p>
                    </div>
                  </div>
                  <Button
                    color="primary"
                    startContent={<RefreshCw className="h-4 w-4" />}
                    onPress={() => mutatePlanoConfig()}
                  >
                    Tentar novamente
                  </Button>
                </CardBody>
              </Card>
            ) : null}

            {selectedPlanoId && (isLoadingConfig || !planoConfig) ? (
              <PlanoConfiguracaoSkeleton />
            ) : null}

            {planoConfig ? (
              <>
                {matrixError ? (
                  <Card className="border border-danger/30 bg-danger/10 text-danger">
                    <CardBody className="flex flex-col gap-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">
                            Não foi possível carregar a matriz de planos.
                          </p>
                          <p className="text-sm text-danger/80">
                            {matrixError instanceof Error
                              ? matrixError.message
                              : "Erro inesperado. Tente novamente mais tarde."}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ) : null}

                {overviewStats.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {overviewStats.map((stat) => (
                      <Card
                        key={stat.id}
                        className="border border-white/5 bg-background/60 backdrop-blur transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                      >
                        <CardBody className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
                              {stat.label}
                            </p>
                            <p className="text-2xl font-semibold text-white">
                              {stat.value}
                            </p>
                            <p className="text-xs text-default-500">
                              {stat.caption}
                            </p>
                          </div>
                          <span
                            className={clsx(
                              "flex h-10 w-10 items-center justify-center rounded-full",
                              stat.accentClass,
                            )}
                          >
                            {stat.icon}
                          </span>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : null}

                <Card className="border border-white/5 bg-background/60 backdrop-blur">
                  <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-primary/80">
                        Resumo do plano
                      </p>
                      <h2 className="text-xl font-semibold text-white">
                        {planoConfig.plano.nome}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-default-400">
                        <span>
                          {totalModulosAtivos} / {totalModulos} módulos ativos
                        </span>
                        <Divider
                          className="hidden h-4 sm:block"
                          orientation="vertical"
                        />
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Slug: {planoConfig.plano.slug}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          isDisabled={isPublishing || isSendingReview}
                          isLoading={isSavingDraft}
                          startContent={<Save className="h-4 w-4" />}
                          variant="flat"
                          onPress={handleSalvarRascunho}
                        >
                          Salvar rascunho
                        </Button>
                        <Button
                          color="secondary"
                          isDisabled={isPublishing || isSavingDraft}
                          isLoading={isSendingReview}
                          startContent={<Send className="h-4 w-4" />}
                          variant="flat"
                          onPress={handleEnviarRevisao}
                        >
                          Enviar para revisão
                        </Button>
                        <Button
                          color="primary"
                          isLoading={isPublishing || isValidatingConfig}
                          startContent={<Rocket className="h-4 w-4" />}
                          onPress={handlePublicarVersao}
                        >
                          Publicar versão
                        </Button>
                      </div>
                      {isValidatingConfig ? (
                        <p className="text-xs text-default-500">
                          Sincronizando dados do plano...
                        </p>
                      ) : null}
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody className="space-y-4">
                    {ultimaVersao ? (
                      <div className="flex flex-wrap items-center gap-3 text-sm text-default-400">
                        <Tooltip content="Versão publicada aplicada a todos os tenants deste plano.">
                          <Chip
                            className="w-fit text-xs uppercase tracking-wide"
                            color={statusTone[ultimaVersao.status] ?? "default"}
                            size="sm"
                            startContent={
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            }
                            variant="flat"
                          >
                            Versão {ultimaVersao.numero} ·{" "}
                            {statusLabel[ultimaVersao.status] ??
                              ultimaVersao.status}
                          </Chip>
                        </Tooltip>
                        {ultimaVersao.publicadoEm ? (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-4 w-4 text-success" />
                            Publicada em{" "}
                            {new Date(ultimaVersao.publicadoEm).toLocaleString(
                              "pt-BR",
                            )}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary/90">
                        <AlertTriangle className="h-4 w-4" />
                        Este plano ainda não possui versão publicada. Publique a
                        primeira configuração após ajustar os módulos.
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card className="border border-white/5 bg-background/60 backdrop-blur">
                  <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-primary/80">
                        Builder de módulos
                      </p>
                      <h3 className="text-lg font-semibold text-white">
                        Arraste e solte para gerenciar o plano
                      </h3>
                      <p className="text-sm text-default-400">
                        Módulos ativados aparecem à esquerda. Arraste da coluna
                        de disponíveis para habilitar, ou devolva para
                        desabilitar.
                      </p>
                    </div>
                    <Chip color="secondary" size="sm" variant="flat">
                      {activeModules.length} ativos · {availableModules.length}{" "}
                      disponíveis
                    </Chip>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <DndContext
                      sensors={sensors}
                      onDragEnd={handleDragEnd}
                      onDragStart={handleDragStart}
                    >
                      <div className="grid gap-4 lg:grid-cols-2">
                        <ModuleContainer
                          description="Módulos atualmente liberados para os tenants deste plano."
                          emptyLabel="Arraste módulos para cá para liberar no plano."
                          icon={<ToggleLeft className="h-4 w-4" />}
                          id={ACTIVE_CONTAINER_ID}
                          isLoading={isLoadingConfig}
                          isSyncing={isSyncingDnD}
                          items={activeModules}
                          pendingModuloId={pendingModuloId}
                          title="Módulos ativos"
                          onToggle={handleToggleModulo}
                        />
                        <ModuleContainer
                          description="Módulos existentes que ainda não fazem parte deste plano."
                          emptyLabel="Todos os módulos estão ativos no plano."
                          icon={<Boxes className="h-4 w-4" />}
                          id={AVAILABLE_CONTAINER_ID}
                          isLoading={isLoadingConfig}
                          isSyncing={isSyncingDnD}
                          items={availableModules}
                          pendingModuloId={pendingModuloId}
                          title="Módulos disponíveis"
                          onToggle={handleToggleModulo}
                        />
                      </div>
                    </DndContext>
                  </CardBody>
                </Card>

                <Card className="border border-white/5 bg-background/50 backdrop-blur">
                  <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
                        Matriz Plano x Módulo
                      </p>
                      <h3 className="text-lg font-semibold text-white">
                        Visão comparativa entre planos
                      </h3>
                      <p className="text-sm text-default-400">
                        Visualize rapidamente quais planos oferecem cada módulo
                        ativo na plataforma.
                      </p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    {isLoadingMatrix && !matrixData ? (
                      <Skeleton className="h-40 rounded-xl" isLoaded={false} />
                    ) : matrixData ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-[720px] border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-default-400">
                              <th className="w-72 px-4 py-3 font-medium">
                                Módulo
                              </th>
                              {matrixData.planos.map((plano) => (
                                <th
                                  key={plano.id}
                                  className="px-4 py-3 text-center font-medium"
                                >
                                  <div className="flex flex-col items-center gap-1 text-default-300">
                                    <span className="text-sm font-semibold text-white">
                                      {plano.nome}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-default-500">
                                      {plano.slug}
                                    </span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="text-sm text-default-200">
                            {matrixRows.map((row) => {
                              if (row.tipo === "categoria") {
                                return (
                                  <tr
                                    key={`categoria-${row.categoria}`}
                                    className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-[0.3em] text-primary/70"
                                  >
                                    <td
                                      className="px-4 py-3"
                                      colSpan={matrixData.planos.length + 1}
                                    >
                                      {row.categoria}
                                    </td>
                                  </tr>
                                );
                              }

                              const modulo = row.modulo;

                              return (
                                <tr
                                  key={modulo.moduloId}
                                  className="border-b border-white/5 hover:bg-white/5"
                                >
                                  <td className="px-4 py-3">
                                    <div className="space-y-1">
                                      <p className="font-medium text-white">
                                        {modulo.nome}
                                      </p>
                                      <p className="text-xs uppercase tracking-widest text-default-500">
                                        {modulo.slug}
                                      </p>
                                    </div>
                                  </td>
                                  {matrixData.planos.map((plano) => {
                                    const status = modulo.planos.find(
                                      (item) => item.planoId === plano.id,
                                    );

                                    return (
                                      <td
                                        key={`${modulo.moduloId}-${plano.id}`}
                                        className="px-4 py-3 text-center"
                                      >
                                        {status?.habilitado ? (
                                          <CheckCircle2 className="mx-auto h-4 w-4 text-success" />
                                        ) : (
                                          <span className="text-default-500">
                                            —
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-white/5 bg-white/5 px-4 py-6 text-sm text-default-500">
                        Nenhuma informação disponível no momento.
                      </div>
                    )}
                  </CardBody>
                </Card>

                <div className="space-y-4">
                  {groupedModules.map((group) => (
                    <Card
                      key={group.categoria}
                      className="border border-white/5 bg-background/50 backdrop-blur"
                    >
                      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
                            Categoria
                          </p>
                          <h3 className="text-lg font-semibold text-white">
                            {group.categoria}
                          </h3>
                        </div>
                        <Chip
                          color="secondary"
                          size="sm"
                          startContent={<Layers className="h-3.5 w-3.5" />}
                          variant="flat"
                        >
                          {group.ativos}/{group.itens.length} ativos
                        </Chip>
                      </CardHeader>
                      <Divider />
                      <CardBody className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          {group.itens.map((modulo) => (
                            <div
                              key={modulo.moduloId}
                              className={clsx(
                                "flex flex-col gap-3 rounded-xl border border-white/5 bg-background/60 p-4 transition-shadow duration-200",
                                modulo.habilitado
                                  ? "shadow-lg shadow-primary/10"
                                  : "opacity-80",
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <p className="text-sm font-semibold text-white">
                                    {modulo.nome}
                                  </p>
                                  <p className="text-xs uppercase tracking-wider text-default-500">
                                    {modulo.slug}
                                  </p>
                                </div>
                                <Switch
                                  aria-label={
                                    modulo.habilitado
                                      ? `Desabilitar módulo ${modulo.nome}`
                                      : `Habilitar módulo ${modulo.nome}`
                                  }
                                  isDisabled={
                                    pendingModuloId === modulo.moduloId ||
                                    isPublishing
                                  }
                                  isSelected={modulo.habilitado}
                                  size="sm"
                                  onValueChange={(checked) =>
                                    handleToggleModulo(modulo.moduloId, checked)
                                  }
                                />
                              </div>

                              {modulo.descricao ? (
                                <p className="text-sm leading-relaxed text-default-400">
                                  {modulo.descricao}
                                </p>
                              ) : null}

                              <div className="flex items-center gap-2 text-xs text-default-500">
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/5 px-2 py-1">
                                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                  {modulo.habilitado
                                    ? "Disponível no plano"
                                    : "Desabilitado"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                <Card className="border border-white/5 bg-background/50 backdrop-blur">
                  <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
                        Histórico de versões
                      </p>
                      <h3 className="text-lg font-semibold text-white">
                        Auditoria de publicações
                      </h3>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody className="space-y-3">
                    {planoConfig.versoes.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-default-500">
                        <Clock className="h-4 w-4" />
                        Nenhuma versão publicada até o momento.
                      </div>
                    ) : (
                      planoConfig.versoes.map((versao) => (
                        <div
                          key={versao.id}
                          className="flex flex-col gap-2 rounded-lg border border-white/5 bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <Chip
                                color={statusTone[versao.status] ?? "default"}
                                size="sm"
                                startContent={
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                }
                                variant="flat"
                              >
                                Versão {versao.numero}
                              </Chip>
                              <span className="text-xs uppercase tracking-wide text-default-500">
                                {statusLabel[versao.status] ?? versao.status}
                              </span>
                            </div>
                            {versao.titulo ? (
                              <p className="text-sm font-medium text-white">
                                {versao.titulo}
                              </p>
                            ) : null}
                            {versao.descricao ? (
                              <p className="text-sm text-default-400">
                                {versao.descricao}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-start gap-1 text-xs text-default-500 sm:items-end">
                            {versao.publicadoEm ? (
                              <span>
                                Publicado em{" "}
                                {new Date(versao.publicadoEm).toLocaleString(
                                  "pt-BR",
                                )}
                              </span>
                            ) : (
                              <span>Não publicado</span>
                            )}
                            {versao.publicadoPorId ? (
                              <span>
                                Publicado por: {versao.publicadoPorId}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </CardBody>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
