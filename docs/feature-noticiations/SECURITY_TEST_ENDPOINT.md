# 🔒 Segurança - Endpoint de Teste de Notificações

## ⚠️ **IMPORTANTE - SEGURANÇA**

O endpoint `/api/admin/notifications/test` possui **múltiplas camadas de proteção**:

### 🛡️ **Proteções Implementadas:**

1. **Ambiente Restrito**: 
   - ✅ Disponível apenas em `NODE_ENV=development`
   - ❌ Bloqueado em produção

2. **Autenticação Obrigatória**:
   - ✅ Requer `INTERNAL_ADMIN_TOKEN` no header `Authorization`
   - ❌ Sem token = acesso negado

3. **Tipos Limitados**:
   - ✅ Apenas tipos de teste permitidos: `test.notification`, `test.email`, `test.whatsapp`
   - ❌ Tipos maliciosos bloqueados

4. **Validação de Dados**:
   - ✅ Campos obrigatórios validados
   - ✅ Payload limitado

### 🔧 **Configuração Necessária:**

```bash
# .env.local (NUNCA commitar)
INTERNAL_ADMIN_TOKEN=seu_token_secreto_aqui
REDIS_URL=redis://localhost:6379
```

### 🧪 **Como Usar:**

```bash
# Com token configurado
INTERNAL_ADMIN_TOKEN=dev_test_token_12345 node scripts/test-notifications.js
```

### 🚨 **NUNCA FAZER:**

- ❌ Commitar `INTERNAL_ADMIN_TOKEN` no Git
- ❌ Usar em produção
- ❌ Deixar token padrão em produção
- ❌ Expor endpoint sem autenticação

---

**Status:** ✅ **Endpoint Seguro** - Múltiplas camadas de proteção implementadas
