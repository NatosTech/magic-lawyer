# Certificados Digitais ICP-Brasil (A1)

## Resumo
- **Objetivo**: permitir que o próprio escritório suba, ative e gerencie certificados A1 diretamente no Magic Lawyer, habilitando integrações PJe/SAJ sob demanda.
- **Status**: domínio Prisma, criptografia e server actions (upload/listagem/desativação) implementados.
- **Acesso**: `SUPER_ADMIN` ou usuários com `TENANT_PERMISSIONS.manageOfficeSettings`. Advogados comuns permanecem bloqueados pela guarda de `/configuracoes`.

---

## Modelo de dados
Tabela `DigitalCertificate`:
- `encryptedData` (Bytes) – conteúdo `.pfx/.p12`
- `encryptedPassword` (Bytes) – senha criptografada separadamente
- `iv` e `passwordIv` (Bytes) – vetores de inicialização exclusivos
- `tenantId`, `responsavelUsuarioId`, `label`, `tipo` (`PJE` | `ESAJ` | `OUTRO`), `isActive`, `validUntil`, `lastValidatedAt`, `lastUsedAt`

Tabela `DigitalCertificateLog`:
- `action` (`CREATED`, `ENABLED`, `DISABLED`, `UPDATED`, `VALIDATED`, `DELETED`, `TESTED`)
- `message` contextual, `actorId`, timestamps

Relacionamentos prontos para auditoria (tenant ↔ usuário ↔ certificado).

---

## Criptografia e infraestrutura
- Biblioteca dedicada em `lib/certificate-crypto.ts` (AES-256-GCM, IV aleatório, tag de autenticação).
- Requer `CERT_ENCRYPTION_KEY` (32 bytes em hex/base64). Fallbacks: `CERT_SECRET_KEY`, `ENCRYPTION_KEY`.
- Ao subir um certificado, todos os ativos do mesmo `tipo` são desativados com log automático.

---

## Server Actions disponíveis

### `uploadDigitalCertificate(params)`
- **Entrada** (validações já implementadas):
  - `tenantId`, `userId`
  - `fileBuffer` (máx. 2 MB)
  - `password` (string obrigatória)
  - `label?`, `validUntil?`, `activate?` (default `true`)
  - `tipo?` (`PJE` default)
- **Saída**: `{ success: boolean; certificate?; error? }`
- **Efeitos colaterais**:
  - Desativa certificados ativos do mesmo tipo e inclui logs `DISABLED`.
  - Cria logs `CREATED` e `ENABLED`.
  - `revalidatePath("/configuracoes/certificados")`.

### `listDigitalCertificates(tenantId)`
- Retorna certificados ordenados, sanitizados (sem blobs).

### `deactivateDigitalCertificate({ tenantId, certificateId, userId })`
- Atualiza `isActive=false` e gera log `DISABLED`.

---

## Contrato da UI
### Localização
- Nova aba **Integrações PJe** dentro de `ConfiguracoesTabs`.
- Card principal “Certificados PJe” com status, responsável e validade.
- Botões condicionais:
  - `Enviar novo certificado` → abre modal com formulário.
  - `Testar conexão` (requer implementação futura).
  - `Desativar` (quando ativo).

### Formulário de upload
- Campos:
  1. Arquivo `.pfx`/`.p12` (drag’n’drop ou seletor).
  2. Senha do certificado (input com toggle visibilidade).
  3. Nome/identificador opcional (`label`).
  4. Validade opcional (`validUntil`, date-picker).
  5. Checkbox “Ativar imediatamente” (`activate`).
- Envio via `FormData` → server action `uploadDigitalCertificate`.
- Exibir checklist de segurança (criptografia, quem terá acesso, limites).

### Lista e detalhes
- Tabela ou timeline com colunas:
  - Status (chip verde/amarelo/vermelho).
  - Tipo (`PJE`, `ESAJ`, `OUTRO`).
  - Responsável (nome + e-mail).
  - Criado em / Último uso / Validade.
  - Ações (Testar, Desativar, Download*).

> `Download` deve ser reservado para usuários com permissão explícita; fluxo ainda não implementado (necessita nova action com rastreamento).

### Logs
- Accordion ou modal “Histórico” exibindo registros de `DigitalCertificateLog` (ação, mensagem, data, usuário).
- Pré-requisito: expor nova action `listDigitalCertificateLogs(certificateId, tenantId)` com paginação.

---

## Roadmap técnico pendente
1. **UI/UX**: implementar aba, modal de upload, tabela de certificados, toasts de feedback e skeletons.
2. **Testar conexão**: server action `testDigitalCertificate` que valide senha, consulte endpoint PJe (mock enquanto sem A1) e grave log `TESTED`.
3. **Download seguro** (opcional): gerar link temporário com auditoria, restrito a administradores.
4. **Alertas automáticos**: cron que verifica `validUntil` (30/10/5 dias) e dispara `Notification`.
5. **Workers de captura**: ao ativar certificado, registrar job que consome integrações PJe/TRT5/TRF1.
6. **Monitoramento**: métricas no Observability (ex. falhas de login, último sucesso).

---

## Dependências / Perguntas para alinhamento
1. Confirmar variação de tipos (`PJE`, `ESAJ`, `OUTRO`) é suficiente ou precisamos granular (ex. `PJE_TRF1`).
2. Política de download: permitido? deve exigir MFA?
3. Quem recebe alertas de expiração? (toda direção, responsáveis configuráveis?)
4. Precisamos permitir múltiplos certificados ativos por tipo (ex. mais de uma patrona)? Atualmente o upload desativa os anteriores automaticamente – ajustar se for necessário manter vários.
5. Fluxo de teste: podemos começar com checagem básica (valida senha via `forge`), depois integrar serviço real?

---

## Próximos passos imediatos
1. Implementar UI na aba `ConfiguracoesTabs`.
2. Criar server actions adicionais (`listDigitalCertificateLogs`, `testDigitalCertificate`, `activateDigitalCertificate` explícita).
3. Cobertura de testes (unit para criptografia, integration para actions).
4. Documentar procedimento operacional seguro (quem gera A1, como armazenar offline, política de rotação).
