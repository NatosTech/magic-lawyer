# 🚀 Ações Rápidas - Página do Cliente

## 🎯 Decisão Arquitetural

Para manter a qualidade e manutenibilidade do sistema, implementamos uma abordagem **híbrida** para criação de recursos relacionados ao cliente:

---

## ✅ **O que PODE ser feito na página do cliente:**

### 📎 **Anexar Documento** (Modal)
- **Por quê?** Formulário simples (4-5 campos)
- **UX:** Rápido e eficiente
- **Implementação:** Modal dedicado

**Campos:**
- Nome do documento *
- Tipo (opcional)
- Descrição (opcional)
- Vincular a processo (opcional)
- Visível para cliente (checkbox)
- Upload de arquivo *

---

## 🔗 **O que é feito via ATALHOS:**

### ⚖️ **Novo Processo** → `/processos/novo?clienteId=XXX`
**Por quê?**
- Formulário complexo (20+ campos)
- Múltiplas relações (área, advogado, comarca, vara)
- Validações extensas
- Melhor UX em página dedicada

### 📝 **Novo Contrato** → `/contratos/novo?clienteId=XXX`
**Por quê?**
- Formulário médio (15+ campos)
- Relações (tipo, modelo, assinaturas)
- Preview de template
- Integração com ClickSign

### ✍️ **Nova Procuração** → `/procuracoes/novo?clienteId=XXX`
**Por quê?**
- Formulário muito complexo
- Vincula múltiplos processos (M:N via `ProcuracaoProcesso`)
- Seleciona outorgados (M:N via `ProcuracaoAdvogado`)
- Regras de substituição
- Upload de documento

---

## 🏗️ **Estrutura de Pastas Cloudinary**

### Documentos do Cliente
```
magiclawyer/
└── clientes/
    └── {nome-cliente}-{id}/
        └── documentos/
            ├── {timestamp}_documento1.pdf
            ├── {timestamp}_documento2.jpg
            └── {timestamp}_documento3.docx
```

**Exemplo:**
```
magiclawyer/clientes/joao-silva-cmxyz123/documentos/1696784567890_rg.pdf
```

---

## 📋 **Schema do Documento**

```prisma
model Documento {
  id                  String   @id @default(cuid())
  tenantId            String
  nome                String                 # Nome do documento
  tipo                String?                # Tipo (Contrato, Identidade, etc)
  descricao           String?                # Observações
  url                 String                 # URL do arquivo
  tamanhoBytes        Int?                   # Tamanho do arquivo
  contentType         String?                # MIME type
  processoId          String?                # Vinculado a processo (opcional)
  clienteId           String?                # Vinculado a cliente (opcional)
  contratoId          String?                # Vinculado a contrato (opcional)
  uploadedById        String?                # Quem fez upload
  visivelParaCliente  Boolean  @default(false)  # Cliente vê?
  visivelParaEquipe   Boolean  @default(true)   # Equipe vê?
  metadados           Json?                  # Metadados adicionais
  deletedAt           DateTime?              # Soft delete
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relações
  cliente             Cliente?  @relation("DocumentoCliente")
  processo            Processo? @relation("DocumentoProcesso")
  contrato            Contrato? @relation("ContratoDocumentos")
  uploadedBy          Usuario?  @relation("DocumentoUploader")
}
```

---

## 🔐 **Controle de Acesso**

### Upload de Documento:
```typescript
✅ ADMIN: Pode anexar documento a qualquer cliente
✅ ADVOGADO: Só pode anexar a clientes vinculados
❌ CLIENTE: Não pode anexar documentos pela interface
❌ SECRETARIA: (verificar permissão específica)
```

### Visualização:
```typescript
✅ ADMIN: Vê todos os documentos
✅ ADVOGADO: Vê documentos dos clientes vinculados
✅ CLIENTE: Vê apenas documentos marcados como visivelParaCliente
```

---

## 📱 **UX dos Botões de Atalho**

### Layout na Página do Cliente:
```
┌─────────────────────────────────────────────────────────┐
│  ← Voltar   [Anexar Documento] [Novo Processo] [Novo…] │
└─────────────────────────────────────────────────────────┘
```

### Comportamento:
1. **Anexar Documento:**
   - Abre modal
   - Cliente já selecionado
   - Upload direto

2. **Novo Processo:**
   - Redireciona para `/processos/novo?clienteId=XXX`
   - Formulário completo
   - Cliente pré-selecionado

3. **Novo Contrato:**
   - Redireciona para `/contratos/novo?clienteId=XXX`
   - Formulário completo
   - Cliente pré-selecionado

4. **Nova Procuração:**
   - Redireciona para `/procuracoes/novo?clienteId=XXX`
   - Formulário wizard/steps
   - Cliente pré-selecionado

---

## 🎨 **Estilos dos Botões**

```tsx
// Anexar Documento (ação principal)
<Button color="primary" variant="flat" />

// Novo Processo (atalho)
<Button color="primary" variant="bordered" />

// Novo Contrato (atalho)
<Button color="secondary" variant="bordered" />

// Nova Procuração (atalho)
<Button color="success" variant="bordered" />
```

---

## 🔄 **Revalidação de Dados**

Após anexar documento:
```typescript
mutateDocumentos();  // Recarrega lista de documentos
mutateCliente();     // Atualiza contador no card
```

---

## 📚 **Referências**

- Ver `app/actions/clientes.ts` → `anexarDocumentoCliente()`
- Ver `app/(protected)/clientes/[clienteId]/page.tsx` → Modal de Upload
- Ver `lib/upload-service.ts` → Serviço de Upload
- Ver [CLOUDINARY_FOLDER_STRUCTURE.md](./CLOUDINARY_FOLDER_STRUCTURE.md) → Estrutura de pastas

---

**Última atualização:** 2025-10-07  
**Decisão:** Abordagem Híbrida (Modal + Atalhos)  
**Status:** ✅ Implementado

