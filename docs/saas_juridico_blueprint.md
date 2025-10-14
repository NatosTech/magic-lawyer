# SaaS Jurídico Moderno — Blueprint de Implementação

Este documento organiza o checklist fornecido em um plano de execução prático, com foco em sprints de entrega, modelo de dados mínimo e contratos de webhooks/APIs essenciais.

## Plano de Implementação por Sprints

| Sprint | Objetivos Principais | Entregáveis | Integrações/Dependências |
| ------ | -------------------- | ----------- | ------------------------ |
| 1 | **Fundação do Núcleo Processual**: cadastro de processos, partes, movimentações básicas e prazos manuais. | CRUD de Processo, Parte, Andamento; Regime de prazo com contagem útil/corrida; Configuração de feriados por tribunal. | Base de dados inicial; serviço de calendário/feriados. |
| 2 | **Automação de prazos e publicações**: ingestão automática e geração de prazos. | Robôs de captura (PJe/eproc/Projudi); pipeline de classificação; criação automática de prazos; painel de prazos com filtros. | Filas (pje.fetch etc.); observabilidade inicial; integrações com DJe/IMAP. |
| 3 | **Documentos e petições**: modelos, geração assistida e assinatura. | Modelo de documento; assistente de peça (seleção → preenchimento → assinatura); controle de signatários; armazenamento de hash/versões. | Integração com serviços de assinatura (ICP-Brasil A1/A3, gov.br). |
| 4 | **Protocolo e recursos**: automação completa do fluxo. | Gatilhos pós-assinatura para protocolo automático; gerenciamento de recursos (prazo próprio, preparo); upload de comprovantes. | Bots de protocolo por tribunal; cofre de segredos. |
| 5 | **Financeiro jurídico**: honorários, custas, acordos e conciliação. | Gestão de honorários (contratual/sucumbencial); emissão de guias e controle de pagamento; cronograma de acordos com cobranças automáticas. | Integração com Pix/cartão e webhooks de pagamento. |
| 6 | **Jurisprudência, decisões e provas**: enriquecimento de inteligência jurídica. | Cadastro de jurisprudência/súmulas vinculadas a processos/modelos; módulo de provas (perícia, laudo, testemunhas). | Integração com fontes de jurisprudência (Jusbrasil, diários). |
| 7 | **LGPD, auditoria e segurança**: governança e compliance. | Audit trail completo; consentimentos LGPD; gestão de certificados digitais; criptografia em repouso e em trânsito. | Cofre de segredos; monitoramento de validade de certificados. |
| 8 | **UX e integrações avançadas**: refinamento e produtividade. | Linha do tempo do processo; matriz de responsabilidades; central de publicações com drag-and-drop; sincronização com calendários. | Integração Google/Microsoft Calendar; WhatsApp Business API. |
| 9 | **DevOps e confiabilidade**: escalabilidade e qualidade contínua. | Backups versionados; rotina de vacuum; ambiente de homolog com dados anonimizados; feature flags por tribunal. | Pipelines de CI/CD; testes de contrato para webhooks/robôs. |

## Esquema ER Mínimo (Entidades e Relações)

- **Processo** (numeroCNJ, foro, vara, orgaoJulgador, classeCNJ, assuntosCNJ[], segredoJustica, justicaGratuita, status)
  - 1:N com **ParteProcessual** (papel, representanteId, procuraçãoId, vigenciaInicio/Fim)
  - 1:N com **Andamento** (origem, carimboTempo, eventoGeradorId, descricao, documentos[])
  - 1:N com **Prazo** (regimePrazoId, responsavelId, dataLimite, status, eventoGeradorId)
  - 1:N com **Peticao** (tipoId, modeloId, protocolo, status)
  - 1:N com **DecisaoProcessual**, **Recurso**, **Audiencia**, **Pericia**, **ProvaDocumental**
  - 1:N com **PublicacaoDJ** (source, oab, recebidoEm, vinculoStatus)
  - N:M com **Jurisprudencia** / **Sumula** via tabelas de vínculo

- **RegimePrazo**, **RegraPrazo** (contagem, feriados, gatilhos)
- **FeriadoTribunal** (tribunalId, data, descricao)
- **PrazoHistorico** para auditoria das mudanças de status/data
- **PeticaoAssinante** (peticaoId, signatarioId, ordem, certificadoId)
- **RecursoPreparo** (recursoId, guiaId, valor, status)
- **GuiaCustas**, **DepositoJudicial**, **HonorarioContratual**, **HonorarioSucumbencial**
- **Acordo** (cronogramaParcelas[], notificacoes)
- **CertificadoDigital** (tipo, provedor, venceEm, armazenadoEm, status)
- **IntegracaoTribunal** (tribunal, config, credenciais, status, featureFlag)
- **Webhook** e **WebhookDelivery** (topic, targetUrl, secret, status, tentativas)
- **AuditLog** (actorId, action, entity, before, after, ip, timestamp)
- **ConsentimentoLGPD** e **PoliticaRetencao** (escopo, baseLegal, expiracao)

> **Observação:** Adotar versionamento de documentos, deduplicação via hash e cofre de segredos para certificados A1/PFX e tokens de integrações.

## Contratos de Webhook (JSON Schema Simplificado)

### publication.created
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "processoId": "uuid",
  "numeroCNJ": "string",
  "publicacao": {
    "fonte": "PJE|EPROC|PROJUDI|IMAP",
    "ementa": "string",
    "recebidoEm": "ISO-8601",
    "origem": {
      "tribunal": "string",
      "identificador": "string"
    }
  },
  "andamentoId": "uuid"
}
```

### deadline.created | deadline.updated | deadline.late
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "prazo": {
    "processoId": "uuid",
    "eventoGeradorId": "uuid",
    "regime": "CPC|CLT|JEC",
    "dataLimite": "ISO-8601",
    "responsavelId": "uuid",
    "status": "ABERTO|CONCLUIDO|VENCIDO"
  },
  "notificacao": {
    "sla": "ISO-8601",
    "lembretes": ["D-5", "D-2", "D-1"],
    "escalonado": true
  }
}
```

### document.signed
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "documentoId": "uuid",
  "processoId": "uuid",
  "assinatura": {
    "tipo": "ICP-A1|ICP-A3|GOVBR",
    "signatarios": [
      {
        "usuarioId": "uuid",
        "ordem": 1,
        "certificadoId": "uuid",
        "carimboTempo": "ISO-8601"
      }
    ],
    "cadeiaCertificados": ["base64"],
    "hash": "sha256"
  }
}
```

### protocol.ok | protocol.failed
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "peticaoId": "uuid",
  "processoId": "uuid",
  "tribunal": "string",
  "protocolo": {
    "numero": "string",
    "comprovanteUrl": "string",
    "tentativas": 2,
    "status": "SUCESSO|FALHA",
    "erro": {
      "codigo": "string",
      "mensagem": "string"
    }
  }
}
```

### payment.paid | payment.failed
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "referencia": {
    "tipo": "GUIA|PREPARO|PARCELA|MENSALIDADE",
    "id": "uuid"
  },
  "valor": {
    "moeda": "BRL",
    "total": 0,
    "taxas": 0
  },
  "pagador": {
    "nome": "string",
    "documento": "CPF|CNPJ"
  },
  "transacao": {
    "meio": "PIX|CARTAO",
    "status": "PAGO|FALHA|ESTORNADO",
    "confirmadoEm": "ISO-8601"
  }
}
```

## APIs Externas a Expor

- **Autenticação & Tenancy**: OAuth2 com JWT e cabeçalho `X-Tenant-Id`; escopos por papel.
- **Processos**: endpoints para CRUD, partes, andamentos, prazos, audiências, decisões, recursos.
- **Documentos**: upload com controle de versão, hash, assinatura e vínculo ao processo.
- **Financeiro**: honorários, custas, acordos e webhooks de conciliação.
- **Publicações**: ingestão, classificação, vinculação a processos e status de triagem.
- **Eventos/Webhooks**: cadastro de endpoints, reenvio manual, consulta a entregas (DLQ).

## Observabilidade & Confiabilidade

- Métricas Prometheus por robô/fila, latência de captura e sucesso de protocolo.
- Logs estruturados com correlação por processo e tribunal.
- Alertas (PagerDuty/Slack) para falhas em robôs, prazos vencidos sem responsável, certificados próximos do vencimento.

## Próximos Passos

1. Refinar estimativas de esforço por sprint considerando equipe e dependências externas.
2. Mapear requisitos regulatórios específicos de cada tribunal para protocolos automáticos.
3. Definir políticas de retenção e anonimização compatíveis com LGPD e compliance interno.
4. Elaborar testes de contrato e ambientes de homologação com dados sintetizados.

