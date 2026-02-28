"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";

import {
  Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure, } from "@heroui/modal";
import { Skeleton, Select, SelectItem } from "@heroui/react";
import { Plus, List, Kanban } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";

import { KanbanColumn } from "./components/kanban-column";
import { TarefaCard } from "./components/tarefa-card";
import { TarefaDetailModal } from "./components/tarefa-detail-modal";

import { criarBoardPadrao } from "@/app/actions/boards";
import { moverTarefa, createTarefa } from "@/app/actions/tarefas";
import { listCategoriasTarefa } from "@/app/actions/categorias-tarefa";
import { getAllProcessos } from "@/app/actions/processos";
import { searchClientes } from "@/app/actions/clientes";
import { title } from "@/components/primitives";
import { useKanban } from "@/app/hooks/use-kanban";
import { DateInput } from "@/components/ui/date-input";

const prioridadeConfig = {
  BAIXA: { label: "Baixa", color: "default" as const },
  MEDIA: { label: "Média", color: "primary" as const },
  ALTA: { label: "Alta", color: "warning" as const },
  CRITICA: { label: "Crítica", color: "danger" as const },
};

export default function KanbanView() {
  const [boardSelecionadoId, setBoardSelecionadoId] = useState<string>("");
  const [tarefaSelecionada, setTarefaSelecionada] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [criandoBoard, setCriandoBoard] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    prioridade: "MEDIA" as "BAIXA" | "MEDIA" | "ALTA" | "CRITICA",
    dataLimite: null as any,
    lembreteEm: null as any,
    categoriaId: "",
    responsavelId: "",
    processoId: "",
    clienteId: "",
    boardId: "",
    columnId: "",
  });
  const [salvando, setSalvando] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { boards, board, tarefas, isLoading, refreshAll } =
    useKanban(boardSelecionadoId);

  const { data: categoriasData } = useSWR("categorias-tarefa-ativas", () =>
    listCategoriasTarefa({ ativo: true }),
  );
  const { data: processosData } = useSWR("processos-para-tarefa", () =>
    getAllProcessos(),
  );
  const { data: clientesData } = useSWR("clientes-para-tarefa", () =>
    searchClientes({}),
  );
  const { data: colunasData } = useSWR(
    formData.boardId ? ["columns-for-select", formData.boardId] : null,
    async () => {
      const { listColumns } = await import("@/app/actions/board-columns");

      return listColumns(formData.boardId);
    },
  );

  const categorias = useMemo(
    () => (categoriasData?.success ? categoriasData.categorias : []),
    [categoriasData],
  );
  const processos = useMemo(
    () => (processosData?.success ? processosData.processos : []),
    [processosData],
  );
  const clientes = useMemo(
    () => (clientesData?.success ? clientesData.clientes : []),
    [clientesData],
  );
  const colunas = useMemo(
    () => (colunasData?.success ? colunasData.columns : []),
    [colunasData],
  );

  // Garantir que selectedKeys sempre exista na coleção
  const processoKeySet = useMemo(
    () => new Set((processos || []).map((p: any) => p.id)),
    [processos],
  );
  const clienteKeySet = useMemo(
    () => new Set((clientes || []).map((c: any) => c.id)),
    [clientes],
  );
  const categoriaKeySet = useMemo(
    () => new Set((categorias || []).map((c: any) => c.id)),
    [categorias],
  );
  const boardKeySet = useMemo(
    () => new Set((boards || []).map((b: any) => b.id)),
    [boards],
  );
  const colunaKeySet = useMemo(
    () => new Set((colunas || []).map((c: any) => c.id)),
    [colunas],
  );

  const selectedProcessKeys = useMemo(
    () =>
      formData.processoId && processoKeySet.has(formData.processoId)
        ? [formData.processoId]
        : [],
    [formData.processoId, processoKeySet],
  );
  const selectedClienteKeys = useMemo(
    () =>
      formData.clienteId && clienteKeySet.has(formData.clienteId)
        ? [formData.clienteId]
        : [],
    [formData.clienteId, clienteKeySet],
  );
  const selectedCategoriaKeys = useMemo(
    () =>
      formData.categoriaId && categoriaKeySet.has(formData.categoriaId)
        ? [formData.categoriaId]
        : [],
    [formData.categoriaId, categoriaKeySet],
  );
  const selectedBoardKeys = useMemo(
    () =>
      formData.boardId && boardKeySet.has(formData.boardId)
        ? [formData.boardId]
        : [],
    [formData.boardId, boardKeySet],
  );
  const selectedColunaKeys = useMemo(
    () =>
      formData.columnId && colunaKeySet.has(formData.columnId)
        ? [formData.columnId]
        : [],
    [formData.columnId, colunaKeySet],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimento antes de iniciar drag
      },
    }),
  );

  // Selecionar primeiro board automaticamente
  useEffect(() => {
    if (boards && boards.length > 0 && !boardSelecionadoId) {
      setBoardSelecionadoId(boards[0].id);
    }
  }, [boards, boardSelecionadoId]);

  // Organizar tarefas por coluna
  const tarefasPorColuna = useMemo(() => {
    const map = new Map<string, any[]>();

    board?.colunas?.forEach((col: any) => {
      map.set(col.id, []);
    });

    tarefas?.forEach((tarefa: any) => {
      if (tarefa.columnId && map.has(tarefa.columnId)) {
        map.get(tarefa.columnId)!.push(tarefa);
      }
    });

    return map;
  }, [board, tarefas]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);

      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Se soltou sobre uma coluna
    const colunaDestino = board?.colunas?.find((col: any) => col.id === overId);

    if (colunaDestino) {
      // Mover para a coluna
      const tarefasDaColuna = tarefasPorColuna.get(colunaDestino.id) || [];
      const novaOrdem = tarefasDaColuna.length;

      await moverTarefa(activeId, colunaDestino.id, novaOrdem);
      refreshAll();
      toast.success("Tarefa movida!");
    }

    setActiveId(null);
  };

  const tarefaAtiva = useMemo(() => {
    return tarefas?.find((t: any) => t.id === activeId);
  }, [activeId, tarefas]);

  const handleCriarBoardPadrao = async () => {
    setCriandoBoard(true);
    const result = await criarBoardPadrao();

    if (result.success) {
      toast.success("Board criado com sucesso!");
      refreshAll();
      if (result.board) {
        setBoardSelecionadoId(result.board.id);
      }
    } else {
      toast.error(result.error || "Erro ao criar board");
    }
    setCriandoBoard(false);
  };

  const handleOpenNova = useCallback(() => {
    setFormData({
      titulo: "",
      descricao: "",
      prioridade: "MEDIA",
      dataLimite: null,
      lembreteEm: null,
      categoriaId: "",
      responsavelId: "",
      processoId: "",
      clienteId: "",
      boardId:
        boardSelecionadoId || (boards && boards.length > 0 ? boards[0].id : ""),
      columnId: board?.colunas?.[0]?.id || "",
    });
    onOpen();
  }, [onOpen, boards, boardSelecionadoId, board]);

  const handleSalvar = useCallback(async () => {
    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");

      return;
    }

    setSalvando(true);

    try {
      const payload = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        prioridade: formData.prioridade,
        dataLimite: formData.dataLimite
          ? formData.dataLimite.toDate().toISOString()
          : null,
        lembreteEm: formData.lembreteEm
          ? formData.lembreteEm.toDate().toISOString()
          : null,
        categoriaId: formData.categoriaId || null,
        responsavelId: formData.responsavelId || null,
        processoId: formData.processoId || null,
        clienteId: formData.clienteId || null,
        boardId: formData.boardId || null,
        columnId: formData.columnId || null,
      };

      const result = await createTarefa(payload);

      if (result.success) {
        toast.success("Tarefa criada com sucesso!");
        refreshAll();
        onClose();
      } else {
        toast.error(result.error || "Erro ao salvar tarefa");
      }
    } catch (error) {
      toast.error("Erro ao salvar tarefa");
    } finally {
      setSalvando(false);
    }
  }, [formData, refreshAll, onClose]);

  if (!boards || (boards.length === 0 && !isLoading)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <h1 className={title()}>Bem-vindo ao Kanban!</h1>
          <p className="text-default-500 text-center max-w-md">
            Você ainda não tem nenhum quadro Kanban. Crie seu primeiro quadro
            para começar a organizar suas tarefas visualmente.
          </p>
          <Button
            color="primary"
            isLoading={criandoBoard}
            size="lg"
            startContent={<Plus size={20} />}
            onPress={handleCriarBoardPadrao}
          >
            Criar Quadro Padrão
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Kanban</h1>
          <p className="mt-2 text-sm text-default-500">
            Visualização em quadros - {board?.nome || "Carregando..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            as="a"
            color="secondary"
            href="/tarefas"
            startContent={<List className="h-4 w-4" />}
            variant="flat"
          >
            Ver Lista
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={handleOpenNova}
          >
            Nova Tarefa
          </Button>
        </div>
      </header>

      {/* Seletor de Board */}
      {boards && boards.length > 1 && (
        <div className="flex items-center gap-2">
          <Kanban className="text-default-400" size={16} />
          <Select
            className="max-w-xs"
            label="Quadro"
            selectedKeys={
              boardSelecionadoId && boardKeySet.has(boardSelecionadoId)
                ? [boardSelecionadoId]
                : []
            }
            size="sm"
            variant="bordered"
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];

              setBoardSelecionadoId(value as string);
            }}
          >
            {boards.map((b: any) => (
              <SelectItem key={b.id} textValue={b.nome}>
                {b.favorito ? "⭐ " : ""}
                {b.nome}
              </SelectItem>
            ))}
          </Select>
        </div>
      )}

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <Skeleton className="h-[600px] rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCorners}
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
            {board?.colunas?.map((coluna: any) => {
              const tarefasDaColuna = tarefasPorColuna.get(coluna.id) || [];

              return (
                <KanbanColumn
                  key={coluna.id}
                  column={coluna}
                  tarefas={tarefasDaColuna}
                  onTarefaClick={(tarefa) => setTarefaSelecionada(tarefa)}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeId && tarefaAtiva ? (
              <div className="rotate-3 scale-105 opacity-90">
                <TarefaCard isDragging tarefa={tarefaAtiva} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modal de Detalhes */}
      {tarefaSelecionada && (
        <TarefaDetailModal
          isOpen={!!tarefaSelecionada}
          tarefa={tarefaSelecionada}
          onClose={() => setTarefaSelecionada(null)}
          onUpdate={refreshAll}
        />
      )}

      {/* Modal Criar Tarefa */}
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>Nova Tarefa</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Título"
                placeholder="Digite o título da tarefa"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
              />

              <Textarea
                label="Descrição"
                minRows={3}
                placeholder="Digite uma descrição (opcional)"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  isRequired
                  label="Prioridade"
                  selectedKeys={[formData.prioridade]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0];

                    setFormData({
                      ...formData,
                      prioridade: value as
                        | "BAIXA"
                        | "MEDIA"
                        | "ALTA"
                        | "CRITICA",
                    });
                  }}
                >
                  {Object.entries(prioridadeConfig).map(([key, config]) => (
                    <SelectItem key={key} textValue={config.label}>
                      {config.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Categoria"
                  placeholder="Selecione uma categoria"
                  selectedKeys={selectedCategoriaKeys}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0];

                    setFormData({ ...formData, categoriaId: value as string });
                  }}
                >
                  {(categorias || []).map((cat: any) => (
                    <SelectItem key={cat.id} textValue={cat.nome}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DateInput
                  hideTimeZone
                  showMonthAndYearPickers
                  label="Data Limite"
                  dateValue={formData.dataLimite}
                  variant="bordered"
                  onDateChange={(value) =>
                    setFormData({ ...formData, dataLimite: value })
                  }
                />

                <DateInput
                  hideTimeZone
                  showMonthAndYearPickers
                  label="Lembrete"
                  dateValue={formData.lembreteEm}
                  variant="bordered"
                  onDateChange={(value) =>
                    setFormData({ ...formData, lembreteEm: value })
                  }
                />
              </div>

              <Select
                label="Processo"
                placeholder="Vincular a um processo (opcional)"
                selectedKeys={selectedProcessKeys}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];

                  setFormData({ ...formData, processoId: value as string });
                }}
              >
                {(processos || []).map((proc: any) => (
                  <SelectItem
                    key={proc.id}
                    textValue={`${proc.numero}${proc.titulo ? ` - ${proc.titulo}` : ""}`}
                  >
                    {proc.numero} - {proc.titulo || "Sem título"}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Cliente"
                placeholder="Vincular a um cliente (opcional)"
                selectedKeys={selectedClienteKeys}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];

                  setFormData({ ...formData, clienteId: value as string });
                }}
              >
                {(clientes || []).map((cli: any) => (
                  <SelectItem key={cli.id} textValue={cli.nome}>
                    {cli.nome}
                  </SelectItem>
                ))}
              </Select>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-semibold mb-3">📊 Quadro Kanban</p>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Board"
                    placeholder="Selecionar quadro"
                    selectedKeys={selectedBoardKeys}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0];

                      setFormData({
                        ...formData,
                        boardId: value as string,
                        columnId: "",
                      });
                    }}
                  >
                    {(boards || []).length > 0
                      ? (boards || []).map((b: any) => (
                          <SelectItem key={b.id} textValue={b.nome}>
                            {b.nome}
                          </SelectItem>
                        ))
                      : null}
                  </Select>

                  <Select
                    isDisabled={!formData.boardId}
                    label="Coluna"
                    placeholder="Selecionar coluna"
                    selectedKeys={selectedColunaKeys}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0];

                      setFormData({ ...formData, columnId: value as string });
                    }}
                  >
                    {(colunas || []).length > 0
                      ? (colunas || []).map((col: any) => (
                          <SelectItem key={col.id} textValue={col.nome}>
                            {col.nome}
                          </SelectItem>
                        ))
                      : null}
                  </Select>
                </div>
                <p className="text-xs text-default-400 mt-2">
                  💡 A tarefa será criada na coluna selecionada
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={salvando} onPress={handleSalvar}>
              Criar Tarefa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
