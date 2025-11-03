# Proposta: Sistema de Roles Flexível por Tenant

## 🎯 Problema Identificado

**Situação Atual:**
- Roles são hardcoded no enum `UserRole` (SUPER_ADMIN, ADMIN, ADVOGADO, SECRETARIA, FINANCEIRO, CLIENTE)
- Não permite que cada tenant tenha suas próprias funções (ex: Estagiária, Menor Aprendiz, Controller)
- Exige migration do banco toda vez que precisar adicionar um novo tipo

**Cenários Reais:**
- Escritório A tem: Estagiária, Menor Aprendiz, Controller
- Escritório B tem: Estagiária, Assistent Jurídico
- Escritório C tem: Controller, Coordenador

Cada tenant precisa de flexibilidade!

## 📊 Arquitetura Atual

### O que já existe:

1. **`UserRole` (enum)** - Roles do sistema
   - SUPER_ADMIN (global)
   - ADMIN, ADVOGADO, SECRETARIA, FINANCEIRO, CLIENTE (por tenant)

2. **`Cargo` (model)** - ✅ JÁ É FLEXÍVEL!
   - Cada tenant cria seus próprios cargos
   - Cargos têm permissões customizadas
   - Usuários podem ter cargos atribuídos

3. **Sistema de Permissões** - Hierarquia:
   - Override Individual → Cargo → Role padrão

### O problema:

Estamos mostrando `usuario.role` (enum fixo) na tabela de usuários, mas **deveríamos mostrar o Cargo** como identificador principal da função do usuário no escritório.

## 💡 Proposta: Usar Cargo como "Função Principal"

### Opção 1: Cargo como Identificador Principal (RECOMENDADA)

**Conceito:**
- `role` (enum) = Nível base do sistema (ADMIN, ADVOGADO, SECRETARIA, FINANCEIRO, CLIENTE)
- `Cargo` = Função específica no escritório (Estagiária, Menor Aprendiz, Controller, etc.)

**Como funciona:**
1. Cada tenant cria seus próprios cargos via UI (`/equipe` → Aba Cargos)
2. Ao criar/editar usuário, ADMIN atribui:
   - **Role base** (ADMIN, ADVOGADO, SECRETARIA, etc.) - define permissões padrão
   - **Cargo** (Estagiária, Controller, etc.) - função específica no escritório
3. Na tabela de usuários, mostrar **Cargo** como identificador principal
4. `role` fica como "nível base" (usado apenas para permissões padrão quando não há cargo)

**Vantagens:**
- ✅ Zero migration - usa estrutura existente
- ✅ Totalmente flexível por tenant
- ✅ Permissões já funcionam (Cargo → permissões customizadas)
- ✅ Cada tenant cria seus próprios cargos

**Exemplo:**
```
Tenant A cria cargos:
- "Estagiária" (nivel 1)
- "Menor Aprendiz" (nivel 1)
- "Controller" (nivel 4)

Usuário: Maria
- role: SECRETARIA (nível base)
- cargo: "Estagiária" (função específica)
- Permissões: vêm do cargo "Estagiária"
```

### Opção 2: Tabela TenantRole (Mais Complexa)

**Conceito:**
- Criar tabela `TenantRole` onde cada tenant define suas roles customizadas
- `UserRole` enum continua apenas para roles do sistema (SUPER_ADMIN, ADMIN)
- Usuário tem `role` (do sistema) + `tenantRoleId` (customizado)

**Estrutura proposta:**
```prisma
model TenantRole {
  id          String   @id @default(cuid())
  tenantId    String
  nome        String   // "Estagiária", "Controller", etc.
  slug        String   // "estagiaria", "controller"
  descricao   String?
  icone       String?  // Nome do ícone
  cor         String?  // Cor do chip
  ativo       Boolean  @default(true)
  permissoesPadrao Json? // Permissões padrão da role
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant  Tenant    @relation(fields: [tenantId], references: [id])
  usuarios Usuario[] // Usuários com esta role
  
  @@unique([tenantId, slug])
  @@index([tenantId])
}
```

**E atualizar Usuario:**
```prisma
model Usuario {
  // ...
  role          UserRole     // Roles do sistema
  tenantRoleId  String?      // Role customizada do tenant (NOVA)
  // ...
}
```

**Vantagens:**
- Roles customizadas separadas de Cargos
- Permissões podem vir da TenantRole ou do Cargo
- Mais granularidade

**Desvantagens:**
- ❌ Requer migration do banco
- ❌ Mais complexo (duas tabelas: TenantRole + Cargo)
- ❌ Pode confundir: Role vs Cargo vs TenantRole

## 🎯 Recomendação: Opção 1 (Usar Cargo)

### Por quê?

1. **Já existe e funciona** - Cargo já permite criar funções customizadas por tenant
2. **Sem migration** - Zero breaking changes
3. **Permissões já funcionam** - Sistema de permissões já usa Cargo
4. **Simples** - Apenas precisamos mudar a UI para mostrar Cargo ao invés de role

### O que precisa mudar:

1. **UI da tabela de usuários:**
   - Mostrar **Cargo principal** como identificador (ao invés de role)
   - Role fica como "nível base" (usado internamente)

2. **Modal de edição:**
   - Select de **Cargo** (ao invés de role hardcoded)
   - Role pode ficar como campo secundário ou ser derivado do cargo

3. **Criação de usuário:**
   - Atribuir Cargo ao criar usuário
   - Role pode ser opcional ou derivado do cargo

4. **Validações:**
   - Permitir usuários sem cargo? (usa role padrão)
   - Ou exigir cargo sempre?

## 🤔 Questões para Decisão

1. **Usuário pode não ter Cargo?**
   - Se sim: usa permissões do `role` padrão
   - Se não: sempre exigir cargo ao criar usuário

2. **Role deve ser editável?**
   - Opção A: Role é derivado do Cargo (cargo define role base)
   - Opção B: Role e Cargo são independentes

3. **Múltiplos cargos?**
   - Sistema já permite múltiplos cargos (UsuarioCargo)
   - Qual é o "cargo principal" para mostrar na tabela?

4. **Compatibilidade:**
   - Usuários existentes sem cargo? Como tratar?
   - Migração de dados necessária?

## 📋 Próximos Passos

**Aguardando decisão do usuário sobre:**
- Opção 1 (usar Cargo) ou Opção 2 (criar TenantRole)
- Se usuário pode não ter cargo
- Como tratar usuários existentes

---

**Última atualização:** Após análise da arquitetura atual

