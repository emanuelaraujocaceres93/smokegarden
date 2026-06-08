import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Plus, FileText, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { generatePDF } from '../../utils/pdfGenerator';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [aprovando, setAprovando] = useState(null)

  useEffect(() => {
    carregarOrcamentos()
  }, [])

  async function carregarOrcamentos() {
    setLoading(true)
    try {
      const [{ data: orcamentosData, error }, { data: clientesData }] = await Promise.all([
        supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
        supabase.from('pessoas').select('id,nome')
      ])
      if (error) throw error
      setOrcamentos(orcamentosData || [])
      setClientes(clientesData || [])
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }

  async function aprovarOrcamento(orcamento) {
    if (!window.confirm(`Aprovar orçamento #${orcamento.numero_orcamento}?`)) return
    
    setAprovando(orcamento.id)
    try {
      const { error } = await supabase
        .from('orcamentos')
        .update({ 
          status: 'aprovado',
          data_aprovacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orcamento.id)

      if (error) throw error

      toast.success(`Orçamento #${orcamento.numero_orcamento} aprovado!`)
      carregarOrcamentos()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao aprovar orçamento')
    } finally {
      setAprovando(null)
    }
  }

  async function gerarPDF(orcamento) {
    try {
      // Buscar itens do orçamento
      const { data: itens } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', orcamento.id)

      const dadosCompletos = {
        ...orcamento,
        itens: itens || []
      }
      
      await generatePDF(dadosCompletos, 'orcamento')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const clientesMap = useMemo(() => Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.nome])), [clientes])

  return (
    <div style={{ padding: '24px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>Orçamentos</h1>
          <p style={{ color: '#888', margin: '5px 0 0' }}>Gerencie propostas criadas a partir do estoque.</p>
        </div>
        <Link to="/orcamentos/novo" style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Novo Orçamento
        </Link>
      </div>

      <div style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Carregando orçamentos...</div>
        ) : orcamentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Nenhum orçamento encontrado.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#333' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Número</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Cliente</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Data</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#aaa' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#aaa' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((orcamento) => (
                <tr key={orcamento.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px', color: 'white' }}>#{orcamento.numero_orcamento}</td>
                  <td style={{ padding: '12px', color: 'white' }}>{orcamento.cliente_nome || clientesMap[orcamento.cliente_id] || 'Cliente avulso'}</td>
                  <td style={{ padding: '12px', color: '#aaa' }}>{orcamento.data_criacao ? new Date(orcamento.data_criacao).toLocaleDateString('pt-BR') : '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80' }}>{formatCurrency(orcamento.total || 0)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '20px', 
                      fontSize: '12px',
                      backgroundColor: orcamento.status === 'aprovado' ? '#22c55e20' : '#f59e0b20',
                      color: orcamento.status === 'aprovado' ? '#4ade80' : '#fbbf24'
                    }}>
                      {orcamento.status === 'aprovado' ? 'Aprovado' : 'Rascunho'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Link to={`/orcamentos/${orcamento.id}`} style={{ padding: '4px 8px', backgroundColor: '#333', color: '#60a5fa', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={14} /> Ver
                      </Link>
                      <button onClick={() => gerarPDF(orcamento)} style={{ padding: '4px 8px', backgroundColor: '#333', color: '#fbbf24', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={14} /> PDF
                      </button>
                      {orcamento.status !== 'aprovado' && (
                        <button onClick={() => aprovarOrcamento(orcamento)} disabled={aprovando === orcamento.id} style={{ padding: '4px 8px', backgroundColor: '#22c55e20', color: '#4ade80', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> {aprovando === orcamento.id ? '...' : 'Aprovar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}