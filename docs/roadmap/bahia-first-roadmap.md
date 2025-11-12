# Bahia First Roadmap Blueprint

## Visão Geral
- **Objetivo**: Lançar o Magic Lawyer inicialmente para escritórios de Salvador e Região Metropolitana, validando produto e operação antes de expandir.
- **Foco do Cliente**: Escritórios de pequeno a médio porte que atuam majoritariamente em Direito Cível e Trabalhista na Bahia.
- **Principais Diferenciais**: Atualizações automáticas de processos, área do cliente com comunicação transparente e onboarding inteligente com consulta CPF/CNPJ.

---

## Fase 1 — Produto Mínimo Vendível (PMV) · 30 dias
**Meta**: Entregar valor imediato para advogados pagarem na primeira demonstração.

| Entregável | Descrição | Checklist |
| --- | --- | --- |
| Cadastro inteligente | Consulta automática de CPF/CNPJ via BrasilAPI (futuro SERPRO) para acelerar onboarding | - [ ] Integração BrasilAPI<br>- [ ] Normalização de dados para cadastro de cliente<br>- [ ] Logs de erro e fallback manual |
| Gestão básica de processos | Cadastro e vínculo de processo CNJ ao cliente com status e última movimentação | - [ ] Formulário com validação CNJ<br>- [ ] Associação a cliente<br>- [ ] Painel interno com filtros simples |
| Dashboard simples | Visão dos processos com status, última movimentação e alerta visual | - [ ] Lista com ordenação por atualização<br>- [ ] Etiquetas de status padronizadas<br>- [ ] Indicador de pendências |
| Área do cliente | Portal web responsivo + QR para acesso rápido às atualizações | - [ ] Autenticação segura por token<br>- [ ] Visão simplificada do caso<br>- [ ] Histórico de movimentações |
| E-mails automáticos | Notificação de atualização enviada ao cliente | - [ ] Template de e-mail padrão<br>- [ ] Configuração SendGrid<br>- [ ] Opt-out por cliente |

**Infra estimada**: Supabase/Neon (R$ 0–49), Vercel Pro (R$ 90), SendGrid (free tier).  
**Preço recomendado**: R$ 99–299/mês por escritório.

---

## Fase 2 — Captura Automática de Andamentos · 60–90 dias
**Meta**: Eliminar cadastros manuais garantindo confiança nos dados.

| Entregável | Descrição | Checklist |
| --- | --- | --- |
| Coleta automática TJBA | Raspagem autorizada (e-SAJ) focada nos processos da patrona | - [ ] Agendamento via cron<br>- [ ] Mecanismo de retries<br>- [ ] Auditoria por processo |
| Integração PJe TRT5/TRF1 | Consulta autenticada com certificado A1 | - [ ] Gestão segura de certificados<br>- [ ] Normalização dos campos PJe<br>- [ ] Logs com nível de detalhe jurídico |
| Normalização de linguagem | Traduzir movimentações para vocabulário uniforme | - [ ] Dicionário de movimentos<br>- [ ] API interna de normalização<br>- [ ] Indicador de tipo de evento |
| Linha do tempo unificada | Visual costurado das movimentações | - [ ] Ordenação cronológica<br>- [ ] Agrupamento por tipo (prazo, audiência, sentença)<br>- [ ] Link para documento original |

**Infra adicional**: Redis (Upstash R$ 20–60), Worker (Railway/Fly.io R$ 5–15), Certificado A1 (R$ 150–250/ano).  
**Preço recomendado**: R$ 199–599/mês.

---

## Fase 3 — Notificações Automáticas de Prazos · 30–45 dias
**Meta**: Garantir que nenhuma novidade crítica passe despercebida.

| Entregável | Descrição | Checklist |
| --- | --- | --- |
| Comunicação multicanal | WhatsApp e e-mail para atualizações e audiências | - [ ] Integração TotalVoice/Zenvia<br>- [ ] Gestão de templates<br>- [ ] Failover para e-mail |
| Alertas de prazo | SMS/Push para prazos vencendo | - [ ] Motor de SLA de prazos<br>- [ ] Configuração por escritório<br>- [ ] Registro de envio e confirmação |
| Painel de notificações | Histórico completo de mensagens enviadas | - [ ] Filtro por processo e canal<br>- [ ] Reenvio manual<br>- [ ] Exportação CSV |

**Custo transacional**: WhatsApp R$ 0,08–0,25/msg, SMS R$ 0,05–0,12/msg ( repassável).

### Integrações priorizadas

- [ ] **Meta WhatsApp Cloud API** — webhook, templates oficializados e roteamento automático de conversas para deadlines e atualizações de clientes.
- [ ] **ClickSign** — sincronizar envelopes, status e documentos assinados diretamente com contratos e procurações do Magic Lawyer.

---

## Fase 4 — Assinatura & Procuração Digital · 30–60 dias
**Meta**: Centralizar formalização sem sair do sistema.

| Entregável | Descrição | Checklist |
| --- | --- | --- |
| Integração Clicksign/D4Sign | Contratos de honorários e acordos | - [ ] Templates parametrizados<br>- [ ] Workflow de assinatura<br>- [ ] Armazenamento seguro dos documentos |
| Assinador gov.br | Procurações e atos oficiais | - [ ] Integração via API<br>- [ ] Gestão de status da assinatura<br>- [ ] Notificação de conclusão |
| Painel financeiro básico | Relacionar casos e honorários | - [ ] Registro de contratos<br>- [ ] Indicadores por cliente<br>- [ ] Exportação resumida |

---

## Fase 5 — Automação de Peticionamento (PJe) · 6–12 meses após faturar
**Meta**: Submissão direta com ganho de escala.

- [ ] Peticionamento em lote com certificados por patrono
- [ ] Distribuição automática (quando permitida)
- [ ] Validação de documentos e anexos
- [ ] Logs detalhados para auditoria

---

## Fase 6 — Inteligência Prática
**Meta**: Transformar dados em ações sugeridas.

- [ ] Resumo automático de movimentações com linguagem natural
- [ ] Sugestões de próximos passos por tipo de evento
- [ ] Data lake enxuto para análises comparativas
- [ ] Relatórios executivos por carteira de cliente

---

## Gestão de Certificados A1
**Fluxo preparado para habilitar integrações PJe assim que o escritório anexar o certificado.**

| Etapa | Responsável | Checklist |
| --- | --- | --- |
| Upload seguro no painel | Advogado administrador | - [ ] Tela com upload de arquivo .pfx/.p12<br>- [ ] Campo para senha do certificado<br>- [ ] Criptografia em repouso + instruções para o usuário<br>- [ ] Possibilidade de desativar temporariamente o certificado |
| Armazenamento protegido | Backend | - [ ] Criptografia AES-256 com chave gerenciada (env `CERT_SECRET_KEY`)<br>- [ ] Rotina de rotação de chave/documentação<br>- [ ] Flag `isActive` para habilitar/desabilitar integrações<br>- [ ] Logs mínimos sem expor conteúdo |
| Monitoramento e validade | Sistema | - [ ] Campo `validUntil` + cron de alerta (30/10/5 dias)<br>- [ ] Auditoria de uso (última operação executada)<br>- [ ] Botão de download somente para responsáveis<br>- [ ] Endpoint de teste de conexão com PJe |

**Próximos passos técnicos**
- [ ] Atualizar schema Prisma com tabela `DigitalCertificates` vinculada ao tenant/patrono.
- [ ] Implementar serviço de criptografia/descrição com libs internas (`libs/crypto`).
- [ ] Criar API para upload/download com autenticação forte + registro de trilha.
- [ ] Expor no painel (`app/(protected)/configuracoes`) card “Certificados PJe” com status.

**Resultado final esperado**
- Painel “Certificados PJe” exibindo status (ativo/inativo/pendente), responsável pelo upload, validade e últimas verificações.
- Upload de arquivos `.pfx/.p12` feito pelo próprio escritório, com criptografia imediata e trilha de auditoria (`DigitalCertificateLog`).
- Possibilidade de ativar/desativar integrações PJe a qualquer momento, refletindo em todos os serviços dependentes.
- Alertas automáticos quando o certificado estiver perto de expirar (30/10/5 dias) e testes rápidos de conexão direto da interface.
- Workers de captura PJe prontos para consumir o certificado ativo sem etapas manuais adicionais.

---

## Plano de Expansão Geográfica
1. **Bahia (Salvador + RMS)** — meta: 10 escritórios
2. **Nordeste (PE, SE, CE, RN)** — meta: 30 escritórios
3. **Brasil** — integração DataJud e cobertura nacional

---

## Métricas de Sucesso
- Tempo médio entre movimentação e notificação enviada
- Percentual de clientes que acessam a área do cliente semanalmente
- Redução de mensagens “tem novidade?” por escritório
- Receita recorrente mensal por região
- Taxa de conversão demonstração → contrato

---

## Próximos Passos Imediatos
- [ ] Validar perfil inicial do cliente (solo, pequeno, médio, cível, trabalhista etc.)
- [ ] Definir pricing e pacotes de lançamento
- [ ] Preparar materiais comerciais (copy, apresentação, script demo)
- [ ] Selecionar escritórios beta em Salvador para pilotos pagos

> Esta blueprint faz parte da pasta `docs/roadmap` dedicada a planejamentos estratégicos e expansão regional do Magic Lawyer.
