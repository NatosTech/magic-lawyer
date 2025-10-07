# Módulo de Clientes - Melhorias e Segurança

## 🔐 Melhorias de Segurança Implementadas

### 1. Bloqueio de Email de SuperAdmin
```typescript
// Verifica se email pertence a um SuperAdmin antes de criar usuário
const superAdminExistente = await prisma.superAdmin.findUnique({
  where: { email: clienteData.email },
});

if (superAdminExistente) {
  return { 
    success: false, 
    error: "Este email pertence a um Super Admin e não pode ser usado para clientes" 
  };
}
```

**Proteção**: Impede que emails de SuperAdmin sejam usados para criar contas de cliente.

### 2. Vinculação Automática ao Advogado
```typescript
// Se advogado criar cliente, vincular automaticamente a ele
if (!advogadosParaVincular && user.role === "ADVOGADO") {
  const advogadoLogado = await getAdvogadoIdFromSession(session);
  if (advogadoLogado) {
    advogadosParaVincular = [advogadoLogado];
  }
}
```

**Benefício**: Cliente criado por advogado aparece automaticamente na lista dele via `AdvogadoCliente`.

### 3. Rastreamento de Criação de Usuários
```prisma
model Usuario {
  ...
  createdById      String?
  createdBy        Usuario?  @relation("UsuarioCriador")
  usuariosCriados  Usuario[] @relation("UsuarioCriador")
}
```

**Auditoria**: Sistema registra quem criou cada usuário para rastreabilidade.

## 📝 Validações Implementadas

### Validador de CPF
Criado em: `lib/api/cpf.ts`

**Funções:**
- ✅ `validarCpf(cpf: string)` - Validação com algoritmo oficial
- ✅ `formatarCpf(cpf: string)` - Formata para 000.000.000-00
- ✅ `limparCpf(cpf: string)` - Remove formatação

**Validações:**
- Verifica se tem 11 dígitos
- Detecta sequências inválidas (111.111.111-11)
- Valida dígitos verificadores

### Componente CpfInput
Criado em: `components/cpf-input.tsx`

**Recursos:**
- ✅ Formatação automática ao digitar
- ✅ Validação em tempo real (onBlur)
- ✅ Mensagem de erro visual
- ✅ Ícone de usuário
- ✅ Máximo de 14 caracteres (formatado)

## 🔍 Busca Automática de CNPJ

### Server Action Existente
Arquivo: `app/actions/brazil-apis.ts`

```typescript
export async function buscarCnpjAction(cnpj: string)
```

**API Utilizada**: [ReceitaWS](https://www.receitaws.com.br/) (gratuita)

**Dados retornados:**
- Razão Social
- Nome Fantasia
- Endereço completo
- Situação cadastral
- Capital social
- Quadro societário (QSA)
- E muito mais...

### Componente CnpjInput
Arquivo: `components/cnpj-input.tsx`

**Recursos:**
- ✅ Formatação automática
- ✅ Validação de formato
- ✅ Botão de busca integrado
- ✅ Callback `onCnpjFound` com dados da empresa
- ✅ Loading state
- ✅ Suporte a Tab e Enter para buscar

## 📋 Formulário Completo de Cliente

### Modal de Criação

**Campos Pessoa Física:**
- Nome Completo (obrigatório)
- CPF (com validação)
- Email (obrigatório se criar usuário)
- Telefone
- Celular/WhatsApp
- Checkbox: Criar usuário de acesso
- Observações

**Campos Pessoa Jurídica:**
- Razão Social (obrigatório)
- CNPJ (com busca automática via Tab)
- Email (obrigatório se criar usuário)
- Telefone
- Celular/WhatsApp
- **Dados do Responsável:**
  - Nome do Responsável
  - Email do Responsável
  - Telefone do Responsável
- Checkbox: Criar usuário de acesso
- Observações

### Formulário ao Pressionar Tab no CNPJ

Quando o usuário digita o CNPJ e pressiona **Tab**, o sistema:

1. ✅ Valida o formato do CNPJ
2. ✅ Busca dados na API da Receita Federal
3. ✅ Preenche automaticamente:
   - Razão Social
   - CNPJ formatado
4. ✅ Exibe toast de sucesso
5. ✅ Permite edição manual após preenchimento

## 🎨 Melhorias de UX

### Ícones Contextuais
- 👤 Pessoa Física → Ícone de User
- 🏢 Pessoa Jurídica → Ícone de Building2
- 📧 Email → Ícone de Mail
- 📞 Telefone → Ícone de Phone
- 🔑 Credenciais → Ícone de Key

### Estados Visuais
- ✅ Loading states em todos os botões
- ✅ Validação em tempo real nos inputs
- ✅ Mensagens de erro claras
- ✅ Toast notifications informativas
- ✅ Modal de credenciais destacado

### Botões Copiáveis
No modal de credenciais:
- ✅ Email copiável com um clique
- ✅ Senha copiável com um clique
- ✅ Feedback visual ao copiar
- ✅ Fonte mono-espaçada para legibilidade

## 🧪 Validações Aplicadas

### Ao Criar Cliente

```typescript
// Validações implementadas:
1. Nome obrigatório
2. Email obrigatório se criar usuário
3. Email não pode ser de SuperAdmin
4. Email não pode existir no tenant
5. CPF validado com algoritmo oficial
6. CNPJ validado e buscado na Receita
```

### Integridade de Dados

```typescript
// Schema garante:
@@unique([tenantId, documento])  // Documento único por tenant
@@unique([tenantId, usuarioId])  // Usuario único por tenant
```

## 📊 Onde CPF é Validado

### 1. Componente de Cliente
- ✅ `app/(protected)/clientes/clientes-content.tsx` - Usa CpfInput

### 2. Componente de Juiz
- ✅ `app/(protected)/juizes/juizes-content.tsx` - Usa CpfInput

### 3. Formulário de Perfil
- ⚠️ Pendente de atualização (se houver)

## 🚀 Como Usar

### Criar Cliente Pessoa Física
1. Clique em "Novo Cliente"
2. Selecione "Pessoa Física"
3. Digite o nome completo
4. Digite o CPF (será validado automaticamente)
5. Digite o email
6. Marque "Criar usuário de acesso"
7. Clique em "Criar Cliente"
8. **Anote as credenciais** exibidas no modal!

### Criar Cliente Pessoa Jurídica
1. Clique em "Novo Cliente"
2. Selecione "Pessoa Jurídica"
3. Digite o CNPJ e pressione **Tab**
   - Dados serão preenchidos automaticamente!
4. Complete os dados do responsável
5. Digite o email
6. Marque "Criar usuário de acesso"
7. Clique em "Criar Cliente"
8. **Anote as credenciais** exibidas no modal!

## ⚠️ Avisos Importantes

1. **Senha é exibida apenas uma vez** - Anote ou envie imediatamente
2. **Email de SuperAdmin bloqueado** - Não pode ser usado para clientes
3. **Cliente vinculado automaticamente** - Aparece na lista do advogado
4. **CPF/CNPJ validados** - Não aceita documentos inválidos
5. **Tab no CNPJ** - Busca dados automaticamente da Receita Federal

## 🔗 Integração com Receita Federal

API Utilizada: **ReceitaWS**
- URL: https://www.receitaws.com.br/
- Gratuita e sem necessidade de autenticação
- Dados atualizados da Receita Federal
- Cache de 1 hora para otimização

## 📚 Arquivos Modificados

### Criados
1. ✅ `lib/api/cpf.ts` - Validador e formatador de CPF
2. ✅ `components/cpf-input.tsx` - Componente de input de CPF

### Atualizados
1. ✅ `app/actions/clientes.ts` - Validações e vinculação automática
2. ✅ `app/(protected)/clientes/clientes-content.tsx` - Formulário completo
3. ✅ `app/(protected)/juizes/juizes-content.tsx` - Usa CpfInput
4. ✅ `prisma/schema.prisma` - Campo createdById em Usuario
5. ✅ `components/ui/modal.tsx` - Suporte a footer

## ✨ Resultado Final

- ✅ Formulário completo e profissional
- ✅ Validação de CPF em tempo real
- ✅ Busca automática de CNPJ (Tab)
- ✅ Proteção contra email de SuperAdmin
- ✅ Vinculação automática ao advogado
- ✅ Auditoria de quem criou usuários
- ✅ Modal de credenciais destacado
- ✅ UX moderna e intuitiva

