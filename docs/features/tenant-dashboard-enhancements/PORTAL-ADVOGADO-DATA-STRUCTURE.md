# Estrutura de Dados - Portal do Advogado

Documentação da estrutura de dados para UF (Unidade Federativa) do Tenant e Processos.

## 📊 Estrutura Atual

### Tenant UF (Unidade Federativa Principal)

**Modelo:** `Endereco`
- **Campo:** `estado` (String, obrigatório)
- **Filtro:** `principal = true` para identificar endereço principal
- **Query:** `Endereco` onde `tenantId = X` e `principal = true`

**Observações:**
- Um tenant pode ter múltiplos endereços
- Apenas um endereço pode ser marcado como `principal = true`
- O campo `estado` armazena a UF (ex: "BA", "SP", "RJ")
- Se não houver endereço principal, pode usar o primeiro endereço encontrado

### Processo UF (Unidade Federativa de Tramitação)

**Modelo:** `Processo` → `Tribunal`
- **Campo:** `Processo.tribunalId` (FK para `Tribunal`)
- **Campo derivado:** `Tribunal.uf` (String, opcional)
- **Query:** `Processo` onde `tenantId = X` → agrupar por `Tribunal.uf`

**Observações:**
- `Processo.tribunalId` é opcional (pode ser null)
- `Tribunal.uf` também é opcional
- Um tenant pode ter processos em múltiplas UFs
- Tribunais são por tenant (`Tribunal.tenantId`)

## 🔍 Queries de Exemplo

### Buscar UF Principal do Tenant

```prisma
const enderecoPrincipal = await prisma.endereco.findFirst({
  where: {
    tenantId: session.user.tenantId,
    principal: true,
  },
  select: {
    estado: true,
  },
});
```

### Buscar UFs onde Tenant tem Processos

```prisma
const processos = await prisma.processo.findMany({
  where: {
    tenantId: session.user.tenantId,
    tribunalId: { not: null },
  },
  include: {
    tribunal: {
      select: {
        uf: true,
      },
    },
  },
});

const ufs = [...new Set(
  processos
    .map(p => p.tribunal?.uf)
    .filter((uf): uf is string => uf !== null && uf !== undefined)
)];
```

### Buscar Tribunais por UF

```prisma
const tribunais = await prisma.tribunal.findMany({
  where: {
    tenantId: session.user.tenantId,
    uf: ufSelecionada,
  },
  select: {
    id: true,
    nome: true,
    sigla: true,
    uf: true,
    tipo: true,
  },
});
```

## 📝 Notas Importantes

1. **Fallback para Tenant UF:**
   - Se não houver endereço principal, usar o primeiro endereço encontrado
   - Se não houver endereço, retornar null ou array vazio

2. **Fallback para Processo UF:**
   - Processos sem `tribunalId` não contam para lista de UFs
   - Tribunais sem `uf` também não contam

3. **Multi-tenancy:**
   - Sempre filtrar por `tenantId` para garantir isolamento
   - Tribunais são específicos por tenant

---

**Última atualização:** Após análise do schema Prisma

