# Relatório de Auditoria — Criação de Orçamento (Smoke Garden)

**Data:** 2026-09-24
**Auditor:** PawWork (automatizado + verificação manual)
**Escopo:** `NovoOrcamento.jsx`, `OrcamentoDetalhes.jsx`, `PublicMenu.jsx`, `Orcamentos.jsx`, `OrcamentoPDF.jsx`, `pdfGenerator.js`, `supabaseOrcamentos.js`, tabela `orcamentos` (banco Supabase) e todas as referências no workspace.

---

## 1. Objetivo da auditoria

Verificar minuciosamente:
- Se existe a opção de colocar **data de emissão** e **data de vencimento** ao criar um orçamento.
- Se essas datas aparecem corretamente no **PDF do orçamento**.
- Se há **inconsistências** entre código, banco, PDF e formulários públicos.

---

## 2. Estrutura do banco (tabela `orcamentos`)

Verificado via arquivo `supabase/DIAGNOSTICO_CORRIGIDO.sql` (consulta de schema — não há arquivo de migração `migrations/` no workspace).

Colunas utilizadas pelo código na tabela `orcamentos`:

| Coluna (código)        | Tipo esperado | Usada onde?                                                                 |
|------------------------|---------------|-------------------------------------------------------------------------------|
| `id`                   | UUID          | Todos os componentes                                                         |
| `numero_orcamento`     | text          | `NovoOrcamento.jsx`, `OrcamentoPDF.jsx`, `Orcamentos.jsx`                    |
| `cliente_id`           | UUID          | `NovoOrcamento.jsx`, `PublicMenu.jsx`                                        |
| `cliente_nome`         | text          | `NovoOrcamento.jsx`, `PublicMenu.jsx`, `pdfGenerator.js`                     |
| `cliente_email`        | text          | `NovoOrcamento.jsx`, `PublicMenu.jsx`                                        |
| `cliente_telefone`     | text          | `NovoOrcamento.jsx`, `PublicMenu.jsx`                                        |
| `cliente_documento`    | text          | `NovoOrcamento.jsx`                                                           |
| `data_criacao`         | timestamptz   | `NovoOrcamento.jsx` (inserido automaticamente), `pdfGenerator.js`, `Orcamentos.jsx` |
| `data_validade`        | timestamptz   | `NovoOrcamento.jsx` (inserido automaticamente, `30 dias`), `pdfGenerator.js` |
| `status`               | text          | `NovoOrcamento.jsx` (`rascunho`), `PublicMenu.jsx` (`pendente`)             |
| `subtotal`             | numeric       | `NovoOrcamento.jsx`                                                           |
| `desconto`             | numeric       | `NovoOrcamento.jsx`                                                           |
| `tipo_desconto`        | text          | `NovoOrcamento.jsx`                                                           |
| `total`                | numeric       | `NovoOrcamento.jsx`, `pdfGenerator.js`                                        |
| `observacoes`          | text          | `NovoOrcamento.jsx`, `pdfGenerator.js`, `OrcamentoPDF.jsx`                  |
| `origem`               | text          | `NovoOrcamento.jsx` (não inserido! — inconsistente), `PublicMenu.jsx` (`publico`), `Orcamentos.jsx` |
| `created_at`           | timestamptz   | `NovoOrcamento.jsx`, `PublicMenu.jsx`                                        |
| `updated_at`           | timestamptz   | `NovoOrcamento.jsx`                                                           |

**Não existem no código** (e provavelmente no banco):
- `data_emissao` — não há referência no workspace.
- `data_vencimento` — não há referência no workspace.
- `valid_until` — usado no componente `OrcamentoPDF.jsx` (linha 101), mas a coluna real é `data_validade`. Isso é uma **inconsistência crítica**.

---

## 3. Verificação por arquivo

### 3.1 `frontend/src/pages/orcamentos/NovoOrcamento.jsx` (criação interna)

- **Estado atual:** não há inputs para data de emissão ou vencimento.
- `data_criacao`: definido automaticamente como `new Date().toISOString()` (linha 169).
- `data_validade`: definido automaticamente como `new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()` (linha 170).
- **Problema:** o usuário não pode alterar essas datas no momento da criação.
- **Problema adicional:** `origem` não é inserido no `insert` (ausente nas linhas 162-179), embora a tabela tenha referência a `publico`/`interno` no componente `OrcamentoDetalhes.jsx` (linha 288).

### 3.2 `frontend/src/pages/orcamentos/OrcamentoDetalhes.jsx` (edição)

- Não exibe `data_criacao` ou `data_validade` no formulário.
- Não permite editar essas datas.
- Mostra `origem` e `status` (linha 287-290), mas sem inputs editáveis.

### 3.3 `frontend/src/pages/orcamentos/Orcamentos.jsx` (lista)

- Exibe `data_criacao` (linha 339) para a coluna "Data".
- Não exibe `data_validade`.
- Não há referência a `data_emissao` ou `data_vencimento`.

### 3.4 `frontend/src/pages/public/PublicMenu.jsx` (pedido público → orçamento)

- Insere `data_criacao` (linha 325) mas **não insere `data_validade`** (ausente no objeto `orcamentoData`, linha 316-327).
- Não há campos para alterar datas no pedido público.
- `origem` é definido como `'publico'` (linha 323) — correto.
- `status` é `'pendente'` (linha 322) — diferente do `NovoOrcamento.jsx` (`'rascunho'`).

### 3.5 `frontend/src/components/OrcamentoPDF.jsx` (componente PDF React)

- Linha 100: `Criação: ...` usa `orcamento.created_at` (não `data_criacao`).
- Linha 101: `Validade: ...` usa `orcamento.valid_until` — **coluna inexistente** no banco/código; o correto é `data_validade`.
- **Inconsistência crítica confirmada.**

### 3.6 `frontend/src/utils/pdfGenerator.js` (PDF real, gerado por `jsPDF`)

- Linha 125: `Data de criação: ...` usa `orcamento.data_criacao || orcamento.created_at` — correto.
- Linha 126: `Validade: ...` usa `orcamento.data_validade` — correto.
- **Portanto:** o PDF real (`pdfGenerator.js`) está correto com `data_validade`, mas o componente `OrcamentoPDF.jsx` (que parece ser um componente React para renderização visual, não o arquivo usado para download) está com o nome errado.

### 3.7 `frontend/src/services/supabaseOrcamentos.js`

- Não faz referência a `data_emissao` ou `data_vencimento`.
- `getById` retorna `orcamento` com `itens` anexados.
- `aprovar` usa `data_aprovacao` (não `data_emissao`).

---

## 4. Inconsistências encontradas (lista completa)

| # | Local                 | Problema                                                                 | Gravidade |
|---|-----------------------|--------------------------------------------------------------------------|-----------|
| 1 | `NovoOrcamento.jsx`   | Sem input editável para data de emissão (`data_criacao`).                | Alta      |
| 2 | `NovoOrcamento.jsx`   | Sem input editável para data de vencimento (`data_validade`).           | Alta      |
| 3 | `NovoOrcamento.jsx`   | `origem` não é inserido no objeto `insert` (ausente).                    | Média     |
| 4 | `OrcamentoDetalhes.jsx` | Sem exibição/edição de `data_criacao` ou `data_validade`.                | Média     |
| 5 | `PublicMenu.jsx`      | Não insere `data_validade` ao criar orçamento a partir de pedido público. | Alta     |
| 6 | `PublicMenu.jsx`      | Sem inputs editáveis para datas no pedido público.                      | Média     |
| 7 | `Orcamentos.jsx`      | Não exibe `data_validade` (vencimento) na lista.                        | Baixa     |
| 8 | `OrcamentoPDF.jsx`    | Usa `valid_until` em vez de `data_validade` (nome incorreto).          | Alta      |
| 9 | `OrcamentoPDF.jsx`    | Usa `created_at` para data de criação (não `data_criacao`).            | Baixa     |
| 10| `PublicMenu.jsx`      | `status` definido como `'pendente'` enquanto `NovoOrcamento.jsx` usa `'rascunho'` — falta de padronização. | Média |

---

## 5. Verificação de arquivos de banco (migrations)

- **Resultado:** não existe diretório `supabase/migrations/` no workspace.
- Os arquivos presentes são:
  - `supabase/DIAGNOSTICO.sql`
  - `supabase/DIAGNOSTICO_CORRIGIDO.sql`
  - `supabase/CORRIGIR_RLS.sql`
- **Implicação:** não há migrações versionadas no repositório. A definição do schema depende exclusivamente do Supabase dashboard ou de execuções manuais de SQL.

---

## 6. Conclusão preliminar

**Não há opção de colocar data de emissão e vencimento manualmente** na criação do orçamento (`NovoOrcamento.jsx`). As datas são fixas (automáticas):
- Emissão = momento da criação (`now`).
- Vencimento = 30 dias após a criação.

Além disso, existem **inconsistências de nomes** (`valid_until` vs `data_validade`) e **campos ausentes** (`data_validade` não inserido por `PublicMenu.jsx`).

---

## 7. Próximos passos (executados durante esta auditoria)

Todos os passos abaixo foram concluídos e verificados no código:

1. ✅ Adicionar inputs editáveis de `data_criacao` (`dataEmissao`) e `data_validade` (`dataVencimento`) em `NovoOrcamento.jsx`.
2. ✅ Corrigir `OrcamentoPDF.jsx` para usar `data_validade` (não `valid_until`).
3. ✅ Corrigir `PublicMenu.jsx` para incluir `data_validade` no insert.
4. ⚠️ `origem` ainda não inserido em `NovoOrcamento.jsx` (não solicitado pelo usuário para esta rodada).
5. ⚠️ `status` `rascunho` (interno) vs `pendente` (público) — não é inconsistência funcional, apenas nomenclatura diferente.

---

## 8. Correções aplicadas (durante auditoria)

### 8.1 `NovoOrcamento.jsx`
- Adicionados estados `dataEmissao` e `dataVencimento`.
- Adicionado `useEffect` para inicializar com data atual (emissão) e +30 dias (vencimento) no formato `YYYY-MM-DD`.
- Adicionados inputs `<input type="date">` no formulário (na seção Cliente, após Observações).
- Corrigido `salvarOrcamento()` para usar `dataEmissao` e `dataVencimento` (com `new Date(... + 'T00:00:00').toISOString()` para evitar deslocamento de fuso).

### 8.2 `PublicMenu.jsx`
- Corrigido `orcamentoData` para incluir `data_validade` (30 dias a partir da criação). Antes não inseria esse campo.

### 8.3 `OrcamentoPDF.jsx`
- Corrigida linha de criação: `data_criacao || created_at` (antes usava apenas `created_at`).
- Corrigida linha de validade: `data_validade` (antes usava `valid_until`, que é uma coluna inexistente).

---

## 9. Status final

| Item                                    | Antes         | Depois         |
|-----------------------------------------|---------------|----------------|
| Input de data de emissão (`NovoOrcamento`) | ❌ Ausente    | ✅ Presente    |
| Input de data de vencimento (`NovoOrcamento`) | ❌ Ausente    | ✅ Presente    |
| `PublicMenu.jsx` insere `data_validade` | ❌ Não inseria | ✅ Inserido     |
| `OrcamentoPDF.jsx` usa `valid_until`    | ❌ Incorreto  | ✅ Corrigido (`data_validade`) |
| PDF real (`pdfGenerator.js`)            | ✅ Correto    | ✅ Inalterado   |

---

## 10. Observações finais

- Os campos editáveis são do tipo `date` (`YYYY-MM-DD`), que converte corretamente para `timestamptz` via `new Date(... + 'T00:00:00')` para evitar problemas de fuso horário.
- O PDF (`OrcamentoPDF.jsx`) agora reflete corretamente `data_criacao` e `data_validade`, alinhado ao banco.
- A tabela `orcamentos` não possui `data_emissao` ou `data_vencimento` como nomes de colunas; o código usa `data_criacao` (emissão) e `data_validade` (vencimento). Isso está consistente com o pedido do usuário (manter nomes existentes e adicionar opção de edição).
- Não há arquivo de migração (`migrations/`) no workspace, portanto a verificação do schema foi feita via arquivos `supabase/DIAGNOSTICO*.sql` e inspeção de código.
- A auditoria foi realizada com cuidado, arquivo por arquivo, com verificação cruzada entre código, banco (via SQL de diagnóstico) e PDF.

---

*Auditoria concluída em 2026-09-24. Relatório (`AUDITORIA_ORCAMENTO.md`) e correções aplicados no workspace `C:\Users\Emanuel\OneDrive\Área de Trabalho\smoke-garden`.*
