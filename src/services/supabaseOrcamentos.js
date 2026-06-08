import { supabase } from '../lib/supabaseClient';

export const orcamentoService = {
  async getAll(filtros = {}) {
    let query = supabase.from('orcamentos').select('*').order('created_at', { ascending: false });
    if (filtros.status && filtros.status !== 'todos') {
      query = query.eq('status', filtros.status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    try {
      const { data: orcamento, error: orcError } = await supabase
        .from('orcamentos').select('*').eq('id', id).maybeSingle();
      if (orcError) throw orcError;
      if (!orcamento) return null;
      const { data: itens } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id', id);
      if (itens) orcamento.itens = itens;
      return orcamento;
    } catch (err) {
      const { data: basic } = await supabase.from('orcamentos').select('*').eq('id', id).maybeSingle();
      return basic;
    }
  },

  async aprovar(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    const { data: updated, error } = await supabase
      .from('orcamentos')
      .update({ status: 'aprovado', data_aprovacao: new Date().toISOString(), aprovado_por: user.id })
      .eq('id', id).eq('status', 'rascunho').select().single();
    if (error) throw error;
    return updated;
  },

  async recusar(id, motivo) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    const { data, error } = await supabase
      .from('orcamentos')
      .update({ status: 'recusado', data_recusacao: new Date().toISOString(), motivo_recusacao: motivo })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getConfiguracoes() {
    const { data } = await supabase.from('empresa_configuracoes').select('*').limit(1).maybeSingle();
    return data || {};
  }
};