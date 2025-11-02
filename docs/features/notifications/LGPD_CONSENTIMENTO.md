# 🔒 LGPD e Consentimento - Notificações

## Visão Geral

O sistema de notificações respeita a LGPD (Lei Geral de Proteção de Dados) através de:

1. **Consentimento por Evento**: Usuário pode habilitar/desabilitar notificações por tipo
2. **Canais Consentidos**: Usuário escolhe quais canais receber (In-app, Email, Push)
3. **Eventos Críticos**: Não podem ser desabilitados por questões de segurança
4. **Direito ao Esquecimento**: Notificações antigas são automaticamente removidas

## Consentimento por Evento

### Interface de Preferências

**Rota:** `/usuario/preferencias-notificacoes`

O usuário pode:

- ✅ Habilitar/desabilitar notificações por evento
- ✅ Escolher canais de entrega (REALTIME, EMAIL, PUSH)
- ✅ Ajustar urgência por evento

### Validação de Eventos Críticos

Eventos críticos não podem ser desabilitados:

```typescript
// app/actions/notifications.ts
if (!data.enabled && !NotificationPolicy.canDisableEvent(data.eventType)) {
  return {
    success: false,
    error: "Este evento é crítico e não pode ser desabilitado",
  };
}
```

**Eventos Críticos:**
- `prazo.expired`
- `prazo.expiring_2h`
- `prazo.expiring_1d`
- `pagamento.overdue`
- `pagamento.failed`
- `contrato.expired`
- `procuracao.expired`
- `sistema.critical_error`

## Canais Consentidos

O usuário escolhe quais canais deseja receber notificações:

- **REALTIME**: Notificações in-app via WebSocket
- **EMAIL**: Notificações por email
- **PUSH**: Notificações push (futuro)

**Validação:** Pelo menos um canal deve estar selecionado.

## Presets por Role (Futuro)

### Planejado

Presets pré-configurados por role para facilitar onboarding:

- **ADMIN**: Todos os eventos habilitados (canais: REALTIME + EMAIL)
- **ADVOGADO**: Eventos de processos, prazos, agenda (canais: REALTIME + EMAIL)
- **CLIENTE**: Eventos de contratos, pagamentos, documentos (canais: EMAIL)
- **FINANCEIRO**: Eventos financeiros apenas (canais: REALTIME + EMAIL)
- **SECRETARIA**: Eventos de agenda e processos (canais: REALTIME)

**Status:** ⏳ Pendente - Requer implementação de presets na criação de usuário

## Direito ao Esquecimento

### Retenção Automática

- Notificações antigas são removidas automaticamente após 90 dias
- Histórico pode ser limpo manualmente pelo usuário
- Dados agregados (estatísticas) são mantidos para relatórios

### Limpeza Manual

```typescript
// app/actions/notifications.ts
export async function clearAllNotifications() {
  // Remove todas as notificações do usuário
  await prisma.notificacaoUsuario.deleteMany({
    where: { usuarioId: userId },
  });
}
```

## Conformidade LGPD

### ✅ Implementado

- [x] Consentimento granular por evento
- [x] Escolha de canais de entrega
- [x] Proteção de eventos críticos
- [x] Limpeza automática de dados antigos
- [x] Interface de preferências do usuário

### ⏳ Pendente

- [ ] Presets por role na criação de usuário
- [ ] Política de privacidade específica para notificações
- [ ] Log de consentimentos para auditoria
- [ ] Exportação de dados de preferências (LGPD art. 18)

## Documentação Relacionada

- [Preferências de Notificações](../usuario/preferencias-notificacoes)
- [Event Catalog](NOTIFICATIONS_EVENT_CATALOG.md)
- [Notification Policy](../lib/notifications/domain/notification-policy.ts)

---

**Última atualização**: 01/11/2024

