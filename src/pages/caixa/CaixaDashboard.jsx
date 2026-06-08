import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Eye, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CaixaDashboard() {
  const navigate = useNavigate();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEntradas: 0,
    saldo: 0
  });

  useEffect(() => {
    fetchMovimentacoes();
  }, []);

  async function fetchMovimentacoes() {
    setLoading(true);
    try {
      // Buscar orçamentos aprovados diretamente
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMovimentacoes(data || []);
      
      // Calcular estatísticas
      const totalEntradas = (data || []).reduce((sum, m) => sum + (m.total || 0), 0);
      setStats({
        totalEntradas: totalEntradas,
        saldo: totalEntradas
      });
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err);
      setError(err.message || String(err));
      toast.error('Erro ao carregar movimentações');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleVerOrcamento = (orcamentoId) => {
    if (orcamentoId) {
      sessionStorage.setItem('voltarPara', '/caixa');
      navigate(`/orcamentos/${orcamentoId}`);
    }
  };

  const handleVoltar = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className="text-center py-12">Carregando movimentações...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Erro: {error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleVoltar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caixa</h1>
          <p className="text-gray-600 mt-1">Registro de orçamentos aprovados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Total em Orçamentos Aprovados</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEntradas)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Saldo em Caixa</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.saldo)}</p>
        </div>
      </div>

      {movimentacoes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">Nenhuma movimentação encontrada</p>
          <p className="text-sm text-gray-400 mt-2">
            Aprove orçamentos na página de Orçamentos para gerar registros no caixa.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimentacoes.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {m.cliente_nome || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-green-600">
                      {formatCurrency(m.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aprovado
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleVerOrcamento(m.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}