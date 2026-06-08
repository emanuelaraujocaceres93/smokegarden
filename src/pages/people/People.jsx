import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'

const emptyForm = {
  tipo: 'cliente',
  nome: '',
  telefone: '',
  email: '',
  documento: '',
  endereco: '',
  observacoes: ''
}

export default function People() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchPeople()
  }, [])

  async function fetchPeople() {
    setLoading(true)
    const { data, error } = await supabase.from('pessoas').select('*').order('nome')
    if (error) toast.error('Erro ao carregar pessoas')
    else setPeople(data || [])
    setLoading(false)
  }

  const filteredPeople = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return people.filter((person) => {
      const matchesType = typeFilter === 'todos' || person.tipo === typeFilter
      const searchable = [person.nome, person.telefone, person.email, person.documento].filter(Boolean).join(' ').toLowerCase()
      return matchesType && (!term || searchable.includes(term))
    })
  }, [people, searchTerm, typeFilter])

  function openCreate(tipo = 'cliente') {
    setEditing(null)
    setForm({ ...emptyForm, tipo })
    setShowModal(true)
  }

  function openEdit(person) {
    setEditing(person)
    setForm({
      tipo: person.tipo,
      nome: person.nome || '',
      telefone: person.telefone || '',
      email: person.email || '',
      documento: person.documento || '',
      endereco: person.endereco || '',
      observacoes: person.observacoes || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.nome.trim()) return toast.error('Nome é obrigatório')

    const payload = {
      tipo: form.tipo,
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      documento: form.documento.replace(/\D/g, '') || null,
      endereco: form.endereco.trim() || null,
      observacoes: form.observacoes.trim() || null
    }

    const request = editing
      ? supabase.from('pessoas').update(payload).eq('id', editing.id)
      : supabase.from('pessoas').insert([payload])

    const { error } = await request
    if (error) return toast.error(error.message)

    toast.success(editing ? 'Pessoa atualizada!' : 'Pessoa cadastrada!')
    setShowModal(false)
    fetchPeople()
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este cadastro?')) return
    const { error } = await supabase.from('pessoas').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Cadastro excluído!')
      fetchPeople()
    }
  }

  if (loading) return <div className="page-empty">Carregando pessoas...</div>

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Pessoas"
        description="Clientes e fornecedores em uma única base."
        actions={
          <div className="actions-row">
            <button className="btn btn-secondary btn-md" type="button" onClick={() => openCreate('fornecedor')}>+ Fornecedor</button>
            <button className="btn btn-primary btn-md" type="button" onClick={() => openCreate('cliente')}>+ Cliente</button>
          </div>
        }
      />

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="actions-row">
          <input className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nome, telefone, e-mail ou documento..." />
          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ maxWidth: 190 }}>
            <option value="todos">Todos</option>
            <option value="cliente">Clientes</option>
            <option value="fornecedor">Fornecedores</option>
          </select>
        </div>
      </div>

      <div className="panel table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Contato</th>
              <th>Documento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeople.map((person) => (
              <tr key={person.id}>
                <td>
                  <strong>{person.nome}</strong>
                  {person.endereco && <div className="text-muted">{person.endereco}</div>}
                </td>
                <td>{person.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}</td>
                <td>
                  {person.telefone || '-'}
                  {person.email && <div className="text-muted">{person.email}</div>}
                </td>
                <td>{person.documento || '-'}</td>
                <td className="actions-cell">
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => openEdit(person)}>Editar</button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => handleDelete(person.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {filteredPeople.length === 0 && (
              <tr><td colSpan="5" className="page-empty">Nenhuma pessoa encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-panel modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar pessoa' : 'Nova pessoa'}</h2>
              <button className="modal-close" type="button" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Tipo</label>
                <select className="form-select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="cliente">Cliente</option>
                  <option value="fornecedor">Fornecedor</option>
                </select>
              </div>
              <div className="form-group"><label>Nome *</label><input className="form-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
              <div className="form-group"><label>Telefone</label><input className="form-input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div className="form-group"><label>E-mail</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-group"><label>CPF/CNPJ</label><input className="form-input" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} /></div>
              <div className="form-group"><label>Endereço</label><textarea className="form-textarea" rows="2" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
              <div className="form-group"><label>Observações</label><textarea className="form-textarea" rows="3" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
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
