# Menu de Configurações (Sidebar)

Planejamento para documentar e tornar autoexplicativas todas as entradas do dropdown **Configurações** no painel.

## ✅ Objetivos
- Garantir que cada item do menu possua tooltips/popovers que expliquem claramente sua função.
- Padronizar textos, ícones e comportamentos para reduzir dúvidas de uso.
- Centralizar a manutenção dessas descrições para futuras iterações do produto.

## 🧭 Checklist Detalhado

### 1. Levantamento e Conteúdo
- [ ] Catalogar todos os itens do dropdown Configurações (Configurações do Escritório, Categorias de Tarefa, Áreas de Processo, Tipos de Contrato, Tribunais, Feriados, Tipos de Petição, Dados Bancários).
- [ ] Para cada item, descrever objetivo, ações principais e público-alvo (ex.: apenas administradores?).
- [ ] Definir microcópias para tooltips/popovers e validar tom/terminologia com UX writing.
- [ ] Identificar estados adicionais que merecem legendas (ex.: ícones desabilitados, badges).

### 2. UX e Implementação In-app
- [ ] Escolher padrão de componente (tooltip, popover, hint persistente) conforme complexidade do item.
- [ ] Inserir ícones auxiliares (ex.: `?` ou `i`) quando necessário para indicar ajuda contextual.
- [ ] Garantir acessibilidade (focus, teclado, aria-labels) para cada ajuda contextual.
- [ ] Validar responsividade: tooltips não podem extrapolar a viewport em telas menores.

### 3. Manutenção e Governança
- [ ] Documentar no Storybook/Design System as descrições e guidelines dos ícones/ajudas.
- [ ] Definir ownership (quem atualiza textos quando novas funcionalidades surgirem).
- [ ] Incluir processo de revisão nas releases que adicionem itens no menu de Configurações.

### 4. Testes e Validação
- [ ] Executar walkthrough com usuários internos para validar clareza das legendas.
- [ ] Adicionar testes visuais/automatizados para garantir que tooltips renderizem corretamente.
- [ ] Monitorar métricas de uso (ex.: redução de tickets de suporte relacionados a cada item).

## 📌 Roteiro de Microcópias (inicial)

- **Configurações do Escritório**: ajustes gerais do tenant (dados cadastrais, branding, preferências globais).
- **Categorias de Tarefa**: catálogo de etiquetas para classificar tarefas do time.
- **Áreas de Processo**: mapeamento das áreas jurídicas atendidas pela equipe.
- **Tipos de Contrato**: modelos de contratos oferecidos/gerenciados pela banca.
- **Tribunais**: cadastro de tribunais com dados relevantes (UF, instância, integrações).
- **Feriados**: calendário personalizado impactando prazos e agendas.
- **Tipos de Petição**: biblioteca de petições com estrutura padronizada.
- **Dados Bancários**: contas cadastradas para cobranças, repasses e controle financeiro.

---

> Use este documento como referência única ao evoluir o menu Configurações, garantindo que nenhuma ação apareça sem explicação para o usuário final.
