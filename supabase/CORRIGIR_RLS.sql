-- =============================================
-- SMOKE GARDEN - CORREÇÕES DE BANCO DE DADOS
-- Revise cada bloco antes de executar!
-- =============================================

-- =============================================
-- BLOCO 1: CORRIGIR RLS NAS TABELAS DESPROTEGIDAS
-- Essas tabelas estão SEM Row Level Security!
-- =============================================

-- 1a. Habilitar RLS em caixa_movimentacoes (15 registros expostos)
ALTER TABLE public.caixa_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_caixa_movimentacoes"
  ON public.caixa_movimentacoes
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated'::text)
  WITH CHECK (true);

-- 1b. Habilitar RLS em empresa_configuracoes
ALTER TABLE public.empresa_configuracoes ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (como configuracoes)
CREATE POLICY "public_select_empresa_configuracoes"
  ON public.empresa_configuracoes
  FOR SELECT
  TO public
  USING (true);

-- Somente authenticated pode editar
CREATE POLICY "auth_all_empresa_configuracoes"
  ON public.empresa_configuracoes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 1c. Habilitar RLS em orcamento_status_history
ALTER TABLE public.orcamento_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_orcamento_status_history"
  ON public.orcamento_status_history
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated'::text)
  WITH CHECK (true);

-- =============================================
-- BLOCO 2: MIGRAR DADOS DAS TABELAS LEGADO
-- Move dados de tabelas antigas para as novas
-- =============================================

-- 2a. Migrar dados de 'sales' para 'vendas' (se houver dados novos em sales)
-- CUIDADO: Execute apenas se sales tiver dados que vendas não tem
-- INSERT INTO vendas (id, valor_total, forma_pagamento, status, created_at)
-- SELECT id, total, payment_method, status, created_at
-- FROM sales
-- WHERE id NOT IN (SELECT id FROM vendas);

-- 2b. Migrar dados de 'products' para 'estoque' (se necessário)
-- CUIDADO: As tabelas têm colunas diferentes, ajuste conforme necessário

-- =============================================
-- BLOCO 3: CRIAR VIEWS PARA UNIFICAR CONSULTAS
-- Views que unificam tabelas duplicadas
-- =============================================

-- 3a. View unificada de itens de venda (combina venda_itens + itens_venda)
-- NOTA: itens_venda NÃO tem coluna created_at, por isso usamos NULL
CREATE OR REPLACE VIEW public.v_todos_itens_venda AS
SELECT
  id,
  venda_id,
  produto_id,
  nome_produto,
  quantidade,
  valor_unitario,
  valor_total,
  tipo,
  created_at,
  descricao,
  estoque_id,
  tipo_item
FROM public.venda_itens
UNION ALL
SELECT
  id,
  venda_id,
  NULL AS produto_id,
  NULL AS nome_produto,
  quantidade,
  valor_unitario,
  valor_total,
  NULL AS tipo,
  NULL::timestamp AS created_at,
  descricao,
  estoque_id,
  tipo_item
FROM public.itens_venda;

-- =============================================
-- BLOCO 4: LIMPAR TABELAS LEGADO (OPCIONAL)
-- Só execute DEPOIS de migrar todos os dados
-- =============================================

-- ⚠️ NÃO EXECUTE ISSO SEM CONFIRMAR QUE NENHUM CÓDIGO USA ESSAS TABELAS
-- Reports.jsx JÁ foi corrigido (itens_venda → venda_itens)

-- Tabelas que podem ser descartadas após migração:
-- DROP TABLE IF EXISTS public.itens_orcamento;     (0 registros)
-- DROP TABLE IF EXISTS public.itens_venda;          (0 registros) - CUIDADO: Reports.jsx usa!
-- DROP TABLE IF EXISTS public.sale_items;           (0 registros)
-- DROP TABLE IF EXISTS public.stock_movements;      (0 registros)
-- DROP TABLE IF EXISTS public.orcamento_status_history; (0 registros)

-- =============================================
-- BLOCO 5: VERIFICAR INTEGRIDADE FINAL
-- =============================================

-- Verificar todas as tabelas com RLS
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- Se retornar linhas, ainda há tabelas sem RLS!

-- Verificar contagem de registros
SELECT relname AS tabela, n_live_tup AS registros
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
