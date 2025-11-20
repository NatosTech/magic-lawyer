# 📊 Métricas e Observabilidade de Notificações

## Visão Geral

O sistema de notificações possui endpoint de métricas para monitoramento de saúde e performance da fila de notificações.

## Endpoint de Métricas

**URL:** `/api/internal/notifications/metrics`  
**Método:** `GET`  
**Autenticação:** Requer role `ADMIN` ou `SUPER_ADMIN`

### Resposta

```json
{
  "success": true,
  "metrics": {
    "overview": {
      "total": 1234,
      "pending": 45,
      "sent": 1150,
      "failed": 39,
      "recent24h": 156,
      "queueSize": 0,
      "successRate": "96.69%"
    },
    "byChannel": [
      { "channel": "REALTIME", "count": 890 },
      { "channel": "EMAIL", "count": 260 }
    ],
    "byType": [
      { "type": "prazo.expiring_1d", "count": 45 },
      { "type": "pagamento.paid", "count": 32 }
    ],
    "timestamp": "2024-11-01T10:30:00.000Z"
  }
}
```

## Métricas Disponíveis

### Overview Geral

- **total**: Total de notificações criadas (todas ou do tenant)
- **pending**: Notificações criadas mas ainda não enviadas
- **sent**: Notificações enviadas com sucesso
- **failed**: Notificações que falharam no envio
- **recent24h**: Notificações criadas nas últimas 24 horas
- **queueSize**: Tamanho estimado da fila BullMQ (preparado para integração futura)
- **successRate**: Taxa de sucesso calculada: `(sent / (sent + failed)) * 100`

### Por Canal

Distribuição de entregas por canal nas últimas 24 horas:
- `REALTIME`: Notificações in-app via WebSocket
- `EMAIL`: Notificações por email
- `PUSH`: Notificações push (futuro)

### Por Tipo de Evento

Contagem de notificações criadas nas últimas 24 horas agrupadas por tipo:
- Exemplos: `prazo.expiring_1d`, `pagamento.paid`, `contrato.expired`, etc.

## Como Usar

### Via cURL

```bash
curl -X GET "http://localhost:9192/api/internal/notifications/metrics" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Via Dashboard Admin (Futuro)

Endpoint preparado para integração com dashboard de métricas na área administrativa.

## Alertas Recomendados

Com base nas métricas, recomenda-se configurar alertas para:

1. **Taxa de Falha Alta**: Se `successRate < 95%`, investigar problemas de entrega
2. **Fila Crescente**: Se `queueSize > 100`, verificar processamento BullMQ
3. **Pendências Críticas**: Se `pending > 50` por mais de 1 hora, verificar workers
4. **Falhas Recentes**: Se `failed > 10` nas últimas 24h, investigar provedores (Ably, Resend)

## Integração com BullMQ Dashboard (Futuro)

O campo `queueSize` está preparado para integração com dashboard do BullMQ quando disponível:

```typescript
// Exemplo futuro
import { Queue } from "bullmq";
const queueSize = await queue.getWaitingCount();
```

## Logs Estruturados

As métricas são complementadas por logs estruturados no formato:

```
[NotificationService] Event publicado: { type, tenantId, userId }
[NotificationQueue] Job adicionado: { jobId, type, priority }
[NotificationDelivery] Entrega registrada: { notificationId, channel, status }
```

---

**Última atualização**: 01/11/2024











