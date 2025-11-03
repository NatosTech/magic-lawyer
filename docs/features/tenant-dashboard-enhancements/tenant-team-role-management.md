# Gestão de Equipe do Tenant (`/equipe`)

Planejamento detalhado da feature que espelha o controle de módulos, mas focada nos cargos da equipe de um tenant específico.

## ✅ Objetivos
- Exibir, criar e editar cargos do tenant com os campos obrigatórios (nome, nível hierárquico, descrição, status ativo).
- Listar, por cargo, os módulos disponíveis apenas para o tenant corrente.
- Refletir em tempo real qualquer alteração no catálogo de módulos permitidos ao tenant.

## 🧭 Checklist Detalhado

### 1. Descoberta e Alinhamento
- [ ] Levantar como funciona hoje o controle de módulos do super admin (UI, fluxo, APIs, modelos).
- [ ] Identificar quais partes podem ser reutilizadas no contexto de tenant (componentes, hooks, serviços).
- [ ] Documentar diferenças necessárias (limitar módulos ao tenant, real-time focado nesse escopo, campos adicionais do cargo).
- [ ] Confirmar convenções de canal realtime (`REALTIME_CHANNEL_PREFIX`, payloads, eventos disponíveis).

### 2. Domínio e Dados
- [ ] Mapear entidades relacionadas (`Cargo`, `Tenant`, `Modulo`, `Permissão`) e relações exigidas pelo novo fluxo.
- [ ] Validar em prisma/schema se já existem campos para nível hierárquico, descrição e status; planejar migrações caso necessário.
- [ ] Garantir que o modelo suporte múltiplos cargos por tenant e associação N:N com módulos.
- [ ] Definir regras de negócio (ex.: nível hierárquico obrigatório? valores pré-definidos? cargo inativo bloqueia login?).

### 3. APIs e Backend
- [x] Inventariar endpoints existentes para módulos/cargos e decidir se serão reutilizados ou estendidos.
- [x] Criar/ajustar endpoint que lista apenas os módulos liberados para o tenant logado.
- [ ] Disponibilizar endpoint para CRUD de cargos com validações de campos obrigatórios.
- [ ] Implementar atualização de permissões (associação módulo ↔ cargo) respeitando escopo do tenant.
- [ ] Em eventos de alteração (ex.: novo módulo liberado ao tenant), publicar mensagem realtime para o canal correspondente.
- [ ] Garantir logs e auditoria (quem criou/editou cargo, quais permissões foram alteradas).

### 4. Frontend (Next.js)
- [ ] Configurar rota `/equipe` apontando para o dashboard correto.
- [ ] Estruturar layout similar ao controle de módulos, adaptando copy e `empty states`.
- [ ] Construir formulário de cargo com campos: nome, nível hierárquico (dropdown/numérico), descrição (textarea) e toggle de status.
- [x] Implementar listagem de módulos do tenant com seleção (checkbox/switch), agrupamentos e busca conforme necessário.
- [x] Revisar a aba **Usuários** garantindo que o modal/fluxo de edição do usuário habilite alteração de dados, permissões e vínculo de cargo (atualmente quebrado).
- [x] Validar que todos os botões/ações exibidos na tela possuem implementação real; remover mocks/placeholders remanescentes.
- [x] Documentar no próprio modal de permissões a precedência (override → cargo → role) e o significado dos chips.
- [ ] Reutilizar componentes compartilhados (tables, forms) ou criar variantes específicas se o design pedir.
- [ ] Tratar estados de carregamento, erro, permissões insuficientes e feedback ao usuário.

### 5. Realtime e Sincronização
- [x] Assinar o canal realtime do tenant logo após montar a página, usando o prefixo configurado.
- [x] Atualizar imediatamente a lista de módulos exibidos quando o tenant ganhar/perder acesso.
- [x] Sincronizar alterações de cargos entre múltiplos usuários (ex.: criação/edição em outra aba).
- [ ] Garantir reconexão e tratamento de queda de conexão.

### 6. Experiência do Usuário
- [ ] Validar micro-interações (loading nos botões, tooltips para níveis hierárquicos, confirmations).
- [ ] Revisar textos, traduções e acessibilidade (labels, ARIA, navegação por teclado).
- [ ] Garantir que o fluxo siga o design system (cores, espaçamentos, tipografia).

### 7. Qualidade e Testes
- [ ] Criar testes unitários para hooks/services que filtram módulos por tenant.
- [ ] Adicionar testes de integração para endpoints de cargos e permissões.
- [ ] Preparar testes e2e cobrindo CRUD de cargos e sincronização realtime.
- [ ] Validar manualmente cenários críticos (tenant sem módulos, muitos módulos, cargo inativo).

### 8. Documentação e Entrega
- [ ] Atualizar README/guia interno com instruções de uso da página `/equipe`.
- [ ] Registrar no changelog ou doc de release as mudanças relevantes.
- [ ] Incluir plano de rollout e comunicação com clientes se necessário.
- [ ] Preparar métricas a monitorar após deploy (erros, tempo de resposta, uso do realtime).

---

> Conforme novos requisitos surgirem, adicionar mais itens a este checklist para manter o acompanhamento completo da feature.
