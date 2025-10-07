# 📊 Schema de Auditoria - Magic Lawyer

## 🎯 Visão Geral

O sistema Magic Lawyer implementa um **schema separado e isolado** para logs de auditoria, garantindo:

- ✅ **Segurança**: Dados de auditoria completamente isolados
- ✅ **Compliance**: LGPD, OAB e regulamentações jurídicas
- ✅ **Performance**: Queries de auditoria não impactam operações
- ✅ **Escalabilidade**: Crescimento ilimitado sem afetar o sistema
- ✅ **Imutabilidade**: Logs não podem ser editados ou deletados

---

## 🏗️ Arquitetura

### Estrutura de Schemas

```
PostgreSQL Database
├── magiclawyer (schema)    # Dados operacionais
│   ├── Tenant
│   ├── Usuario
│   ├── Cliente
│   ├── Processo
│   └── ... (outros modelos)
│
├── support (schema)         # Dados de suporte
│   ├── SuperAdmin
│   └── Ticket
│
└── audit (schema)           # ⭐ LOGS DE AUDITORIA (ISOLADO)
    └── AuditLog
        ├── Totalmente separado
        ├── Acesso restrito
        └── Imutável
```

---

## 📋 Modelo AuditLog

### Schema Prisma

```prisma
model AuditLog {
  id             String   @id @default(cuid())
  tenantId       String   // Sempre filtrar por tenant
  usuarioId      String?  // Quem realizou a ação
  acao           String   // Ex: "RESET_SENHA_CLIENTE", "CREATE_PROCESSO"
  entidade       String   // Ex: "Usuario", "Cliente", "Processo"
  entidadeId     String?  // ID da entidade afetada
  dados          Json?    // Dados relevantes da ação
  previousValues Json?    // Valores anteriores (updates)
  changedFields  String[] // Campos alterados
  ip             String?  // IP do usuário
  userAgent      String?  // Navegador/dispositivo
  createdAt      DateTime @default(now())
  
  // Relações (cross-schema)
  tenant         Tenant   @relation(fields: [tenantId], references: [id])
  usuario        Usuario? @relation(fields: [usuarioId], references: [id])

  // Índices otimizados para queries de auditoria
  @@index([tenantId, entidade])
  @@index([tenantId, createdAt])
  @@index([tenantId, usuarioId])
  @@index([tenantId, acao])
  @@index([tenantId, entidade, entidadeId])
  @@map("audit_logs")
  @@schema("audit")
}
```

### Tabela SQL Gerada

```sql
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.audit_logs (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  usuario_id      TEXT,
  acao            TEXT NOT NULL,
  entidade        TEXT NOT NULL,
  entidade_id     TEXT,
  dados           JSONB,
  previous_values JSONB,
  changed_fields  TEXT[],
  ip              TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_audit_tenant_entidade ON audit.audit_logs(tenant_id, entidade);
CREATE INDEX idx_audit_tenant_created ON audit.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_tenant_usuario ON audit.audit_logs(tenant_id, usuario_id);
CREATE INDEX idx_audit_tenant_acao ON audit.audit_logs(tenant_id, acao);
CREATE INDEX idx_audit_tenant_entidade_id ON audit.audit_logs(tenant_id, entidade, entidade_id);
```

---

## 🔐 Políticas de Segurança

### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Isolamento por Tenant
CREATE POLICY audit_tenant_isolation ON audit.audit_logs
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id')::text);

-- Política: Apenas INSERT permitido
CREATE POLICY audit_insert_only ON audit.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- NENHUM DELETE ou UPDATE permitido
-- Logs são IMUTÁVEIS
```

### Permissões de Schema

```sql
-- Usuários da aplicação só podem:
GRANT USAGE ON SCHEMA audit TO app_user;
GRANT SELECT, INSERT ON audit.audit_logs TO app_user;

-- SuperAdmins podem ler tudo:
GRANT SELECT ON audit.audit_logs TO super_admin;

-- NINGUÉM pode deletar ou atualizar
REVOKE DELETE, UPDATE ON audit.audit_logs FROM PUBLIC;
```

---

## 📝 Ações Auditadas

### Categorias de Ações

```typescript
// Autenticação e Usuários
"LOGIN"
"LOGOUT"
"LOGIN_FALHO"
"RESET_SENHA_CLIENTE"
"CREATE_USUARIO"
"UPDATE_USUARIO"
"DELETE_USUARIO"

// Clientes
"CREATE_CLIENTE"
"UPDATE_CLIENTE"
"DELETE_CLIENTE"
"VIEW_CLIENTE_SENSIVEL"

// Processos
"CREATE_PROCESSO"
"UPDATE_PROCESSO"
"DELETE_PROCESSO"
"UPLOAD_DOCUMENTO_PROCESSO"
"DELETE_DOCUMENTO_PROCESSO"

// Contratos
"CREATE_CONTRATO"
"UPDATE_CONTRATO"
"DELETE_CONTRATO"
"ASSINAR_CONTRATO"

// Financeiro
"CREATE_PAGAMENTO"
"UPDATE_PAGAMENTO"
"CANCELAR_PAGAMENTO"
"ESTORNAR_PAGAMENTO"

// Configurações
"UPDATE_CONFIG_TENANT"
"UPDATE_PLANO_TENANT"
```

---

## 💻 Como Usar

### Registrar Log de Auditoria

```typescript
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

export async function minhaServerAction() {
  const session = await auth();
  const user = session?.user;

  // ... sua lógica aqui ...

  // Registrar no log
  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: "UPDATE_CLIENTE",
      entidade: "Cliente",
      entidadeId: cliente.id,
      dados: {
        clienteNome: cliente.nome,
        camposAlterados: ["nome", "email"],
      },
      previousValues: {
        nome: clienteAntigo.nome,
        email: clienteAntigo.email,
      },
      changedFields: ["nome", "email"],
      ip: request?.ip || null,
      userAgent: request?.headers.get("user-agent") || null,
    },
  });
}
```

### Buscar Logs (Admin)

```typescript
// Buscar logs de um cliente específico
export async function getAuditLogsCliente(clienteId: string) {
  const session = await auth();
  const user = session?.user;

  if (!user.isAdmin && !user.isSuperAdmin) {
    throw new Error("Acesso negado");
  }

  return await prisma.auditLog.findMany({
    where: {
      tenantId: user.tenantId,
      entidade: "Cliente",
      entidadeId: clienteId,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      usuario: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

// Buscar ações de um usuário
export async function getAuditLogsUsuario(usuarioId: string, periodo?: { inicio: Date; fim: Date }) {
  const session = await auth();
  const user = session?.user;

  if (!user.isSuperAdmin) {
    throw new Error("Apenas SuperAdmin pode ver logs de usuários");
  }

  return await prisma.auditLog.findMany({
    where: {
      tenantId: user.tenantId,
      usuarioId,
      ...(periodo && {
        createdAt: {
          gte: periodo.inicio,
          lte: periodo.fim,
        },
      }),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

// Relatório de auditoria
export async function getRelatorioAuditoria(filtros: {
  dataInicio: Date;
  dataFim: Date;
  acao?: string;
  entidade?: string;
}) {
  const session = await auth();
  const user = session?.user;

  if (!user.isAdmin && !user.isSuperAdmin) {
    throw new Error("Acesso negado");
  }

  return await prisma.auditLog.groupBy({
    by: ["acao", "entidade"],
    where: {
      tenantId: user.tenantId,
      createdAt: {
        gte: filtros.dataInicio,
        lte: filtros.dataFim,
      },
      ...(filtros.acao && { acao: filtros.acao }),
      ...(filtros.entidade && { entidade: filtros.entidade }),
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });
}
```

---

## 📊 Queries Úteis

### Ver últimas ações de um tenant

```sql
SELECT 
  al.acao,
  al.entidade,
  al.entidade_id,
  al.created_at,
  u.first_name || ' ' || u.last_name AS usuario,
  u.email
FROM audit.audit_logs al
LEFT JOIN magiclawyer.usuarios u ON u.id = al.usuario_id
WHERE al.tenant_id = 'SEU_TENANT_ID'
ORDER BY al.created_at DESC
LIMIT 50;
```

### Ações de reset de senha

```sql
SELECT 
  al.dados->>'clienteNome' AS cliente,
  al.dados->>'usuarioEmail' AS email,
  al.dados->>'resetadoPor' AS resetado_por,
  al.created_at
FROM audit.audit_logs al
WHERE 
  al.tenant_id = 'SEU_TENANT_ID'
  AND al.acao = 'RESET_SENHA_CLIENTE'
ORDER BY al.created_at DESC;
```

### Relatório mensal de atividades

```sql
SELECT 
  DATE_TRUNC('day', al.created_at) AS dia,
  al.acao,
  COUNT(*) AS quantidade
FROM audit.audit_logs al
WHERE 
  al.tenant_id = 'SEU_TENANT_ID'
  AND al.created_at >= NOW() - INTERVAL '30 days'
GROUP BY dia, al.acao
ORDER BY dia DESC, quantidade DESC;
```

---

## 🔄 Retenção e Archive

### Política de Retenção

```sql
-- Manter 2 anos online
-- Arquivar dados antigos

-- Tabela de archive
CREATE TABLE audit.audit_logs_archive (
  LIKE audit.audit_logs INCLUDING ALL
);

-- Particionar por data (opcional para melhor performance)
CREATE TABLE audit.audit_logs_2025 PARTITION OF audit.audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### Cron Job de Archive (executar mensalmente)

```sql
-- Mover logs antigos para archive
WITH moved AS (
  DELETE FROM audit.audit_logs
  WHERE created_at < NOW() - INTERVAL '2 years'
  RETURNING *
)
INSERT INTO audit.audit_logs_archive
SELECT * FROM moved;
```

---

## 🎯 Compliance e LGPD

### Dados Auditados para LGPD

```typescript
// Ações que DEVEM ser auditadas para LGPD:

// 1. Acesso a dados pessoais sensíveis
"VIEW_CLIENTE_CPFRG"
"VIEW_CLIENTE_ENDERECO"
"EXPORT_DADOS_CLIENTE"

// 2. Modificações de dados pessoais
"UPDATE_CLIENTE_DADOS_PESSOAIS"
"DELETE_CLIENTE" // Direito ao esquecimento

// 3. Compartilhamento de dados
"SHARE_PROCESSO"
"EXPORT_RELATORIO"

// 4. Alterações de segurança
"RESET_SENHA"
"CHANGE_PERMISSIONS"
```

### Relatório LGPD

```typescript
export async function getRelatorioLGPD(clienteId: string) {
  const session = await auth();
  
  if (!session?.user.isSuperAdmin) {
    throw new Error("Acesso negado");
  }

  // Buscar TODAS as ações relacionadas ao cliente
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entidade: "Cliente", entidadeId: clienteId },
        { dados: { path: ["clienteId"], equals: clienteId } },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      usuario: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return {
    cliente: clienteId,
    totalAcoes: logs.length,
    primeiroAcesso: logs[0]?.createdAt,
    ultimoAcesso: logs[logs.length - 1]?.createdAt,
    acoesPorTipo: logs.reduce((acc, log) => {
      acc[log.acao] = (acc[log.acao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    logs,
  };
}
```

---

## 🚀 Performance

### Índices Otimizados

Os índices foram criados para otimizar as queries mais comuns:

```sql
-- Buscar logs de um tenant por entidade (ex: Cliente)
-- Usa: idx_audit_tenant_entidade
WHERE tenant_id = ? AND entidade = ?

-- Buscar logs recentes de um tenant
-- Usa: idx_audit_tenant_created
WHERE tenant_id = ? ORDER BY created_at DESC

-- Buscar ações de um usuário específico
-- Usa: idx_audit_tenant_usuario
WHERE tenant_id = ? AND usuario_id = ?

-- Buscar tipo de ação (ex: RESET_SENHA_CLIENTE)
-- Usa: idx_audit_tenant_acao
WHERE tenant_id = ? AND acao = ?

-- Buscar logs de uma entidade específica (ex: Cliente com ID X)
-- Usa: idx_audit_tenant_entidade_id
WHERE tenant_id = ? AND entidade = ? AND entidade_id = ?
```

### Estimativas de Volume

```
Tenant Pequeno (10 usuários):
- ~500 logs/dia = ~15k logs/mês = ~180k logs/ano
- Tamanho: ~50MB/ano

Tenant Médio (50 usuários):
- ~2.5k logs/dia = ~75k logs/mês = ~900k logs/ano
- Tamanho: ~250MB/ano

Tenant Grande (200 usuários):
- ~10k logs/dia = ~300k logs/mês = ~3.6M logs/ano
- Tamanho: ~1GB/ano
```

---

## 📚 Referências

- [Prisma Multi-Schema](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [LGPD - Lei Geral de Proteção de Dados](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [OAB - Regulamentações](https://www.oab.org.br/)

---

## ✅ Checklist de Implementação

- [x] Schema `audit` criado
- [x] Modelo `AuditLog` movido para schema `audit`
- [x] Índices otimizados adicionados
- [x] Relações cross-schema funcionando
- [x] Migrations aplicadas
- [x] Testes de inserção funcionando
- [x] Queries de busca otimizadas
- [ ] RLS implementado (opcional, para maior segurança)
- [ ] Cron job de archive configurado
- [ ] Relatórios LGPD implementados
- [ ] Dashboard de auditoria criado

---

**Última atualização:** 2025-10-07  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e funcional

