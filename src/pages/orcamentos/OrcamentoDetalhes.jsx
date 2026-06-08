import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function OrcamentoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orcamento, setOrcamento] = useState(null)
  const [itens, setItens] = useState([])
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [id])

  async function carregarDados() {
    setLoading(true)
    try {
      const { data: orcamentoData, error } = await supabase.from('orcamentos').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      setOrcamento(orcamentoData)

      // Usar a tabela correta: 'orcamento_itens'
      const { data: itensData } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id', id)
      setItens(itensData || [])

      if (orcamentoData?.cliente_id) {
        const { data: clienteData } = await supabase.from('pessoas').select('*').eq('id', orcamentoData.cliente_id).maybeSingle()
        setCliente(clienteData || null)
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar orçamento')
    } finally {
      setLoading(false)
    }
  }

  async function excluirOrcamento() {
    if (!window.confirm('Excluir este orçamento?')) return
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Orçamento excluído!')
      navigate('/orcamentos')
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>Carregando orçamento...</div>
  if (!orcamento) return <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>Orçamento não encontrado.</div>

  return (
    <div style={{ padding: '24px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/orcamentos')} style={{ padding: '6px 12px', backgroundColor: '#333', color: '#aaa', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>Orçamento #{orcamento.numero_orcamento || orcamento.id?.slice(0, 8)}</h1>
          <p style={{ color: '#888', margin: '5px 0 0' }}>Criado em {new Date(orcamento.data_criacao || orcamento.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <button onClick={excluirOrcamento} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={16} /> Excluir
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>Cliente</h2>
          <p style={{ color: 'white' }}><strong>{cliente?.nome || orcamento.cliente_nome || 'Cliente avulso'}</strong></p>
          {cliente?.telefone && <p style={{ color: '#aaa' }}>{cliente.telefone}</p>}
          {cliente?.email && <p style={{ color: '#aaa' }}>{cliente.email}</p>}
          {cliente?.documento && <p style={{ color: '#aaa' }}>{cliente.documento}</p>}
          {orcamento.observacoes && (
            <>
              <h3 style={{ color: 'white', fontSize: '14px', marginTop: '16px', marginBottom: '8px' }}>Observações</h3>
              <p style={{ color: '#aaa' }}>{orcamento.observacoes}</p>
            </>
          )}
        </div>

        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>Itens</h2>
          {itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Nenhum item encontrado.</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Item</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Tipo</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#aaa' }}>Qtd</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#aaa' }}>Unitário</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#aaa' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px', color: 'white' }}>{item.descricao}</td>
                        <td style={{ padding: '12px', color: '#aaa' }}>{item.tipo_item}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'white' }}>{item.quantidade}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80' }}>{formatCurrency(item.valor_unitario)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'white' }}>{formatCurrency(item.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #444' }}>
                      <td colSpan="4" style={{ padding: '12px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>Total</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80', fontWeight: 'bold' }}>{formatCurrency(orcamento.total || 0)}</td>
                    </tr>
                    {orcamento.desconto > 0 && (
                      <tr>
                        <td colSpan="4" style={{ padding: '12px', textAlign: 'right', color: '#aaa' }}>Desconto ({orcamento.tipo_desconto === 'percentual' ? `${orcamento.desconto}%` : formatCurrency(orcamento.desconto)})</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#f87171' }}>-{formatCurrency(orcamento.desconto)}</td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}