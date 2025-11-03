# UI Refresh – Equipe / Clientes / Advogados

Este roteiro descreve, em 20 passos, como aplicar o design e as interações do módulo de **Advogados** aos modais e seções equivalentes dos módulos **Clientes** e **Equipe**. Seguindo-o em ordem, outro desenvolvedor (ou uma IA menos contextuada) consegue executar as mudanças e depois submeter para revisão.

---

## 🎯 Objetivo

Garantir que os modais e fluxos de gerenciamento (visualização, edição, permissões) tenham a mesma experiência premium do módulo de Advogados:

- Layout com `Tabs`, card-resumo e animações `framer-motion`.
- Estilos alinhados com o design system (gradientes suaves, bordas “glass”, estados empty/erro ricos).
- Comportamento consistente (selecionar tudo, tooltips, audiências em realtime).

---

## 🛠️ Pré-requisitos

- Familiaridade com Next.js + React (Client Components).
- Conhecimento básico de `framer-motion` e HeroUI.
- Scripts de testes prontos: `npm test`, `npm run test:e2e`.

---

## 🔄 Passos de Migração (20 etapas)

### Planejamento & Setup

1. **Criar branch** a partir de `feature/system-polish-and-juridical-apis` (ex.: `feature/ui-refresh-equipe`).  
2. **Rodar testes unitários** (`npm test`) para garantir baseline verde.  
3. **Documentar ponto de partida**: capturar screenshot dos modais atuais de Clientes e Equipe (para comparação posterior).  

### Componentes Compartilhados

4. ✅ **Criar wrappers reutilizáveis** em `components/ui`:
   - ✅ `ModalHeaderGradient` - `components/ui/modal-header-gradient.tsx`
   - ✅ `ModalSectionCard` - `components/ui/modal-section-card.tsx`
   - ✅ `MotionCardGrid` - `components/ui/motion-card-grid.tsx`

5. ✅ **Extrair helpers de motion** (variantes `containerVariants`, `cardVariants`, `fadeInUp`) para `components/ui/motion-presets.ts`.  
6. ✅ **Decisão sobre `useResponsiveColumns()`**: Não foi implementado, pois o Tailwind CSS já fornece classes utilitárias responsivas (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), que são mais simples e performáticas. O `MotionCardGrid` já aceita o parâmetro `columns` que usa essas classes do Tailwind.  

### Portal do Advogado (baseline visual)

7. **Refinar `/portal-advogado`** (já fase 1 concluída):
   - Aplicar `MotionCardGrid` nas seções.
   - Ajustar cards para glass/gradiente.
   - Garantir header em hero com CTA.  

### Clientes – Lista & Toolbar

8. ✅ **Reestilizar o bloco de filtros** no topo de `ClientesContent`:
   - ✅ Header hero com gradiente (similar ao Equipe)
   - ✅ Cards de métricas usando `MotionCardGrid` com gradientes glass
   - ✅ Card de filtros com animação (AnimatePresence), botão toggle animado, chips de filtros ativos, resumo de filtros aplicados
9. ⚠️ **Refatorar grid/lista** de clientes:
   - ✅ Cards animados com motion.div e grid responsivo (sm:grid-cols-2 lg:grid-cols-3)
   - ⚠️ **NÃO usa MotionCardGrid** - usa grid padrão do Tailwind com motion.div (decisão: grid padrão é suficiente para esta lista)
   - ✅ Estados empty/erro implementados (similar ao de Cargos, mas com estilo próprio)  

### Clientes – Modal Principal

10. ✅ **Substituir modal atual** por novo layout:
    - ✅ Header com `ModalHeaderGradient` (avatar implícito no ícone)
    - ✅ Tabs: "Dados Gerais", "Contato", "Acesso", "Observações"
    - ✅ Seções com `ModalSectionCard`, switches, tooltips
    - ✅ Modal de criar e editar cliente implementados

11. ❌ **Implementar select de cargo** (se aplicável): **NÃO APLICÁVEL** - Clientes não têm cargos, apenas usuários de acesso. Esta etapa não se aplica ao módulo de Clientes.

12. ⚠️ **Indicações de validação inline**: 
    - ✅ Campos `isRequired` implementados
    - ⚠️ Validação com shake/motion em erro: **NÃO IMPLEMENTADO** (pode ser adicionado no futuro)  

### Clientes – Modais Complementares

13. ✅ **Modal de visualização** → replicar card hero com tabs (Resumo, Contato, Processos).  
14. ⏳ **Modal de reset de senha / credenciais** → usar mesmo padrão do novo `permission-guard` card (já existe, mas pode ser melhorado no futuro).  

### Equipe – Tabs & Dashboard

15. ✅ **Aplicar motion no painel principal** (`EquipesContent` já parcialmente atualizado):
    - ✅ Header hero com gradiente e descrição
    - ✅ Dashboard cards usando `MotionCardGrid` com gradientes glass
    - ✅ Garantir que abas "Cargos", "Usuários", "Convites" compartilham layout.
    - ✅ Reaproveitar `MotionCardGrid` para métricas e cards por seção.  

16. ✅ **CargosTab refeito** (já iniciado):
    - ✅ Estados erro/empty melhorados com cards animados
    - ✅ Botões `Selecionar tudo / Limpar tudo` por módulo implementados
    - ✅ Card de ajuda introdutório no modal de cargo
    - ✅ Switches animados para permissões  

17. ✅ **UsuariosTab redesign**:
    - ✅ Tabela mantida (decisão: tabela é mais adequada para listagem de usuários)
    - ✅ Header com filtros animados (AnimatePresence)
    - ✅ Tooltips nos chips de cargo/role
    - ✅ **Toolbar com estatísticas (`usuarioStats`)**: **IMPLEMENTADO** - cards de métricas (Total, Ativos, Inativos, por Role, com Cargo, com Vinculação)
    - ✅ Estados empty/erro melhorados com cards animados

18. ✅ **ConvitesTab**:
    - ✅ Cards de resumo (Pendentes, Aceitos, Expirados, Total) usando `MotionCardGrid`
    - ✅ Modal de novo convite com tabs (Dados, Cargo/Role, Observações) e `ModalHeaderGradient` + `ModalSectionCard`
    - ✅ Lista de convites com cards animados

### Equipe – Modais

19. ✅ **Modal de edição de usuário**:
    - ✅ Tabs: Perfil, Contatos, Cargo/Role, Endereços, Histórico (5 abas completas).
    - ✅ **Aba Endereços**: Integrado `EnderecoManager` com suporte completo de gerenciamento de endereços.
    - ✅ **Aba Histórico**: Integrado `UsuarioHistoricoTab` com histórico completo de alterações do usuário.
    - ✅ **Upload de avatar**: Implementado com suporte a URL e arquivo via API route (`/api/equipe/upload-avatar`) e Cloudinary.
    - ✅ **Modal de visualização**: Refatorado para usar `ModalHeaderGradient`, `Tabs` (Resumo, Contato) e `ModalSectionCard` - alinhado com padrão de Clientes.

20. ✅ **Modal de permissões individuais**:
    - Já alinhado com `ModalHeaderGradient`, texto introdutório, chips de origem, switches uniformes.
    - ⏳ CTA "Aplicar override em módulo" com `Selecionar todas/Remover todas` pode ser adicionado no futuro.

21. ✅ **Modal de vincular usuário**: Atualizado com `ModalHeaderGradient` e `ModalSectionCard`.  

---

## ✅ Checklist de Validação

- [x] ✅ **UI alinhada entre Clientes/Equipe/Advogados**: **COMPLETO**
  - ✅ Modal de visualização de usuário em Equipe segue padrão (`ModalHeaderGradient`, `Tabs`, `ModalSectionCard`)
  - ✅ Modal de edição de usuário com 5 abas (Perfil, Contatos, Cargo/Role, Endereços, Histórico)
  - ✅ Upload de avatar implementado com API route e Cloudinary
- [x] ✅ Filtros animados (AnimatePresence), tooltips, select "selecionar tudo" (CargosTab) funcionando.  
- [x] ✅ Modais responsivos + animações suaves (`motion`, tabs, gradientes).  
- [x] ✅ Estados erro/vazio ricos (cards com ícones, CTA, mensagens contextuais).  
- [x] ✅ Testes unitários (`npm test`): **12 testes passaram** (2 suites, 12 testes).  
- [ ] ⚠️ Testes E2E (`npm run test:e2e`): **Cancelado pelo usuário** (travou durante execução).  
- [x] ✅ Dashboard de auditoria registra ações de cargo/override sem regressões (verificado via código).  

---

## 📚 Referências

- `app/(protected)/advogados/advogados-content.tsx`  
- `components/user-management-modal.tsx`  
- `app/(protected)/clientes/clientes-content.tsx`  
- `app/(protected)/equipe/equipe-content.tsx`  
- `docs/features/tenant-dashboard-enhancements/NEXT-STEPS.md` (status da branch)

---

**Status atual:**  
- ✅ **Componentes compartilhados** (4-6): Concluídos  
- ⚠️ **Portal Advogado** (7): Fase 1 concluída, refinamentos pendentes  
- ✅ **Clientes** (8-14): Maioria concluída, alguns itens opcionais pendentes  
- ✅ **Equipe** (15-21): **COMPLETO** - Todas as pendências críticas resolvidas:
  - ✅ Toolbar com estatísticas em UsuariosTab (passo 17) - 6 cards de métricas
  - ✅ Modal de visualização refatorado com `ModalHeaderGradient`, `Tabs` e `ModalSectionCard`
  - ✅ Modal de edição completo com 5 abas (Perfil, Contatos, Cargo/Role, Endereços, Histórico)
  - ✅ Upload de avatar implementado via API route (`/api/equipe/upload-avatar`) com Cloudinary
  - ✅ Abas Endereços e Histórico integradas
- ✅ **Checklist**: Validado, E2E cancelado  

**Melhorias implementadas:**
1. ✅ **Toolbar com estatísticas** (`usuarioStats`) na aba Usuários - 6 cards de métricas com `MotionCardGrid`
2. ✅ **Modal de visualização** - refatorado para usar `ModalHeaderGradient`, `Tabs` (Resumo, Contato) e `ModalSectionCard`
3. ✅ **Modal de edição** - expandido para 5 abas completas:
   - ✅ Perfil (com upload de avatar)
   - ✅ Contatos
   - ✅ Cargo/Role
   - ✅ **Endereços** (integração com `EnderecoManager`)
   - ✅ **Histórico** (integração com `UsuarioHistoricoTab`)
4. ✅ **Upload de avatar** - implementado via API route com suporte a URL e arquivo via Cloudinary
5. ✅ **Campos adicionais** - phone, cpf, rg, dataNascimento, observacoes incluídos em `UsuarioEquipeData`
6. ✅ **EnderecoManager** - corrigido para reagir a mudanças de `userId` com dependência no `useEffect`

**Pendências opcionais (futuro):**
- CTA "Selecionar todas/Remover todas" no modal de permissões (passo 20) - opcional
- Validação com shake/motion em erros (passo 12) - opcional

**Última atualização:** 2025-01-27 - Todas as pendências críticas resolvidas. Módulo Equipe alinhado com padrões de Clientes e Advogados.
