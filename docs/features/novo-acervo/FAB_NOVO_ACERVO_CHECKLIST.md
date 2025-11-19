# ✅ Checklist – Botão Flutuante “Novo Acervo”

Documento para guiar a implementação do botão flutuante arrastável, modal “Novo Acervo” e pipeline de ingestão de documentos. Serve tanto para devs quanto para agentes de IA operando no repositório.

---

## 1. Inventário do que já existe (evitar retrabalho)

- `app/(protected)/documentos/page.tsx:1` já expõe o módulo Documentos para usuários autenticados.
- `app/(protected)/documentos/documentos-content.tsx:1` renderiza a árvore com clientes/processos, chama `uploadDocumentoExplorer`, `createExplorerFolder` etc., e contém parte da UX de upload.
- `components/documento-upload-modal.tsx:1` possui validação de PDF, limites de tamanho e integração com o hook `useUploadDocumentoProcuracao` (referência para reuso de UX de upload).
- `app/actions/documentos-explorer.ts:1` oferece server actions para criar pastas, anexar arquivos, persistir metadados e já usa `UploadService`.
- `lib/upload-service.ts:1` centraliza upload via Cloudinary (com fallback local) e já formata estrutura `magiclawyer/<tenant>/...`.
- `prisma/schema.prisma:739` define `Processo` e relações (`ProcessoDocumento` em `prisma/schema.prisma:1048`; `Documento` em `prisma/schema.prisma:1002`); preferir estender esses modelos em vez de criar tabelas paralelas.
- `docs/architecture/PROJECT_STRUCTURE.md:1` lista módulos relevantes (agenda, processos, documentos) e serve como mapa.
- `docs/features/notifications/NOTIFICATIONS_ARCHITECTURE.md:47` + `app/lib/notifications/notification-worker.ts:1` mostram que BullMQ/Redis já existem para jobs assíncronos – podemos reutilizar para OCR/IA.

---

## 2. Objetivo da nova funcionalidade

1. Exibir um botão de ação flutuante (FAB), visível nas telas internas, com possibilidade de arrastar e fixar onde o usuário preferir.
2. Persistir a posição escolhida (localStorage + preferências do usuário em banco) para manter a experiência em múltiplos dispositivos.
3. Ao clicar, abrir um menu/modal de ações rápidas. Primeira ação: **Novo Acervo**.
4. “Novo Acervo” abre um modal de intake onde o usuário envia PDFs/imagens e define o contexto (cliente, processo, etiquetas).
5. Cada envio dispara a criação de um “processo/acervo” e anexa os arquivos, executando OCR + classificações em background.

---

## 3. Arquitetura Proposta (alto nível)

1. **Camada de UI**
   - Novo componente `FloatingQuickActionsButton` em `components/`.
   - Hook `useFloatingButtonPosition` (provavelmente em `hooks/`) para lidar com drag + persistência.
   - Modal `NovoAcervoModal` (pode ficar em `components/novo-acervo-modal.tsx` ou dentro de `app/(protected)/documentos/_components/`).

2. **Persistência de posição**
   - Criar tabela Prisma (ex.: `model UserUiPreference`) com campos `userId`, `tenantId`, `fabPositionX`, `fabPositionY`, `lastDevice`.
   - API Route ou Server Action (ex.: `app/actions/user-ui-preferences.ts`) para salvar/carregar.
   - No cliente: ler primeiro de `localStorage`, sincronizar com dado do servidor após login.

3. **Fluxo Novo Acervo**
   - Modal com dropzone (`react-dropzone`) + inputs (tipo de documento, cliente, processo, notas).
   - Envio chama endpoint `POST /api/documentos/acervo` (ou server action) que:
     1. Cria um registro `Processo` (status inicial “Em qualificação”) ou usa um modelo `Acervo` específico se preferirem.
     2. Para cada arquivo, cria `Documento` + `DocumentoVersao` e associa via `ProcessoDocumento`.
     3. Gera URLs assinadas ou envia direto via `UploadService`.
     4. Publica job na fila `acervo-intake` (BullMQ) com payload {documentoId, processId, tenantId}.

4. **Pipeline OCR/IA**
   - Worker BullMQ (pasta `app/lib/queues` ou `app/workers`) consome `acervo-intake`.
   - Job executa:
     - Download do arquivo (Cloudinary/S3).
     - OCR via provedor (Textract, Vision API, Azure Form Recognizer).
     - Persiste texto extraído (`DocumentoVersao.metadata` ou tabela auxiliar `DocumentoConteudo`).
     - Opcional: chama LLM (OpenAI/Azure/Vertex) para sugerir tags/checklist automático e grava no campo `metadata`.
     - Notifica usuário (via `HybridNotificationService`) quando finalizar.

5. **Observabilidade**
   - Log estruturado em cada etapa (`logger` já existe em `lib/logger.ts`).
   - Métricas de fila (BullMQ) podem ser expostas igual às notificações.

---

## 4. Checklist Detalhado

### 4.1 Planejamento
- [ ] Validar com UX quais páginas exibem o FAB (dashboard, documentos, processos etc.).
- [ ] Definir regras de permissão (quais roles podem ver o botão/acionar “Novo Acervo”).

### 4.2 Banco & Prisma
- [ ] Adicionar modelo `UserUiPreference` (ou expandir um existente) para salvar posição do FAB.
- [ ] Adicionar campos/tabelas para rastro do OCR (ex.: `DocumentoOcr` ou `DocumentoVersao.metadata -> { ocrStatus, texto }`).
- [ ] Criar migration + atualizar `@/app/generated/prisma`.

### 4.3 API / Server Actions
- [ ] Criar server action `getUserFabPreferences` e `upsertUserFabPreferences`.
- [ ] Criar rota/server action `createNovoAcervo` que encapsula criação do processo + anexos.
- [ ] Gerar URLs assinadas (caso necessário) ou usar `UploadService` diretamente.
- [ ] Publicar job BullMQ (`acervo-intake`) ao final do upload.

### 4.4 Frontend – Botão Flutuante
- [ ] Criar componente do FAB com portal (`createPortal`) para evitar clipping.
- [ ] Implementar drag com `PointerEvent` ou `react-draggable`, limitando área segura (considerar header/sidebar).
- [ ] Persistir posição no estado local; salvar em `localStorage` a cada 500 ms de inatividade; sincronizar com server action ao soltar.
- [ ] Animar estados (hover, drag) e garantir acessibilidade (aria-label, foco).

### 4.5 Frontend – Modal Novo Acervo
- [ ] Criar modal usando `@heroui/modal` para manter consistência visual.
- [ ] Incluir dropzone + fallback input file múltiplo; exibir lista com nome, tamanho, status.
- [ ] Inputs obrigatórios: cliente (autocomplete), processo (opcional), tipo de documento, descrição/notas.
- [ ] Validar formatos aceitos (PDF, JPG, PNG) e tamanho (ex.: 50 MB por arquivo).
- [ ] Ao enviar, mostrar progresso (barra ou lista) e bloquear botão até finalizar.
- [ ] Após sucesso, limpar seleção e emitir toast/notification.

### 4.6 Worker BullMQ
- [ ] Criar queue `acervo-intake` no mesmo padrão de `app/lib/notifications/notification-queue.ts`.
- [ ] Implementar worker (`app/lib/queues/acervo-intake-worker.ts`) que:
  - Baixa arquivo (via Cloudinary API `download_url`).
  - Envia para OCR.
  - Normaliza texto (UTF-8, remove ruído).
  - Atualiza `DocumentoVersao.metadata`.
  - Registra tempo de processamento e falhas.
- [ ] Adicionar retry/backoff e DLQ (Dead Letter Queue) se necessário.

### 4.7 Notificações & Feedback
- [ ] Integrar `HybridNotificationService` para avisar usuário quando OCR terminar ou falhar.
- [ ] Opcional: adicionar badge no FAB se houver falhas pendentes.

### 4.8 Testes
- [ ] Criar testes unitários para hooks (`useFloatingButtonPosition`) e server actions novas.
- [ ] Testar upload end-to-end (Playwright) simulando arrastar arquivos.
- [ ] Adicionar mocks para OCR em ambiente de teste.

### 4.9 Documentação
- [ ] Atualizar `docs/architecture/PROJECT_STRUCTURE.md` com o novo módulo.
- [ ] Registrar endpoints e eventos em `docs/features/novo-acervo/FAB_NOVO_ACERVO_CHECKLIST.md` (este arquivo) e, se necessário, adicionar README específico.
- [ ] Descrever variáveis de ambiente novas (.env.example).

---

## 5. Estrutura do Modal “Novo Acervo”

| Área | Campos | Observações |
| --- | --- | --- |
| Contexto | Seletores de Cliente (obrig.) e Processo (opcional), checkbox “Criar processo automaticamente” | Auto-preencher processo quando usuário entrar via tela /processos |
| Metadados | Tipo de documento (enum), tags livres, data de emissão/validade | Pode mapear para `Documento.metadata` |
| Upload | Dropzone com múltiplos arquivos, visualização de tamanho/status, botão para remover | Utilizar `FileReader` apenas para preview |
| Pós-envio | Resumo do processo criado, link para ir à pasta | Mostrar número do processo + status OCR |

---

## 6. Critérios de Aceite / Testes

1. **FAB**
   - Aparece apenas para usuários com permissão definida.
   - Drag funciona em desktop/touch.
   - Após relogar em outro dispositivo, posição persiste (dados vêm do servidor).

2. **Modal Novo Acervo**
   - Aceita arrastar múltiplos arquivos e bloqueia tipos proibidos.
   - Feedback de upload (progresso ou estado final) visível.
   - Cria registros em `Processo`, `Documento`, `ProcessoDocumento`.

3. **Pipeline OCR**
   - Job é enfileirado e executado; status atualizado em banco.
   - Logs mostram início/fim e erros.
   - Notificação enviada ao usuário responsável.

4. **Testes automatizados**
   - Playwright: cenário arrastar FAB + abrir modal + mock upload.
   - Jest: testes dos server actions e hooks.

---

## 7. Rollout & Observabilidade

1. **Flags**: opcionalmente proteger com feature flag (por Tenant) usando variáveis ou tabela `FeatureToggle`.
2. **Monitoramento**:
   - Logs estruturados (`logger.info`) em cada etapa.
   - Métricas de fila (jobs pendentes, duração média).
   - Alertas para falhas consecutivas no OCR.
3. **Fallback**: se worker falhar, arquivos permanecem anexados e status aparece como “Processamento pendente”.

---

## 8. Próximos incrementos sugeridos

- Integração com AI para sugerir checklist automático com base no OCR.
- Busca semântica sobre o texto extraído usando vetor (Pinecone/PGVector).
- Automatizar criação de tarefas a partir dos documentos (workflow).

---

## 9. Serviços / Contas recomendadas (com opções free)

| Objetivo | Serviço sugerido | Plano gratuito / crédito | Passo a passo para obter chave |
| --- | --- | --- | --- |
| Storage + CDN (já em uso) | **Cloudinary** | Free tier com 25 créditos/mês | 1) Criar conta em [cloudinary.com](https://cloudinary.com). 2) Confirmar e-mail. 3) Em “Dashboard” copiar `cloud_name`, `api_key`, `api_secret`. 4) Adicionar no `.env` (`CLOUDINARY_*`). |
| Storage alternativo / grandes volumes | **AWS S3** | Free tier de 5 GB por 12 meses | 1) Criar conta AWS. 2) Criar bucket (`magiclawyer-acervos`). 3) Criar usuário IAM com política `AmazonS3FullAccess` restrita ao bucket. 4) Gerar Access Key + Secret. 5) Usar para uploads direct-to-S3 se necessário. |
| OCR – melhor integração com PDFs | **AWS Textract** | 1.000 páginas/mês por 3 meses | 1) Ativar Textract no console AWS. 2) Criar papel IAM com permissão `AmazonTextractFullAccess`. 3) Guardar `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`. 4) Configurar worker para usar `StartDocumentAnalysis`. |
| OCR alternativo + formulários | **Google Cloud Vision / Document AI** | Crédito global de US$300 por 90 dias | 1) Criar projeto no Google Cloud Console. 2) Ativar APIs Vision e Document AI. 3) Criar Service Account com papel `Document AI Editor`. 4) Baixar JSON e configurar `GOOGLE_APPLICATION_CREDENTIALS`. |
| OCR focado em documentos fiscais | **Azure AI Document Intelligence (Form Recognizer)** | 500 páginas free/mês | 1) Criar recurso “Document Intelligence” no Azure Portal (região East US). 2) Copiar `endpoint` e `key` exibidos. 3) Salvar em `.env` (`AZURE_FORM_RECOGNIZER_ENDPOINT/KEY`). |
| IA para tagging / checklist | **Azure OpenAI** ou **OpenAI** | Azure dá US$200 no novo tenant; OpenAI cobra por uso | **Azure**: criar recurso “Azure OpenAI”, solicitar acesso, gerar chave + endpoint. **OpenAI**: criar conta em [platform.openai.com], gerar API Key (requer cartão). Salvar como `OPENAI_API_KEY`. |
| Vetorização opcional | **Supabase + pgvector** ou **Pinecone** | Supabase free 500 MB; Pinecone free 1 pod | Seguir docs oficiais; criar projeto, pegar URL/KEY. Pode ser usado depois para busca semântica dos OCRs. |
| Fila / Redis gerenciado | **Upstash Redis** | Free tier: 10k comandos/dia | 1) Criar conta em [upstash.com]. 2) Criar database Redis, anotar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`. 3) Atualizar `.env` e `redis-config`. |
| Observabilidade | **Sentry** ou **Logtail** | Sentry free 5k eventos/mês | 1) Criar projeto Next.js no Sentry. 2) Copiar DSN e definir `SENTRY_DSN`. 3) Opcionalmente integrar worker separadamente. |

> Sempre armazenar as chaves somente em `.env`/secret manager e atualizar `docs/ENV_SETUP.md` quando novos providers forem adicionados.

---

> Mantenha este checklist atualizado durante a implementação para garantir rastreabilidade e alinhamento entre equipes/herramentas de IA.
