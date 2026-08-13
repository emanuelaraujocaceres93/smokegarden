-- =============================================
-- SMOKE GARDEN - DIAGNÓSTICO CORRIGIDO (v2)
-- Execute no Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. LISTAR TABELAS (corrigido - sem hasinserts)
-- =============================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- 2. SCHEMA COMPLETO (corrigido - sem duplicatas)
-- =============================================
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- =============================================
-- 3. RLS STATUS POR TABELA
-- =============================================
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- 4. VERIFICAR TABELAS ESPERADAS PELO APP
-- =============================================
SELECT
  t.tabela_esperada,
  CASE WHEN pg.tables IS NOT NULL THEN '✅ EXISTE' ELSE '❌ AUSENTE' END AS status
FROM (VALUES
  ('orcamentos'),
  ('orcamento_itens'),
  ('estoque'),
  ('pessoas'),
  ('vendas'),
  ('venda_itens'),
  ('itens_venda'),
  ('pedidos_publicos'),
  ('pedidos_publicos_convertidos'),
  ('avaliacoes'),
  ('configuracoes'),
  ('empresa_configuracoes'),
  ('installments'),
  ('bills_to_pay'),
  ('caixa_movimentacoes')
) AS t(tabela_esperada)
LEFT JOIN (
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
) pg ON pg.tablename = t.tabela_esperada
ORDER BY t.tabela_esperada;

-- =============================================
-- 5. SCHEMA DA TABELA ORCAMENTOS
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orcamentos'
ORDER BY ordinal_position;

-- =============================================
-- 6. SCHEMA DA TABELA ORCAMENTO_ITENS
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orcamento_itens'
ORDER BY ordinal_position;

-- =============================================
-- 7. SCHEMA DA TABELA VENDAS
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vendas'
ORDER BY ordinal_position;

-- =============================================
-- 8. SCHEMA DA TABELA VENDA_ITENS
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'venda_itens'
ORDER BY ordinal_position;

-- =============================================
-- 9. SCHEMA DA TABELA ESTOQUE
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'estoque'
ORDER BY ordinal_position;

-- =============================================
-- 10. SCHEMA DA TABELA PESSOAS
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pessoas'
ORDER BY ordinal_position;

-- =============================================
-- 11. SCHEMA DA TABELA CONFIGURACOES
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'configuracoes'
ORDER BY ordinal_position;

-- =============================================
-- 12. VERIFICAR TABELAS DUPLICADAS/CONFLITANTES
-- Tabelas que o código pode confundir
-- =============================================
SELECT
  tablename,
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = t.tablename) AS existe
FROM (VALUES
  ('itens_orcamento'),
  ('orcamento_itens'),
  ('itens_venda'),
  ('venda_itens'),
  ('sale_items'),
  ('sales'),
  ('vendas'),
  ('products'),
  ('estoque'),
  ('clients'),
  ('pessoas'),
  ('suppliers'),
  ('services')
) AS t(tablename)
ORDER BY t.tablename;

-- =============================================
-- 13. LISTAR TODAS AS POLICIES (simplificado)
-- =============================================
SELECT
  tablename,
  policyname,
  cmd AS operacao,
  roles AS para_papel,
  CASE
    WHEN qual IS NOT NULL THEN qual::text
    ELSE '(sem filtro)'
  END AS condicao_leitura,
  CASE
    WHEN with_check IS NOT NULL THEN with_check::text
    ELSE '(sem filtro)'
  END AS condicao_escrita
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================
-- 14. USUARIOS AUTENTICADOS
-- =============================================
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- =============================================
-- 15. STORAGE BUCKETS
-- =============================================
SELECT
  id,
  name,
  public AS is_public,
  created_at
FROM storage.buckets
ORDER BY name;

-- =============================================
-- 16. FUNCOES CUSTOMIZADAS
-- =============================================
SELECT
  routine_name,
  routine_type,
  data_type AS return_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =============================================
-- 17. TRIGGERS ATIVOS
-- =============================================
SELECT
  event_object_table AS tabela,
  trigger_name,
  event_manipulation AS evento,
  action_timing AS timing,
  action_statement AS acao
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =============================================
-- 18. CONTAGEM POR TABELA
-- =============================================
SELECT
  relname AS tabela,
  n_live_tup AS registros
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- =============================================
-- 19. VERIFICAR SE COLUNAS CRÍTICAS EXISTEM
-- Testa se as colunas que o código usa existem
-- =============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== VERIFICAÇÃO DE COLUNAS CRÍTICAS ===';

  -- orcamentos: verificar colunas usadas no código
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamentos'
  LOOP
    RAISE NOTICE 'orcamentos.%', r.column_name;
  END LOOP;

  RAISE NOTICE '---';

  -- venda_itens
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'venda_itens'
  LOOP
    RAISE NOTICE 'venda_itens.%', r.column_name;
  END LOOP;

  RAISE NOTICE '---';

  -- estoque
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'estoque'
  LOOP
    RAISE NOTICE 'estoque.%', r.column_name;
  END LOOP;

  RAISE NOTICE '---';

  -- pessoas
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pessoas'
  LOOP
    RAISE NOTICE 'pessoas.%', r.column_name;
  END LOOP;
END $$;

-- =============================================
-- 20. VERIFICAR URL E CONEXAO
-- =============================================
SELECT
  current_database() AS database,
  current_user AS usuario,
  version() AS versao_postgres,
  now() AS hora_servidor;
