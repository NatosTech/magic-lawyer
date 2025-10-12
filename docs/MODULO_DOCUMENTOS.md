# 📁 Módulo de Documentos

Este módulo entrega a experiência de "explorador" pedida para `/documentos`, organizando o acervo por cliente → processo → pasta → arquivo com sincronização direta ao Cloudinary.

## Visão Geral

- **Explorador interativo:** cards de clientes, lista de processos e árvore de pastas lado a lado.
- **Cloudinary first:** toda pasta criada/renomeada/deletada replica imediatamente na nuvem e atualiza `Documento` + `DocumentoVersao`.
- **Upload drag & drop:** arraste PDFs, imagens ou arquivos Office diretamente para a pasta ativa (envio sequencial com feedback).
- **Contadores ao vivo:** totais de clientes/processos/documentos/arquivos, além de badges por pasta.
- **Revalidação automática:** `SWR` mantém o explorer sincronizado (focus/reconnect) sem depender do botão de atualizar.
- **Fallback seguro:** quando uma pasta não existe no Cloudinary o backend gera um nó virtual para facilitar o bootstrap.

## Estrutura de Pastas

```
magiclawyer/{tenantSlug}/clientes/{clienteSlug-id}/processos/{processoSlug-id}/{subpastas...}/arquivo.ext
magiclawyer/{tenantSlug}/clientes/{clienteSlug-id}/documentos/{subpastas...}/arquivo.ext
```

- `clienteSlug-id` utiliza `sanitizeSegment(nome)-{cuid}` (minúsculo, sem acentos).
- `processoSlug-id` segue o mesmo padrão aplicado ao número do processo.
- Subpastas são slugificadas automaticamente.

## Server Actions

| Action | Responsabilidade |
|--------|------------------|
| `getDocumentExplorerData` | Monta DTO hierárquico (clientes/processos/arquivos) e consulta a árvore de pastas no Cloudinary. |
| `uploadDocumentoExplorer` | Envia arquivo estruturado, cria `Documento` e primeira `DocumentoVersao`. |
| `createExplorerFolder` | Cria pasta vazia no Cloudinary respeitando o prefixo calculado. |
| `renameExplorerFolder` | Usa `cloudinary.api.rename_folder` e reescreve `cloudinaryPublicId`/`url` das versões + metadados legados. |
| `deleteExplorerFolder` | Deleta recursos por prefixo, marca documentos como `deletedAt` e remove versões vinculadas. |
| `deleteExplorerFile` | Remove um arquivo isolado (versão mais recente ou documento sem versão). |

Todas as actions validam `session.user`, tenant e vínculo com o cliente/processo antes de mutar dados.

## Upload Service

`UploadService` ganhou métodos especializados:

- `uploadStructuredDocument` (aplica pasta hierárquica, detecta `resource_type` e grava `folderPath`).
- `createFolder`, `renameFolder`, `deleteFolderRecursive`, `listSubFolders`, `buildFolderTree`.
- Helpers `toPathSegment`, `detectResourceType`, `guessMimeTypeFromName` mantêm padrão entre backend e frontend.

## UI / Fluxo

1. **Clientes:** buscável e com contadores; seleção reseta processo e pasta ativos.
2. **Processos:** lista vertical; ao selecionar, o painel direito renderiza a árvore específica.
3. **Árvore de pastas:** nós vindos do Cloudinary + nós derivados de documentos (garante exibição mesmo sem pasta física). A raiz representa a pasta base do processo ou "Documentos gerais" do cliente.
4. **Arquivos:** exibidos por pasta, com ações *Abrir* (CDN) e *Excluir*.
5. **Drag & Drop:** área aceita múltiplos arquivos, chama `uploadDocumentoExplorer` sequencialmente.
6. **Renomear / Excluir pasta:** prompts rápidos (`prompt` / `confirm`) acionam as actions correspondentes; `mutate()` do SWR refresca a árvore instantaneamente.

## Sincronismo Banco ↔ Cloudinary

- Upload cria `Documento` com metadados `{ folderPath, subpastas, originalFileName }` e uma `DocumentoVersao` #1.
- Renomear substitui prefixo do `public_id` e atualiza `url` em todas as versões + metadados legados.
- Deletar pasta remove versões, marca `Documento.deletedAt` e executa `delete_resources_by_prefix` antes de `delete_folder`.
- Deletar arquivo remove a versão (ou documento único) e atualiza o banco de dados.

## Extensões Futuras

- Permitir upload em "Documentos gerais" (sem processo) usando o mesmo pipeline (`categoria: "cliente"`).
- Implementar renomeação/duplicação de arquivos, versionamento incremental e filtros por tipo.
- Integrar auditoria (`DocumentoLog`) para rastrear quem moveu/renomeou.

---
**Atualizado em:** ${new Date().toISOString()}
