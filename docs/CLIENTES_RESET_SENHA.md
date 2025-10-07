# Reset de Senha de Clientes

## 📋 Visão Geral

Sistema completo para resetar senhas de clientes com auditoria e controle de acesso.

## 🔐 Funcionalidade

### Quem Pode Resetar Senha?

1. **Advogado**: Pode resetar senha apenas dos **seus clientes** (vinculados via `AdvogadoCliente`)
2. **Admin**: Pode resetar senha de **qualquer cliente** do tenant
3. **SuperAdmin**: Pode resetar senha de qualquer cliente de qualquer tenant

### Quando o Botão Aparece?

O botão **"Resetar Senha"** aparece no dropdown de ações do cliente APENAS quando:
- ✅ Cliente possui `usuarioId` (tem acesso ao sistema)
- ✅ Usuário logado tem permissão (advogado vinculado ou admin)

## 🎯 Fluxo Completo

### 1. Cliente Perde a Senha

```
Cliente: "Perdi minha senha!"
↓
Advogado: Acessa /clientes
↓
Clica no menu ⋮ do cliente
↓
Clica em "Resetar Senha" 🔑
↓
Confirma a ação
↓
Sistema gera nova senha automaticamente
↓
Modal mostra nova senha
↓
Advogado copia e envia para cliente
↓
Log de auditoria registrado ✅
```

### 2. Indicadores Visuais

**Card do Cliente:**
- ✅ Badge verde "Acesso" se tem usuário
- 🔑 Ícone de chave no badge
- ⋮ Menu de ações com "Resetar Senha"

**Após Reset:**
- 🎉 Toast de sucesso
- 🔑 Modal com novas credenciais
- 📋 Botões para copiar email e senha
- ⚠️ Aviso que senha será exibida apenas uma vez

## 📊 Log de Auditoria

### Dados Registrados

```typescript
{
  acao: "RESET_SENHA_CLIENTE",
  entidade: "Usuario",
  entidadeId: "[ID do usuário]",
  detalhes: {
    clienteId: "[ID do cliente]",
    clienteNome: "[Nome do cliente]",
    usuarioEmail: "[Email do usuário]",
    resetadoPor: "[Nome de quem resetou]",
    resetadoPorId: "[ID de quem resetou]",
    resetadoPorRole: "[ADVOGADO ou ADMIN]",
    dataReset: "[ISO timestamp]"
  }
}
```

### Exemplo de Log

```json
{
  "id": "...",
  "tenantId": "cmgfsgy4u0013yra481b88wkh",
  "usuarioId": "cmgfsgy6e001pyra4nqo5zyqv",
  "acao": "RESET_SENHA_CLIENTE",
  "entidade": "Usuario",
  "entidadeId": "cmgfs9ml20001yr4ilm5zltko",
  "detalhes": {
    "clienteId": "cmgfs9mlc0003yr4iibnjtkf3",
    "clienteNome": "Robson José Santos Nonato Filho",
    "usuarioEmail": "robsonnonatoiii@gmail.com",
    "resetadoPor": "Ricardo Araujo",
    "resetadoPorId": "cmgfsgy6e001pyra4nqo5zyqv",
    "resetadoPorRole": "ADVOGADO",
    "dataReset": "2025-10-07T03:15:42.123Z"
  },
  "ipAddress": null,
  "createdAt": "2025-10-07T03:15:42.123Z"
}
```

## 🔒 Segurança

### Validações Implementadas

1. ✅ **Autenticação**: Requer sessão válida
2. ✅ **Tenant**: Verifica `tenantId`
3. ✅ **Permissão**: Advogado só reseta de clientes vinculados
4. ✅ **Existência**: Verifica se cliente existe
5. ✅ **Usuário**: Verifica se cliente tem usuário de acesso
6. ✅ **Confirmação**: Usuário deve confirmar antes de resetar

### Controle de Acesso

```typescript
// Advogado: Apenas clientes vinculados
whereClause.advogadoClientes = {
  some: {
    advogadoId: advogadoLogado,
  },
};

// Admin: Todos os clientes do tenant
// (sem restrição adicional)
```

## 📱 Interface

### Badge "Acesso"
- **Cor**: Verde (success)
- **Ícone**: Chave (Key)
- **Localização**: Ao lado do nome no card
- **Condição**: Apenas se `usuarioId` existe

### Botão "Resetar Senha"
- **Cor**: Laranja (warning)
- **Ícone**: KeyRound
- **Localização**: Dropdown de ações
- **Condição**: Apenas se `usuarioId` existe

### Modal de Credenciais
- **Título**: "🔑 Credenciais de Acesso"
- **Conteúdo**: Email e senha copiáveis
- **Aviso**: Senha exibida apenas uma vez
- **Botão**: "Entendi" para fechar

## 🎨 UX/UI

### Estados

- **Loading**: Spinner enquanto reseta
- **Confirmação**: Dialog antes de executar
- **Sucesso**: Toast + Modal com credenciais
- **Erro**: Toast com mensagem clara

### Mensagens

```typescript
// Sucesso
"Senha resetada com sucesso!"

// Erro - Cliente sem usuário
"Este cliente não possui usuário de acesso"

// Erro - Não encontrado
"Cliente não encontrado"

// Erro - Sem permissão
"Acesso negado"
```

## 🔍 Consultar Logs de Auditoria

### Query para Ver Resets de Senha

```typescript
const logsResetSenha = await prisma.auditLog.findMany({
  where: {
    tenantId: "...",
    acao: "RESET_SENHA_CLIENTE",
  },
  include: {
    usuario: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
});
```

### Visualizar na Interface

**Futuramente pode-se criar:**
- Página de auditoria em `/admin/auditoria`
- Filtro por tipo de ação
- Timeline de ações
- Export para CSV

## ⚠️ Importantes

1. **Senha temporária**: Deve ser alterada pelo cliente no primeiro acesso
2. **Email real**: Necessário para enviar credenciais
3. **Auditoria**: Todos os resets são registrados
4. **Segurança**: Senha com 12 caracteres, letras, números e símbolos
5. **Hash**: Senha armazenada com bcrypt (salt rounds: 10)

## 🚀 Como Usar

### Resetar Senha de um Cliente

1. Acesse `/clientes`
2. Encontre o cliente que precisa resetar
3. Clique no menu ⋮ (três pontos)
4. Clique em "Resetar Senha" 🔑
5. Confirme a ação
6. Copie a nova senha
7. Envie para o cliente

### Verificar se Cliente Tem Acesso

- 🟢 Badge verde "Acesso" → Tem usuário
- ⚪ Sem badge → Não tem usuário
- 🔑 Botão "Resetar Senha" aparece apenas se tem usuário

## 📝 Código da Action

Arquivo: `app/actions/clientes.ts`

```typescript
export async function resetarSenhaCliente(clienteId: string)
```

**Processo:**
1. Valida sessão e permissões
2. Busca cliente com usuário
3. Gera nova senha aleatória (12 chars)
4. Hash com bcrypt
5. Atualiza usuário
6. Registra no AuditLog
7. Retorna credenciais

## 🎯 Melhorias Futuras

- [ ] Enviar email automático com nova senha
- [ ] Forçar troca de senha no próximo login
- [ ] Expiração de senha temporária (24h)
- [ ] Histórico de resets de senha por cliente
- [ ] Notificação para o cliente via WhatsApp
- [ ] 2FA (autenticação de dois fatores)
- [ ] Política de senha customizável

## ✅ Resultado

- ✅ Advogado pode ajudar clientes que perderam senha
- ✅ Admin tem controle total
- ✅ Auditoria completa de quem fez o quê
- ✅ Segurança mantida
- ✅ UX intuitiva
- ✅ Logs para compliance

