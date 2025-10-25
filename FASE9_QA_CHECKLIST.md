# Fase 9: QA & Testes - Checklist de Validação

## 📋 Cenários de Teste

### ✅ Teste 1: Suspender Tenant Ativo ✅ **CONCLUÍDO**

**Setup:**
1. ✅ Abra 2 abas: Admin + Tenant
2. ✅ Na aba Tenant: faça login com `sandra@adv.br` / `Sandra@123`
3. ✅ Navegue para dashboard

**Ações:**
4. ✅ Na aba Admin: `/admin/tenants` → "Sandra Advocacia" → Gerenciar → Status
5. ✅ Mude status: "Ativo" → "Suspenso"
6. ✅ Clique em "Salvar Alterações"

**Validações Esperadas:**
- ✅ Badge na lista admin muda para "Suspenso" instantaneamente
- ✅ Na aba Tenant: redirecionado para `/login?reason=TENANT_SUSPENDED`
- ✅ Toast exibe: "🔒 Escritório Suspenso" (amarelo)
- ✅ URL correta: `sandra.localhost:9192/login?reason=TENANT_SUSPENDED`

**🐛 Bug Crítico Encontrado e Corrigido:**
- **Problema:** `pathname?.startsWith("/")` fazia match com `/dashboard`
- **Solução:** Match exato para `"/"` apenas
- **Status:** ✅ Resolvido

**Logs de Auditoria:**
- [ ] Prisma: `TenantStatusTransition` registrado
- [ ] `sessionVersion` incrementado
- [ ] `statusChangedAt` atualizado
- [ ] `statusReason` preenchido

---

### ✅ Teste 2: Reativar Tenant Suspenso

**Setup:**
1. Tenant Sandra já está suspenso (Teste 1)

**Ações:**
2. Na aba Admin: Mesmo caminho
3. Mude status: "Suspenso" → "Ativo"
4. Salve

**Validações Esperadas:**
- [ ] Badge volta para "Ativo" em < 5 segundos
- [ ] Animações aparecem
- [ ] Usuário pode fazer login normalmente
- [ ] Após login, funciona normalmente

---

### ✅ Teste 3: Mudar Plano do Tenant

**Setup:**
1. Login no admin
2. Localizar "Sandra Advocacia"

**Ações:**
3. Ir para aba "Assinatura"
4. Mudar plano (ex.: Básico → Premium)
5. Salvar

**Validações Esperadas:**
- [ ] `planRevision` é incrementado
- [ ] Badge do plano muda na lista
- [ ] Usuários do tenant são invalidados
- [ ] Na próxima verificação (5s), usuário é redirecionado

---

### ✅ Teste 4: Desativar Usuário Específico

**Setup:**
1. Tenha 2 usuários logados no mesmo tenant (aba 1 e aba 2)

**Ações:**
2. Na aba Admin: Sandra → Usuários
3. Encontre usuário específico
4. Desative usuário
5. Salve

**Validações Esperadas:**
- [ ] Apenas o usuário desativado é redirecionado
- [ ] Outros usuários continuam ativos
- [ ] Motivo: `USER_DISABLED`
- [ ] Toast: "🚫 Usuário Desativado"

---

### ✅ Teste 5: Validação ao Focar Aba

**Setup:**
1. Usuário logado no tenant
2. Suspenda o tenant em outra aba

**Ações:**
3. Mude para outra aba do navegador
4. Volte para a aba do tenant (foco)

**Validações Esperadas:**
- [ ] Validação dispara imediatamente ao focar
- [ ] Se suspenso, redireciona para login
- [ ] Se ainda ativo, continua funcionando

---

### ✅ Teste 6: Limpeza de Datas (Trial/Renova)

**Setup:**
1. Admin: Tenha um tenant com trial definido

**Ações:**
2. Vá em Assinatura
3. Limpe campo `trialEndsAt` (seta para null)
4. Salve

**Validações Esperadas:**
- [ ] `invalidateTenant()` é chamado
- [ ] Motivo: `TRIAL_ENDS_AT_CHANGED`
- [ ] Sessões são invalidadas
- [ ] Mesmo comportamento para `renovaEm`

---

### ✅ Teste 7: Subscription Criada

**Setup:**
1. Tenant sem subscription

**Ações:**
2. Crie uma subscription nova

**Validações Esperadas:**
- [ ] `invalidateTenant()` é chamado
- [ ] Motivo: `SUBSCRIPTION_CREATED`
- [ ] Módulos são recalculados
- [ ] Usuários veem mudanças

---

### ✅ Teste 8: Erros de Credenciais

**Ações:**
1. Vá para `/login`
2. Digite email correto, senha errada
3. Tente fazer login

**Validações Esperadas:**
- [ ] Toast: "❌ Email ou senha incorretos"
- [ ] Mensagem amigável com dica sobre maiúsculas/minúsculas
- [ ] Toast fica visível por 6 segundos

---

### ✅ Teste 9: Navegação Após Invalidação

**Setup:**
1. Usuário logado
2. Suspenda o tenant

**Ações:**
3. Tente navegar para outra rota
4. Aguarde redirecionamento
5. Tente voltar (botão back)

**Validações Esperadas:**
- [ ] Redirecionamento ocorre em < 5s
- [ ] Botão back não volta (histórico limpo)
- [ ] Token foi limpo (signOut executado)
- [ ] Overlay aparece brevemente

---

### ✅ Teste 10: Múltiplos Admins

**Setup:**
1. Dois admins abertos em `/admin/tenants`

**Ações:**
2. Admin 1 suspende tenant
3. Observar Admin 2

**Validações Esperadas:**
- [ ] Admin 2 vê mudança em < 5 segundos
- [ ] Animação aparece
- [ ] Badge atualiza
- [ ] Sem precisar refresh manual

---

## 🐛 Casos de Erro

### Erro 1: API de Validação Falha

**Simular:**
1. Desligue servidor temporariamente
2. Aguarde próximo check (5s)

**Esperado:**
- [ ] Console mostra warning
- [ ] Usuário não é desconectado (fail-open)
- [ ] Retenta na próxima verificação

---

### Erro 2: Payload Inválido

**Setup:**
1. Edite hook `useSessionGuard` para enviar `userId: null`

**Esperado:**
- [ ] API retorna `400 INVALID_USER_ID`
- [ ] Console mostra warning
- [ ] Não desconecta usuário (segurança)

---

### Erro 3: Network Error

**Simular:**
1. Bloqueie requisições para `/api/session/check` via DevTools

**Esperado:**
- [ ] Catch captura erro
- [ ] Console mostra warning
- [ ] Usuário continua funcionando
- [ ] Retenta na próxima verificação

---

## 📊 Métricas de Sucesso

- [ ] Todos os testes passam
- [ ] Tempo de resposta < 5s
- [ ] Zero loops infinitos
- [ ] Zero vazamentos de memória
- [ ] Toast aparece corretamente
- [ ] Auditoria completa
- [ ] Logs estruturados

---

## 🧹 Limpeza Após Testes

1. Reativar tenant Sandra
2. Reativar usuários desativados
3. Limpar console do navegador
4. Limpar localStorage/sessionStorage
5. Verificar logs de erro

---

## 📝 Documentação Final

- [ ] Atualizar README.md
- [ ] Documentar variáveis de ambiente
- [ ] Criar guia de troubleshooting
- [ ] Screenshots dos fluxos
- [ ] Atualizar CHANGELOG

---

**Execução:** _________________  
**Data:** _________________  
**Status:** [ ] Aprovado [ ] Rejeitado
