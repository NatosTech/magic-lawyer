# Configurações do Tenant (`/configuracoes`)

Plano para tornar a página de configurações totalmente funcional para cada tenant.

## ✅ Objetivos
- Permitir edição completa das preferências do tenant (dados gerais, branding, integrações).
- Garantir que todas as seções exibidas na UI salvem e reflitam dados reais.
- Habilitar troca de favicon/logo tanto pelo tenant quanto pelo super admin.

## 🧭 Checklist Detalhado

### 1. Descoberta e Auditoria da Tela Atual
- [ ] Inventariar todos os cards, botões e campos presentes em `/configuracoes`.
- [ ] Identificar quais elementos estão apenas mockados ou sem backend.
- [ ] Registrar necessidades adicionais com o time (quais ajustes o tenant espera fazer).

### 2. Modelo de Dados e Prisma
- [ ] Revisar schema (Prisma/DB) para confirmar existência de campos de branding (`favicon`, `logo`, `cores`, etc.).
- [ ] Caso não exista, planejar migrações para incluir `tenant.favicon` (URL/blob) e demais atributos necessários.
- [ ] Mapear relacionamentos de integrações (ex.: webhooks, notificações, integrações externas).
- [ ] Garantir versionamento/auditoria das alterações de configuração.

### 3. APIs e Backend
- [ ] Criar/atualizar endpoints para leitura/atualização dos dados do tenant.
- [ ] Implementar upload seguro de favicon/logo (validação de formato, tamanho, armazenamento S3/Blob).
- [ ] Expor configurações específicas de integrações (notificações, realtime, billing).
- [ ] Assegurar que o super admin possua endpoint/rota para alterar favicon do tenant.
- [ ] Adicionar logs e permissões adequadas (somente admins do tenant podem alterar dados sensíveis).

### 4. Frontend e UX
- [ ] Conectar cada card/botão a uma ação real (salvar, testar integração, resetar).
- [ ] Implementar formulários com validação e feedback (success/error states).
- [ ] Adicionar uploader de favicon com preview e fallback.
- [ ] Garantir consistência visual e responsividade da página.
- [ ] Permitir edição diferenciada para super admin quando aplicável (ex.: marcações somente leitura ou overrides).

### 5. Fluxos Complementares
- [ ] Atualizar cache/session após mudança de branding para refletir favicon/logo imediatamente.
- [ ] Sincronizar alterações com outros serviços dependentes (ex.: e-mails transacionais).
- [ ] Definir política de versionamento/rollback das configurações.

### 6. Testes e Qualidade
- [ ] Criar testes unitários para serviços de configuração e uploads.
- [ ] Cobrir APIs com testes de integração, incluindo validações de permissão.
- [ ] Executar testes e2e garantindo que todos os controles da tela funcionem.
- [ ] Validar manualmente upload de favicon e percepção visual em múltiplos navegadores.

### 7. Documentação e Go-live
- [ ] Atualizar documentação interna sobre como administrar configurações de tenant.
- [ ] Preparar FAQ ou passo a passo para clientes (alteração de branding, integrações).
- [ ] Inserir instruções para super admin gerenciar favicons dos tenants.
- [ ] Planejar validação pós-deploy (monitorar erros, coletar feedback dos tenants).

---

> Use este documento para centralizar todo item relacionado à evolução da tela `/configuracoes`, garantindo que não reste nenhuma ação mockada.
