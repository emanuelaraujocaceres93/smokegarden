-- Script de limpeza: remove orçamentos e itens de teste (ex.: emails @example.com)
-- Use com cuidado. Revise antes de executar.

BEGIN;

DELETE FROM caixa_movimentacoes WHERE orcamento_id IN (
  SELECT id FROM orcamentos WHERE cliente_email LIKE '%@example.com' OR cliente_nome ILIKE 'Cliente Test%'
);

DELETE FROM orcamento_status_history WHERE orcamento_id IN (
  SELECT id FROM orcamentos WHERE cliente_email LIKE '%@example.com' OR cliente_nome ILIKE 'Cliente Test%'
);

DELETE FROM orcamento_itens WHERE orcamento_id IN (
  SELECT id FROM orcamentos WHERE cliente_email LIKE '%@example.com' OR cliente_nome ILIKE 'Cliente Test%'
);

DELETE FROM orcamentos WHERE cliente_email LIKE '%@example.com' OR cliente_nome ILIKE 'Cliente Test%';

COMMIT;

-- Recomendo rodar primeiro as consultas abaixo para revisar o que será removido:
-- SELECT * FROM orcamentos WHERE cliente_email LIKE '%@example.com' OR cliente_nome ILIKE 'Cliente Test%';
