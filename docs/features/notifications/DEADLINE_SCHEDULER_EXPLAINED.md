# 🕐 Deadline Scheduler - Explicação Simples

## O que é "Deadline"?

**Deadline** = **Prazo** (em português)

No contexto jurídico, são datas importantes que não podem ser perdidas:
- ✅ Prazo para apresentar defesa (ex: 15 dias)
- ✅ Prazo para recorrer (ex: 15 dias)
- ✅ Prazo para apresentar documentos (ex: 10 dias)
- ✅ Prazo para pagar custas (ex: 5 dias)

**Exemplo prático:**
```
Um processo tem um prazo que vence em 30/01/2025.
Se o advogado perder esse prazo, pode prejudicar o cliente!
```

---

## O que é "Scheduler"?

**Scheduler** = **Agendador** / **Programador**

É um sistema que executa tarefas automaticamente em horários definidos.

**Exemplo da vida real:**
- ⏰ Despertador no celular (acorda você todo dia às 7h)
- 📅 Lembrete no Google Calendar (avisa 1 hora antes da reunião)
- 🔔 Notificação do WhatsApp (aparece quando chega mensagem)

**No nosso caso:**
- ⏰ Todo dia às 8:00 UTC (5:00 da manhã no Brasil), o sistema verifica automaticamente quais prazos estão vencendo

---

## O que faz o DeadlineSchedulerService?

É um **robô automático** que todo dia:
1. 🔍 **Procura** prazos que estão perto de vencer
2. 📢 **Avisa** os advogados sobre esses prazos
3. ⚠️ **Alerta** quando um prazo já venceu

### Como funciona na prática:

**Cenário Real:**
```
Advogado João tem um processo com prazo que vence em 05/02/2025.

📅 D-7 (7 dias antes): Sistema avisa "João, falta 7 dias!"
   → João recebe notificação no app e email

📅 D-3 (3 dias antes): Sistema avisa "João, falta 3 dias!"
   → João recebe notificação no app e email

📅 D-1 (1 dia antes): Sistema avisa "João, falta 1 dia! URGENTE!"
   → João recebe notificação no app e email

📅 H-2 (2 horas antes): Sistema avisa "João, falta 2 horas! CRÍTICO!"
   → João recebe notificação no app e email (obrigatório)

📅 Vencido: Sistema avisa "João, o prazo VENCEU!"
   → João recebe notificação no app e email (obrigatório)
```

---

## Por que isso é importante?

### ⚠️ **Problema sem o sistema:**
```
Advogado esquece de checar manualmente os prazos
↓
Prazo vence sem o advogado saber
↓
Cliente é prejudicado
↓
Escritório pode ter problemas legais
```

### ✅ **Solução com o DeadlineScheduler:**
```
Sistema avisa automaticamente 7 dias antes
↓
Advogado tem tempo de se preparar
↓
Sistema avisa novamente 3 dias, 1 dia e 2 horas antes
↓
Advogado nunca perde um prazo
↓
Cliente está protegido
```

---

## Detalhes Técnicos (Opcional)

### Quando o sistema verifica?

**Todo dia às 8:00 UTC** (automaticamente via cron job)

### O que ele procura?

1. **Prazos que expiram em 7 dias** → Aviso inicial
2. **Prazos que expiram em 3 dias** → Aviso de atenção
3. **Prazos que expiram em 1 dia** → Aviso urgente
4. **Prazos que expiram em 2 horas** → Aviso crítico
5. **Prazos já vencidos** → Aviso de atraso

### Quem recebe as notificações?

- **Advogado responsável** pelo processo
- **Administrador** do escritório (tenant)
- Todos com permissão para ver o processo

### Onde as notificações aparecem?

1. **Notificação no app** (em tempo real via Ably)
2. **Email** (para garantir que não perde)

---

## Exemplo Completo

### Situação:
```
Processo: "1234567-89.2024.8.05.0001"
Cliente: "João Silva"
Prazo: "Apresentar Defesa"
Data de Vencimento: 15/02/2025
Advogado Responsável: "Maria Santos"
```

### O que acontece automaticamente:

**08/02/2025 às 8:00** (7 dias antes):
```
🟡 Notificação: "Prazo 'Apresentar Defesa' do processo 
   1234567-89.2024.8.05.0001 expira em 7 dias"
📧 Email enviado para maria@escritorio.com
```

**12/02/2025 às 8:00** (3 dias antes):
```
🟠 Notificação: "Prazo 'Apresentar Defesa' do processo 
   1234567-89.2024.8.05.0001 expira em 3 dias"
📧 Email enviado para maria@escritorio.com
```

**14/02/2025 às 8:00** (1 dia antes):
```
🔴 Notificação: "URGENTE: Prazo 'Apresentar Defesa' do processo 
   1234567-89.2024.8.05.0001 expira em 1 dia"
📧 Email enviado para maria@escritorio.com
```

**15/02/2025 às 6:00** (2 horas antes):
```
🆘 Notificação: "CRÍTICO: Prazo 'Apresentar Defesa' do processo 
   1234567-89.2024.8.05.0001 expira em 2 horas"
📧 Email enviado para maria@escritorio.com
```

**15/02/2025 às 8:01** (após vencer):
```
⚠️ Notificação: "ATENÇÃO: Prazo 'Apresentar Defesa' do processo 
   1234567-89.2024.8.05.0001 VENCEU"
📧 Email enviado para maria@escritorio.com
```

---

## Resumo Simples

### Em uma frase:
> **"É um sistema que avisa os advogados automaticamente quando um prazo está perto de vencer, para evitar que eles esqueçam e percam o prazo."**

### Analogia:
> É como um **despertador inteligente** que:
> - Toca 7 dias antes
> - Toca 3 dias antes  
> - Toca 1 dia antes
> - Toca 2 horas antes
> - E toca quando já passou

### Benefícios:
1. ✅ **Nunca perde um prazo** (sistema avisa várias vezes)
2. ✅ **Tempo para se preparar** (avisos com antecedência)
3. ✅ **Proteção do cliente** (advogado sempre informado)
4. ✅ **Menos stress** (sistema cuida dos lembretes)
5. ✅ **Profissionalismo** (escritório organizado)

---

## Perguntas Frequentes

### ❓ O sistema realmente funciona sozinho?
**Sim!** Uma vez configurado, ele roda automaticamente todo dia sem intervenção manual.

### ❓ E se houver muitos prazos?
O sistema processa todos eles automaticamente. Não há limite.

### ❓ E se o advogado não ver a notificação?
Ele também recebe por **email**, então mesmo que não abra o app, vai ver no email.

### ❓ Quanto custa?
É gratuito! Faz parte do sistema Magic Lawyer.

### ❓ Precisa instalar algo?
Não! Já está integrado no sistema. Funciona automaticamente.

---

## Onde está no código?

- **Serviço**: `app/lib/notifications/services/deadline-scheduler.ts`
- **Cron Job**: `app/api/cron/check-deadlines/route.ts`
- **Configuração**: `vercel.json` (define quando executa)

---

## Conclusão

O **Deadline Scheduler** é uma funcionalidade essencial que protege o escritório e os clientes, avisando automaticamente sobre prazos importantes antes que expirem.

É como ter um **assistente virtual** que nunca esquece de checar os prazos! 🤖⚖️

