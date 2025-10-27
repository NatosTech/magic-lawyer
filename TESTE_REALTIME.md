# 🔄 Guia de Teste - Sistema de Realtime Multitenant

## 📋 Pré-requisitos
- Servidor rodando em `http://localhost:9192`
- Banco de dados com dados de seed (tenant Sandra)
- Duas abas do navegador abertas

---

## 🎯 Teste 1: Suspender Tenant (Status Muda)

### Setup
1. **Aba 1**: Abra `http://localhost:9192/admin/tenants` (painel admin)
2. **Aba 2**: Abra `http://sandra.localhost:9192/login` (tenant Sandra)
3. **Faça login** na Aba 2 com:
   - Email: `sandra@adv.br`
   - Senha: `Sandra@123`

### Passo a Passo
1. Na **Aba 1**, localize "Sandra Advocacia" e clique em "Gerenciar"
2. Vá na aba **"Status"**
3. Mude o status de **"Ativo"** para **"Suspenso"**
4. Clique em **"Salvar Alterações"**

### O Que Deve Acontecer

#### ✅ Na Aba 1 (Painel Admin):
- **Até 5 segundos**: Badge "Ativo" muda para "Suspenso"
- **Animação**: Borda verde pulsa no card
- **Badge**: Animação de bounce
- **Tooltip**: Ao passar o mouse no badge, mostra motivo:
  ```
  STATUS_CHANGED_FROM_ACTIVE_TO_SUSPENDED
  ```

#### ✅ Na Aba 2 (Tenant):
- **Imediatamente**: Redirecionado para `/login?reason=SUSPENDED`
- **Mensagem Toast**: Exibe mensagem amigável:
  ```
  🔒 Escritório Suspenso
  Sua conta foi temporariamente suspensa. 
  Entre em contato com o suporte para mais informações.
  ```
- **Sessão**: Invalidada automaticamente

---

## 🎯 Teste 2: Mudar Plano (Subscription Muda)

### Setup
1. **Aba 1**: Abra `http://localhost:9192/admin/tenants`
2. Encontre "Sandra Advocacia" → "Gerenciar"

### Passo a Passo
1. Vá na aba **"Assinatura"**
2. Mude o **plano** (ex: Básico → Premium)
3. Clique em **"Salvar"**

### O Que Deve Acontecer
- **Badge do plano** muda na lista em até 5 segundos
- **Animações** visuais de mudança
- **sessionVersion** é incrementado

---

## 🎯 Teste 3: Desativar Usuário

### Setup
1. **Aba 1**: Abra `http://localhost:9192/admin/tenants`
2. Encontre "Sandra Advocacia" → "Gerenciar" → aba "Usuários"
3. **Aba 2**: Tenha um usuário logado no tenant

### Passo a Passo
1. Na Aba 1, encontre um usuário
2. Clique em "Desativar" ou mude o status para inativo
3. Salve

### O Que Deve Acontecer
- **Na Aba 2**: Usuário é deslogado imediatamente
- **Redirecionamento**: Para `/login` com motivo

---

## 🔍 O Que Observar

### ✅ Indicadores de Sucesso
- [ ] Badges atualizam em até 5 segundos
- [ ] Animação de borde verde nos cards
- [ ] Animação de bounce no badge
- [ ] Tooltips mostram motivos corretos
- [ ] Sessões invalidadas automaticamente
- [ ] Logs de auditoria criados
- [ ] **Mensagens claras no login** com emojis e cores
- [ ] **Mensagens de erro específicas** para email/senha incorretos

### ❌ Problemas Possíveis
- Badges não atualizam → Verificar SWR refreshInterval
- Sessão não invalida → Verificar middleware e API de validação
- Animações não aparecem → Verificar CSS Tailwind

---

## 🐛 Debug

### Console do Navegador
Abra DevTools (F12) e observe:
```javascript
// SWR deve estar revalidando
[swr] Revalidating: tenant-status
[swr] Success: { status: "SUSPENDED", ... }
```

### Console do Servidor
Observe logs:
```bash
# Invalidação sendo chamada
Invalidating tenant cmh5q4ao0001cyrjr36nobk5t
# Auditoria registrada
Tenant session invalidated
```

### Network Tab
Verifique requisições:
- `POST /api/internal/session/validate` (middleware)
- `GET /api/admin/tenants/[id]/status` (SWR)
- `POST /api/internal/realtime/invalidate` (evento)

---

## 📊 Checklist de Validação

- [ ] Teste 1: Suspender tenant (status muda)
- [ ] Teste 2: Mudar plano (subscription muda)
- [ ] Teste 3: Desativar usuário (usuário muda)
- [ ] Badges atualizam em tempo real
- [ ] Animações visuais funcionam
- [ ] Tooltips exibem motivos
- [ ] Sessões invalidadas corretamente
- [ ] Logs de auditoria registrados
- [ ] Mensagens de erro são claras e específicas

---

## 🎨 Melhorias Implementadas na UX

### Mensagens de Status no Login
Quando o usuário é redirecionado para o login por invalidação de sessão, agora ele vê mensagens específicas:

- **SUSPENDED**: "🔒 Escritório Suspenso" (amarelo/warning)
- **CANCELLED**: "❌ Escritório Cancelado" (vermelho/danger)
- **SESSION_VERSION_MISMATCH**: "🔄 Sessão Expirada" (azul/info)
- **USER_DISABLED**: "🚫 Usuário Desativado" (amarelo/warning)
- **SESSION_REVOKED**: "🔒 Sessão Revogada" (amarelo/warning)

### Mensagens de Erro de Credenciais
- **Email ou senha incorretos**: Mensagem clara com instruções
- **Dica**: "A senha é sensível a maiúsculas e minúsculas"
- **Toast**: Exibido por 6 segundos com emoji ❌

### Tratamento de Erros de Status
Quando o tenant está inativo na tentativa de login:
- Login bloqueado automaticamente
- Motivo registrado no console do servidor
- Usuário vê mensagem de credenciais inválidas (por segurança)

---

**Dica**: Mantenha o console do navegador aberto para ver mensagens de debug em tempo real! 🚀
