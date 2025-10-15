import { useCallback } from "react";
import useSWR from "swr";

import { getBoard, listBoards } from "@/app/actions/boards";
import { getTarefasPorBoard } from "@/app/actions/tarefas";

export function useKanban(boardId?: string | null) {
  const {
    data: boardsData,
    mutate: mutateBoards,
    isLoading: boardsLoading,
  } = useSWR("boards-kanban", () => listBoards({ ativo: true }));

  const boards = boardsData?.success ? boardsData.boards : [];

  const {
    data: boardData,
    mutate: mutateBoard,
    isLoading: boardLoading,
  } = useSWR(boardId ? ["board-detail", boardId] : null, () =>
    getBoard(boardId!),
  );

  const board = boardData?.success ? boardData.board : null;

  const {
    data: tarefasData,
    mutate: mutateTarefas,
    isLoading: tarefasLoading,
  } = useSWR(boardId ? ["board-tarefas", boardId] : null, () =>
    getTarefasPorBoard(boardId!),
  );

  const tarefas = tarefasData?.success ? tarefasData.tarefas : [];

  const refreshAll = useCallback(() => {
    mutateBoards();
    if (boardId) {
      mutateBoard();
      mutateTarefas();
    }
  }, [boardId, mutateBoards, mutateBoard, mutateTarefas]);

  return {
    boards,
    boardsLoading,
    board,
    boardLoading,
    tarefas,
    tarefasLoading,
    isLoading: boardsLoading || boardLoading || tarefasLoading,
    mutateBoards,
    mutateBoard,
    mutateTarefas,
    refreshAll,
  };
}
