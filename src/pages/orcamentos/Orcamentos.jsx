import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

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
      toast.error('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }

  const clientesMap = useMemo(() => Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.nome])), [clientes])

  return (
    <div className="page-main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orçamentos</h1>
          <p className="page-description">Gerencie propostas criadas a partir do estoque.</p>
        </div>
        <Link className="btn btn-primary btn-md" to="/orcamentos/novo"><Plus size={16} /> Novo Orçamento</Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="page-empty">Carregando orçamentos...</div>
        ) : orcamentos.length === 0 ? (
          <div className="page-empty">Nenhum orçamento encontrado.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead><tr><th>Número</th><th>Cliente</th><th>Data</th><th>Total</th><th>Validade</th><th>Ações</th></tr></thead>
              <tbody>
                {orcamentos.map((orcamento) => (
                  <tr key={orcamento.id}>
                    <td>#{orcamento.id?.slice(0, 8)}</td>
                    <td>{clientesMap[orcamento.cliente_id] || 'Cliente avulso'}</td>
                    <td>{orcamento.created_at ? new Date(orcamento.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>{formatCurrency(orcamento.valor_total)}</td>
                    <td>{orcamento.expires_at ? new Date(orcamento.expires_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="actions-cell"><Link to={`/orcamentos/${orcamento.id}`} className="btn btn-secondary btn-sm"><Eye size={16} /> Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
