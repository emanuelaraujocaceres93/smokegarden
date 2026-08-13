-- =============================================
-- SMOKE GARDEN - DIAGNÓSTICO SUPABASE
-- Execute este SQL no Supabase SQL Editor
-- (https://supabase.com/dashboard → SQL Editor)
-- =============================================

-- =============================================
-- 1. LISTAR TODAS AS TABELAS DO BANCO
-- =============================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  hasinserts,
  hasupdates,
  hasdeletes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- 2. LISTAR COLUNAS DE CADA TABELA (SCHEMA)
-- =============================================
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  CASE
    WHEN pk.column_name IS NOT NULL THEN 'PK'
    ELSE ''
  END AS constraint_type
FROM information_schema.columns c
LEFT JOIN (
  SELECT ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
    AND tc.table_schema = ku.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
) pk ON c.column_name = pk.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- =============================================
-- 3. VERIFICAR RLS (ROW LEVEL SECURITY)
-- Mostra se RLS está ativo e quantas policies existem
-- =============================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  forcerowsecurity AS force_rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- 4. LISTAR POLICIES DE RLS
-- =============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================
-- 5. VERIFICAR TABELAS COM CONTAGEM DE REGISTROS
-- Ajuda a saber se dados existem
-- =============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== CONTAGEM DE REGISTROS ===';
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I', 'public', r.tablename)
    INTO STRICT r;
    RAISE NOTICE 'Tabela: % → % registros', r.tablename, r.count;
  END LOOP;
END $$;

-- Versão simples (funciona sem DO block):
SELECT
  relname AS tabela,
  n_live_tup AS estimativa_registros
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- =============================================
-- 6. VERIFICAR TABELAS ESPERADAS PELO APP
-- Compara com o que o código usa
-- =============================================
DO $$
DECLARE
  tabelas_esperadas TEXT[] := ARRAY[
    'orcamentos',
    'orcamento_itens',
    'estoque',
    'produtos',
    'pessoas',
    'vendas',
    'venda_itens',
    'itens_venda',
    'pedidos_publicos',
    'pedidos_publicos_convertidos',
    'avaliacoes',
    'configuracoes',
    'empresa_configuracoes',
    'logos',
    'installments',
    'bills_to_pay'
  ];
  t TEXT;
  existe BOOLEAN;
BEGIN
  RAISE NOTICE '=== VERIFICAÇÃO DE TABELAS ESPERADAS ===';
  FOREACH t IN ARRAY tabelas_esperadas LOOP
    SELECT EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = t
    ) INTO existe;

    IF existe THEN
      RAISE NOTICE '✅ Tabela "%" existe', t;
    ELSE
      RAISE WARNING '❌ Tabela "%" NÃO existe!', t;
    END IF;
  END LOOP;
END $$;

-- =============================================
-- 7. VERIFICAR FUNÇÕES RPC (se houver)
-- =============================================
SELECT
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =============================================
-- 8. VERIFICAR ÍNDICES
-- =============================================
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================
-- 9. VERIFICAR PROBLEMAS COMUNS DE CONEXÃO
-- Testa se o banco está acessível
-- =============================================
SELECT
  current_database() AS database,
  current_user AS usuario,
  version() AS versao_postgres,
  now() AS hora_servidor;

-- =============================================
-- 10. VERIFICAR STORAGE BUCKETS (RLS do Storage)
-- =============================================
SELECT
  id,
  name,
  owner,
  created_at,
  updated_at,
  public AS is_public
FROM storage.buckets
ORDER BY name;

-- =============================================
-- 11. VERIFICAR STORAGE POLICIES
-- =============================================
SELECT
  id,
  bucket_id,
  name,
  definition
FROM storage.policies
ORDER BY bucket_id, name;

-- =============================================
-- 12. VERIFICAR SE AUTH ESTÁ FUNCIONANDO
-- =============================================
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
