# 🎨 Estrutura de UI/UX e Padrões Frontend — SPDealer

> **Status**: Documentação Oficial
> **Versão**: 2.0 (Atualizada com suporte a FormBuilder v2.0 e FlowForm)
> **Última Atualização**: Junho de 2026

Este documento unifica e detalha todas as diretrizes de design, parâmetros visuais (cores, tipografia, espaçamento), atalhos de teclado e arquitetura de frontend adotados no ecossistema do **SPDealer**. Todos os desenvolvedores e agentes de IA devem seguir estritamente estas especificações para garantir a consistência do sistema.

---

## 1. 🧭 Estrutura de UI e Fluxos de Layout

O SPDealer adota duas topologias principais de layout para os seus formulários e módulos de interface. Ambos são implementados de maneira responsiva, empilhando elementos em dispositivos móveis (`< 768px`) e estendendo-se em desktops.

### 1.1 Estrutura Geral do Card (`.sp-card`)
Todo formulário básico ou modal de cadastro segue a seguinte hierarquia rígida de elementos DOM:

1. **`.sp-card`**: Container principal com borda sutil e fundo branco.
2. **`.sp-card__header`**: Topo do formulário que contém o título, ícone descritivo e botões de ação do painel (como minimizar/fechar). Possui fundo em gradiente azul.
3. **`.sp-card__body`**: Corpo do formulário onde a grid responsiva de campos (`.sp-form-grid` ou `.sp-grid`) é renderizada.
4. **`.sp-card__footer`**: Base contendo os botões de ação do formulário (Cancelar à esquerda, Salvar à direita).

```
┌────────────────────────────────────────────────────────────┐
│ .sp-card__header (Título + Botões de Controle)             │
├────────────────────────────────────────────────────────────┤
│ .sp-card__body                                             │
│  ┌───────────────────────┐   ┌──────────────────────────┐  │
│  │ Label 1               │   │ Label 2                  │  │
│  │ [ Input 1           ] │   │ [ Input 2              ] │  │
│  └───────────────────────┘   └──────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│ .sp-card__footer                                           │
│ [Cancelar]                                        [Salvar] │
└────────────────────────────────────────────────────────────┘
```

---

### 1.2 Os Dois Padrões de Layout

#### Padrão A: Formulário Padrão (Ex: Clientes, Fornecedores e CRUDs Gerais)
* **Visual**: Fundo do cabeçalho em azul degradê suave, fundo geral claro, e os inputs em cinza claro com bordas finas.
* **Layout**: Campos organizados em duas colunas responsivas por linha (ou uma única coluna dependendo da complexidade e tamanho).
* **Footer**: Botão "Salvar" (verde) alinhado à direita; botão "Cancelar" (cinza/branco) à esquerda.
* **Uso**: Cadastro de usuários, cadastro de filiais, transportadoras, etc.

#### Padrão B: Módulo Complexo (Ex: Vendas e Orçamentos)
* **Visual**: Cabeçalhos escuros para maior foco visual em dados densos, abas internas para fragmentação de etapas e botões de ações rápidas.
* **Layout**: Grid compacta de 12 colunas para maximizar a área de trabalho da tela, com agrupamentos lógicos de dados.
* **Footer**: Rodapé flutuante com totalizadores e ações primárias sempre acessíveis.
* **Uso**: Tela de Vendas, Frente de Caixa, Gestão de Ordens de Serviço.

---

### 1.3 Sidebar Otimizado e Visualização de Propriedades
O editor visual (`FormBuildEditor`) adota um painel esquerdo colapsável:
* **Estado Expandido (300px)**: Exibe ícones e nomes de todos os componentes disponíveis para drag-and-drop.
* **Estado Colapsado (60px)**: Oculta as labels, mantendo apenas os ícones centralizados para maximizar a área de trabalho (canvas do canvas expande em mais de 500px).
* **Painel de Propriedades**: A barra lateral direita clássica foi removida para poupar espaço. A edição de propriedades de qualquer campo é aberta via **Clique com Botão Direito** sobre o componente, exibindo um modal dinâmico contendo a grid de configurações e eventos.

---

### 1.4 Minimizar para Dock no Rodapé (`#sp-footer-dock`)
Formulários abertos podem ser minimizados para liberar a área de trabalho:
* Ao clicar no controle "Minimizar", o formulário é ocultado e um item é adicionado ao rodapé do sistema com a classe `.sp-dock-item` contendo o atributo `data-workspace-id`.
* O clique no item do dock restaura o formulário exatamente no estado e aba em que o usuário o deixou, garantindo múltiplos workspaces simultâneos.

---

### 1.5 Listagem e Grids com AG-Grid
As telas de listagem de dados utilizam exclusivamente a biblioteca **AG-Grid**:
* **Busca**: Campo `Localizar` de busca instantânea (debounce) no topo, acompanhado de botão "+ Incluir" alinhado à direita.
* **Ações de Linha**: Botões de edição (✏️) e exclusão (🗑️) ficam **fixados e ancorados à direita** nas duas últimas colunas da grade (pinned right).
* **Paginação**: Rodapé com totalizador ("Mostrando X de Y registros") e botões de controle de páginas anterior/próxima.

---

## 2. 🎨 Parâmetros de Cores (Design Tokens)

As cores são controladas através de CSS Variables globais definidas no `:root` e são de uso obrigatório em novas interfaces. **Não utilize tons purpuras (Purple Ban) ou azuis corporativos genéricos que saiam desse escopo.**

| Nome do Token | Valor Hexadecimal | Aplicação Principal |
| :--- | :--- | :--- |
| `--sp-color-primary` | `#0056B3` | Headers de formulários padrão, botões principais de navegação. |
| `--sp-color-success` | `#28A745` | Botões "Salvar" ou "Gravar", status positivo, ícones de verificação. |
| `--sp-color-error` | `#DC3545` | Botões "Excluir", badges de status inativo/bloqueado, mensagens de erro. |
| `--sp-input-bg` | `#F8F9FA` | Fundo de inputs, selects e textareas ativos (evita a fadiga ocular). |
| `--sp-border` | `#DDDDDD` | Linhas de divisão, bordas de inputs e separadores visuais. |
| `--sp-bg-global` | `#F1F5F9` | Cor de fundo de páginas inteiras e painéis fora de cards. |
| `--sp-text-main` | `#1E293B` / `#333333` | Cor padrão de fontes para leitura em fundo claro. |
| `--sp-warning` | `#FFC107` | Destaques de campos obrigatórios (`*`) e alertas preventivos. |
| `--sp-info` | `#17A2B8` | Ícones de dica e caixas com avisos informativos. |

---

## 3. 📐 Parâmetros de Tamanhos, Tipografia e Espaçamentos

O design do SPDealer é projetado para ser denso porém legível, otimizado para operação rápida em computadores de mesa.

### 3.1 Tipografia
* **Família de Fontes Principal**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Fonte Mono (Código)**: `source-code-pro, Menlo, Monaco, Consolas, monospace`
* **Escala de Tamanhos**:
  * Título de Modais/Cards: `1.25rem` (`20px`) com peso `600` (semibold) ou `700` (bold).
  * Subtítulos e Grupos: `1.125rem` (`18px`) com peso `500` (medium).
  * Texto Padrão e Inputs: `0.875rem` (`14px`) ou `0.9rem` (`14.4px`) para maximizar a exibição de dados.
  * Legendas e Dicas: `0.75rem` (`12px`) com peso `400`.

### 3.2 Espaçamentos (Spacing Tokens)
O espaçamento segue uma escala baseada no grid de 8 pixels:
* **Margens de Página**: `1.5rem` (`24px`).
* **Padding interno de Cards**: `1.125rem` (`18px`) no corpo; `12px 16px` no cabeçalho e rodapé.
* **Gaps de Grid**: `1rem` (`16px`) entre colunas e linhas.
* **Padding de Inputs**: `10px` vertical e horizontal.
* **Redução de Footers**: Para economizar altura nas telas, os rodapés fixos utilizam altura reduzida com padding vertical de `8px` e `line-height: 1.15`.

### 3.3 Bordas e Sombras (Geometry)
* **Borda de Inputs e Botões**: `border-radius: 6px`
* **Borda de Cards e Modais**: `border-radius: 8px`
* **Largura Máxima do Modal Padrão**: `820px` (desktop), centralizado na tela.
* **Sombras (Box Shadows)**:
  * Suave (`shadow-sm`): `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (para inputs/cards pequenos).
  * Média (`shadow-md`): `0 4px 6px -1px rgba(0, 0, 0, 0.1)` (para cards de destaque).
  * Elevada (`shadow-lg`): `0 10px 15px -3px rgba(0, 0, 0, 0.1)` (para modais flutuantes).

---

## 4. 🗂️ Componentes do Frontend e Catálogo de Metadados

O sistema do SPDealer é baseado em **Código Compilado** para as páginas CRUD e formulários finais (gerando arquivos limpos e reutilizáveis de React + custom CSS), e **Renderização Dinâmica** exclusiva para dashboards e menus.

### 4.1 Lista de Componentes Disponíveis (Catálogo de 30 Componentes)
Novos formulários podem herdar e renderizar os seguintes tipos através do catálogo de metadados:

1. **Campos de Entrada (Input)**:
   * `text` (Texto com suporte a máscaras de CPF, CNPJ, telefone, e-mail, etc.).
   * `textarea` (Área de texto com limitador de caracteres).
   * `select` (Menu dropdown).
   * `checkbox` (Caixa de seleção única ou múltipla).
   * `radio` (Seleção de opções exclusivas).
   * `calendar` (Seletor de datas nativo).
   * `daypilot_calendar` 📆 (Calendário avançado com arrastar-e-soltar e visualizações semanais/diárias).

2. **Mídia e Captura**:
   * `image` 🖼️ (Exibição de imagem com suporte a **captura em tempo real via Webcam** e resoluções configuráveis).
   * `upload` 📤 (Upload de arquivos PDF/DOCX com barreira de tamanho).
   * `gallery` 🖼️ (Galeria dinâmica de imagens com upload e download em lote).

3. **Agrupadores e Display**:
   * `container` 📦 (Agrupador genérico de campos).
   * `subform` (Subformulário acoplado).
   * `tabs` (Abas horizontais para organização de campos).
   * `bevel` 🖼️ (Moldura visual ou fieldset com título).
   * `card` 🃏 (Card Bootstrap para exibir dados sumarizados).
   * `kanban` 📋 (Quadro kanban completo com etapas, cartões de tarefas e membros).
   * `avisos` 🔔 (Componente de avisos e notificações integradas via WebSocket ou queries do banco).

---

### 4.2 Lógica de Validação e Feedback Visual
* **Acessibilidade de Foco**: Focos de teclado são forçados através do seletor `:focus-visible`, gerando uma borda colorida verde-água (`#0D9488`).
* **Estado de Erro de Input**:
  * Inputs inválidos ganham borda vermelha (`--sp-color-error`).
  * Uma mensagem de aviso curta surge logo abaixo do campo com o ícone `⚠️` ou `✗`.
* **Badges de Status**:
  * Ícone `✓` verde para campos válidos ou preenchidos corretamente.
  * Ícone `ℹ` azul-claro para notas informativas.

---

## 5. ⌨️ Atalhos de Teclado e UX Operacional

O SPDealer prioriza o preenchimento sem mouse. Todos os formulários devem obrigatoriamente implementar estes mapeamentos de atalhos em seus loops de eventos de teclado:

### 5.1 Navegação em Formulários
* **`[ENTER]` ou `[TAB]`**: Avança o foco para o próximo campo válido.
* **`[SHIFT + TAB]`**: Retorna o foco para o campo anterior.
* **`[ESC]`**: Fecha o modal ativo (após alertar caso haja alterações não salvas).

### 5.2 Ações Globais
* **`[CTRL + G]`**: Salva/Grava o formulário (dispara validação do hook `useForm`).
* **`[CTRL + X]`**: Cancela a edição em andamento e fecha a janela.
* **`[CTRL + N]`**: Abre o formulário de criação (atalho de listagem para "+ Incluir").

### 5.3 Navegação em Tabelas (AG-Grid)
* **`[ENTER]`**: Abre a linha ativa para edição.
* **`[↑] [↓] [←] [→]`**: Move a célula de foco ativa.
* **`[DEL]`**: Abre confirmação de exclusão do registro selecionado.

---

## 6. 🛠️ Arquitetura do Frontend e Boas Práticas

### 6.1 Organização Física de Arquivos
Arquivos criados ou modificados devem obedecer a seguinte estrutura de diretórios:
* **Formulários**: `src/components/Forms/{Feature}Form.tsx` e `src/components/Forms/{Feature}FormPage.tsx`
* **Listas/Grids**: `src/components/Lists/{Feature}List.tsx`
* **Páginas**: `src/pages/{Module}/{Feature}Page.tsx`
* **Services de API**: `src/services/{Feature}Service.ts`
* **Estilização**: Arquivo `{Component}.css` colocado **no mesmo diretório** do arquivo `.tsx` correspondente.

### 6.2 Convenções de Nomenclatura e Código
* **Componentes React**: PascalCase (ex: `ClienteEditar.tsx`, `FornecedorFormPage.tsx`).
* **Classes CSS**: Prefixo `sp-` obrigatório (ex: `.sp-btn`, `.sp-card`, `.sp-form__input`).
* **Services**: camelCase com sufixo Service (ex: `clientesService.ts`).
* **Variáveis de Estado**: Utilizar `react-hook-form` ou inputs controlados. Toda lógica de mutação passa por validação inicial do formulário no cliente antes de submeter ao backend Java Spring Boot.
* **Geração de Código**: A compilação final do FormBuilder gera cinco ativos organizados na pasta `src/refatorado/`:
  1. `.tsx` (Componente visual React)
  2. `.css` (Estilos co-locados)
  3. `.java` (Service/Controller no backend Spring Boot)
  4. `.sql` (Migrações DDL/DML necessárias)
  5. `.types.ts` (Interfaces e tipos TypeScript correspondentes)
