# 🚀 Próximos Passos - Tenant Dashboard Enhancements

Este documento centraliza os próximos passos e prioridades após a conclusão do sistema de permissões e auditoria.

## ✅ Concluído Recentemente

- [x] Sistema de permissões consolidado (override → cargo → role)
- [x] Hooks e server actions para verificação de permissões
- [x] Dashboard de auditoria de permissões
- [x] Stack de testes configurada (Jest + Playwright)
- [x] Export CSV no dashboard
- [x] Logging e auditoria estruturados

## 📋 Próximas Tarefas Prioritárias

### 1. Migração de Permissões Antigas ✅ CONCLUÍDO

**Status:** ✅ **Todas as verificações já usam o novo sistema!**

**Resultado do mapeamento:**
```
✅ Uso novo de permissões: 50 ocorrências
⚠️  Uso antigo de permissões: 0 ocorrências

✨ Nenhum uso antigo encontrado! Tudo migrado para o novo sistema.
```

**O que foi verificado:**
- ✅ `checkPermission` usado em 37 ocorrências (server actions)
- ✅ `checkPermissions` usado em 11 ocorrências (batch checks)
- ✅ `usePermissionCheck` implementado (hook client-side)
- ✅ `usePermissionsCheck` implementado (hook client-side)
- ✅ Nenhum uso de `session.user.permissions` encontrado

**Ações futuras (se necessário):**
- [ ] Monitorar novos arquivos que possam usar permissões antigas
- [ ] Executar script periodicamente durante code reviews
- [ ] Adicionar lint rule para prevenir uso antigo

**Como usar o script para monitoramento:**
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
   - ✅ Fase 1 (estrutura básica, links estáticos)
   - Próximas fases:
     - Fase 2: Dados do tenant/processo
     - Fase 3: Links dinâmicos por UF
     - Fases 4-5: Calendário e comunicados (input manual)

2. **Configurações Avançadas** (expansão de `tenant-settings.md`)
   - Integrações com APIs externas
   - Webhooks
   - Backup e restore
   - Logs detalhados

3. **Team Portal UI Refresh** (`TEAM-PORTAL-UI-REFRESH.md`)
   - Uniformizar modais e seções de Equipe/Clientes/Advogados
   - Reaproveitar componentes animados, cards e tooltips
   - Garantir consistência visual e UX

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

### 4. Executar Testes Regularmente (Média Prioridade)

**Importante:** O projeto não possui pipeline automática. Testes devem ser executados manualmente.

**Ações recomendadas:**
- [ ] Executar `npm test` antes de commits importantes
- [ ] Rodar `npm run test:e2e` após mudanças significativas na UI
- [ ] Verificar cobertura com `npm run test:coverage` periodicamente
- [ ] Manter testes atualizados conforme código evolui

**Nota:** Se no futuro decidir habilitar CI/CD, consulte `CI-CD.md` e `SETUP-CI.md` como referência.

### 5. Sincronizar Novos Módulos (Alta Prioridade)

- ✅ Script CLI `npm run modules:detect` executa a varredura automática (`autoDetectModulesCore`) e limpa caches (`module-map` + `module-map-edge`).
- ✅ Endpoint interno `/api/internal/module-detect` protegido por token para uso em automações/cron.
- [ ] Configurar worker/cron (p. ex. Vercel, GitHub Actions, servidor interno) chamando o script ou endpoint para manter o catálogo sempre alinhado com novas rotas.

## 📊 Status Atual

### UI & Experiência
- 🔄 Em andamento: **Team Portal UI Refresh** (`TEAM-PORTAL-UI-REFRESH.md`)
- ✅ Portal do Advogado — Fase 1 concluída

### Sistema de Permissões
- ✅ Infraestrutura completa
- ⚠️ Migração pendente (uso antigo ainda existe)
- ✅ Testes e auditoria funcionando

### Dashboard de Auditoria
- ✅ Funcional básico implementado
- ⏳ Aguardando feedback em produção
- 📝 Melhorias planejadas

### Execução de Testes
- ✅ Stack configurada (Jest + Playwright)
- ✅ Scripts npm disponíveis
- 📝 Execução manual conforme necessário

### Próximas Features
- 📋 Portal do Advogado - Planejado
- 📋 Configurações Avançadas - Planejado

## 🎯 Recomendações de Ordem

1. ✅ **Primeiro:** Migrar permissões antigas - CONCLUÍDO
2. **Segundo:** Escolher próxima feature e começar fatiamento
3. **Terceiro:** Executar testes regularmente antes de commits importantes
4. **Em paralelo:** Coletar feedback do dashboard em produção

## 📝 Notas

- Use `scripts/map-permission-usage.js` regularmente para verificar migração
- Mantenha documentação atualizada conforme features são implementadas
- Colete feedback de forma estruturada (forms, issues, etc.)
- Priorize features que trazem valor imediato aos usuários

---

**Última atualização:** Após conclusão do sistema de permissões e remoção do CI/CD
**Próxima revisão:** Conforme novas features forem implementadas
