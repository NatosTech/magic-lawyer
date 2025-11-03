# Portal do Advogado (Sidebar)

Planejamento da nova área dedicada a informações úteis para advogados dentro do painel.

## ✅ Objetivos
- Exibir portais e serviços essenciais (TJBA, TRT5, TRF1, etc.) com dados atualizados.
- Facilitar o acesso a informações de plantões, recessos forenses, suspensões de prazos e comunicados.
- Centralizar links rápidos, autenticação e notificações relevantes ao dia a dia jurídico do tenant.
- Verificar se no cadastro do Tenant tem a UF que ele está centralizado, e se no processo, tem a UF aonde roda o processo

## 🧭 Checklist Detalhado

### 1. Descoberta e Curadoria de Conteúdo
- [ ] Levantar necessidades do usuário final (advogado) com entrevistas/notas da Dra. Sandra.
- [ ] Catalogar portais obrigatórios por tribunal (TJBA, TRT5, TRF1) e outros que surgirem.
- [ ] Mapear quais informações cada portal oferece (recesso, pautas, Diário Oficial, andamentos, intimações).
- [ ] Definir frequência de atualização desejada (tempo real, diário, manual).
- [ ] Verificar se o cadastro do tenant armazena a UF de atuação principal e se cada processo registra a UF de tramitação; alinhar como essas informações direcionam avisos (ex.: liminares impactadas por recessos locais).

### 2. Fontes de Dados e Integrações
- [ ] Pesquisar APIs oficiais ou serviços públicos para TJBA, TRT5 e TRF1 (ex.: calendários, recessos, pautas).
- [ ] Validar disponibilidade de RSS/Atom, arquivos ICS, endpoints JSON ou scraping permitido por termos de uso.
- [ ] Listar alternativas privadas/APIs de terceiros que agregam dados jurídicos (ex.: Jusbrasil, Preâmbulo, CPTEC).
- [ ] Documentar fallback quando não houver API oficial (automatizar download de editais, scraping com consentimento, input manual).
- [ ] Definir estratégia de autenticação se algum portal exigir login (cookies, certificados, OAuth).
- [ ] Investigar serviços que, a partir do número da OAB, retornem processos vinculados ao advogado (APIs públicas, convênios ou integrações comerciais) e mapear requisitos de segurança/custos.

### 3. Arquitetura e Backend
- [ ] Projetar serviço agregador que normalize dados de múltiplas fontes (ex.: recesso → formato único).
- [ ] Implementar caching e políticas de atualização para evitar rate limits.
- [ ] Criar endpoints para expor calendários, comunicados e links úteis ao frontend.
- [ ] Configurar observabilidade para monitorar falhas de coleta (alertas quando fonte ficar indisponível).

- [x] Adicionar item “Portal do Advogado” no sidebar com ícone condizente.
- [x] Definir layout com seções (Calendário de Recessos, Comunicados, Links Rápidos, Status dos Tribunais).
- [x] Implementar cards/listas com estados de carregamento e fallback quando não houver dados.
- [ ] Permitir filtros por tribunal, tipo de comunicado e período.
- [ ] Avaliar integrações com calendário pessoal (export `.ics`) e notificações push.

### 5. Realtime e Atualizações
- [ ] Configurar jobs/cron ou webhooks para atualizar dados conforme disponibilidade das fontes.
- [ ] Avisar usuários (toast/badge) quando novos comunicados relevantes forem publicados.
- [ ] Sincronizar visualização multiusuário (ex.: marcação de comunicado como lido).

### 6. Legal & Compliance
- [ ] Revisar termos de uso dos portais para garantir conformidade com scraping/integrations.
- [ ] Documentar créditos e links oficiais exigidos pelos tribunais.
- [ ] Tratar dados pessoais/quebra de sigilo (não expor processos sigilosos).

### 7. Testes e Qualidade
- [ ] Escrever testes para parsers/adapters de cada fonte de dados.
- [ ] Validar manualmente cenários de indisponibilidade (portal fora do ar, dado incompleto).
- [ ] Preparar testes e2e do fluxo no dashboard (carregamento, filtros, exportações).

### 8. Documentação e Rollout
- [ ] Registrar instruções de configuração das integrações (tokens, certificados, cron jobs).
- [ ] Incluir guia rápido para o usuário final sobre funcionalidades da aba.
- [ ] Planejar comunicação do lançamento (release notes, walkthrough com clientes).

---

> Toda nova funcionalidade relacionada ao Judiciário deve ser detalhada neste documento para manter o escopo centralizado.
