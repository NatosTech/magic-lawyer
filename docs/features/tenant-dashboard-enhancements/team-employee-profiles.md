# Gestão de Funcionários da Equipe

Este documento descreve a primeira versão do módulo de **Funcionários** para o portal do tenant. O objetivo é permitir que o escritório cadastre colaboradores internos (controller, administradora financeira, estagiário, etc.) com dados trabalhistas, benefícios e documentos, mantendo a autenticação/permissões já existentes.

---

## 🎯 Objetivos Principais

- Criar uma ficha de funcionário vinculada ao `Usuario`.
- Permitir cadastrar contratos, dados trabalhistas (CTPS, PIS, datas) e benefícios.
- Centralizar anexos relevantes (contrato de trabalho, exames, holerites).
- Disponibilizar um botão “Novo Funcionário” na aba **Equipe → Usuários** com modal completo.
- Preparar o backend para futuras integrações (processo de admissão, folha, auditoria).

---

## 🧱 Mudanças de Dados (Prisma)

> ✅ **Implementado** – `prisma/schema.prisma`

### Novos enums
- `FuncionarioStatus` – `ATIVO`, `AFASTADO`, `FERIAS`, `DESLIGADO`
- `FuncionarioTipoContrato` – `CLT`, `PJ`, `ESTAGIO`, `TRAINEE`, `TEMPORARIO`
- `FuncionarioBeneficioTipo` – vale-refeição, plano de saúde, etc.
- `FuncionarioBeneficioStatus` – `ATIVO`, `SUSPENSO`, `CANCELADO`
- `FuncionarioDocumentoTipo` – contrato, exames, holerites, carteira de trabalho, etc.

### Novos modelos
- `FuncionarioPerfil`
  - `usuarioId` (1:1 com `Usuario`)
  - Dados trabalhistas, contrato, salário (`Decimal`), benefícios padrão.
- `FuncionarioBeneficio`
  - Cadastro granular de benefícios por colaborador.
- `FuncionarioDocumento`
  - Metadados + URL (Cloudinary) de arquivos anexados.
- `FuncionarioDependente`
  - Dependentes para plano de saúde/benefícios.

### Relacionamentos adicionais
- `Usuario` agora tem `funcionarioPerfil`.
- `Tenant` referencia coleções (`funcionarioPerfis`, `funcionarioBeneficios`, `funcionarioDocumentos`, `funcionarioDependentes`).
- `Cargo` ganha `funcionarios` (relacionamento `CargoPrincipal`).

⚠️ **Ações necessárias após pull:**
1. Executar `npx prisma format`.
2. Gerar migração: `npx prisma migrate dev --name add-funcionarios`.
3. Rodar `npx prisma generate`.
4. Atualizar seeds/fixtures se necessário.

---

## 🖥️ UI & Fluxo

### Botão “Novo Funcionário”

- Local: aba **Equipe → Usuários**, junto aos filtros (ao lado de “Exportar visão”).
- Ação: abre modal em modo criação.
- Permissões: exibir somente para `ADMIN` (e futuros perfis autorizados via `checkPermission("equipe", "criar")`).

### Modal – Estrutura Recomendada

Tabs sugeridas (beleza e comportamento iguais aos modais atuais):

1. **Perfil**
   - Nome, sobrenome, email (obrigatório), CPF/RG/Data Nascimento.
   - Role (nível base) + Cargo principal.
   - Status (ativo/inativo) + geração de senha temporária.
2. **Dados Trabalhistas**
   - Tipo de contrato, datas de admissão/demissão, jornada.
   - Campos CTPS (número/serie/órgão), PIS.
   - Flags de benefícios padrão (VT, VR, plano de saúde).
   - Observações.
3. **Benefícios**
   - Lista + botão “Adicionar benefício”.
   - Formulário inline (tipo, status, valores, vigência).
4. **Documentos**
   - Upload via API `/api/equipe/upload-avatar` como referência.
   - Metadados: tipo, título, número, emissão, validade, observações.
5. **Endereços**
   - Reaproveitar `EnderecoManager` (já suporta `userId`).
6. **Histórico**
   - Reaproveitar `UsuarioHistoricoTab` + incluir eventos de RH (criação, alteração contrato, benefício).

> 💡 **Criação vs. Edição**: reusar o modal atual (`isEditModalOpen`) adicionando estado `mode = "create" | "edit"`. Para criação, limpar `selectedUsuario` e salvar via nova action (`createFuncionarioUsuario`).

---

## 🔌 Backend & Server Actions

### Novas actions sugeridas (em `app/actions/equipe.ts`)

| Action | Propósito | Pontos de atenção |
|--------|-----------|-------------------|
| `createFuncionarioUsuario` | Cria `Usuario` + `FuncionarioPerfil` + opcionalmente benefícios/documentos | Gerar senha temporária (`bcrypt`), validar email único (`Usuario` + `SuperAdmin`), auditar (`EquipeHistorico`). |
| `updateFuncionarioPerfil` | Atualiza dados trabalhistas | Respeitar `checkPermission("equipe","editar")`, registrar alterações no histórico. |
| `upsertFuncionarioBeneficio` / `deleteFuncionarioBeneficio` | CRUD de benefícios | Validar enum, vigência, persistir auditoria. |
| `upsertFuncionarioDocumento` / `deleteFuncionarioDocumento` | CRUD de anexos | Validar uploads (tamanho, tipo). |
| `createFuncionarioDependente` / `deleteFuncionarioDependente` | Gestão de dependentes | Implementar depois que Benefícios estiverem estáveis. |

### Realtime & Auditoria
- Emitir eventos Ably/Redis (`equipe.usuario.created`, `funcionario.perfil.updated`) para sincronizar abas.
- `EquipeHistorico` deve registrar: contrato alterado, benefício adicionado/removido, upload de documento.

---

## 🛠️ Integrações e Reuso

- **Uploads**: usar rota `/api/equipe/upload-avatar` como referência; criar `/api/equipe/upload-documento` se necessário (mesmas validações, outra pasta no Cloudinary).
- **Endereços & Contas bancárias**: já existem componentes (`EnderecoManager`, `DadosBancariosForm`) prontos para reuso. Apenas garantir `userId`.
- **Benefícios padrão**: para múltiplos colaboradores, considerar seeds ou presets (`vale-transporte`, `plano-saude`).

---

## ✅ Checklist de Implementação

- [ ] Botão “Novo Funcionário” visível apenas para perfis autorizados.
- [ ] Modal multi-aba em modo criação (perfil → dados trabalhistas → benefícios → documentos → endereços → histórico).
- [ ] Server action `createFuncionarioUsuario` com senha temporária + envio de convite (opcional).
- [ ] Persistência completa nas novas tabelas (`FuncionarioPerfil`, `FuncionarioBeneficio`, `FuncionarioDocumento`).
- [ ] Auditoria (`EquipeHistorico`) para cada alteração.
- [ ] Eventos realtime para atualizar grid de usuários e dashboard de métricas.
- [ ] Testes (`npm test`) cobrindo: criação, validação de email/CPF, associação de cargo, benefícios.
- [ ] Atualizar `TEAM-PORTAL-UI-REFRESH.md` checklist após entrega.

---

## ⚠️ Pontos Críticos & Cuidados

1. **Migração de dados antiga**: usuários existentes precisarão de um `FuncionarioPerfil` default. Criar script de migração (ou job) que popule registros vazios.
2. **Validação de CPF/PIS**: se optar por obrigar, reutilizar utilitários existentes (`validateCPF`, etc.).
3. **Decimal**: campos `salarioBase`, `valorBase`, `contribuicao*` usam `@db.Decimal(14,2)` => manipular com `Prisma.Decimal`.
4. **Permissões**: `checkPermission("equipe","criar")` e `("equipe","editar")` devem ser aplicadas aos novos endpoints.
5. **Auditoria**: manter padrão `motivo` + `dadosAntigos/dadosNovos` para rastreamento.
6. **Uploads**: validar tamanho (5 MB) e tipos; sanitizar nomes; definir diretório no Cloudinary (ex.: `tenants/{slug}/funcionarios/{usuarioId}`).
7. **Dependentes**: campo `dependePlanoSaude` ajuda em relatórios (guardar se participa do benefício).
8. **Dashboard**: atualizar métricas (total funcionários, ativos, desligados, com benefícios) após finalizar backend.

---

## 🔄 Próximos Passos Recomendados

1. **Implementar `createFuncionarioUsuario`** reutilizando padrões de `createCliente`/`createAdvogado`.
2. **Expandir modal existente para suportar modo criação** (usar mesmo formulário da edição com estado inicial vazio).
3. **Construir subcomponentes reutilizáveis**:
   - `FuncionarioBeneficiosForm`
   - `FuncionarioDocumentosTable`
   - `FuncionarioDependentesForm`
4. **Atualizar dashboards** (`usuarioStats`) para refletir novos status (ativos, afastados, férias, desligados).
5. **Adicionar testes** (unitários + integração) seguindo `test-plan-permissions.md`.

---

## 📎 Referências

- `app/(protected)/equipe/equipe-content.tsx`
- `app/actions/equipe.ts`
- `app/api/equipe/upload-avatar/route.ts`
- `components/endereco-manager.tsx`
- `docs/features/tenant-dashboard-enhancements/TEAM-PORTAL-UI-REFRESH.md`

