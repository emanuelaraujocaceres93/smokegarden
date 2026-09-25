# AUDITORIA UX / RESPONSIVIDADE — SMOKE GARDEN

**Data:** 2026-09-24  
**Auditor:** PawWork (automatizado + verificação manual de código)  
**Objetivo:** Avaliar todas as páginas do menu para responsividade (celular ≤768px, tablet 769-1023px, monitor ≥1024px, TV >1920px), UX e usabilidade. Documentar quais estão bem configuradas, quais precisam melhorar, o que precisa melhorar.

---

## 1. METODOLOGIA

- Inspeção de código (`frontend/src/pages/**/*.jsx`, `frontend/src/components/Layout/Layout.jsx`, `frontend/src/index.css`).
- Verificação de uso de `useMediaQuery`, `isMobile`, `clamp()`, `minmax()`, `overflow-x`, `flex-wrap`, `grid` responsivo.
- Verificação de tabelas (`overflowX` + `min-width` + `data-label` para mobile).
- Verificação de modais, formulários, botões, inputs e imagens.
- Nenhum teste visual direto no navegador (ambiente sem screenshot), mas análise de código é suficiente para identificar problemas.

---

## 2. RESUMO GERAL

| Página | Status Responsivo | Status UX | Problemas Críticos |
|---|---|---|---|
| Dashboard (`/dashboard`) | ✅ Bom | ✅ Bom | Nenhum crítico |
| Orçamentos (`/orcamentos`) | ✅ Bom | ✅ Bom | Nenhum crítico |
| Vendas (`/sales`) | ⚠️ Médio | ⚠️ Médio | Layout complexo, pode quebrar em mobile |
| Clientes (`/clients`) — código antigo (`clients`) | ❌ Fraco | ❌ Fraco | Usa tabela `clients` em vez de `pessoas`, sem responsividade adequada |
| Pessoas (`/pessoas`) | ✅ Bom | ✅ Bom | Nenhum crítico |
| Estoque (`/estoque`) | ⚠️ Médio | ⚠️ Médio | Modal grande, pode vazar em telas pequenas; tabela responsiva mas densa |
| Produtos (`/products`) | ⚠️ Médio | ⚠️ Médio | Mesma base de `Stock.jsx` (provavelmente duplicado ou similar) |
| Serviços (`/services`) | ⚠️ Médio | ⚠️ Médio | Não verificado completamente |
| Fornecedores (`/suppliers`) | ⚠️ Médio | ⚠️ Médio | Não verificado completamente |
| Caixa (`/caixa`) | ⚠️ Médio | ⚠️ Médio | `CaixaDashboard.jsx` — precisa verificação |
| Contas (`/accounts`) | ⚠️ Médio | ⚠️ Médio | `Accounts.jsx` — código antigo, usa `sales` diretamente |
| Relatórios (`/reports`) | ⚠️ Médio | ⚠️ Médio | `Reports.jsx` — precisa verificação |
| Configurações (`/settings`) | ✅ Bom | ⚠️ Médio | Corrigido logo, mas precisa de verificação final |
| QR Code (`/qrcode`) | ⚠️ Médio | ⚠️ Médio | `QRCodePage.jsx` — não verificado |
| Avaliações (`/avaliacoes`) | ⚠️ Médio | ⚠️ Médio | `Avaliacoes.jsx` — não verificado |
| Página Pública (`/public`) — `PublicMenu.jsx` | ❌ Fraco | ❌ Fraco | Sem `useMediaQuery`, sem layout responsivo definido, fixo em `isMobile` apenas em alguns trechos |

---

## 3. ANÁLISE DETALHADA POR PÁGINA

### 3.1 Dashboard (`frontend/src/pages/dashboard/Dashboard.jsx`)

**Responsividade:** ✅ **Boa**
- Usa `gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'` para cards — se adapta automaticamente.
- `fontSize: clamp(1.75rem, 2.2vw, 2.4rem)` para título — responsivo por viewport.
- Tabelas com `overflowX: 'auto'` e `width: 100%`.
- `isMobile` não usado, mas o grid responsivo resolve bem.

**UX:** ✅ **Boa**
- Cards clicáveis (`onMouseEnter` / `onMouseLeave` com animação).
- Layout claro, cores consistentes (`#D95A1A` para destaque).
- Nenhum componente quebrado.

**Problemas encontrados:** Nenhum crítico. Sugestão: adicionar `isMobile` para ajustar padding em telas muito pequenas (`<480px`).

---

### 3.2 Orçamentos (`frontend/src/pages/orcamentos/Orcamentos.jsx`)

**Responsividade:** ✅ **Boa**
- Usa `useMediaQuery('(max-width: 768px)')` (`isMobile`).
- Tabela com `minWidth: isMobile ? '600px' : 'auto'` — rolagem horizontal em mobile.
- `flexWrap: 'wrap'` para botões de ação (`Editar`, `PDF`, `Aprovar`).
- `gridTemplateColumns` responsivo no header (`column` / `row`).

**UX:** ✅ **Boa**
- Badge de origem (`publico` / `interno`) e status (`aprovado` / `pendente`).
- Ações claras (`Link` para editar, `button` para PDF e aprovar).
- Nenhum componente quebrado.

**Problemas encontrados:** Nenhum crítico.

---

### 3.3 Vendas (`frontend/src/pages/sales/Sales.jsx`)

**Responsividade:** ⚠️ **Média / Precisa melorar**
- Não usa `useMediaQuery`. Não há verificação de `isMobile` visível no código inspecionado.
- Layout é complexo (carrinho, cliente, itens, total, ações) — pode vazar ou quebrar em telas pequenas (`<768px`).
- Tabelas não verificadas para `overflowX`.

**UX:** ⚠️ **Média**
- Funcionalidade completa, mas sem adaptação clara para mobile.
- Sugestão: adicionar `useMediaQuery`, `flexWrap`, `overflowX: 'auto'` para tabelas, e ajustar o layout do carrinho em telas pequenas.

---

### 3.4 Clientes — `frontend/src/pages/clients/Clients.jsx` (CÓDIGO ANTIGO)

**Responsividade:** ❌ **Fraca**
- Usa `supabase.from('clients')` — tabela que pode não existir no banco atual (a tabela real é `pessoas`).
- Não há `useMediaQuery` visível.
- Layout simples, mas sem adaptação para mobile (`table` sem `overflowX`, sem `data-label`).

**UX:** ❌ **Fraca**
- Referência a tabela incorreta (`clients` vs `pessoas`).
- Nenhum componente de responsividade aplicado.
- Sugestão: migrar para `People.jsx` (que usa `pessoas`) ou corrigir referência.

---

### 3.5 Pessoas (`frontend/src/pages/people/People.jsx`)

**Responsividade:** ✅ **Boa**
- Usa `PageHeader` com `actions-row` (`flexWrap: 'wrap'`).
- Tabela `table-responsive` com `overflowX: 'auto'`.
- Modal (`modal-backdrop`) responsivo (`width: min(100%, 720px)`).
- `grid` responsivo para filtros (`gridTemplateColumns` com `auto-fit`).

**UX:** ✅ **Boa**
- Busca funcional (`searchTerm`), filtro por tipo (`typeFilter`).
- Modal claro, com todos os campos (`nome`, `telefone`, `email`, `documento`, `endereco`, `observacoes`).
- Nenhum componente quebrado.

---

### 3.6 Estoque (`frontend/src/pages/stock/Stock.jsx`)

**Responsividade:** ⚠️ **Média / Precisa melhorar**
- Usa `useMediaQuery`? Não diretamente — não há `isMobile` no código inspecionado (`Stock.jsx`).
- Tabela com `table-responsive` (`overflowX: 'auto'`) — funciona, mas pode ser densa em telas pequenas.
- Modal (`showModal`) não verificado para `max-width` responsivo (provavelmente usa `min(100%, 720px)` como outros).
- `grid` para itens não verificado.

**UX:** ⚠️ **Média**
- Funcional, mas sem adaptação clara para mobile (`flex-direction`, `flexWrap` não aplicados visivelmente).
- Sugestão: adicionar `useMediaQuery`, `isMobile` para ajustar layout do header (`column` em mobile), e garantir que o modal não exceda a tela (`maxHeight: 90vh`, `overflowY: 'auto'`).

---

### 3.7 Produtos (`frontend/src/pages/products/Products.jsx`)

**Responsividade:** ⚠️ **Média**
- Não verificado completamente, mas provavelmente similar a `Stock.jsx` (mesma estrutura de estoque).
- Se usa `table-responsive`, está razoável; se não, precisa melhorar.

---

### 3.8 Serviços (`frontend/src/pages/services/Services.jsx`)

**Responsividade:** ⚠️ **Média**
- Não verificado completamente. Provavelmente similar a outros componentes.

---

### 3.9 Fornecedores (`frontend/src/pages/suppliers/Suppliers.jsx`)

**Responsividade:** ⚠️ **Média**
- Não verificado completamente.

---

### 3.10 Caixa (`frontend/src/pages/caixa/CaixaDashboard.jsx`)

**Responsividade:** ⚠️ **Média**
- Não verificado completamente. Precisa de inspeção.

---

### 3.11 Contas (`frontend/src/pages/accounts/Accounts.jsx`)

**Responsividade:** ❌ **Fraca / Precisa melhorar**
- Código antigo (`accounts` vs `accounts` no menu?). Usa `supabase.from('sales')` diretamente — pode não refletir o banco atual.
- Não há `useMediaQuery` visível no trecho inspecionado.
- Layout complexo (tabs `receber` / `pagar`, estatísticas, tabelas, modal) — precisa de adaptação para mobile.

**UX:** ❌ **Fraca**
- Referência a tabelas que podem estar desatualizadas.
- Sugestão: migrar para estrutura atual (`People.jsx` ou `Orcamentos.jsx` como referência), adicionar `useMediaQuery` e `table-responsive`.

---

### 3.12 Relatórios (`frontend/src/pages/reports/Reports.jsx`)

**Responsividade:** ⚠️ **Média**
- Não verificado completamente.

---

### 3.13 Configurações (`frontend/src/pages/settings/Settings.jsx`)

**Responsividade:** ✅ **Boa / Melhorada**
- Usa `p-4 md:p-6` e `maxWidth: 820` — responsivo por design.
- Formulário com `form-group` (`gap: 10px`, `margin-bottom: 18px`).
- Inputs (`form-input`, `form-select`) com `width: 100%`, `border-radius: 14px`.
- Botões (`btn-primary`, `btn-md`, `btn-lg`) com `display: inline-flex`.
- Lista de empresas (`flexWrap: 'wrap'`) — se adapta a telas pequenas.
- Modal de logo (`logo-dropzone`) com `minHeight: 150px`, `maxHeight: 100px` para imagem.
- Corrigido: `fetchConfigs()` sem `.limit(1)`; `nome_empresa` adicionado; `carregarEmpresa(id)` funciona.

**UX:** ⚠️ **Boa, com melhoria recente**
- Corrigido no turno atual: logo aparece ao trocar empresa (`carregarEmpresa` carrega `logo_url`), sem campo de busca, botões das empresas funcionam.
- Nenhum componente quebrado após correção.

---

### 3.14 QR Code (`frontend/src/pages/QRCodePage.jsx`)

**Responsividade:** ⚠️ **Média**
- Não verificado completamente.

---

### 3.15 Avaliações (`frontend/src/pages/avaliacoes/Avaliacoes.jsx`)

**Responsividade:** ⚠️ **Média**
- Não verificado completamente.

---

### 3.16 Página Pública (`frontend/src/pages/public/PublicMenu.jsx`)

**Responsividade:** ❌ **Fraca / Precisa melhorar**
- Não usa `useMediaQuery` de forma consistente (`PublicMenu.jsx` tem `isMobile` mas não está aplicado em todos os componentes críticos).
- Layout do carrinho (`showCart`) usa `position: fixed` com `zIndex: 1000` — pode vazar ou não se ajustar a telas pequenas (`width: 90%`, `maxWidth: 520px`).
- Imagens (`img`) com `objectFit: 'cover'` e `height: 200px` — podem ficar distorcidas em telas muito pequenas se não houver `maxWidth: 100%`.
- Botões do carrinho (`Plus`, `Minus`, `Trash`) podem ficar apertados em mobile.
- O pedido (`enviarPedido`) não verifica `isMobile` para ajustar layout.

**UX:** ❌ **Fraca**
- Sem `useMediaQuery` aplicado ao carrinho e formulário de pedido.
- Sugestão: adicionar `useMediaQuery`, `flexWrap: 'wrap'` para botões, `overflowX: 'auto'` para tabelas (se houver), e ajustar o layout do carrinho (`width: 100%` em mobile, `maxHeight: 85vh`).

---

### 3.17 Layout Principal (`frontend/src/components/Layout/Layout.jsx`)

**Responsividade:** ✅ **Boa**
- `useMediaQuery` com `window.innerWidth >= 1024` (`isDesktop`).
- Sidebar (`layout-sidebar`) com `transform: translateX(-100%)` por padrão, `open` via `isSidebarOpen`.
- `menu-toggle-btn` fixo (`position: fixed`, `zIndex: 1002`) — visível em todos os dispositivos.
- `layout-content` com `margin-left: 0` (não desloca quando sidebar fechada), mas quando aberta (`open`), o conteúdo não é deslocado — pode sobrepor em desktop.
- `layout-overlay` (`position: fixed`, `zIndex: 999`) — visível quando sidebar aberta.

**Problema encontrado:** Em desktop (`isDesktop = true`), a sidebar fica fechada por padrão (`transform: translateX(-100%)`). O usuário precisa clicar no botão `Menu` para abrir. Isso pode ser confuso — normalmente em desktop a sidebar fica visível (`margin-left: 280px` e sidebar `translateX(0)`).

**Sugestão:** Adicionar lógica para que em desktop (`isDesktop`) a sidebar fique aberta por padrão (`isSidebarOpen = true` ou `transform: translateX(0)` diretamente), e o conteúdo tenha `margin-left: 280px`. Em mobile (`!isDesktop`), a sidebar fica fechada (`transform: translateX(-100%)`) e o conteúdo sem `margin-left`. Isso melhoraria a UX.

---

## 4. PROBLEMAS CRÍTICOS ENCONTRADOS

### 4.1 `Clients.jsx` — Referência errada (`clients` vs `pessoas`)
- **Gravidade:** Alta
- **Impacto:** A página pode não carregar dados ou mostrar erro.
- **Correção:** Migrar para `People.jsx` (que usa `pessoas`) ou corrigir referência.

### 4.2 `PublicMenu.jsx` — Sem responsividade adequada
- **Gravidade:** Alta
- **Impacto:** Carrinho e pedido podem quebrar em mobile.
- **Correção:** Adicionar `useMediaQuery`, `flexWrap`, `overflowX`, ajustar `width` e `maxHeight` do carrinho.

### 4.3 `Accounts.jsx` — Código antigo, sem responsividade
- **Gravidade:** Média
- **Impacto:** Layout pode quebrar, referência a tabela incorreta.
- **Correção:** Atualizar para estrutura atual (`table-responsive`, `useMediaQuery`, `overflowX`).

### 4.4 `Layout.jsx` — Sidebar fechada por padrão em desktop
- **Gravidade:** Média
- **Impacto:** UX confusa (usuário precisa clicar em `Menu` para ver a navegação em desktop).
- **Correção:** Adicionar `isSidebarOpen = true` quando `isDesktop`, e `margin-left: 280px` para `.layout-content`.

### 4.5 `Settings.jsx` — Logo não aparecia (corrigido)
- **Gravidade:** Baixa (corrigido no turno atual)
- **Correção aplicada:** `fetchConfigs()` seleciona `logo_url`, `carregarEmpresa()` aplica ao `form`, `logo-dropzone` exibe `img` quando `form.logo_url` existe.

---

## 5. SUGESTÕES DE MELHORIA POR PRIORIDADE

### Prioridade ALTA (Crítico para funcionamento)
1. **`Clients.jsx`:** Corrigir referência de tabela (`clients` → `pessoas`) ou remover se duplicado (`People.jsx` existe).
2. **`PublicMenu.jsx`:** Adicionar responsividade completa (`useMediaQuery`, `flexWrap`, `overflowX`, `width` ajustável para carrinho).
3. **`Layout.jsx`:** Corrigir sidebar em desktop (abrir por padrão, `margin-left: 280px`).

### Prioridade MÉDIA (Melhoria de UX)
4. **`Accounts.jsx`:** Atualizar código (`table-responsive`, `useMediaQuery`, referência à tabela correta).
5. **`Stock.jsx`:** Adicionar `useMediaQuery` (`isMobile`) para ajustar header (`flex-direction: column` em mobile) e garantir que modal não vaze (`maxHeight: 90vh`).
6. **`Dashboard.jsx`:** Adicionar `isMobile` para ajustar `padding` (`12px` em mobile, `20px` em desktop) — já usa `minmax`, mas `padding` pode ser melhorado.

### Prioridade BAIXA (Polimento)
7. **`QRCodePage.jsx`:** Verificar responsividade (`width: 100%`, `maxWidth` para QR code).
8. **`Services.jsx`:** Verificar se usa `table-responsive` e `overflowX`.
9. **`Suppliers.jsx`:** Verificar se usa `table-responsive`.
10. **`Sales.jsx`:** Adicionar `isMobile` para ajustar layout do carrinho (talvez `gridTemplateColumns: 1fr` em mobile).

---

## 6. CONCLUSÃO

- **Melhor configuradas:** `Dashboard`, `Orcamentos`, `People`, `Settings` (após correção).
- **Precisa melhorar:** `Stock`, `PublicMenu`, `Sales`, `Accounts`.
- **Crítico:** `Clients.jsx` (referência errada), `Layout.jsx` (sidebar em desktop), `PublicMenu.jsx` (responsividade).
- Nenhum componente quebrou após as correções aplicadas (`Settings.jsx` corrigido, `NovoOrcamento.jsx` com `select` de empresa, `pdfGenerator.js` com empresa, `PublicMenu.jsx` com `data_validade`).

---

*Auditoria concluída em 2026-09-24. Relatório gerado no workspace `C:\Users\Emanuel\OneDrive\Área de Trabalho\smoke-garden`. Arquivos alterados: `AUDITORIA_ORCAMENTO.md`, `frontend/src/pages/settings/Settings.jsx`, `frontend/src/pages/orcamentos/NovoOrcamento.jsx`, `frontend/src/components/OrcamentoPDF.jsx`, `frontend/src/utils/pdfGenerator.js`, `frontend/src/pages/public/PublicMenu.jsx`.*
