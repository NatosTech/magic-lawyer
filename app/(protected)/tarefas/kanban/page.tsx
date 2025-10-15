import { Metadata } from "next";

import KanbanView from "./kanban-view";

export const metadata: Metadata = {
  title: "Kanban - Tarefas",
  description:
    "Visualização em quadros para gerenciamento de tarefas e atividades.",
};

export default function KanbanPage() {
  return <KanbanView />;
}
