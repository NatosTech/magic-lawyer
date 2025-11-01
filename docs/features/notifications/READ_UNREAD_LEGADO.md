# 📖 Rastreio Read/Unread - Sistema Legado e Novo

## Visão Geral

O sistema possui duas tabelas relacionadas a notificações:

1. **`Notificacao`** (Sistema Legado): Tabela antiga com campo `lidoEm`
2. **`Notification`** (Sistema Novo): Tabela nova com campos `readAt` e delivery status

## Fluxo de Rastreio

### Sistema Novo (Recomendado)

O sistema novo usa a tabela `Notification` com:

- **Campo `readAt`**: Timestamp quando a notificação foi marcada como lida
- **Campo `deliveryStatus`**: Status da entrega por canal (`PENDING`, `SENT`, `READ`, `FAILED`)

**Server Actions:**
- `markNewNotificationAsRead(notificationId)` - Marca como lida
- `markNewNotificationAsUnread(notificationId)` - Marca como não lida

**Localização:** `app/actions/notifications.ts`

### Sistema Legado (Compatibilidade)

O sistema legado usa a tabela `NotificacaoUsuario` com:

- **Campo `lidoEm`**: Timestamp quando a notificação foi lida
- **Campo `status`**: `"NAO_LIDA"` | `"LIDA"` | `"ARQUIVADA"`

**Server Actions:**
- `setNotificationStatus(id, status)` - Atualiza status da notificação
- `markAllNotificationsAsRead()` - Marca todas como lidas
- `clearAllNotifications()` - Limpa todas as notificações

**Localização:** `app/actions/notificacoes.ts`

## Migração e Compatibilidade

### Leitura Unificada

O hook `useNotifications` lê de ambos os sistemas:

```typescript
// app/hooks/use-notifications.ts
const notifications = data?.notifications.map((item) => ({
  // ... mapeia campos de ambos os sistemas
  lidoEm: item.lidoEm ?? null,
  status: item.status as NotificationStatus,
}));
```

### Histórico Antigo

Notificações legadas (`NotificacaoUsuario`) também são suportadas e respeitam marcações:

- ✅ Sistema novo marca `Notification.readAt`
- ✅ Sistema legado marca `NotificacaoUsuario.lidoEm`
- ✅ Ambos são lidos pelo hook `useNotifications`

## Garantia de Funcionamento

### Verificação

1. **Notificações novas**: Usam `Notification` e são marcadas via `markNewNotificationAsRead`
2. **Notificações legadas**: Continuam funcionando via `setNotificationStatus`
3. **Leitura unificada**: Hook `useNotifications` retorna ambos os tipos

### Testes

```bash
# Testar marcação de leitura
npm run notifications:smoke
```

## Status do Checklist

⚠️ **Etapa 3 - Item de Read/Unread**: Sistema funcional, mas documentação formal pendente

**Nota**: O sistema está funcionando para ambos os tipos de notificação. A documentação garante que desenvolvedores entendam a compatibilidade.

---

**Última atualização**: 01/11/2024

