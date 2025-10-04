# 🤖 Instruções para IA - Magic Lawyer

Este documento contém diretrizes específicas para desenvolvimento no projeto Magic Lawyer.

## 🎯 **REGRA FUNDAMENTAL: Sempre Use Tipos do Prisma**

### ❌ **NUNCA faça isso:**
```typescript
// Interface customizada - EVITAR
interface EventoFormData {
  titulo: string;
  descricao?: string;
  tipo: "REUNIAO" | "AUDIENCIA";
  // ... mais campos
}
```

### ✅ **SEMPRE faça isso:**
```typescript
// Tipos do Prisma - PREFERIR
import type { Evento, EventoTipo, EventoStatus } from "@/app/generated/prisma";

// Para formulários (sem campos auto-gerados)
export type EventoFormData = Omit<Evento, "id" | "tenantId" | "criadoPorId" | "createdAt" | "updatedAt"> & {
  dataInicio: string; // String para o formulário, será convertido para Date
  dataFim: string;    // String para o formulário, será convertido para Date
};
```

## 📅 **REGRA FUNDAMENTAL: Use Day.js para Datas**

### ❌ **NUNCA faça isso:**
```typescript
// Date nativo - EVITAR
const data = new Date(evento.dataInicio);
const formatada = data.toLocaleDateString("pt-BR");
const hora = data.toLocaleTimeString("pt-BR");
```

### ✅ **SEMPRE faça isso:**
```typescript
// DateUtils - PREFERIR
import { DateUtils } from "@/app/lib/date-utils";

const dataFormatada = DateUtils.formatDate(evento.dataInicio);
const horaFormatada = DateUtils.formatTime(evento.dataInicio);
const dataLonga = DateUtils.formatDateLong(evento.dataInicio);
const isToday = DateUtils.isToday(evento.dataInicio);
const calendarDate = DateUtils.fromCalendarDate(selectedDate);
```

### 🎯 **Por que usar Day.js?**
- ✅ **Performance**: Muito mais rápido que Moment.js
- ✅ **Imutabilidade**: Objetos não são mutados
- ✅ **API Consistente**: Métodos padronizados
- ✅ **Localização**: Suporte completo ao português
- ✅ **Plugins**: Extensões para timezone, UTC, etc.

## 🏗️ **Arquitetura do Projeto**

### **Stack Principal:**
- **Next.js 14+** com App Router
- **Prisma** + PostgreSQL
- **HeroUI** + Tailwind CSS
- **SWR** para dados client-side
- **NextAuth.js v5** para autenticação

### **Estrutura Multi-Tenant:**
- Banco único com `tenant_id` em todas as tabelas
- Isolamento lógico por tenant
- Suporte a branding personalizado por escritório

### **🎯 Regras de Negócio Fundamentais:**

#### **Hierarquia de Usuários:**
```
SUPER_ADMIN (Sistema)
├── ADMIN (Escritório) - Acesso total
├── ADVOGADO - Seus clientes e processos
├── SECRETARIA - Agenda operacional
├── FINANCEIRO - Módulo financeiro
└── CLIENTE - Apenas seus dados
```

#### **Sistema Financeiro:**
- **Cliente**: Vê o que deve pagar (faturas em aberto)
- **Advogado**: Vê o que deve receber (comissões)
- **Escritório**: Controle total (receitas, despesas, comissões)

#### **Sistema de Agenda:**
- **Admin**: Todos os eventos do escritório
- **Advogado**: Seus eventos e clientes
- **Secretaria**: Agenda operacional (organização)
- **Cliente**: Apenas eventos do seu processo

> **📖 Documentação Completa**: Consulte **[BUSINESS_RULES.md](BUSINESS_RULES.md)** para regras detalhadas.

## 📁 **Estrutura de Arquivos**

```
app/
├── (protected)/          # Rotas protegidas
├── (public)/            # Rotas públicas
├── actions/             # Server Actions do Next.js
├── hooks/               # Hooks customizados (SWR)
├── lib/                 # Utilitários e configurações
└── generated/prisma/    # Cliente Prisma gerado

components/
├── primitives.ts        # Componentes base (shadcn-style)
└── ...                  # Componentes específicos

prisma/
├── schema.prisma        # Schema do banco
├── migrations/          # Migrações
└── seeds/              # Dados de exemplo
```

## 🔧 **Padrões de Desenvolvimento**

### **1. Server Actions (Backend)**
```typescript
// app/actions/eventos.ts
import { prisma } from "@/app/lib/prisma";
import type { Evento } from "@/app/generated/prisma";

export async function createEvento(data: EventoFormData) {
  // Sempre use tipos do Prisma
  // Validação manual (sem Zod)
  // Tratamento de erros específicos do Prisma
}
```

### **2. Hooks SWR (Frontend)**
```typescript
// app/hooks/use-eventos.ts
import useSWR from "swr";
import { getEventos } from "@/app/actions/eventos";

export function useEventos(filters?: EventoFilters) {
  const { data, error, isLoading, mutate } = useSWR(
    ["eventos", filters], 
    () => getEventos(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
    }
  );

  return { eventos: data?.success ? data.data : undefined, isLoading, error, mutate };
}
```

### **3. Componentes React**
```typescript
// components/evento-form.tsx
import { Modal, Input, Select } from "@heroui/react";
import { useEventos } from "@/app/hooks/use-eventos";
import { createEvento } from "@/app/actions/eventos";

export default function EventoForm() {
  // Use SWR para dados
  // Use Server Actions para mutations
  // Validação client-side + server-side
}
```

## 🎨 **UI/UX Guidelines**

### **HeroUI + Tailwind:**
- Use componentes do HeroUI sempre que possível
- Customize com Tailwind CSS
- Mantenha consistência visual
- Responsive design obrigatório

### **Validação de Formulários:**
- Validação client-side para UX
- Validação server-side para segurança
- Mensagens de erro claras e específicas
- Campos obrigatórios marcados visualmente

## 🗄️ **Banco de Dados**

### **Prisma Schema:**
- Sempre use `tenantId` em todas as tabelas
- Relacionamentos bem definidos
- Enums para valores fixos
- Campos de auditoria (`createdAt`, `updatedAt`)

### **Migrações:**
```bash
npx prisma migrate dev
npx prisma db seed
```

### **Seeds:**
- Dados de exemplo para desenvolvimento
- Tenants de teste (Sandra, Salba)
- Usuários, clientes, processos

## 🔐 **Autenticação**

### **NextAuth.js v5:**
- Configuração em `auth.ts`
- Rota em `app/api/auth/[...nextauth]/route.ts`
- Middleware para proteção de rotas
- Suporte a múltiplos providers

### **Proteção de Rotas:**
```typescript
// middleware.ts
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
```

## 📧 **Integrações Externas**

### **Email (Nodemailer):**
- Configuração SMTP via env vars
- Templates personalizados
- Suporte a Gmail, Outlook, etc.

### **Google Calendar:**
- OAuth2 para autenticação
- Sincronização bidirecional
- Múltiplos calendários

### **ClickSign:**
- API para assinatura digital
- Sandbox e produção
- Webhooks para status

## 🚀 **Comandos Úteis**

```bash
# Desenvolvimento
npm run dev

# Banco de dados
npx prisma migrate dev
npx prisma db seed
npx prisma studio

# Build
npm run build
npm start

# Docker
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## ⚠️ **Armadilhas Comuns**

### **1. Não use interfaces customizadas**
- Sempre prefira tipos do Prisma
- Use `Omit<>` ou `Pick<>` para adaptar

### **2. Não use useEffect para dados**
- Prefira SWR para dados client-side
- Server Actions para mutations

### **3. Não esqueça do tenant_id**
- Todas as queries devem filtrar por tenant
- Middleware garante isolamento

### **4. Não use Zod desnecessariamente**
- Validação manual é mais simples
- Menos dependências

## 🎯 **Checklist de Desenvolvimento**

- [ ] Usar tipos do Prisma
- [ ] Implementar validação client + server
- [ ] Tratar erros específicos do Prisma
- [ ] Usar SWR para dados
- [ ] Usar Server Actions para mutations
- [ ] Testar com dados de seed
- [ ] Verificar responsividade
- [ ] Documentar funcionalidades

## 📚 **Recursos Adicionais**

- [README.md](./README.md) - Documentação completa
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Guia de desenvolvimento
- [prisma/schema.prisma](./prisma/schema.prisma) - Schema do banco
- [auth.ts](./auth.ts) - Configuração de autenticação

---

**Lembre-se**: Sempre prefira simplicidade e consistência. Use as ferramentas certas para cada tarefa e mantenha o código limpo e bem documentado.
