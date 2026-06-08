import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'

const emptyForm = {
  tipo: 'produto',
  nome: '',
  descricao: '',
  valor: '',
  imagens: '',
  ativo: true
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Stock() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await supabase.from('estoque').select('*').order('nome')
    if (error) {
      toast.error('Erro ao carregar estoque')
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return items.filter((item) => {
      const matchesType = typeFilter === 'todos' || item.tipo === typeFilter
      const matchesTerm = !term || item.nome?.toLowerCase().includes(term) || item.descricao?.toLowerCase().includes(term)
      return matchesType && matchesTerm
    })
  }, [items, searchTerm, typeFilter])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      tipo: item.tipo,
      nome: item.nome || '',
      descricao: item.descricao || '',
      valor: item.valor ?? '',
      imagens: Array.isArray(item.imagens) ? item.imagens.join('\n') : '',
      ativo: item.ativo !== false
    })
    setShowModal(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.nome.trim()) return toast.error('Nome é obrigatório')

    const imagens = form.imagens
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean)
      .slice(0, 5)

    const payload = {
      tipo: form.tipo,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      valor: Number(form.valor) || 0,
      imagens,
      ativo: form.ativo
    }

    const request = editing
      ? supabase.from('estoque').update(payload).eq('id', editing.id)
      : supabase.from('estoque').insert([payload])

    const { error } = await request
    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(editing ? 'Item atualizado!' : 'Item cadastrado!')
    setShowModal(false)
    fetchItems()
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este item do estoque?')) return
    const { error } = await supabase.from('estoque').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Item excluído!')
      fetchItems()
    }
  }

  if (loading) return <div className="page-empty">Carregando estoque...</div>

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Estoque"
        description="Produtos e serviços em uma única base."
        actions={<button className="btn btn-primary btn-md" type="button" onClick={openCreate}>+ Novo item</button>}
      />

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="actions-row">
          <input className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar no estoque..." />
          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="todos">Todos</option>
            <option value="produto">Produtos</option>
            <option value="servico">Serviços</option>
          </select>
        </div>
      </div>

      <div className="panel table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.nome}</strong>
                  {item.descricao && <div className="text-muted">{item.descricao}</div>}
                </td>
                <td>{item.tipo === 'produto' ? 'Produto' : 'Serviço'}</td>
                <td>{formatCurrency(item.valor)}</td>
                <td><span className={`badge ${item.ativo ? 'badge-success' : 'badge-danger'}`}>{item.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td className="actions-cell">
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => openEdit(item)}>Editar</button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => handleDelete(item.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr><td colSpan="5" className="page-empty">Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-panel modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar item' : 'Novo item'}</h2>
              <button className="modal-close" type="button" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Tipo</label>
                <select className="form-select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="produto">Produto</option>
                  <option value="servico">Serviço</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nome *</label>
                <input className="form-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea className="form-textarea" rows="3" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Valor *</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Imagens (uma URL por linha, máximo 5)</label>
                <textarea className="form-textarea" rows="4" value={form.imagens} onChange={(e) => setForm({ ...form, imagens: e.target.value })} />
              </div>
              <label className="actions-row" style={{ alignItems: 'center', marginBottom: 20 }}>
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
                Ativo no cardápio público
              </label>
              <div className="modal-footer" style={{ padding: 0, borderTop: 0 }}>
                <button className="btn btn-secondary btn-md" type="button" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary btn-md" type="submit">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
