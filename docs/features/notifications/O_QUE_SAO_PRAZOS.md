# ⚖️ O que são os Prazos no Magic Lawyer?

## 📍 Onde estão os prazos?

Os prazos estão armazenados no **banco de dados PostgreSQL**, na tabela `ProcessoPrazo` (schema `magiclawyer`).

**Estrutura no banco:**
```sql
ProcessoPrazo
├── id (UUID único)
├── tenantId (qual escritório)
├── processoId (qual processo)
├── titulo (ex: "Apresentar Defesa")
├── descricao (detalhes do prazo)
├── fundamentoLegal (lei que determina o prazo)
├── status (ABERTO, CONCLUIDO, PRORROGADO, CANCELADO)
├── dataVencimento (📅 data que o prazo vence)
├── dataCumprimento (quando foi cumprido, se já foi)
├── responsavelId (qual advogado é responsável)
└── ... outros campos
```

**Relacionamentos:**
- ✅ Cada prazo pertence a **UM processo**
- ✅ Cada processo pode ter **VÁRIOS prazos**
- ✅ Cada prazo tem **UM advogado responsável**

---

## ⚖️ O que são esses prazos? (Contexto Jurídico)

No mundo jurídico, **prazos** são datas importantes que o advogado precisa cumprir. São obrigatórios e não podem ser perdidos!

### Exemplos reais de prazos:

#### 1. **Prazo para Apresentar Defesa**
```
📋 Título: "Apresentar Defesa Inicial"
📅 Vence em: 15/02/2025
👤 Responsável: Advogado Maria
📄 Fundamentação: Art. 335, CPC
```
**O que significa:** O advogado precisa entregar a defesa até 15/02, senão o cliente pode ser prejudicado.

#### 2. **Prazo para Recorrer**
```
📋 Título: "Recurso de Apelação"
📅 Vence em: 20/03/2025
👤 Responsável: Advogado João
📄 Fundamentação: Art. 1.006, CPC
```
**O que significa:** Se o juiz deu uma decisão desfavorável, o advogado tem até 20/03 para recorrer.

#### 3. **Prazo para Apresentar Documentos**
```
📋 Título: "Comprovar Renda"
📅 Vence em: 10/02/2025
👤 Responsável: Advogado Pedro
📄 Fundamentação: Determinação judicial
```
**O que significa:** O juiz pediu documentos e o advogado tem até 10/02 para entregar.

#### 4. **Prazo para Pagar Custas**
```
📋 Título: "Pagamento de Custas Processuais"
📅 Vence em: 05/02/2025
👤 Responsável: Advogado Ana
📄 Fundamentação: Art. 98, CPC
```
**O que significa:** Precisa pagar taxas do processo até 05/02, senão o processo pode ser extinto.

---

## 🎯 Como são criados no sistema?

### Opção 1: Criar Manualmente

1. **Acesse um processo** específico (ex: `/processos/abc123`)
2. **Vá na aba "Prazos"**
3. **Clique em "Novo Prazo"**
4. **Preencha:**
   - Título (ex: "Apresentar Defesa")
   - Data de Vencimento
   - Descrição (opcional)
   - Fundamentação Legal (opcional)
   - Responsável (advogado)

### Opção 2: Criados Automaticamente

Alguns prazos podem ser criados automaticamente quando:
- 📄 Uma movimentação do processo acontece
- 📋 Uma diligência é criada
- ⚖️ Uma causa processual é vinculada

---

## 📊 Onde ver os prazos?

### 1. **Na página do Processo**
```
/processos/[processoId]
└── Aba "Prazos"
    ├── Lista de todos os prazos
    ├── Status de cada prazo
    └── Botões para criar/editar
```

### 2. **No Dashboard**
- Prazos próximos de vencer aparecem como **alertas**
- Podem ter um **filtro** por status (aberto, concluído, etc.)

### 3. **Nas Notificações**
- Sistema avisa quando um prazo está próximo de vencer
- Email e notificação no app

---

## 🔍 Exemplo Prático Completo

### Situação Real:

**Processo:** "1234567-89.2024.8.05.0001"  
**Cliente:** "João Silva"  
**Advogado Responsável:** "Maria Santos"

**Movimentação do Tribunal:**
> "Intime-se o réu para apresentar defesa no prazo de 15 dias."

### O que acontece no sistema:

**1. Advogado cria o prazo:**
```javascript
{
  titulo: "Apresentar Defesa Inicial",
  dataVencimento: "2025-02-15T23:59:59",
  descricao: "Prazo estabelecido na intimação recebida em 01/02/2025",
  fundamentoLegal: "Art. 335, CPC - 15 dias úteis",
  responsavelId: "advogado-maria-id",
  processoId: "processo-abc123",
  status: "ABERTO"
}
```

**2. Sistema salva no banco:**
```sql
INSERT INTO "magiclawyer"."ProcessoPrazo" (
  id, tenantId, processoId, titulo, dataVencimento, status
) VALUES (
  'prazo-xyz789',
  'tenant-123',
  'processo-abc123',
  'Apresentar Defesa Inicial',
  '2025-02-15T23:59:59',
  'ABERTO'
);
```

**3. Deadline Scheduler verifica automaticamente:**
- ✅ 08/02 (7 dias antes) → Notifica Maria
- ✅ 12/02 (3 dias antes) → Notifica Maria
- ✅ 14/02 (1 dia antes) → Notifica Maria
- ✅ 15/02 às 6h (2 horas antes) → Notifica Maria urgentemente
- ✅ 15/02 após vencer → Notifica Maria que venceu

---

## 📋 Status dos Prazos

### **ABERTO** 🟡
- Prazo ainda não venceu
- Advogado ainda precisa cumprir
- **Este é o status que o Deadline Scheduler procura!**

### **CONCLUIDO** ✅
- Prazo foi cumprido
- Advogado já fez o que precisava
- Sistema não notifica mais (já foi resolvido)

### **PRORROGADO** 🔄
- Prazo foi estendido
- Nova data de vencimento foi definida
- Sistema passa a monitorar a nova data

### **CANCELADO** ❌
- Prazo foi cancelado
- Não precisa mais ser cumprido
- Sistema não monitora

---

## 🎯 Resumo Visual

```
PROCESSO JURÍDICO
│
├── Cliente: João Silva
├── Número: 1234567-89.2024.8.05.0001
├── Advogado: Maria Santos
│
└── PRAZOS (vários):
    │
    ├── 📅 Prazo 1: "Apresentar Defesa"
    │   └── Vence: 15/02/2025
    │   └── Status: ABERTO 🟡
    │
    ├── 📅 Prazo 2: "Pagamento de Custas"
    │   └── Vence: 10/02/2025
    │   └── Status: ABERTO 🟡
    │
    └── 📅 Prazo 3: "Apresentar Documentos"
        └── Vence: 05/02/2025
        └── Status: CONCLUIDO ✅
```

---

## 🔗 Resumo Técnico

### **Onde está no código?**

**Banco de Dados (Prisma):**
```prisma
model ProcessoPrazo {
  id             String
  processoId     String  // Relaciona com Processo
  titulo         String
  dataVencimento  DateTime  // ⚠️ Data que o Deadline Scheduler verifica
  status         ProcessoPrazoStatus  // ABERTO, CONCLUIDO, etc.
  responsavelId  String?  // Qual advogado é responsável
  // ...
}
```

**Arquivo:** `prisma/schema.prisma` (linha 819)

**Ações/Criação:**
- `app/actions/processos.ts` → Funções `createProcessoPrazo`, `updateProcessoPrazo`
- `app/(protected)/processos/[processoId]/page.tsx` → Interface para criar/gerenciar

**Sistema de Notificações:**
- `app/lib/notifications/services/deadline-scheduler.ts` → Busca prazos próximos e avisa

---

## 💡 Por que isso é importante?

### ❌ **Sem o sistema:**
```
Advogado precisa lembrar manualmente de cada prazo
↓
Esquece de checar diariamente
↓
Perde um prazo importante
↓
Cliente é prejudicado
↓
Escritório pode ter problemas legais
```

### ✅ **Com o Deadline Scheduler:**
```
Sistema verifica automaticamente todo dia
↓
Avisa o advogado 7 dias, 3 dias, 1 dia e 2 horas antes
↓
Advogado nunca esquece
↓
Cliente está protegido
↓
Escritório profissional e organizado
```

---

## 🎓 Analogia Final

Os **prazos** são como **compromissos importantes** no calendário do advogado:

- 📅 **Data de vencimento** = Quando precisa fazer
- 👤 **Responsável** = Quem precisa fazer
- ⚖️ **Processo vinculado** = Onde precisa fazer
- 🔔 **Deadline Scheduler** = Sistema que avisa com antecedência

É como ter um **assistente** que:
1. ✅ Conhece todos os seus compromissos
2. ✅ Avisa você com antecedência
3. ✅ Lembra várias vezes
4. ✅ Nunca deixa você esquecer

---

**Conclusão:** Os prazos são **obrigações jurídicas com datas específicas** que o advogado precisa cumprir. O Deadline Scheduler existe para garantir que nenhum prazo seja esquecido! ⚖️📅

