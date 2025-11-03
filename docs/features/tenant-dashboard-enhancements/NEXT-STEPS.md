# 🚀 Próximos Passos - Tenant Dashboard Enhancements

Este documento centraliza os próximos passos e prioridades após a conclusão do sistema de permissões e auditoria.

## ✅ Concluído Recentemente

- [x] Sistema de permissões consolidado (override → cargo → role)
- [x] Hooks e server actions para verificação de permissões
- [x] Dashboard de auditoria de permissões
- [x] Stack de testes completa (Jest + Playwright)
- [x] CI/CD configurado com validação e monitoramento
- [x] Export CSV no dashboard
- [x] Logging e auditoria estruturados

## 📋 Próximas Tarefas Prioritárias

### 1. Migração de Permissões Antigas (Alta Prioridade)

**Objetivo:** Garantir que todas as verificações de permissão usem o novo sistema consolidado.

**Ações:**
- [ ] Executar `node scripts/map-permission-usage.js` para mapear uso atual
- [ ] Identificar arquivos que ainda usam `session.user.permissions`
- [ ] Substituir por `usePermissionCheck` ou `checkPermission` conforme contexto
- [ ] Testar cada substituição para garantir comportamento correto
- [ ] Validar que overrides e cargos estão sendo respeitados

**Arquivos a verificar:**
- Componentes que renderizam botões baseados em permissões
- Guards de rota e middleware
- Server actions que verificam permissões manualmente

**Como usar o script:**
```bash
node scripts/map-permission-usage.js
```

### 2. Dashboard de Auditoria - Feedback em Produção (Média Prioridade)

**Objetivo:** Coletar feedback real de uso e melhorar a experiência.

**Ações:**
- [ ] Deploy do dashboard em produção
- [ ] Monitorar uso por 7-14 dias
- [ ] Coletar feedback sobre:
  - Campos adicionais necessários
  - Filtros que deveriam ser salvos
  - Alertas para recusas suspeitas
  - Performance com grandes volumes
- [ ] Implementar melhorias baseadas em feedback

**Métricas a acompanhar:**
- Volume de recusas por módulo/ação
- Usuários com mais recusas
- Padrões de acesso negado

**Possíveis melhorias futuras:**
- Filtros salvos por usuário
- Alertas automáticos para padrões suspeitos
- Export em outros formatos (PDF, Excel)
- Dashboard de métricas agregadas
- Integração com notificações

### 3. Priorizar Próximas Features do Branch (Alta Prioridade)

**Features disponíveis:**
1. **Portal do Advogado** (`portal-advogado.md`)
   - Calendário de recessos
   - Plantões e pautas
   - Links para tribunais
   - Comunicados e editais

2. **Configurações Avançadas** (expansão de `tenant-settings.md`)
   - Integrações com APIs externas
   - Webhooks
   - Backup e restore
   - Logs detalhados

**Como priorizar:**
- Avaliar valor de negócio de cada feature
- Verificar dependências técnicas
- Consultar stakeholders sobre urgência
- Escolher item de maior valor
- Fatiar em tarefas menores e implementar incrementalmente

**Template de fatiamento:**
1. Criar checklist detalhado (baseado no documento)
2. Identificar MVP (funcionalidade mínima viável)
3. Implementar MVP
4. Testar e coletar feedback
5. Iterar e expandir

### 4. Manter CI/CD Saudável (Média Prioridade)

**Ações imediatas:**
- [ ] Monitorar primeiro run do workflow no GitHub Actions
- [ ] Verificar se job `validate-env` está funcionando
- [ ] Confirmar que secrets estão configurados
- [ ] Validar monitoramento de memória
- [ ] Ajustar thresholds se necessário

**Checklist pós-primeiro-run:**
- [ ] Todos os jobs passaram?
- [ ] Secrets configurados corretamente?
- [ ] Memória dos services dentro dos limites?
- [ ] Testes executaram com sucesso?
- [ ] Relatórios de cobertura gerados?

**Ajustes comuns:**
- Limites de memória dos services (se houver OOM)
- Timeout dos jobs (se muito lentos)
- Retry logic (se houver flakiness)
- Caching (para acelerar builds)

## 📊 Status Atual

### Sistema de Permissões
- ✅ Infraestrutura completa
- ⚠️ Migração pendente (uso antigo ainda existe)
- ✅ Testes e auditoria funcionando

### Dashboard de Auditoria
- ✅ Funcional básico implementado
- ⏳ Aguardando feedback em produção
- 📝 Melhorias planejadas

### CI/CD
- ✅ Workflow configurado
- ⏳ Aguardando primeiro run
- 📝 Ajustes podem ser necessários

### Próximas Features
- 📋 Portal do Advogado - Planejado
- 📋 Configurações Avançadas - Planejado

## 🎯 Recomendações de Ordem

1. **Primeiro:** Migrar permissões antigas (garante consistência)
2. **Segundo:** Monitorar CI/CD no primeiro run (garante infraestrutura)
3. **Terceiro:** Escolher próxima feature e começar fatiamento
4. **Em paralelo:** Coletar feedback do dashboard em produção

## 📝 Notas

- Use `scripts/map-permission-usage.js` regularmente para verificar migração
- Mantenha documentação atualizada conforme features são implementadas
- Colete feedback de forma estruturada (forms, issues, etc.)
- Priorize features que trazem valor imediato aos usuários

---

**Última atualização:** Após conclusão do sistema de permissões e CI/CD
**Próxima revisão:** Após primeiro run do CI/CD e migração de permissões

