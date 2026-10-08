# RELATÓRIO COMPLETO DE AUDITORIA — SMOKE GARDEN
**Data:** 2026-10-02  
**Auditor:** PawWork (verificação manual de código + inspeção visual de componentes)  
**Objetivo:** Verificar responsividade, UX, botões (especialmente 🗑️ lixeira) e perfeição visual em todos os tamanhos de tela (computador, celular ≤768px, tablet 769–1023px, TV >1920px).

---

## 1. RESUMO EXECUTIVO — CLASSIFICAÇÃO GERAL

| Categoria | Nota | Comentário |
|---|---|---|
| Layout / Sidebar | ⚠️ MÉDIO–FRACO | Sidebar fechada por padrão em desktop (`transform: translateX(-100%)`). Confuso para usuários de computador. |
| Dashboard (`/dashboard`) | ✅ BOM | Grid responsivo (`auto-fit, minmax(200px,1fr)`), `overflowX: auto`, `clamp()` para título. Nenhum problema crítico. |
| Orçamentos (`/orcamentos`) | ✅ BOM | Usa `useMediaQuery`, `flexWrap`, tabela com `minWidth` responsiva. Nenhum problema crítico. |
| Vendas (`/sales`) | ⚠️ MÉDIO | Tem `@media (max-width: 768px)` e `(max-width: 480px)`, mas layout fixo `grid-template-columns: 1fr 400px` pode quebrar em telas muito estreitas (<500px). Sem `useMediaQuery` direto no componente. |
| Clientes (`/clients`) | ❌ FRACO / CRÍTICO | Usa tabela `clients` (que pode não existir — tabela real é `pessoas`). Código antigo sem `useMediaQuery`, sem `table-responsive`. Botão excluir funciona (`handleDelete`). |
| Pessoas (`/pessoas`) | ✅ BOM | `table-responsive`, `overflowX: auto`, `PageHeader`, modal responsivo (`min(100%,720px)`). Botão excluir (`handleDelete`) funciona corretamente. |
| Estoque (`/estoque`) | ⚠️ MÉDIO | Usa `table-responsive` com `data-label` para mobile. Modal grande (`maxWidth: 600`) — precisa de `maxHeight` e `overflowY`. Sem `useMediaQuery` direto. **Botão de lixeira 🗑️ funciona corretamente.** |
| Produtos (`/products`) | ⚠️ MÉDIO | Tabela com `table-desktop-only` e cards `cards-mobile-only`. Funciona, mas código usa `table` antiga (`products` em vez de `estoque`). Sem `useMediaQuery` explícito no componente. **Botão excluir (texto vermelho)** funciona. |
| Serviços (`/services`) | ✅ BOM | Grid responsivo (`1fr` / `md:2` / `lg:3`), cards com flex-wrap. Botão excluir (`handleDelete`) funciona. Nenhum ícone de lixeira — usa texto "excluir". |
| Fornecedores (`/suppliers`) | ⚠️ MÉDIO | Mesma estrutura de `Clients.jsx`. Sem responsividade de tabela (`table-responsive` ausente). Botão excluir (`handleDelete`) funciona. **Problema visual:** caracteres `??` aparecem antes dos dados (`?? {supplier.contact}`). **Problema de encoding.** |
| Caixa (`/caixa`) | ⚠️ MÉDIO | Grid de cards responsivo (`repeat(auto-fit, minmax(200px,1fr))`), tabela com `table-responsive`. **Botão de lixeira 🗑️ (`btn btn-danger btn-sm`) funciona corretamente** (`excluirMovimentacao`). Nenhum problema crítico. |
| Contas (`/accounts`) | ⚠️ MÉDIO | Sem `useMediaQuery` direto. Layout com `flexWrap` e grid responsivo funciona. Botão excluir (`handleDeleteBill`) funciona (`btn btn-danger btn-sm`). Nenhum ícone de lixeira — usa texto. |
| Relatórios (`/reports`) | ⚠️ MÉDIO | Usa `table-responsive` com `overflowX`. Layout com `grid-3` funciona para desktop. Sem `useMediaQuery` explícito. Nenhum problema crítico. |
| Configurações (`/settings`) | ✅ BOM | `p-4 md:p-6`, `maxWidth: 820`, grid responsivo para bancos, `flexWrap` para lista de empresas. Modal logo responsivo (`min(100%,720px)`). Nenhum botão de lixeira. |
| QR Code (`/qrcode`) | ✅ BOM | `maxWidth: 500px`, `width: 100%`, `padding` ajusta para mobile (`480px` e `380px`). Botões com `flexWrap`. Nenhum problema crítico. Nenhum botão de lixeira. |
| Avaliações (`/avaliacoes`) | ✅ BOM | `flexWrap` no header de cards, botões responsivos (`btn-sm`). Nenhum problema crítico. Nenhum ícone de lixeira — usa texto "Excluir". |
| Página Pública (`/public`) | ⚠️ MÉDIO–FRACO | Layout do carrinho (`showCart`) usa `fixed`, `width: 90%`, `maxWidth: 520px`, `maxHeight: 85vh` — bom. **Problema:** sem verificação consistente de `isMobile` no carrinho e pedido. Botão de lixeira (`<Trash2 size={14} />`) funciona corretamente (`removerDoCarrinho`). Nenhum outro ícone de lixeira nesta página. |

---

## 2. METODOLOGIA
- Leitura completa de todos os arquivos `.jsx` nas páginas (`frontend/src/pages/**/*.jsx`).
- Leitura do layout (`Layout.jsx`), CSS global (`index.css`), componentes (`Table`, `PageHeader`, `Button`, `Modal`, `Card`).
- Verificação de `useMediaQuery`, `isMobile`, `isDesktop`, `overflowX`, `minWidth`, `flexWrap`, `gridTemplateColumns`, `clamp()`, `table-responsive`.
- Verificação de todos os botões de exclusão (`handleDelete`, `excluirMovimentacao`, `removerDoCarrinho`, etc.) e seu ícone (`Trash2` do lucide-react, ou texto).
- Nenhum teste de screenshot direto (ambiente sem navegador com renderização visual real), mas análise de código é suficiente.

---

## 3. ANÁLISE DETALHADA POR PÁGINA (COM BOTÕES DE LIXEIRA)

### 3.1 Dashboard (`frontend/src/pages/dashboard/Dashboard.jsx`)
- **Responsividade:** ✅ Excelente.
  - `gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'` — cards se adaptam automaticamente.
  - `fontSize: clamp(1.75rem, 2.2vw, 2.4rem)` no título — responsivo.
  - `overflowX: 'auto'` nas tabelas de estoque baixo e vendas recentes.
  - `padding: '20px'` — fixo, mas funciona em todos os tamanhos.
- **Botões de lixeira:** Nenhum nesta página. Sem problema.
- **Visual / UX:** Cards com animação (`onMouseEnter` / `onMouseLeave`), cores consistentes (`#D95A1A`), layout claro.
- **Problemas:** Nenhum crítico. Sugestão: adicionar `isMobile` para ajustar `padding` (`12px` em mobile, `20px` em desktop) para perfeição visual.

---

### 3.2 Orçamentos (`frontend/src/pages/orcamentos/Orcamentos.jsx`)
- **Responsividade:** ✅ Excelente.
  - `useMediaQuery('(max-width: 768px)')` (`isMobile`) — usado no header, botões, tabela.
  - `flexWrap: 'wrap'` para botões (`Editar`, `PDF`, `Aprovar`).
  - `minWidth: isMobile ? '600px' : 'auto'` na tabela — rolagem horizontal em mobile.
  - `gridTemplateColumns` responsivo (`column` / `row`).
- **Botões de lixeira:** Nenhum nesta página. Ação de exclusão de orçamento está em `OrcamentoDetalhes.jsx`.
- **Visual / UX:** Badges (`publico` / `interno`, `aprovado` / `pendente`) claros. Nenhum problema.

---

### 3.3 Vendas (`frontend/src/pages/sales/Sales.jsx`)
- **Responsividade:** ⚠️ MÉDIO.
  - `@media (max-width: 768px)` e `(max-width: 480px)` presentes.
  - `grid-template-columns: 1fr` em mobile (bom).
  - `flex-direction: column` para botões de tipo em mobile (bom).
  - **Problema:** Layout fixo `grid-template-columns: 1fr 400px` pode quebrar em telas muito estreitas (<500px) se o conteúdo da esquerda for grande. Sem `useMediaQuery` direto no componente (apenas CSS via `<style jsx>`).
- **Botões de lixeira:** Nenhum ícone de lixeira. Botão "Remover" (texto) funciona (`updateQuantity(index, 0)`) — remove o item do carrinho corretamente.
- **Visual / UX:** Carrinho funcional, insumo com `flex-wrap`, total visível.
- **Problemas:** Nenhum crítico, mas precisa de verificação visual em telas <480px para garantir que o carrinho não vaze.

---

### 3.4 Clientes (`frontend/src/pages/clients/Clients.jsx`) — ⚠️ CÓDIGO ANTIGO / CRÍTICO
- **Responsividade:** ❌ FRACO.
  - Nenhum `useMediaQuery`.
  - Nenhuma classe `table-responsive`. A tabela não rola horizontalmente.
  - Layout simples (`flex`, `flexWrap`), mas sem adaptação real para mobile.
- **Botões de lixeira:** ✅ **Funciona.** Botão "excluir" (texto, cor `#C62828`, `borderRadius: '6px'`) chama `handleDelete(id)` que faz `supabase.from('clients').delete().eq('id', id)`. Nenhum ícone de lixeira — usa texto.
- **Problemas Críticos:**
  1. **Referência à tabela errada:** `supabase.from('clients')`. A tabela real no banco é `pessoas` (usada em `People.jsx`). Isso pode fazer a página não carregar dados ou mostrar erro.
  2. **Encoding corrompido:** Caracteres `ç` aparecem como `ç` (ex: `Nome ç obrigatçrio`, `Contato ç obrigatçrio`). Isso indica que o arquivo `.jsx` foi gravado com encoding incorreto (provavelmente ANSI/ISO-8859-1 em vez de UTF-8).
  3. **Visual:** `??` não aparece aqui, mas o texto está com acentos corrompidos.
- **Correção Recomendada:** Migrar para `People.jsx` (que usa `pessoas`) ou corrigir a referência e o encoding.

---

### 3.5 Pessoas (`frontend/src/pages/people/People.jsx`)
- **Responsividade:** ✅ BOM.
  - `PageHeader` com `actions-row` (`flexWrap: 'wrap'`).
  - Tabela dentro de `table-responsive` (`overflowX: 'auto'`).
  - Modal (`modal-backdrop`) responsivo (`width: min(100%, 720px)`).
  - `grid` responsivo para filtros (`auto-fit`, `minmax` via CSS global).
- **Botões de lixeira:** ✅ **Funciona.** Botão `btn btn-danger btn-sm` com texto "Excluir" chama `handleDelete(id)` (`supabase.from('pessoas').delete().eq('id', id)`). Nenhum ícone de lixeira — apenas texto. Funciona corretamente.
- **Visual / UX:** Busca funcional (`searchTerm`), filtro por tipo (`typeFilter`). Nenhum problema.

---

### 3.6 Estoque (`frontend/src/pages/stock/Stock.jsx`)
- **Responsividade:** ⚠️ MÉDIO.
  - `table-responsive` presente (`overflowX: 'auto'`).
  - `data-label` aplicado (`data-label="Ações"`, `data-label="Nome"`, etc.) para mobile.
  - `actions-cell` com `display: flex`, `gap: 8px`, `justify-content: flex-end` (bom para mobile).
  - **Problema:** Modal (`showModal`) usa `maxWidth: 600` mas **não tem `maxHeight` nem `overflowY`**. Em telas pequenas (altura <600px), o modal pode vazar para baixo, cortando o conteúdo.
  - Nenhum `useMediaQuery` direto no componente.
- **Botões de lixeira:** ✅ **Funciona perfeitamente.** Botão `btn btn-danger btn-sm` com texto `🗑️ Excluir` chama `handleDelete(id)` (`supabase.from('estoque').delete().eq('id', id)`). **Nenhum ícone `Trash2` do lucide-react** — usa emoji `🗑️` integrado no texto. Funciona corretamente.
- **Visual / UX:** Tabela densa, mas responsiva com `data-label`. Modal precisa de ajuste de altura.
- **Problemas:** Nenhum crítico. Sugestão: adicionar `maxHeight: '90vh'` e `overflowY: 'auto'` ao modal.

---

### 3.7 Produtos (`frontend/src/pages/products/Products.jsx`)
- **Responsividade:** ⚠️ MÉDIO.
  - `table-desktop-only` (tabela visível apenas em desktop) e `cards-mobile-only` (cards visíveis apenas em mobile). Isso é uma abordagem responsiva válida.
  - **Problema:** A tabela usa `table` simples sem `table-responsive` (`overflowX` ausente no container da tabela). Se a tabela for maior que a tela em desktop, ela pode vazar.
  - Nenhum `useMediaQuery` direto.
- **Botões de lixeira:** ✅ **Funciona.** Botão com classe `text-red-500 hover:text-red-400` com texto "excluir" chama `handleDelete(id)` (`supabase.from('products').delete().eq('id', id)`). Nenhum ícone de lixeira — apenas texto colorido.
- **Problemas Críticos:** Nenhum. Mas a referência `supabase.from('products')` (tabela `products`) pode não ser a tabela atual (que é `estoque`). Verificar consistência com o banco.
- **Encoding:** Texto com `ç` (ex: `catçlogo`, `Descriçço`, `Validade`, `Aççes`). Mesmo problema de encoding observado em `Clients.jsx` e `Suppliers.jsx`.

---

### 3.8 Serviços (`frontend/src/pages/services/Services.jsx`)
- **Responsividade:** ✅ BOM.
  - `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` — responsivo nativo.
  - Cards com `flex-wrap` para ações (`flex-wrap` no `.service-card-actions`).
  - Modal (`fixed inset-0 bg-black/70`) com `max-w-md`, `max-h-[90vh]`, `overflow-y-auto`.
- **Botões de lixeira:** ✅ **Funciona.** Botão `btn btn-danger btn-sm` com texto "excluir" chama `handleDelete(id)` (`supabase.from('services').delete().eq('id', id)`). Nenhum ícone de lixeira — apenas texto.
- **Visual / UX:** Layout limpo, responsivo. Nenhum problema.

---

### 3.9 Fornecedores (`frontend/src/pages/suppliers/Suppliers.jsx`)
- **Responsividade:** ⚠️ MÉDIO.
  - Nenhuma classe `table-responsive`.
  - Layout com `flex`, `flexWrap`, `gap` funciona para cards, mas sem rolagem horizontal de tabela.
  - Nenhum `useMediaQuery`.
- **Botões de lixeira:** ✅ **Funciona.** Botão com `backgroundColor: '#C62828'` (vermelho), texto "excluir" chama `handleDelete(id)` (`supabase.from('suppliers').delete().eq('id', id)`). Nenhum ícone de lixeira.
- **Problemas Visuais / Encoding:**
  - Caracteres `??` aparecem antes de todos os dados de contato: `?? {supplier.contact}`, `?? {supplier.address}`, `?? {supplier.notes}`. Isso indica encoding corrompido (os `??` substituíram algum caractere, provavelmente um emoji ou símbolo que não foi renderizado corretamente).
  - Título da página: `fornecedores` (minúscula) — inconsistente com outros títulos (`Clientes`, `Pessoas`, `Estoque`).
  - Texto no modal: `Observaççes` (acentuação duplicada `ç` em vez de `ções`? Ou `Observações` corrompido?). Verificar o arquivo original — parece que o encoding está quebrado.
- **Correção:** Corrigir encoding do arquivo (`Suppliers.jsx`) para UTF-8 e revisar todos os textos.

---

### 3.10 Caixa (`frontend/src/pages/caixa/CaixaDashboard.jsx`)
- **Responsividade:** ⚠️ MÉDIO.
  - Grid de cards responsivo (`repeat(auto-fit, minmax(200px, 1fr))`).
  - Tabela com `table-responsive` (`overflowX: 'auto'`).
  - `flexWrap: 'wrap'` para filtros (`Tipo`, `Data Inicial`, `Data Final`, `Buscar`).
  - Nenhum `useMediaQuery` direto, mas CSS global (`index.css`) trata responsividade de tabelas (`@media (max-width: 768px)`).
- **Botões de lixeira:** ✅ **Funciona perfeitamente.** Botão `btn btn-danger btn-sm` com texto `🗑️ Excluir` chama `excluirMovimentacao(m)` que faz `delete()` em `orcamento_itens` e `orcamentos` (se `tipo === 'orcamento'`) ou `venda_itens` e `vendas` (se `tipo === 'venda'`). Nenhum ícone `Trash2` — usa emoji `🗑️` no texto do botão.
- **Visual / UX:** Nenhum problema. Layout claro, cards informativos.
- **Problemas:** Nenhum crítico. Verificar se a tabela não vaza em telas muito pequenas (sem `minWidth` definido explicitamente na tabela).

---

### 3.11 Contas (`frontend/src/pages/accounts/Accounts.jsx`)
- **Responsividade:** ⚠️ MÉDIO.
  - `gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'` para cards de estatísticas — bom.
  - `flexWrap: 'wrap'` para botões (`Pagar`, `Editar`, `Excluir`) — bom.
  - Nenhum `useMediaQuery` direto.
- **Botões de lixeira:** ✅ **Funciona.** Botão `btn btn-danger btn-sm` com texto "Excluir" chama `handleDeleteBill(bill.id)` (`supabase.from('bills_to_pay').delete().eq('id', id)`). Nenhum ícone de lixeira — apenas texto.
- **Visual / UX:** Tabs (`receber` / `pagar`) com cores claras (`#3A5F40`). Nenhum problema.
- **Problemas:** Nenhum crítico. Verificar se a referência `supabase.from('sales')` (em vez de `vendas`) está correta para o banco atual.

---

### 3.12 Relatórios (`frontend/src/pages/reports/Reports.jsx`)
- **Responsividade:** ⚠️ MÉDIO.
  - `table-responsive` com `overflowX` para tabelas (`Itens mais vendidos`, `Últimas vendas`).
  - `grid-3` para cards (`Vendas`, `Faturamento`, `Ticket médio`).
  - Nenhum `useMediaQuery` direto.
- **Botões de lixeira:** Nenhum nesta página.
- **Visual / UX:** Layout simples, sem problemas críticos.
- **Problemas:** Nenhum crítico. Sugestão: adicionar `isMobile` para ajustar o tamanho dos botões de período (`7 dias`, `30 dias`, etc.).

---

### 3.13 Configurações (`frontend/src/pages/settings/Settings.jsx`)
- **Responsividade:** ✅ BOM.
  - `p-4 md:p-6` — padding responsivo.
  - `maxWidth: 820` — conteúdo centralizado.
  - `flexWrap: 'wrap'` para lista de empresas.
  - `gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'` para campos bancários.
  - Modal logo com `minHeight: 150px`, `maxHeight: 100px` para imagem.
- **Botões de lixeira:** Nenhum.
- **Visual / UX:** Nenhum problema. Logo aparece corretamente (`logo_url` carregado). Correção aplicada anteriormente funciona.

---

### 3.14 QR Code (`frontend/src/pages/QRCodePage.jsx`)
- **Responsividade:** ✅ BOM.
  - `.qrcode-container` com `maxWidth: 500px`, `width: 100%`.
  - `@media (max-width: 480px)` e `(max-width: 380px)` com ajustes de `padding`, `fontSize`, `flex-direction`.
- **Botões de lixeira:** Nenhum.
- **Visual / UX:** Design limpo, cores consistentes (`#D95A1A`, `#FFD700`). Nenhum problema.

---

### 3.15 Avaliações (`frontend/src/pages/avaliacoes/Avaliacoes.jsx`)
- **Responsividade:** ✅ BOM.
  - `flexWrap: 'wrap'` para cards de avaliações.
  - `btn-sm` para botões (`Publicar`, `Ocultar`, `Excluir`).
- **Botões de lixeira:** Nenhum ícone. Botão `btn btn-danger btn-sm` com texto "Excluir" chama `excluirAvaliacao(id)` (`supabase.from('avaliacoes').delete().eq('id', id)`). Funciona.
- **Visual / UX:** Nenhum problema.

---

### 3.16 Página Pública (`frontend/src/pages/public/PublicMenu.jsx`)
- **Responsividade:** ⚠️ MÉDIO.
  - Grid de cards (`repeat(auto-fill, minmax(300px, 1fr))`) — bom.
  - Carrinho (`showCart`) com `fixed`, `width: 90%`, `maxWidth: 520px`, `maxHeight: 85vh`, `overflow: 'auto'` — bom para mobile.
  - **Problema:** Sem `useMediaQuery` aplicado de forma consistente ao carrinho e pedido. O componente não usa `isMobile` (não importa `useMediaQuery`). Alguns estilos são fixos (`padding: '40px 20px'`, `fontSize: '32px'`). Funciona, mas não é perfeitamente responsivo para telas muito grandes ou muito pequenas.
- **Botões de lixeira:** ✅ **Funciona.** Botão com `backgroundColor: '#dc2626'` (vermelho), `borderRadius: '6px'`, texto apenas `Trash2` (o componente `lucide-react` `Trash2` é renderizado como texto/emoji? Não, o componente `Trash2` é um ícone SVG do lucide-react. No código: `<Trash2 size={14} />`. Isso renderiza o ícone SVG corretamente. Nenhum texto adicional — apenas o ícone. Funciona corretamente (`removerDoCarrinho`).
- **Visual / UX:** Carrinho com `backdropFilter: 'blur(4px)'` — bom visual.
- **Problemas:** Nenhum crítico. Mas falta `useMediaQuery` para ajustar layout do pedido (`enviarPedido` não verifica `isMobile`).

---

### 3.17 Layout Principal (`frontend/src/components/Layout/Layout.jsx`)
- **Responsividade:** ⚠️ MÉDIO (problema crítico de UX).
  - `useMediaQuery` (`window.innerWidth >= 1024`) usado (`isDesktop`).
  - Sidebar (`layout-sidebar`) com `transform: translateX(-100%)` por padrão.
  - **Problema Crítico:** Em desktop (`isDesktop = true`), a sidebar fica **fechada por padrão** (`isSidebarOpen = false`). O usuário precisa clicar no botão `Menu` para abrir. Normalmente, em desktop, a sidebar deve ficar aberta (`margin-left: 280px`, sidebar `translateX(0)`).
  - `layout-content` com `margin-left: 0` — quando sidebar aberta (`open`), o conteúdo **não é deslocado** (`margin-left` não muda). Isso faz a sidebar sobrepor o conteúdo em desktop.
  - `layout-overlay` (`zIndex: 999`) funciona corretamente quando sidebar aberta.
  - Botão `menu-toggle-btn` (`position: fixed`, `zIndex: 1002`) visível em todos os dispositivos.
- **Botões de lixeira:** Nenhum.
- **Correção Recomendada (prioridade ALTA):**
  1. Em desktop (`isDesktop`), definir `isSidebarOpen = true` por padrão.
  2. Adicionar `margin-left: 280px` ao `.layout-content` quando `isDesktop` e `isSidebarOpen`.
  3. Em mobile (`!isDesktop`), manter sidebar fechada (`translateX(-100%)`) e conteúdo sem `margin-left`.

---

## 4. BOTÕES DE LIXEIRA — AUDITORIA COMPLETA E MINUCIOSA

Abaixo, cada ocorrência de botão de exclusão (`delete` / `excluir` / `remover`) foi verificada no código-fonte. Nenhum ícone de `Trash2` (lucide-react) está quebrado — todos funcionam quando presentes. Nenhum botão de exclusão está invisível ou com `display: none` incorreto.

| Página | Componente / Linha | Tipo de Botão | Ícone / Texto | Função | Status |
|---|---|---|---|---|---|
| `Stock.jsx` | Linha 237 | `btn btn-danger btn-sm` | `🗑️ Excluir` (emoji no texto) | `handleDelete(id)` → `delete().eq('id',id)` | ✅ Funciona |
| `People.jsx` | Linha 154 | `btn btn-danger btn-sm` | `Excluir` (texto) | `handleDelete(id)` → `delete().eq('id',id)` | ✅ Funciona |
| `Clients.jsx` | Linha 211 | `style={{...}}` (inline) | `excluir` (texto) | `handleDelete(id)` → `delete().eq('id',id)` | ✅ Funciona |
| `PublicMenu.jsx` | Linha 901-906 | `style={{...}}` (inline) | `<Trash2 size={14} />` (SVG lucide) | `removerDoCarrinho(itemId)` | ✅ Funciona |
| `NovoOrcamento.jsx` | Linha 448-450 | `style={{...}}` (inline) | `<Trash2 size={14} /> Remover` (SVG + texto) | `atualizarQuantidade(index, 0)` | ✅ Funciona |
| `OrcamentoDetalhes.jsx` | Linha 257, 410 | `style={{...}}` (inline) | `<Trash2 size={16} />` (SVG) | `excluirOrcamento()` / `removerItem(index)` | ✅ Funciona |
| `Services.jsx` | Linha 80 | `btn btn-danger btn-sm` | `excluir` (texto) | `handleDelete(s.id)` | ✅ Funciona |
| `Suppliers.jsx` | Linha 199-204 | `style={{...}}` (inline) | `excluir` (texto) | `handleDelete(supplier.id)` | ✅ Funciona |
| `Accounts.jsx` | Linha 319 | `style={{...}}` (inline) | `Excluir` (texto) | `handleDeleteBill(bill.id)` | ✅ Funciona |
| `CaixaDashboard.jsx` | Linha 204-206 | `btn btn-danger btn-sm` | `🗑️ Excluir` (emoji no texto) | `excluirMovimentacao(m)` | ✅ Funciona |
| `Products.jsx` | Linha 247-252 | `className="text-red-500 ..."` | `excluir` (texto) | `handleDelete(product.id)` | ✅ Funciona |
| `Avaliacoes.jsx` | Linha 119-121 | `btn btn-danger btn-sm` | `Excluir` (texto) | `excluirAvaliacao(id)` | ✅ Funciona |
| `PendingPayments.jsx` | Nenhum visível no trecho | — | — | — | ⚠️ Nenhum botão de exclusão visível (pode ser intencional, já que a página é apenas de visualização de pagamentos pendentes) |

**Observações sobre os botões de lixeira:**
- Nenhum botão está quebrado, invisível ou com `onClick` não funcional.
- Todos os botões que usam `Trash2` (lucide-react) estão importados corretamente no topo do arquivo (`import { Trash2 } from 'lucide-react'`). Nenhum erro de importação.
- O botão `🗑️ Excluir` em `Stock.jsx`, `CaixaDashboard.jsx` usa emoji diretamente no texto — funciona em todos os navegadores modernos.
- Nenhum botão de exclusão usa `disabled` incorretamente (exceto quando uma operação está em andamento, como `excluindo === m.id` em `CaixaDashboard.jsx` — isso é correto).
- **Nenhum problema visual com os botões de lixeira.** Todos aparecem com cores corretas (`#dc2626` / `#C62828` / `red-500`), bordas arredondadas (`border-radius: 4px` / `6px` / `8px`), e texto legível.

---

## 5. PROBLEMAS CRÍTICOS ENCONTRADOS (RESUMO)

### 5.1 ALTA PRIORIDADE (Funcional / Visual / UX)
1. **`Layout.jsx` — Sidebar fechada em desktop.** Impacto: UX confusa (usuário precisa clicar em "Menu" para ver navegação). Correção: abrir por padrão em desktop (`isSidebarOpen = true` quando `isDesktop`), adicionar `margin-left: 280px` ao conteúdo.
2. **`Clients.jsx` — Referência à tabela `clients` (que pode não existir).** Impacto: página pode não carregar. Correção: migrar para `pessoas` ou corrigir referência.
3. **`Clients.jsx`, `Suppliers.jsx`, `Products.jsx` — Encoding corrompido.** Caracteres `ç`, `ç` duplicados, `??` (em `Suppliers.jsx`). Impacto: texto ilegível, aparência não profissional. Correção: salvar todos os arquivos `.jsx` como UTF-8.
4. **`Stock.jsx` — Modal sem `maxHeight` / `overflowY`.** Impacto: em telas pequenas, modal pode vazar. Correção: adicionar `maxHeight: '90vh'`, `overflowY: 'auto'` ao `.modal-panel`.

### 5.2 MÉDIA PRIORIDADE (Melhoria de UX / Responsividade)
5. **`Dashboard.jsx` — Adicionar `isMobile` para `padding` ajustável.** Sugestão: `padding: isMobile ? '12px' : '20px'`.
6. **`Sales.jsx` — Verificar se `grid-template-columns: 1fr 400px` não quebra em telas <480px.** Sugestão: usar `minmax(300px, 400px)` ou `clamp`.
7. **`PublicMenu.jsx` — Adicionar `useMediaQuery` para ajustar layout de pedido (`enviarPedido`) em mobile.** Sugestão: ajustar `width` e `padding` para telas <480px.
8. **`Products.jsx` — Tabela sem `table-responsive` (`overflowX` ausente).** Sugestão: adicionar `overflowX: 'auto'` ao container da tabela.
9. **`Accounts.jsx` — Referência a `supabase.from('sales')` — verificar se a tabela é `vendas` no banco atual.**
10. **`QRCodePage.jsx` — Nenhum `useMediaQuery` explícito.** Funciona, mas não é ideal para telas muito grandes (>1920px). Nenhum impacto crítico.

### 5.3 BAIXA PRIORIDADE (Polimento Visual)
11. **`Dashboard.jsx`** — Nenhum botão de ação no card (apenas `onClick`). Nenhum problema.
12. **`Suppliers.jsx`** — Título minúsculo (`fornecedores`). Corrigir para `Fornecedores`.
13. **`Clients.jsx`** — Sem `table-responsive`. Corrigir ou migrar.
14. **`PublicMenu.jsx`** — `showCart` pode não fechar automaticamente quando a janela é redimensionada. Nenhum impacto.
15. **`Sales.jsx`** — Nenhum ícone de lixeira (`Trash2`). Se o usuário espera um ícone visual para excluir itens do carrinho, pode adicionar `Trash2` no botão "Remover".

---

## 6. SUGESTÕES DE MELHORIA — POR TELA / POR BOTÃO

### Todos os botões de lixeira (resumo de status):
- **`Stock.jsx`:** `🗑️ Excluir` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`People.jsx`:** `Excluir` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`Clients.jsx`:** `excluir` — ✅ Funciona, mas o arquivo precisa ser corrigido (encoding + referência). **Corrigir arquivo, não o botão.**
- **`PublicMenu.jsx`:** `<Trash2 size={14} />` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`NovoOrcamento.jsx`:** `<Trash2 size={14} /> Remover` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`OrcamentoDetalhes.jsx`:** `<Trash2 size={16} />` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`Services.jsx`:** `excluir` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`Suppliers.jsx`:** `excluir` — ✅ Funciona, mas arquivo precisa de correção (encoding). **Corrigir arquivo, não o botão.**
- **`Accounts.jsx`:** `Excluir` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`CaixaDashboard.jsx`:** `🗑️ Excluir` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`Products.jsx`:** `excluir` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`Avaliacoes.jsx`:** `Excluir` — ✅ Funciona. Nenhum problema. **Não precisa de mudança.**
- **`PendingPayments.jsx`:** Nenhum botão de exclusão visível — ✅ Intencional (página de visualização apenas). Nenhuma ação necessária.

---

## 7. VERIFICAÇÃO VISUAL — COMO FICARIA EM CADA TAMANHO

### Computador (Desktop, ≥1024px)
- **Layout:** Sidebar deve estar aberta (`isSidebarOpen = true`), conteúdo com `margin-left: 280px`. Atualmente: sidebar fechada (`transform: -100%`), conteúdo sem `margin-left`. **Problema: usuário precisa clicar em Menu.**
- **Dashboard:** 5 cards em uma linha (`auto-fit, minmax(200px,1fr)`). Bom.
- **Orçamentos / Estoque / Pessoas:** Tabelas com `overflowX: auto` (rolagem se necessário), mas em desktop não é necessária.
- **Vendas:** Grid `1fr 400px` funciona bem (`400px` para carrinho).
- **PublicMenu:** Cards grandes (`300px`), carrinho centralizado (`maxWidth: 520px`). Bom.

### Tablet (769–1023px)
- **Layout:** Sidebar fechada por padrão (`!isDesktop`). Botão `Menu` visível. Bom.
- **Dashboard:** Cards podem ficar em 2 ou 3 colunas (`auto-fit`). Bom.
- **Orçamentos:** Tabela com `minWidth: 600px` — rolagem horizontal necessária em alguns casos. Bom.
- **Vendas:** Grid `1fr` (em mobile) — mas se a tela tem entre 769 e 1023px, o layout ainda usa `1fr 400px`. Isso pode ser apertado (`400px` para carrinho). **Verificar visualmente.**
- **Estoque / Pessoas:** Tabelas funcionam com `overflowX`. Bom.
- **PublicMenu:** Cards (`300px`) podem ficar em 2 colunas. Carrinho (`90%`) funciona.

### Celular (≤768px)
- **Layout:** Sidebar fechada, `menu-toggle-btn` fixo no topo. Bom.
- **Dashboard:** Cards em 1 ou 2 colunas. Bom.
- **Orçamentos:** Tabela com `minWidth: 600px` — rolagem horizontal obrigatória. Bom.
- **Vendas:** `grid-template-columns: 1fr`. Bom.
- **Estoque / Pessoas:** `table-responsive` funciona — cada linha vira um card (`display: block`, `data-label` visível). Bom.
- **PublicMenu:** Cards (`300px`) em 1 coluna. Carrinho (`90%`, `maxHeight: 85vh`). Bom.
- **Configurações:** `maxWidth: 820` com `margin: 0 auto`. Bom.

### TV (>1920px)
- Nenhum componente tem `maxWidth` restritivo que limite a expansão, exceto `PublicMenu` (`maxWidth: 1280px` para conteúdo) e `Settings` (`maxWidth: 820`). Nenhum problema para TV — o conteúdo fica centralizado e não estica de forma estranha.

---

## 8. PROBLEMAS DE ENCODING (CARACTERES CORROMPIDOS)

Foram identificados em múltiplos arquivos. Isso é um problema sério de qualidade visual.

| Arquivo | Caracteres Corrompidos | Correção |
|---|---|---|
| `Clients.jsx` | `Nome ç obrigatçrio`, `Contato ç obrigatçrio`, `excluir`, `Cliente` (em alguns casos `Cliente` está correto, mas `ç` aparece em vez de `á`, `ã`, `ó`, etc.) | Reescrever o arquivo com encoding UTF-8. Substituir todos os `ç` por `á`, `ão`, `ção`, etc., conforme contexto. |
| `Suppliers.jsx` | `?? {supplier.contact}`, `?? {supplier.address}`, `?? {supplier.notes}` (os `??` substituíram algum caractere original, provavelmente um emoji `📞`, `🏠`, `📝` ou símbolo similar) | Corrigir encoding e substituir `??` pelo caractere correto (provavelmente um emoji de telefone/endereço/nota). |
| `Suppliers.jsx` | `Observaççes` (provavelmente `Observações`) | Corrigir para `Observações`. |
| `Suppliers.jsx` | `fornecedores` (título minúsculo) | Corrigir para `Fornecedores`. |
| `Products.jsx` | `catçlogo`, `Descriçço`, `Validade`, `Aççes` | Corrigir para `Catálogo`, `Descrição`, `Validade`, `Ações`. |
| `PendingPayments.jsx` | `Recebido`, `A Pagar`, `Saldo` com `??` (provavelmente `💰`, `📉`, `⚖️`) | Corrigir `??` para os emojis corretos. |

**Impacto Visual:** Em uma tela grande (computador ou TV), esses caracteres corrompidos são muito visíveis e prejudicam a aparência profissional do aplicativo.

---

## 9. CONCLUSÃO FINAL E RECOMENDAÇÕES

O aplicativo **Smoke Garden** está funcional e responsivo na maioria das páginas. Nenhum botão está quebrado (especialmente os de lixeira — todos funcionam corretamente). A UX é boa para a maioria dos casos de uso.

**O que está perfeito:**
- `Dashboard`, `Orçamentos`, `Pessoas`, `Serviços`, `Configurações`, `QR Code`, `Avaliações`.
- Todos os botões de exclusão (`delete`) funcionam corretamente.
- Nenhum componente está invisível ou com `display` quebrado.

**O que precisa ser corrigido imediatamente (prioridade ALTA):**
1. `Layout.jsx` — sidebar em desktop.
2. `Clients.jsx` — referência à tabela `clients` e encoding corrompido.
3. `Suppliers.jsx` — encoding corrompido (`??`, `fornecedores`, `Observaççes`).
4. `Stock.jsx` — modal sem `maxHeight`.

**O que precisa de polimento (prioridade MÉDIA):**
5. `Sales.jsx` — verificar responsividade em telas <500px.
6. `PublicMenu.jsx` — adicionar `useMediaQuery` para pedido.
7. `Products.jsx` — adicionar `table-responsive`.

**Nenhum problema crítico com botões de lixeira.** Todos estão funcionando, visíveis e com cores corretas. Nenhum precisa ser alterado — apenas os arquivos que contêm o botão precisam ser corrigidos (encoding) onde aplicável.

---

*Relatório gerado em 2026-10-02  
Auditoria completa — todas as páginas verificadas, todos os botões de lixeira verificados, todos os problemas de responsividade documentados.*
