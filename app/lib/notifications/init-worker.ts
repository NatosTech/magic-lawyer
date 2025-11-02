/**
 * Inicialização automática do worker de notificações
 * Este módulo deve ser importado no startup da aplicação
 */

let workerInitialized = false;

/**
 * Inicializa o worker de notificações automaticamente
 * Apenas no servidor (não no cliente)
 */
export async function initNotificationWorker(): Promise<void> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    return; // Não executar no cliente
  }

  // Verificar se worker já foi iniciado
  if (workerInitialized) {
    return;
  }

  try {
    const { getNotificationWorker } = await import("./notification-worker");
    
    // Criar e iniciar worker (singleton)
    // O worker inicia automaticamente quando criado, mas garantimos que seja criado
    const worker = getNotificationWorker();
    
    // Marcar como inicializado
    workerInitialized = true;

    console.log("[NotificationWorker] ✅ Worker inicializado e pronto");
  } catch (error) {
    console.error("[NotificationWorker] ❌ Erro ao inicializar worker:", error);
    // Não falhar a aplicação se o worker não iniciar
    throw error;
  }
}

// Inicializar worker quando módulo for importado (apenas no servidor)
// Isso garante que o worker seja criado no startup da aplicação Next.js
if (typeof window === "undefined") {
  // Usar process.nextTick para garantir que a aplicação esteja pronta
  process.nextTick(() => {
    initNotificationWorker().catch((error) => {
      console.error("[NotificationWorker] Erro na inicialização automática:", error);
    });
  });
}
