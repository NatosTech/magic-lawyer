# Implementação: Cargo como Identificador Principal

## 🎯 Decisões Técnicas

### 1. Usuário sem Cargo
- **Decisão:** Usar `role` como fallback quando usuário não tem cargo
- **Justificativa:** Não quebrar usuários existentes, permitir flexibilidade

### 2. Exibição na Lista
- **Decisão:** Destacar **Cargo principal** como chip primário
- **Role:** Mostrar como badge/informação secundária (menor, menos destaque)
- **Ordem:** Cargo primeiro, role abaixo ou ao lado (menor)

### 3. Múltiplos Cargos
- **Decisão:** Usar **primeiro cargo ativo** como cargo principal
- **Critério:** Primeiro registro em `UsuarioCargo` onde `ativo = true`
- **Exibição adicional:** Mostrar contador de cargos adicionais (ex: "Estagiária +2")

## 📋 Plano de Implementação

### Fase 1: Helper Functions (30min)
- [x] Criar `getCargoPrincipal(usuario)` - retorna cargo principal ou null
- [x] Criar `getDisplayLabel(usuario)` - retorna "Cargo" ou "Role" como fallback
- [x] Criar `getDisplayColor(usuario)` - cor baseada em cargo ou role
- [x] Criar `getDisplayIcon(usuario)` - ícone baseado em cargo ou role

### Fase 2: Tabela de Usuários (45min)
- [x] Substituir coluna "ROLE" por "FUNÇÃO" 
- [x] Mostrar cargo principal como chip primário
- [x] Mostrar role como badge secundário (menor)
- [x] Adicionar tooltip mostrando todos os cargos se múltiplos

### Fase 3: Modal de Edição (30min)
- [x] Atualizar select de "Role" para mostrar como "Nível Base"
- [x] Adicionar campo para atribuir Cargo principal
- [x] Validar que cargo seja obrigatório (ou opcional?)

### Fase 4: Componentes Relacionados (45min)
- [ ] Atualizar `permission-guard.tsx` - usar cargo para labels
- [ ] Atualizar `use-profile-navigation.ts` - se necessário
- [ ] Atualizar filtros/buscas - buscar por cargo ao invés de role
- [ ] Atualizar export CSV - incluir cargo principal

### Fase 5: Validações e Testes (30min)
- [ ] Testar usuário sem cargo (fallback para role)
- [ ] Testar usuário com múltiplos cargos
- [ ] Testar criação/edição de usuário com cargo
- [ ] Validar que permissões continuam funcionando

**Tempo Total Estimado:** ~3 horas

---

**Última atualização:** Após decisão pela Opção 1
