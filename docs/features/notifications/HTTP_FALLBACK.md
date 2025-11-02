# 🔄 Fallback HTTP/Polling para Notificações

## Visão Geral

O sistema de notificações usa WebSocket (Ably) como canal principal para entrega em tempo real. Quando o WebSocket não está disponível ou desconectado, o sistema automaticamente faz fallback para polling HTTP.

## Como Funciona

### 1. Detecção de Conexão

O hook `useNotifications` detecta automaticamente o status da conexão Ably através do `RealtimeProvider`:

```typescript
const { isConnected } = useRealtime();
```

### 2. Polling Dinâmico

- **Com WebSocket conectado**: Polling padrão (60s ou customizado)
- **Sem WebSocket**: Polling mais frequente (30s) para garantir entrega rápida

### 3. Implementação

```typescript
// app/hooks/use-notifications.ts
useEffect(() => {
  if (!isConnected) {
    setPollingInterval(30000); // 30 segundos (fallback HTTP)
  } else {
    setPollingInterval(refreshInterval); // Intervalo padrão
  }
}, [isConnected, refreshInterval]);
```

## Configuração

### Opções do Hook

```typescript
const { notifications, unreadCount } = useNotifications({
  limit: 50,              // Limite de notificações
  refreshInterval: 60000,  // Intervalo padrão (60s)
  enablePolling: true,     // Habilitar polling automático
});
```

### Desabilitar Polling

```typescript
const { notifications } = useNotifications({
  enablePolling: false, // Polling apenas manual (via mutate)
});
```

## Invalidar Cache via HTTP

Quando o Ably falha ao publicar, o sistema automaticamente invalida o cache via HTTP:

```typescript
// app/lib/realtime/publisher.ts
async function fallbackToHttp(event: RealtimeEvent) {
  await fetch("/api/internal/realtime/invalidate", {
    method: "POST",
    headers: {
      "x-internal-token": process.env.REALTIME_INTERNAL_TOKEN,
    },
    body: JSON.stringify(event),
  });
}
```

Isso força o SWR a revalidar automaticamente nas próximas requisições.

## Status do Checklist

✅ **Etapa 2 - Item 41-42**: Fallback HTTP implementado com polling de 30s quando Ably falha

---

**Última atualização**: 01/11/2024

