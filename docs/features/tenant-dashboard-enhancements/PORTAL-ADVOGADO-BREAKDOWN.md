# Portal do Advogado - Breakdown em Subtarefas

Este documento quebra o Portal do Advogado em subtarefas menores e priorizadas para desenvolvimento incremental.

## 🎯 MVP (Minimum Viable Product)

**Escopo mínimo para lançamento inicial:**
- Links para portais principais (TJBA, TRT5, TRF1) no sidebar
- Página básica com seções para Recessos, Comunicados e Links Rápidos
- Exibição estática de informações (sem integração automática inicial)
- Suporte a múltiplas UFs (usando dados do Tenant e Processo)

## 📋 Fases de Desenvolvimento

### Fase 1: Estrutura Básica (Semana 1)

**Objetivo:** Criar a base do portal sem integrações complexas.

#### 1.1 Estrutura de Navegação
- [ ] Adicionar item "Portal do Advogado" no sidebar
- [ ] Definir ícone apropriado (ex: `Gavel`, `Scale`, `Building`)
- [ ] Criar rota `/portal-advogado`
- [ ] Configurar permissão de acesso (ADMIN, ADVOGADO)

**Estimativa:** 2-3 horas

#### 1.2 Layout da Página
- [ ] Criar componente `PortalAdvogadoPage` (Server Component)
- [ ] Estruturar layout com seções:
  - Header com título e descrição
  - Cards para cada seção principal
  - Espaço para conteúdo futuro
- [ ] Adicionar estados de loading e empty state

**Estimativa:** 3-4 horas

#### 1.3 Seções Básicas (Placeholder)
- [ ] Card "Links para Tribunais"
- [ ] Card "Calendário de Recessos" (placeholder)
- [ ] Card "Comunicados e Editais" (placeholder)
- [ ] Card "Links Úteis" (lista estática inicial)

**Estimativa:** 2-3 horas

**Total Fase 1:** ~8-10 horas

---

### Fase 2: Dados do Tenant/Processo (Semana 1-2)

**Objetivo:** Validar e usar dados de UF já existentes.

#### 2.1 Validar Dados Existentes
- [ ] Verificar se `Tenant` tem campo de UF (ex: `Endereco.estado`)
- [ ] Verificar se `Processo` tem campo de UF (ex: `Processo.tribunalId → Tribunal.uf`)
- [ ] Documentar estrutura atual no Prisma schema
- [ ] Criar queries de exemplo para validar dados

**Estimativa:** 2-3 horas

#### 2.2 Server Actions para Dados
- [ ] Criar `app/actions/portal-advogado.ts`
- [ ] Implementar `getTenantUF()` - busca UF principal do tenant
- [ ] Implementar `getProcessosUFs()` - lista UFs onde tenant tem processos
- [ ] Implementar `getTribunaisPorUF()` - lista tribunais de uma UF

**Estimativa:** 3-4 horas

#### 2.3 Componente de Seleção de UF
- [ ] Criar componente `UFSelector` (client component)
- [ ] Exibir UF do tenant como padrão
- [ ] Permitir filtrar por outras UFs onde há processos
- [ ] Integrar com SWR para cache

**Estimativa:** 3-4 horas

**Total Fase 2:** ~8-11 horas

---

### Fase 3: Links e Navegação (Semana 2)

**Objetivo:** Funcionalidade completa de links para tribunais.

#### 3.1 Base de Dados de Tribunais
- [ ] Criar/carregar tabela `Tribunal` (se não existir completamente)
- [ ] Popular com tribunais principais (TJBA, TRT5, TRF1, etc.)
- [ ] Campos: nome, sigla, UF, URL do portal, tipo (Estadual, Trabalhista, Federal)
- [ ] Criar seed ou migration

**Estimativa:** 2-3 horas

#### 3.2 Componente de Links para Tribunais
- [ ] Criar `TribunaisLinksCard` component
- [ ] Buscar tribunais da UF selecionada
- [ ] Exibir cards por tribunal com:
  - Nome e sigla
  - Botão "Acessar Portal" (link externo)
  - Badge de tipo (Estadual, Trabalhista, Federal)
- [ ] Adicionar busca/filtro se muitos tribunais

**Estimativa:** 4-5 horas

#### 3.3 Links Úteis (Estáticos Iniciais)
- [ ] Criar `LinksUteisCard` component
- [ ] Lista inicial de links comuns:
  - Consulta Processual CNJ
  - PJe
  - e-Jus
  - Portal do CNJ
  - OAB Nacional
- [ ] Permitir adicionar links customizados por tenant (futuro)

**Estimativa:** 2-3 horas

**Total Fase 3:** ~8-11 horas

---

### Fase 4: Calendário de Recessos (Semana 3-4)

**Objetivo:** Exibir recessos forenses de forma organizada.

#### 4.1 Modelo de Dados
- [ ] Criar `RecessoForense` no Prisma schema:
  - `tribunalId` (FK Tribunal)
  - `dataInicio`, `dataFim`
  - `tipo` (Recesso, Feriado, Suspensão)
  - `descricao`
  - `fonte` (manual, API, scraping)
- [ ] Criar migration
- [ ] Criar server action `getRecessosPorTribunal()`

**Estimativa:** 3-4 horas

#### 4.2 Componente de Calendário
- [ ] Criar `RecessosCalendarCard` component
- [ ] Exibir lista de recessos por tribunal
- [ ] Filtros por:
  - Tribunal
  - Tipo (Recesso, Feriado, Suspensão)
  - Período (próximos 30 dias, próximos 90 dias)
- [ ] Destaque para recessos ativos (hoje)

**Estimativa:** 5-6 horas

#### 4.3 Input Manual (MVP)
- [ ] Criar form para adicionar recesso manualmente
- [ ] Apenas ADMIN pode adicionar
- [ ] Validar datas e campos obrigatórios
- [ ] Integrar com server action

**Estimativa:** 3-4 horas

**Total Fase 4:** ~11-14 horas

---

### Fase 5: Comunicados e Editais (Semana 4-5)

**Objetivo:** Centralizar comunicados importantes.

#### 5.1 Modelo de Dados
- [ ] Criar `ComunicadoTribunal` no Prisma schema:
  - `tribunalId` (FK Tribunal)
  - `titulo`, `conteudo` (texto)
  - `dataPublicacao`, `dataExpiracao` (opcional)
  - `tipo` (Comunicado, Edital, Intimação)
  - `url` (link externo se houver)
  - `lidoPor` (array de userId - tracking)
- [ ] Criar migration
- [ ] Criar server actions CRUD

**Estimativa:** 3-4 horas

#### 5.2 Componente de Lista
- [ ] Criar `ComunicadosCard` component
- [ ] Exibir lista de comunicados:
  - Cards com título, data, tribunal
  - Badge de "Novo" para não lidos
  - Link para conteúdo completo
- [ ] Filtros por tribunal, tipo, período
- [ ] Paginação se muitos itens

**Estimativa:** 5-6 horas

#### 5.3 Input Manual (MVP)
- [ ] Criar form para adicionar comunicado manualmente
- [ ] Apenas ADMIN pode adicionar
- [ ] Upload de PDF/arquivo (opcional)
- [ ] Integrar com server action

**Estimativa:** 3-4 horas

**Total Fase 5:** ~11-14 horas

---

### Fase 6: Integrações Automáticas (Futuro - Semana 6+)

**Objetivo:** Automatizar coleta de dados externos.

#### 6.1 Pesquisa de APIs
- [ ] Pesquisar APIs oficiais de TJBA, TRT5, TRF1
- [ ] Validar RSS/Atom feeds disponíveis
- [ ] Avaliar APIs de terceiros (Jusbrasil, etc.)
- [ ] Documentar custos e requisitos

**Estimativa:** 4-6 horas (pesquisa)

#### 6.2 Implementar Scraping/API (Se viável)
- [ ] Criar service para cada tribunal
- [ ] Implementar parsing de dados
- [ ] Configurar jobs/cron para atualização
- [ ] Tratamento de erros e fallbacks

**Estimativa:** 16-24 horas (complexo)

#### 6.3 Notificações
- [ ] Avisar quando novo recesso/comunicado detectado
- [ ] Badge de "Novo" no sidebar
- [ ] Toast/notificação push

**Estimativa:** 4-6 horas

**Total Fase 6:** ~24-36 horas (opcional)

---

## 📊 Resumo de Estimativas

| Fase | Descrição | Estimativa | Prioridade |
|------|-----------|------------|------------|
| 1 | Estrutura Básica | 8-10h | 🔴 Alta |
| 2 | Dados do Tenant/Processo | 8-11h | 🔴 Alta |
| 3 | Links e Navegação | 8-11h | 🔴 Alta |
| 4 | Calendário de Recessos | 11-14h | 🟡 Média |
| 5 | Comunicados e Editais | 11-14h | 🟡 Média |
| 6 | Integrações Automáticas | 24-36h | 🟢 Baixa (Futuro) |

**MVP Total (Fases 1-3):** ~24-32 horas  
**Completo (Fases 1-5):** ~46-60 horas  
**Com Integrações (Fases 1-6):** ~70-96 horas

## 🚀 Recomendações de Priorização

1. **Sprint 1:** Fases 1 e 2 (estrutura + dados básicos)
   - Entrega: Portal acessível no sidebar com estrutura básica
   - Valor: Usuários já podem navegar e ver estrutura

2. **Sprint 2:** Fase 3 (links para tribunais)
   - Entrega: Links funcionais para todos os tribunais
   - Valor: Acesso rápido aos portais oficiais

3. **Sprint 3:** Fase 4 (calendário de recessos - manual)
   - Entrega: Calendário com input manual
   - Valor: Organização de recessos por tribunal

4. **Sprint 4:** Fase 5 (comunicados - manual)
   - Entrega: Sistema de comunicados com input manual
   - Valor: Centralização de informações importantes

5. **Futuro:** Fase 6 (integrações automáticas)
   - Avaliar ROI após feedback dos usuários
   - Decidir se vale investimento em scraping/APIs

## 📝 Notas Importantes

- **MVP focado:** Fases 1-3 entregam valor imediato com esforço controlado
- **Input manual primeiro:** Mais seguro e rápido que integrações complexas
- **Dados reais:** Usar dados de UF já existentes no sistema
- **Feedback cedo:** Lançar MVP e coletar feedback antes de Fase 6
- **Iterativo:** Cada fase pode ser ajustada baseada em feedback

---

**Criado em:** Após análise do checklist original  
**Próxima revisão:** Após início da Fase 1

