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

      const { data: itensData } = await supabase.from('itens_orcamento').select('*').eq('orcamento_id', id)
      setItens(itensData || [])

      if (orcamentoData?.cliente_id) {
        const { data: clienteData } = await supabase.from('pessoas').select('*').eq('id', orcamentoData.cliente_id).maybeSingle()
        setCliente(clienteData || null)
      }
    } catch (error) {
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

  if (loading) return <div className="page-empty">Carregando orçamento...</div>
  if (!orcamento) return <div className="page-empty">Orçamento não encontrado.</div>

  return (
    <div className="page-main">
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/orcamentos')}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 className="page-title" style={{ marginTop: 12 }}>Orçamento #{orcamento.id?.slice(0, 8)}</h1>
          <p className="page-description">Criado em {new Date(orcamento.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <button className="btn btn-danger btn-md" type="button" onClick={excluirOrcamento}>
          <Trash2 size={16} /> Excluir
        </button>
      </div>

      <div className="grid-3">
        <section className="card card-section">
          <h2>Cliente</h2>
          <p><strong>{cliente?.nome || 'Cliente avulso'}</strong></p>
          {cliente?.telefone && <p>{cliente.telefone}</p>}
          {cliente?.email && <p>{cliente.email}</p>}
          {cliente?.documento && <p>{cliente.documento}</p>}
        </section>

        <section className="card card-section card-span-2">
          <h2>Itens</h2>
          <div className="table-responsive">
            <table className="table compact">
              <thead><tr><th>Item</th><th>Tipo</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td>{item.descricao}</td>
                    <td>{item.tipo_item}</td>
                    <td>{item.quantidade}</td>
                    <td>{formatCurrency(item.valor_unitario)}</td>
                    <td>{formatCurrency(item.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="4">Total</td><td>{formatCurrency(orcamento.valor_total)}</td></tr>
              </tfoot>
            </table>
          </div>
          {orcamento.qrcode_pix && (
            <div className="card">
              <h3 className="panel-title">Payload PIX</h3>
              <code style={{ wordBreak: 'break-all' }}>{orcamento.qrcode_pix}</code>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
