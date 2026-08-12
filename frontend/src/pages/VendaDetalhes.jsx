// Crie o arquivo: src/pages/VendaDetalhes.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function VendaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venda, setVenda] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarVenda();
  }, [id]);

  async function carregarVenda() {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVenda(data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Venda não encontrada');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: '20px', color: 'white' }}>Carregando...</div>;
  if (!venda) return <div style={{ padding: '20px', color: 'white' }}>Venda não encontrada</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        ← Voltar
      </button>
      <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
        <h1 style={{ color: 'white' }}>Detalhes da Venda</h1>
        <p><strong style={{ color: '#aaa' }}>Número:</strong> <span style={{ color: 'white' }}>{venda.numero_venda}</span></p>
        <p><strong style={{ color: '#aaa' }}>Cliente:</strong> <span style={{ color: 'white' }}>{venda.cliente_nome || 'Cliente avulso'}</span></p>
        <p><strong style={{ color: '#aaa' }}>Valor Total:</strong> <span style={{ color: '#4ade80' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor_total)}</span></p>
        <p><strong style={{ color: '#aaa' }}>Data:</strong> <span style={{ color: 'white' }}>{new Date(venda.created_at).toLocaleDateString('pt-BR')}</span></p>
        <p><strong style={{ color: '#aaa' }}>Status:</strong> <span style={{ color: '#4ade80' }}>{venda.status}</span></p>
      </div>
    </div>
  );
}