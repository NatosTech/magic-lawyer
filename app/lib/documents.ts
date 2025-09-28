import prisma from "./prisma";

// Retorna documentos diretamente do processo (1:N legado e M:N via pivot)
// + documentos pessoais do cliente relacionados ao processo
// Nota: filtros de visibilidade (cliente/equipe) podem ser adicionados após aplicar migrations e gerar o client.
export async function getDocumentosDoProcesso(processoId: string) {
  const processo = await prisma.processo.findUnique({
    where: { id: processoId },
    select: { id: true, tenantId: true, clienteId: true },
  });
  if (!processo) return [];

  const [docsDiretos, pivots, docsCliente] = await Promise.all([
    prisma.documento.findMany({
      where: { tenantId: processo.tenantId, processoId },
    }),
    prisma.processoDocumento.findMany({
      where: { tenantId: processo.tenantId, processoId },
      select: { documentoId: true },
    }),
    prisma.documento.findMany({
      where: { tenantId: processo.tenantId, clienteId: processo.clienteId },
    }),
  ]);

  const pivotDocIds = Array.from(new Set(pivots.map((p) => p.documentoId)));
  const docsViaPivot = pivotDocIds.length ? await prisma.documento.findMany({ where: { id: { in: pivotDocIds }, tenantId: processo.tenantId } }) : [];

  const byId = new Map<string, any>();
  for (const d of docsDiretos) byId.set(d.id, d);
  for (const d of docsViaPivot) byId.set(d.id, d);
  for (const d of docsCliente) byId.set(d.id, d);

  return Array.from(byId.values());
}
