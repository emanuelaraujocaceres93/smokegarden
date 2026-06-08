import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function NovoOrcamento() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [estoque, setEstoque] = useState([])
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [novoCliente, setNovoCliente] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [itens, setItens] = useState([])

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const [{ data: estoqueData }, { data: clientesData }] = await Promise.all([
      supabase.from('estoque').select('*').eq('ativo', true).order('nome'),
      supabase.from('pessoas').select('*').eq('tipo', 'cliente').order('nome')
    ])
    setEstoque(estoqueData || [])
    setClientes(clientesData || [])
  }

  const itensFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return estoque.filter((item) => !term || item.nome.toLowerCase().includes(term) || item.descricao?.toLowerCase().includes(term))
  }, [estoque, searchTerm])

  const total = itens.reduce((sum, item) => sum + item.valor_total, 0)

  function adicionarItem(item) {
    const existente = itens.find((orcItem) => orcItem.estoque_id === item.id)
    if (existente) {
      setItens(itens.map((orcItem) =>
        orcItem.estoque_id === item.id
          ? { ...orcItem, quantidade: orcItem.quantidade + 1, valor_total: (orcItem.quantidade + 1) * orcItem.valor_unitario }
          : orcItem
      ))
    } else {
      setItens([...itens, {
        tipo_item: item.tipo,
        estoque_id: item.id,
        descricao: item.nome,
        quantidade: 1,
        valor_unitario: Number(item.valor) || 0,
        valor_total: Number(item.valor) || 0
      }])
    }
    setShowModal(false)
    setSearchTerm('')
  }

  function atualizarQuantidade(index, quantidade) {
    if (quantidade <= 0) {
      setItens(itens.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    setItens(itens.map((item, itemIndex) =>
      itemIndex === index ? { ...item, quantidade, valor_total: quantidade * item.valor_unitario } : item
    ))
  }

  async function resolveClienteId() {
    if (clienteId) return clienteId
    if (!novoCliente.trim()) return null

    const { data, error } = await supabase
      .from('pessoas')
      .insert([{ tipo: 'cliente', nome: novoCliente.trim() }])
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async function salvarOrcamento() {
    if (itens.length === 0) return toast.error('Adicione pelo menos um item')

    try {
      setLoading(true)
      const resolvedClienteId = await resolveClienteId()
      const { data: config } = await supabase.from('configuracoes').select('chave_pix').limit(1).maybeSingle()
      const { data: pixPayload } = await supabase.rpc('gerar_qrcode_pix', {
        valor: total,
        chave_pix: config?.chave_pix || ''
      })

      const { data: orcamento, error } = await supabase
        .from('orcamentos')
        .insert([{ cliente_id: resolvedClienteId, valor_total: total, qrcode_pix: pixPayload || null }])
        .select()
        .single()

      if (error) throw error

      const itensData = itens.map((item) => ({ ...item, orcamento_id: orcamento.id }))
      const { error: itensError } = await supabase.from('itens_orcamento').insert(itensData)
      if (itensError) throw itensError

      toast.success('Orçamento criado!')
      navigate('/orcamentos')
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar orçamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Novo Orçamento</h1>
          <p className="page-description">Crie um orçamento com itens do estoque unificado.</p>
        </div>
        <div className="actions-row">
          <button className="btn btn-secondary btn-md" type="button" onClick={() => navigate(-1)}>Cancelar</button>
          <button className="btn btn-primary btn-md" type="button" onClick={salvarOrcamento} disabled={loading}>
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>

      <div className="grid-3">
        <section className="card card-section">
          <h2>Cliente</h2>
          <div className="form-group">
            <label>Cliente existente</label>
            <select className="form-select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecionar depois</option>
              {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Novo cliente</label>
            <input className="form-input" value={novoCliente} onChange={(e) => setNovoCliente(e.target.value)} disabled={Boolean(clienteId)} />
          </div>
        </section>

        <section className="card card-section card-span-2">
          <div className="section-header">
            <h2>Itens</h2>
            <button className="btn btn-primary btn-md" type="button" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Adicionar
            </button>
          </div>

          {itens.length === 0 ? (
            <div className="page-empty">Nenhum item adicionado.</div>
          ) : (
            <div className="table-responsive">
              <table className="table compact">
                <thead><tr><th>Item</th><th>Qtd</th><th>Unitário</th><th>Total</th><th>Ações</th></tr></thead>
                <tbody>
                  {itens.map((item, index) => (
                    <tr key={`${item.estoque_id}-${index}`}>
                      <td>{item.descricao}</td>
                      <td><input className="input-quantity" type="number" min="1" value={item.quantidade} onChange={(e) => atualizarQuantidade(index, Number(e.target.value) || 1)} /></td>
                      <td>{formatCurrency(item.valor_unitario)}</td>
                      <td>{formatCurrency(item.valor_total)}</td>
                      <td><button className="btn btn-danger btn-sm" type="button" onClick={() => atualizarQuantidade(index, 0)}><Trash2 size={16} /> Remover</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan="3">Total</td><td>{formatCurrency(total)}</td><td /></tr></tfoot>
              </table>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Adicionar item</h3>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowModal(false)}>Fechar</button>
            </div>
            <div className="modal-list">
              <input className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar no estoque..." />
              {itensFiltrados.map((item) => (
                <button key={item.id} className="product-button" type="button" onClick={() => adicionarItem(item)}>
                  <div><strong>{item.nome}</strong> <span className="text-muted">({item.tipo})</span></div>
                  <small>{formatCurrency(item.valor)}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
