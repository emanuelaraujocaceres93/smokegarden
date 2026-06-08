import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function CaixaDashboard() {
  const navigate = useNavigate();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('data');
  const [sortDirection, setSortDirection] = useState('desc');
  const [stats, setStats] = useState({ totalEntradas: 0, saldo: 0 });
  const [filtroData, setFiltroData] = useState({ inicio: '', fim: '' });
  const [tipo, setTipo] = useState('todos');

  useEffect(() => {
    fetchMovimentacoes();
  }, [filtroData, tipo]);

  async function buscarNomeCliente(clienteId, clienteNome) {
    if (clienteId) {
      const { data: pessoa } = await supabase
        .from('pessoas')
        .select('nome')
        .eq('id', clienteId)
        .single();
      
      if (pessoa?.nome) return pessoa.nome;
    }
    if (clienteNome) return clienteNome;
    return 'Cliente não informado';
  }

  async function fetchMovimentacoes() {
    setLoading(true);
    try {
      let todasMovimentacoes = [];
      let totalEntradas = 0;

      // Buscar orçamentos aprovados
      if (tipo === 'todos' || tipo === 'orcamentos') {
        let queryOrcamentos = supabase
          .from('orcamentos')
          .select('*')
          .eq('status', 'aprovado');

        if (filtroData.inicio) queryOrcamentos = queryOrcamentos.gte('data_criacao', filtroData.inicio);
        if (filtroData.fim) queryOrcamentos = queryOrcamentos.lte('data_criacao', filtroData.fim);

        const { data: orcamentos, error: orcError } = await queryOrcamentos.order('data_criacao', { ascending: false });
        if (!orcError && orcamentos) {
          const orcamentosFormatados = await Promise.all(orcamentos.map(async (o) => ({
            id: o.id,
            tipo: 'orcamento',
            data: o.data_criacao,
            valor: o.total || 0,
            cliente: await buscarNomeCliente(o.cliente_id, o.cliente_nome),
            numero: o.numero_orcamento,
            id_origem: o.id
          })));
          todasMovimentacoes = [...todasMovimentacoes, ...orcamentosFormatados];
          totalEntradas += orcamentos.reduce((sum, o) => sum + (o.total || 0), 0);
        }
      }

      // Buscar vendas concluídas
      if (tipo === 'todos' || tipo === 'vendas') {
        let queryVendas = supabase
          .from('vendas')
          .select('*')
          .eq('status', 'concluida');

        if (filtroData.inicio) queryVendas = queryVendas.gte('created_at', filtroData.inicio);
        if (filtroData.fim) queryVendas = queryVendas.lte('created_at', filtroData.fim);

        const { data: vendas, error: vendasError } = await queryVendas.order('created_at', { ascending: false });
        if (!vendasError && vendas) {
          const vendasFormatadas = await Promise.all(vendas.map(async (v) => ({
            id: v.id,
            tipo: 'venda',
            data: v.created_at,
            valor: v.valor_total || v.total || 0,
            cliente: await buscarNomeCliente(v.cliente_id, v.cliente_nome),
            numero: v.numero_venda || v.id.slice(0, 8),
            id_origem: v.id
          })));
          todasMovimentacoes = [...todasMovimentacoes, ...vendasFormatadas];
          totalEntradas += vendas.reduce((sum, v) => sum + (v.valor_total || v.total || 0), 0);
        }
      }

      todasMovimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
      setMovimentacoes(todasMovimentacoes);
      setStats({ totalEntradas, saldo: totalEntradas });
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao carregar movimentações');
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const movimentacoesFiltradas = movimentacoes.filter(m => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      m.cliente?.toLowerCase().includes(search) ||
      m.numero?.toString().toLowerCase().includes(search) ||
      m.tipo?.toLowerCase().includes(search)
    );
  });

  const movimentacoesOrdenadas = [...movimentacoesFiltradas].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'valor') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }
    return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return ' ↕️';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const handleVerDetalhes = (mov) => {
    if (mov.tipo === 'orcamento') {
      navigate(`/orcamentos/${mov.id_origem}`);
    } else {
      navigate(`/vendas/${mov.id_origem}`);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>Caixa</h1>
          <p style={{ color: '#888', margin: 0 }}>Controle financeiro - Orçamentos aprovados e Vendas</p>
        </div>
        <button onClick={fetchMovimentacoes} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔄 Atualizar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
          <p style={{ color: '#aaa', margin: 0 }}>Total em Movimentações</p>
          <p style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '10px 0 0 0' }}>{formatCurrency(stats.totalEntradas)}</p>
        </div>
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
          <p style={{ color: '#aaa', margin: 0 }}>Saldo em Caixa</p>
          <p style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '10px 0 0 0' }}>{formatCurrency(stats.saldo)}</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: '8px 16px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }}>
              <option value="todos">Todos</option>
              <option value="orcamentos">Orçamentos</option>
              <option value="vendas">Vendas</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>📅 Data Inicial</label>
            <input type="date" value={filtroData.inicio} onChange={(e) => setFiltroData({...filtroData, inicio: e.target.value})} style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>📅 Data Final</label>
            <input type="date" value={filtroData.fim} onChange={(e) => setFiltroData({...filtroData, fim: e.target.value})} style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>🔍 Buscar</label>
            <input type="text" placeholder="Cliente ou número..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }} />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#333' }}>
            <tr>
              <th onClick={() => handleSort('tipo')} style={{ padding: '12px', textAlign: 'left', color: '#aaa', cursor: 'pointer' }}>Tipo {getSortIcon('tipo')}</th>
              <th onClick={() => handleSort('numero')} style={{ padding: '12px', textAlign: 'left', color: '#aaa', cursor: 'pointer' }}>Número {getSortIcon('numero')}</th>
              <th onClick={() => handleSort('cliente')} style={{ padding: '12px', textAlign: 'left', color: '#aaa', cursor: 'pointer' }}>Cliente {getSortIcon('cliente')}</th>
              <th onClick={() => handleSort('valor')} style={{ padding: '12px', textAlign: 'right', color: '#aaa', cursor: 'pointer' }}>Valor {getSortIcon('valor')}</th>
              <th onClick={() => handleSort('data')} style={{ padding: '12px', textAlign: 'left', color: '#aaa', cursor: 'pointer' }}>Data {getSortIcon('data')}</th>
              <th style={{ padding: '12px', textAlign: 'center', color: '#aaa' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoesOrdenadas.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Nenhuma movimentação encontrada</td>
              </tr>
            ) : (
              movimentacoesOrdenadas.map((m, index) => (
                <tr key={m.id || index} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', backgroundColor: m.tipo === 'orcamento' ? '#f59e0b20' : '#22c55e20', color: m.tipo === 'orcamento' ? '#fbbf24' : '#4ade80' }}>
                      {m.tipo === 'orcamento' ? 'Orçamento' : 'Venda'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'white' }}>#{m.numero}</td>
                  <td style={{ padding: '12px', color: 'white' }}>{m.cliente || '—'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80' }}>{formatCurrency(m.valor)}</td>
                  <td style={{ padding: '12px', color: '#aaa' }}>{formatDate(m.data)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleVerDetalhes(m)} style={{ padding: '4px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Ver</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {movimentacoesOrdenadas.length > 0 && (
            <tfoot style={{ backgroundColor: '#333', borderTop: '2px solid #444' }}>
              <tr>
                <td colSpan="3" style={{ padding: '12px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>Total:</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80', fontWeight: 'bold' }}>{formatCurrency(stats.totalEntradas)}</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}