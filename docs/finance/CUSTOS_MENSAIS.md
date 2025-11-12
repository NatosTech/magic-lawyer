# 📊 Magic Lawyer — Plano Financeiro Mensal Completo

> Câmbio de referência: **1 USD = R$ 5,50** (10/11/2025). Todos os valores estão arredondados para facilitar a apresentação a sócios/investidores.

## Visão Rápida para Investidores

- **Investimento mensal para manter o produto vivo (infra fixa + ferramentas obrigatórias): R$ 1.977.**
- **Provisionamento de variáveis para operar o volume atual (pagamentos, mídia, notificações, backups): R$ 2.350.**
- **Capex recorrente total (fixo + variáveis moderadas): ~R$ 4.000/mês.**
- **Break-even:** alcançado com **5 clientes Básico + 3 Pro + 1 Enterprise (R$ 4.641/mês)** ou qualquer mix equivalente de receita.
- **Assinaturas sugeridas:** R$ 249 (Básico), R$ 699 (Pro), R$ 1.299 (Enterprise) e plano Ultra sob consulta, com entregáveis claros para cada faixa.

---

## Checklist do que Mantém o Projeto Online

| Serviço | Função no produto | Plano / licenças | Ciclo | USD/mês | BRL/mês* | Observações chave |
| --- | --- | --- | --- | --- | --- | --- |
| **Vercel** | Hosting Next.js 15 + crons | Team Pro – 2 seats | Mensal | 40 | **R$ 220** | Edge, subdomínios por tenant e cron jobs (`vercel.json`). |
| **Neon / Supabase (PostgreSQL)** | Banco multi-tenant via Prisma | Pro 2 CU / 500 GB | Mensal | 79 | **R$ 435** | Backups automáticos + réplicas. |
| **Upstash Redis** | BullMQ, deduplicação e locks | Pro 100 M comandos | Mensal | 20 | **R$ 110** | Worker + filas realtime. |
| **Ably Realtime** | WebSockets multi-tenant | Business Scale 3 M msgs | Mensal | 49 | **R$ 270** | Canais por tenant com SLA 99,99 %. |
| **Cloudinary** | Armazenamento pesado de documentos | Advanced 600 créditos | Mensal | 99 | **R$ 545** | ~300 GB + 600k transformações. |
| **Google Workspace** | SMTP e contas operacionais | Business Starter (2 usuários) | Mensal | — | **R$ 78** | 1 conta DEFAULT + 1 ADMIN. |
| **Domínios + Cloudflare** | `magiclawyer.com.br` + `.com` + SSL | Registro anual + CF Pro | Mensalizado | — | **R$ 45** | Inclui DNS gerenciado e WAF básico. |
| **Clicksign** | Assinaturas eletrônicas com API | Plus 200 docs/mês | Mensal | — | **R$ 299** | Inclui WhatsApp + API oficial ([fonte](https://www.clicksign.com/plans), 11/2025). |

\* Conversão com 1 USD = R$ 5,50.

**Subtotal fixo obrigatório:** **R$ 1.977/mês.**

---

## Custos Variáveis e Dependentes de Volume

| Item | Métrica | Referência 2025 | Exemplo mensal | Investimento (R$) | Observações |
| --- | --- | --- | --- | --- | --- |
| **Asaas (cobrança)** | Taxa por boleto/PIX/cartão | Boleto R$ 1,99; PIX R$ 1,99 (30 grátis); Cartão 2,99 % + R$ 0,49 | 200 boletos + 100 PIX + 80 cartões (ticket R$ 350) | **1.414** | Ajustar conforme negociação comercial. |
| **Cloudinary créditos extras** | Crédito excedente | US$ 0,15/crédito adicional | +300 créditos | **248** | Quando ultrapassar 600 créditos. |
| **Ably excedente** | Mensagens adicionais | US$ 2,50 por milhão | +5 M mensagens | **69** | Relevante em push massivo. |
| **Upstash overage** | Comandos extras | US$ 0,20 / 100 k comandos | +300 k | **3** | Baixo impacto; só monitorar. |
| **Backups S3/Wasabi** | GB armazenado | US$ 0,023/GB | 200 GB | **25** | Snapshots + assets críticos. |
| **ngrok Pro** | Túnel para webhooks QA | US$ 16 | 1 túnel dedicado | **88** | Necessário para Asaas em homologação. |
| **Resend (fallback e-mail)** | 30 k envios | US$ 20 + excedentes | 40 k envios | **154** | Redundância ao SMTP próprio. |
| **Meta Cloud API (WhatsApp)** | Conversas por categoria | US$ 0,0196–0,0644 | 1.000 conversas mistas | **350** | Precisa BSP (360dialog, etc.). |

> **Envelope variável recomendado:** provisionar **R$ 2.350/mês** para suportar o volume atual sem surpresas. Em crescimento acelerado, reestimar trimestralmente.

---

## O que a Assinatura Entrega

| Plano | Para quem? | Limites incluídos | Principais entregas | Preço mensal (R$) | Preço anual (R$) |
| --- | --- | --- | --- | --- | --- |
| **Básico** | Bancos com até 3 usuários | 50 processos, 1 GB storage, 500 docs | CRM jurídico, agenda, documentos básicos, relatórios essenciais | **249** | 2 490 (2 meses grátis) |
| **Pro** | Escritórios médios (até 10 usuários) | 200 processos, 5 GB storage, 2 000 docs | Tudo do Básico + contratos/honorários, financeiro completo, integrações Asaas/Clicksign | **699** | 6 990 |
| **Enterprise** | Firmas regionais (até 50 usuários) | 1 000 processos, 20 GB storage, 10 000 docs | Tudo do Pro + automações, integrações PJe/eProc/Projudi, API/webhooks, omnicanal | **1 299** | 12 990 |
| **Ultra (sob demanda)** | Grupos com operação nacional | Limites customizados | Todos os recursos + gerente dedicado, laboratórios beta, automações personalizadas | **2 490+** | Sob consulta (contrato anual) |

**Add-ons opcionais:** WhatsApp oficial (Meta Cloud API), armazenamento adicional, blocos extras de documentos/assinaturas e onboarding premium.

---

## Quando o Investimento se Paga

| Mix de clientes | Receita Mensal (R$) | Margem sobre custo fixo (R$ 1.977) | Resultado |
| --- | --- | --- | --- |
| **5 Básico + 3 Pro + 1 Enterprise** | **4.641** | **2.664** | Cenário base para break-even. |
| **5 Básico + 4 Pro + 1 Enterprise** | 5.340 | 3.363 | Foco em Pro acelera margem. |
| **5 Básico + 5 Pro** | 4.740 | 2.763 | Sem Enterprise ainda cobre investimento. |
| **5 Básico + 2 Pro + 2 Enterprise** | 5.241 | 3.264 | Mix com Enterprise libera caixa para marketing. |

- **Receita necessária para break-even:** **R$ 1.977/mês** (já coberto até pelo mix mínimo acima).  
- **Payback do investimento mensal:** alcançado no mesmo mês em que fechamos **≥ R$ 2,0 mil** em MRR.  
  - 8 clientes Básico (8 × 249 = R$ 1.992) ou 3 clientes Pro (3 × 699 = R$ 2.097) já pagam o investimento fixo.  
  - Qualquer venda de Enterprise gera margem imediata para marketing e suporte.  
- **Margem operacional alvo:** manter **≥ R$ 2.500/mês** após custo fixo para cobrir variáveis (R$ 2.350 provisionados) e ainda ter folga para reinvestimento.

---

## Simulação de Escala (Infra + Variáveis)

| Estágio | Tenants ativos | Usuários ativos | Processos/mês | Receita transacional estimada | Opex variável | Custo total (fixo + variável) |
| --- | --- | --- | --- | --- | --- | --- |
| **Lançamento** | 3 | 60 | 150 | R$ 90 k faturados pelo Asaas | R$ 450 | **R$ 2.130/mês** |
| **Crescimento** | 10 | 250 | 600 | R$ 360 k | R$ 1.650 | **R$ 3.330/mês** |
| **Escala regional** | 25 | 700 | 1.800 | R$ 1,1 M | R$ 4.900 | **R$ 6.580/mês** |

> Receita Asaas assume ticket médio de R$ 600 e taxa média de 3 %. Acima de 25 tenants, considerar Postgres dedicado (Aurora/Crunchy Bridge) e Redis dimensionado.

---

## Como o Investimento se distribui mês a mês

1. **Infraestrutura fixa (R$ 1.977):** mantém a plataforma operando 24/7 com segurança (hosting, banco, realtime, e-mail, domínio + assinaturas eletrônicas).
2. **Variáveis operacionais (R$ 2.350):** cobre cobranças, mensageria, storage excedente, WhatsApp e QA de integrações.
3. **Reserva para marketing e sucesso do cliente:** use a margem restante (≥ R$ 2.6 mil no cenário base) para CAC, conteúdo e suporte premium.

---

## Próximas Ações Financeiras

- Revisar trimestralmente câmbio e contratos com Cloudinary/Ably/Asaas para manter taxas competitivas.  
- Definir meta pública “5-3-1” (5 Básico, 3 Pro, 1 Enterprise) como marco de sustentabilidade e atualizar dashboards para acompanhar.  
- Estruturar oferta de add-ons (WhatsApp oficial, armazenamento extra, onboarding premium) para ampliar ticket médio sem inflar custo fixo.  
- Atualizar este documento sempre que um novo serviço pago entrar no stack ou quando os limites de uso mudarem.

---

> Documento preparado em 10/11/2025 para conversas com sócios e investidores. Atualize trimestralmente ou a cada novo compromisso financeiro.
