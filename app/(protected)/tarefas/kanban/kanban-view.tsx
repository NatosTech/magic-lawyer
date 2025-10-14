"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Skeleton } from "@heroui/react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";

import { criarBoardPadrao } from "@/app/actions/boards";
import { moverTarefa } from "@/app/actions/tarefas";
import { title } from "@/components/primitives";
import { useKanban } from "@/app/hooks/use-kanban";
import { KanbanColumn } from "./components/kanban-column";
import { TarefaCard } from "./components/tarefa-card";
import { TarefaDetailModal } from "./components/tarefa-detail-modal";

export default function KanbanView() {
  const [boardSelecionadoId, setBoardSelecionadoId] = useState<string>("");
  const [tarefaSelecionada, setTarefaSelecionada] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [criandoBoard, setCriandoBoard] = useState(false);

  const { boards, board, tarefas, isLoading, refreshAll } = useKanban(boardSelecionadoId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimento antes de iniciar drag
      },
    })
  );

  // Selecionar primeiro board automaticamente
  useEffect(() => {
    if (boards.length > 0 && !boardSelecionadoId) {
      setBoardSelecionadoId(boards[0].id);
    }
  }, [boards, boardSelecionadoId]);

  // Organizar tarefas por coluna
  const tarefasPorColuna = useMemo(() => {
    const map = new Map<string, any[]>();

    board?.colunas?.forEach((col: any) => {
      map.set(col.id, []);
    });

    tarefas.forEach((tarefa: any) => {
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
    return tarefas.find((t: any) => t.id === activeId);
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

  if (boards.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <h1 className={title()}>Bem-vindo ao Kanban!</h1>
          <p className="text-default-500 text-center max-w-md">Você ainda não tem nenhum quadro Kanban. Crie seu primeiro quadro para começar a organizar suas tarefas visualmente.</p>
          <Button color="primary" size="lg" startContent={<Plus size={20} />} onPress={handleCriarBoardPadrao} isLoading={criandoBoard}>
            Criar Quadro Padrão
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className={title()}>Kanban</h1>
            <p className="text-default-500 text-lg">{board?.nome || "Carregando..."}</p>
          </div>
          <div className="flex gap-3">
            <Button as="a" href="/tarefas" color="default" variant="flat" size="lg">
              Ver Lista
            </Button>
            <Button color="primary" startContent={<Plus size={20} />} as="a" href="/tarefas" size="lg">
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Seletor de Board */}
        {boards.length > 1 && (
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-default-600">Quadro:</p>
            <Select className="max-w-sm" selectedKeys={boardSelecionadoId ? [boardSelecionadoId] : []} onChange={(e) => setBoardSelecionadoId(e.target.value)} size="md" variant="bordered">
              {boards.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.favorito ? "⭐ " : ""}
                  {b.nome}
                </SelectItem>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="bg-default-50/50 rounded-2xl p-6 border-2 border-default-100">
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-80">
                <Skeleton className="h-[600px] rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
              {board?.colunas?.map((coluna: any) => {
                const tarefasDaColuna = tarefasPorColuna.get(coluna.id) || [];

                return <KanbanColumn key={coluna.id} column={coluna} tarefas={tarefasDaColuna} onTarefaClick={(tarefa) => setTarefaSelecionada(tarefa)} />;
              })}
            </div>

            <DragOverlay>
              {activeId && tarefaAtiva ? (
                <div className="rotate-3 scale-105 opacity-90">
                  <TarefaCard tarefa={tarefaAtiva} isDragging />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modal de Detalhes */}
      {tarefaSelecionada && <TarefaDetailModal tarefa={tarefaSelecionada} isOpen={!!tarefaSelecionada} onClose={() => setTarefaSelecionada(null)} onUpdate={refreshAll} />}
    </div>
  );
}
