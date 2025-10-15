# 🔐 Sistema de Assinatura Digital - Estrutura Base

## 📋 Visão Geral

O Magic Lawyer possui uma **estrutura completa** para gerenciar assinaturas digitais de petições. A implementação atual é **neutra** e está preparada para integração com qualquer solução de assinatura digital.

---

## ✅ O que está implementado

### 1. Modelo de Dados

**Tabela: `AssinaturaPeticao`**

```prisma
model AssinaturaPeticao {
  id                 String         @id @default(cuid())
  tenantId           String
  peticaoId          String
  usuarioId          String?
  assinanteNome      String
  assinanteDocumento String?        // CPF/CNPJ
  assinanteEmail     String?
  assinanteTelefone  String?
  tipoAssinatura     AssinaturaTipo @default(MANUAL)
  ipAssinatura       String?
  provedorAssinatura String?        // Nome da plataforma/método usado
  tokenAssinatura    String?        // Token de validação (se aplicável)
  hashArquivo        String?        // Hash SHA256 do documento
  arquivoUrl         String?        // URL do documento assinado
  metadados          Json?          // Dados adicionais em JSON
  status             String         @default("PENDENTE")
  assinadaEm         DateTime?
  expiradaEm         DateTime?
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt

  // Relacionamentos
  peticao Peticao  @relation(fields: [peticaoId], references: [id])
  tenant  Tenant   @relation(fields: [tenantId], references: [id])
  usuario Usuario? @relation(fields: [usuarioId], references: [id])
}
```

**Enum: `AssinaturaTipo`**

```prisma
enum AssinaturaTipo {
  MANUAL      // Assinatura manual (não digital)
  DIGITAL     // Assinatura digital genérica
  ICP_BRASIL  // Certificado ICP-Brasil (A1/A3)
  GOV_BR      // gov.br (não aplicável para SaaS privado)
  OUTRO       // Outros métodos
}
```

### 2. Server Actions

**Arquivo:** `app/actions/assinaturas.ts`

```typescript
// Funções disponíveis:
listarAssinaturas(peticaoId: string)
verificarStatusAssinatura(assinaturaId: string)
cancelarAssinatura(assinaturaId: string)
verificarPeticaoAssinada(peticaoId: string)
```

### 3. Hooks SWR

**Arquivo:** `app/hooks/use-assinaturas.ts`

```typescript
// Hooks disponíveis:
useAssinaturas(peticaoId)           // Lista assinaturas de uma petição
useStatusAssinatura(assinaturaId)   // Verifica status (atualiza a cada 5s)
usePeticaoAssinada(peticaoId)       // Verifica se petição está assinada
```

### 4. Interface do Usuário

**Componentes:**
- ✅ Botão "Assinar" nas petições (aparece apenas se houver documento)
- ✅ Modal de assinatura com lista de assinaturas existentes
- ✅ Chips de status coloridos (PENDENTE, ASSINADO, REJEITADO, EXPIRADO)
- ✅ Exibição de metadados (nome, CPF, email, telefone, provedor)

---

## 🎯 Como Integrar uma Solução de Assinatura

A estrutura está preparada para receber **qualquer** solução de assinatura digital. Aqui está o que você precisa fazer:

### Passo 1: Criar Server Action de Iniciar Assinatura

```typescript
// app/actions/assinaturas.ts

export async function iniciarAssinatura(
  peticaoId: string,
  metodo: string // "PLATAFORMA_X", "ICP_A1", etc
): Promise<ActionResponse<{ assinaturaId: string; urlRedirect?: string }>> {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const userInfo = await getUserInfo();

    // 1. Verificar se petição existe e tem documento
    const peticao = await prisma.peticao.findFirst({
      where: { id: peticaoId, tenantId },
      include: { documento: true },
    });

    if (!peticao?.documento) {
      return { success: false, error: "Petição sem documento" };
    }

    // 2. Criar registro de assinatura
    const assinatura = await prisma.assinaturaPeticao.create({
      data: {
        tenantId,
        peticaoId,
        usuarioId: userId,
        assinanteNome: userInfo.name,
        assinanteEmail: userInfo.email,
        tipoAssinatura: "DIGITAL", // ou outro tipo
        provedorAssinatura: metodo,
        status: "PENDENTE",
        expiradaEm: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // 3. AQUI: Integrar com sua solução de assinatura
    // Exemplo:
    // const urlAssinatura = await suaSolucao.criarDocumento(peticao.documento);

    return {
      success: true,
      data: {
        assinaturaId: assinatura.id,
        urlRedirect: "URL_DA_SUA_SOLUCAO", // opcional
      },
    };
  } catch (error) {
    return { success: false, error: "Erro ao iniciar assinatura" };
  }
}
```

### Passo 2: Criar Rota de Callback (se necessário)

```typescript
// app/api/assinatura/callback/route.ts

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assinaturaId = searchParams.get("id");
  const status = searchParams.get("status");

  // Atualizar assinatura no banco
  await prisma.assinaturaPeticao.update({
    where: { id: assinaturaId },
    data: {
      status: status === "signed" ? "ASSINADO" : "REJEITADO",
      assinadaEm: status === "signed" ? new Date() : null,
    },
  });

  // Redirecionar para página de petições
  return NextResponse.redirect(new URL("/peticoes", request.url));
}
```

### Passo 3: Atualizar Modal de Assinatura

```typescript
// app/(protected)/peticoes/page.tsx

const handleIniciarAssinatura = async (metodo: string) => {
  const result = await iniciarAssinatura(assinaturaPeticaoId, metodo);

  if (result.success && result.data?.urlRedirect) {
    // Redirecionar para plataforma de assinatura
    window.location.href = result.data.urlRedirect;
  } else if (result.success) {
    toast.success("Assinatura iniciada!");
    setAssinaturaModalOpen(false);
    mutatePeticoes();
  } else {
    toast.error(result.error || "Erro ao iniciar assinatura");
  }
};
```

---

## 📊 Fluxo de Assinatura

```
1. Usuário clica em "Assinar" na petição
2. Modal abre mostrando opções disponíveis
3. Usuário escolhe método de assinatura
4. Sistema cria registro no banco (status: PENDENTE)
5. Sistema integra com solução escolhida
6. Usuário é redirecionado (se necessário)
7. Usuário assina o documento
8. Sistema recebe callback/webhook
9. Sistema atualiza status para ASSINADO
10. Usuário vê confirmação
```

---

## 🔒 Campos Importantes

### Status de Assinatura
- `PENDENTE` - Aguardando assinatura
- `ASSINADO` - Documento assinado
- `REJEITADO` - Assinatura recusada
- `EXPIRADO` - Prazo expirado (24h)

### Metadados (JSON)
Você pode armazenar qualquer informação adicional no campo `metadados`:

```json
{
  "certificado": {
    "tipo": "A1",
    "validade": "2025-12-31",
    "emissor": "AC Certisign"
  },
  "plataforma": {
    "nome": "Plataforma X",
    "documentId": "abc123",
    "signerId": "xyz789"
  },
  "validacao": {
    "timestamp": "2025-10-14T20:00:00Z",
    "ip": "192.168.1.1"
  }
}
```

---

## 🎨 Interface Atual

### Botão "Assinar"
- Aparece apenas se a petição tiver documento anexado
- Cor secundária (roxo)
- Ícone de caneta

### Modal de Assinatura
- Lista de assinaturas existentes
- Status com chips coloridos
- Metadados do assinante
- Aviso de funcionalidade futura (até implementar)

---

## 🚀 Próximos Passos

1. **Definir solução de assinatura** a ser utilizada
2. **Implementar integração** conforme passos acima
3. **Testar fluxo completo**
4. **Atualizar modal** com opções reais
5. **Documentar** processo específico

---

## 📝 Notas Importantes

- ✅ Estrutura **100% pronta** para qualquer solução
- ✅ Código **neutro** e **flexível**
- ✅ Suporta **múltiplos métodos** de assinatura
- ✅ **Isolamento por tenant** garantido
- ✅ **Metadados extensíveis** via JSON
- ✅ **Status automático** de expiração

---

**Desenvolvido com ❤️ pela equipe Magic Lawyer**

