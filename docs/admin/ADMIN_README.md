# 🔑 Magic Lawyer - Sistema Administrativo (SuperAdmin)

## Visão Geral

O sistema administrativo do Magic Lawyer permite que o **SuperAdmin** gerencie completamente a plataforma white label multi-tenant, incluindo tenants, planos, módulos, juízes globais, pacotes premium, financeiro e auditoria completa.

---

## 🚀 Acesso ao Sistema

### URL de Acesso
```
http://localhost:9192/admin
```

### Credenciais de SuperAdmin
```
📧 Email: robsonnonatoiii@gmail.com
🔑 Senha: Robson123!
```

**⚠️ Importante:** Apenas usuários com role `SUPER_ADMIN` podem acessar esta área. O sistema valida automaticamente no layout e redireciona usuários não autorizados.

---

## 📋 Rotas e Funcionalidades Disponíveis

### 🎯 Navegação Principal

#### 1. **Dashboard** (`/admin/dashboard`)
- Visão geral do sistema Magic Lawyer
- Métricas de faturamento e crescimento
- Estatísticas de tenants
- Sinais de atenção (inadimplência, problemas, etc.)
- Cards com informações executivas

#### 2. **Tenants** (`/admin/tenants`)
- **Lista de Tenants** (`/admin/tenants`)
  - Visualizar todos os escritórios de advocacia
  - Cards com informações de cada tenant
  - Status (ativo, suspenso, cancelado)
  - Estatísticas básicas
  
- **Criar Novo Tenant** (`/admin/tenants/new`)
  - Formulário completo de criação
  - Configuração de usuário admin
  - Dados do escritório
  - Branding inicial
  
- **Gerenciar Tenant** (`/admin/tenants/[tenantId]`)
  - Visualizar detalhes completos
  - Editar informações do escritório
  - Gerenciar usuários do tenant
  - Resetar senhas
  - Criar/editar/excluir usuários
  - Controle de status (ativo/suspenso/cancelado)

#### 3. **Planos** (`/admin/planos`)
- Gerenciar planos disponíveis no sistema
- Controle de módulos liberados por plano
- Limites de usuários, processos e storage
- Valores mensais e anuais
- Período de teste

#### 4. **Gestão de Módulos** (`/admin/modulos`)
- **Módulos** (`/admin/modulos`)
  - Lista de todos os módulos do sistema
  - Ativar/desativar módulos
  - Gerenciar permissões
  
- **Categorias** (`/admin/modulos/categorias`)
  - Organizar módulos por categorias
  - Gerenciar estrutura hierárquica

#### 5. **Juízes Globais** (`/admin/juizes`)
- Base de dados centralizada de magistrados
- Criar/editar/excluir juízes
- Configurar como público ou premium
- Informações detalhadas (tribunal, vara, especialidades)
- Controle de preço de acesso (se premium)

**Arquitetura:**
- **Juízes Globais**: Criados pelo SuperAdmin, visíveis para todos os tenants quando `isPublico: true`
- **Juízes Premium**: Podem ter `isPremium: true` e `precoAcesso` definido
- **Juízes Privados**: Criados pelos próprios tenants, isolados por tenant

#### 6. **Pacotes Premium** (`/admin/pacotes`)
- Configurar pacotes de monetização
- Gerenciar juízes premium
- Definir preços e políticas de cobrança
- Controlar acesso a funcionalidades premium

#### 7. **Financeiro** (`/admin/financeiro`)
- Gestão financeira global do sistema
- Visualizar faturamento por tenant
- Controle de assinaturas
- Relatórios financeiros
- Integração com gateway de pagamento

#### 8. **Bancos** (`/admin/bancos`)
- Gestão completa de bancos do sistema
- CRUD de bancos (código, nome, CNPJ, ISPB)
- Dashboard com estatísticas
- Contas vinculadas por banco
- Ativar/desativar bancos

#### 9. **Relatórios** (`/admin/relatorios`)
- Analytics e relatórios do sistema
- Uso por tenant e usuário
- Métricas de crescimento
- Exportação de dados

### 🔧 Navegação Secundária

#### 10. **Auditoria** (`/admin/auditoria`)
- Logs completos do sistema
- Registro de todas as ações administrativas
- Auditoria de segurança
- Rastreamento de mudanças

#### 11. **Configurações** (`/admin/configuracoes`)
- Configurações globais do sistema
- Parâmetros administrativos
- Ajustes de infraestrutura

#### 12. **Suporte** (`/admin/suporte`)
- Central de suporte e ajuda
- Documentação administrativa
- Ferramentas de diagnóstico

---

## 🏗️ Funcionalidades Principais

### 🏢 Gerenciamento de Tenants

**Operações Disponíveis:**
- ✅ **Criar novos escritórios** de advocacia
- ✅ **Visualizar lista** de todos os tenants
- ✅ **Editar informações** do escritório
- ✅ **Gerenciar usuários** do tenant (criar, editar, excluir)
- ✅ **Resetar senhas** de usuários
- ✅ **Controlar status** (ATIVO, SUSPENSO, CANCELADO)
- ✅ **Visualizar estatísticas** de cada tenant
- ✅ **Gerenciar domínios** customizados

**Criação de Tenant:**
1. Acesse `/admin/tenants/new`
2. Preencha dados do escritório (nome, CNPJ, etc.)
3. Configure usuário admin inicial
4. Sistema cria automaticamente:
   - Tenant com branding padrão
   - Usuário admin do tenant
   - Configurações básicas
   - Isolamento de dados garantido

### 👨‍⚖️ Gerenciamento de Juízes Globais

**Funcionalidades:**
- ✅ **Criar juízes públicos** (visíveis para todos os tenants)
- ✅ **Criar juízes premium** (com preço de acesso)
- ✅ **Editar informações** detalhadas
- ✅ **Definir especialidades** e áreas de atuação
- ✅ **Controlar visibilidade** (público/premium)
- ✅ **Configurar preços** de acesso
- ✅ **Gerenciar favoritos** e avaliações

**Diferença entre Juízes:**
- **Globais (SuperAdmin)**: Controlados exclusivamente pelo SuperAdmin, podem ser públicos ou premium
- **Privados (Tenants)**: Criados pelos próprios tenants, isolados e não vazam dados entre tenants

### 💎 Gestão de Planos e Módulos

**Planos:**
- Gerenciar planos disponíveis (Básico, Premium, Enterprise)
- Controlar limites (usuários, processos, storage)
- Definir valores mensais/anuais
- Configurar período de teste
- Liberar módulos por plano

**Módulos:**
- Ativar/desativar módulos do sistema
- Organizar por categorias
- Gerenciar permissões por módulo
- Controlar disponibilidade por plano

### 💰 Financeiro e Monetização

**Funcionalidades:**
- Visualizar faturamento global
- Controlar assinaturas e cobranças
- Relatórios financeiros detalhados
- Integração com gateway (Asaas)
- Gestão de inadimplência

**Modelo de Monetização:**
- Assinaturas mensais/anuais por plano
- Acesso pago a juízes premium
- Comissões sobre vendas
- Consultoria e suporte premium

### 🏦 Gestão de Bancos

**Funcionalidades:**
- CRUD completo de bancos
- Cadastro com código, nome, CNPJ, ISPB
- Dashboard com estatísticas
- Visualizar contas vinculadas
- Ativar/desativar bancos
- Busca e filtros

---

## 🔒 Segurança Implementada

### 1. Controle de Acesso
- ✅ **Middleware de proteção** em todas as rotas `/admin/*`
- ✅ **Validação de SuperAdmin** por role e email
- ✅ **Verificação de status** (SuperAdmin deve estar ACTIVE)
- ✅ **Redirecionamento automático** para usuários não autorizados

### 2. Isolamento de Dados
- ✅ **Juízes globais**: Controlados pelo SuperAdmin
- ✅ **Juízes privados**: Isolados por tenant (sem vazamento)
- ✅ **Tenants**: Dados completamente isolados
- ✅ **Filtros obrigatórios** em todas as queries

### 3. Auditoria
- ✅ **Logs completos** de todas as ações administrativas
- ✅ **Rastreamento de mudanças** em tenants e juízes
- ✅ **Registro de acesso** e operações sensíveis
- ✅ **Histórico completo** de modificações

---

## 🛠️ Como Usar

### Acessar o Sistema

1. **Login:**
   ```
   URL: http://localhost:9192/admin
   Email: robsonnonatoiii@gmail.com
   Senha: Robson123!
   ```

2. **Dashboard:**
   - Visão geral imediata do sistema
   - Métricas e estatísticas importantes
   - Cards com informações executivas

### Criar um Novo Tenant

1. Acesse **Tenants** → **Criar Novo Tenant**
2. Preencha formulário completo:
   - Dados do escritório (nome, CNPJ, etc.)
   - Usuário admin inicial
   - Configurações básicas
3. Sistema cria automaticamente o tenant isolado

### Adicionar Juiz Global

1. Acesse **Juízes Globais** → **Adicionar Juiz**
2. Preencha informações:
   - Nome, tribunal, vara
   - Especialidades
   - Tipo: Público ou Premium
3. Se Premium, configure preço de acesso
4. Juiz fica disponível para todos os tenants

### Gerenciar Tenant Específico

1. Acesse **Tenants** → Clique no tenant desejado
2. Visualize/edite informações do escritório
3. Gerencie usuários:
   - Criar novos usuários
   - Editar usuários existentes
   - Resetar senhas
   - Excluir usuários
4. Controle status (ativo/suspenso/cancelado)

---

## 📊 Estrutura de Navegação

O sistema administrativo utiliza um sidebar com navegação organizada:

**Navegação Principal:**
- Dashboard
- Tenants
- Planos
- Gestão de Módulos (Módulos | Categorias)
- Juízes Globais
- Pacotes Premium
- Financeiro
- Bancos
- Relatórios

**Navegação Secundária:**
- Auditoria
- Configurações
- Suporte

---

## 📚 Arquivos Relacionados

- **Layout Admin**: `app/admin/layout.tsx`
- **Navegação**: `app/hooks/use-admin-navigation.ts`
- **Componentes**: `components/admin-app-shell.tsx`
- **Server Actions**: `app/actions/admin/*.ts`
- **Páginas**: `app/admin/**/page.tsx`

---

## 🚨 Importante

- ⚠️ **Acesso Restrito**: Apenas SuperAdmin pode acessar `/admin/*`
- ⚠️ **Isolamento Total**: Dados de tenants nunca se misturam
- ⚠️ **Auditoria Completa**: Todas as ações são registradas
- ⚠️ **Validações**: Sempre verificar permissões e status antes de operações

---

**Última atualização:** Baseado na estrutura real do código em `app/admin/` e `app/hooks/use-admin-navigation.ts`

**Magic Lawyer v1.0 - Sistema Administrativo** 🔑  
*Plataforma White Label para Escritórios de Advocacia*
