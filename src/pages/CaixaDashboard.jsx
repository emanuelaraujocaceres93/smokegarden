import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DollarSign, TrendingUp, Eye, ArrowLeft, Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function caixadashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [filtroData, setFiltroData] = useState({
        inicio: '',
        fim: ''
    });
    const [stats, setStats] = useState({
        totalEntradas: 0,
        totalSaidas: 0,
        saldo: 0
    });

    useEffect(() => {
        carregarMovimentacoes();
    }, [filtroData]);

    async function carregarMovimentacoes() {
        try {
            setLoading(true);
            
            let query = supabase
                .from('caixa_movimentacoes')
                .select('*')
                .order('created_at', { ascending: false });

            if (filtroData.inicio) {
                query = query.gte('created_at', filtroData.inicio);
            }
            if (filtroData.fim) {
                query = query.lte('created_at', filtroData.fim);
            }

            const { Data, error } = await query;
            if (error) throw error;

            setMovimentacoes(Data || []);

            // Calcular estatçsticas
            const entradas = (Data || []).filter(m => m.tipo === 'entrada');
            const saidas = (Data || []).filter(m => m.tipo === 'saida');

            setStats({
                totalEntradas: entradas.reduce((sum, m) => sum + (m.valor || 0), 0),
                totalSaidas: saidas.reduce((sum, m) => sum + (m.valor || 0), 0),
                saldo: entradas.reduce((sum, m) => sum + (m.valor || 0), 0) - saidas.reduce((sum, m) => sum + (m.valor || 0), 0)
            });
        } catch (error) {
            toast.error('Erro ao carregar movimentaççes');
            console.error(error);
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
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleVerorçamento = (orçamentoId) => {
        if (orçamentoId) {
            sessionStorage.setItem('paginaAnterior', '/caixa');
            navigate(`/orçamentos/${orçamentoId}`);
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Registro de caixa</h1>
                    </div>
                    <p className="text-gray-600 ml-12">
                        Registro de todas as movimentaççes financeiras do sistema
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">total de Entradas</p>
                                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalEntradas)}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-green-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm">total de Saçdas</p>
                                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalSaidas)}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-red-200 rotate-180" />
                        </div>
                    </div>

                    <div className={`bg-gradient-to-r rounded-lg shadow-lg p-6 text-white ${
                        stats.saldo >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Saldo Atual</p>
                                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.saldo)}</p>
                            </div>
                            <DollarSign className="w-12 h-12 text-blue-200" />
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-700">Filtrar por perçodo</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data Inicial
                            </label>
                            <input
                                type="date"
                                value={filtroData.inicio}
                                onChange={(e) => setFiltroData({...filtroData, inicio: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data Final
                            </label>
                            <input
                                type="date"
                                value={filtroData.fim}
                                onChange={(e) => setFiltroData({...filtroData, fim: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabela */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : movimentacoes.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma movimentaçço encontrada</h3>
                        <p className="text-gray-600">
                            Aprove orçamentos na pçgina de Orçamentos para gerar movimentaççes no caixa.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descriçço</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aççes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {movimentacoes.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(mov.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {mov.descricao}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    mov.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {mov.tipo === 'entrada' ? 'Entrada' : 'Saçda'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {mov.cliente_nome || '---'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                <span className={mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                                                    {formatCurrency(mov.valor)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Pendente
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {mov.orçamento_id && (
                                                    <button
                                                        onClick={() => handleVerorçamento(mov.orçamento_id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span className="text-sm">Ver Orçamento</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr className="border-t-2 border-gray-200">
                                        <td colSpan="4" className="px-6 py-4 text-right font-bold text-lg">SALDO total:</td>
                                        <td className={`px-6 py-4 text-right font-bold text-lg ${
                                            stats.saldo >= 0 ? 'text-blue-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(stats.saldo)}
                                        </td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
