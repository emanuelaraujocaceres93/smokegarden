import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    notes: ''
  })
  const [searchTerm, setSearchTerm] = useState('')

  const refreshSuppliers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')
    
    if (error) {
      toast.error('Erro ao carregar fornecedores')
    } else {
      setSuppliers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSuppliers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!formData.contact.trim()) {
      toast.error('Contato é obrigatório')
      return
    }
    
    const supplierData = {
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      address: formData.address.trim() || null,
      notes: formData.notes.trim() || null
    }

    if (editingSupplier) {
      const { error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', editingSupplier.id)
      if (error) {
        toast.error('Erro ao atualizar fornecedor')
      } else {
        toast.success('Fornecedor atualizado!')
      }
    } else {
      const { error } = await supabase
        .from('suppliers')
        .insert([supplierData])
      if (error) {
        toast.error('Erro ao cadastrar fornecedor')
      } else {
        toast.success('Fornecedor cadastrado!')
      }
    }

    setShowModal(false)
    setEditingSupplier(null)
    resetForm()
    refreshSuppliers()
  }

  const resetForm = () => {
    setFormData({ name: '', contact: '', address: '', notes: '' })
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      address: supplier.address || '',
      notes: supplier.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este fornecedor?')) {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) {
        toast.error('Erro ao excluir fornecedor')
      } else {
        toast.success('Fornecedor excluído!')
        refreshSuppliers()
      }
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando...</div>
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Fornecedores</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Gerencie seus fornecedores</p>
      </div>

      {/* Barra de ações */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar por nome ou contato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #3A5F40',
            backgroundColor: '#1A1A1A',
            color: '#E0E0E0'
          }}
        />
        <button
          onClick={() => {
            setEditingSupplier(null)
            resetForm()
            setShowModal(true)
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#3A5F40',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Novo Fornecedor
        </button>
      </div>

      {/* Lista de fornecedores */}
      {filteredSuppliers.length === 0 ? (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF' }}>{searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredSuppliers.map(supplier => (
            <div
              key={supplier.id}
              style={{
                backgroundColor: '#1A1A1A',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{supplier.name}</p>
                <p style={{ color: '#D95A1A', margin: '0 0 4px 0', fontSize: '14px' }}>📞 {supplier.contact}</p>
                {supplier.address && <p style={{ color: '#9CA3AF', margin: '0 0 4px 0', fontSize: '12px' }}>📍 {supplier.address}</p>}
                {supplier.notes && <p style={{ color: '#F9A825', margin: '4px 0 0 0', fontSize: '12px', fontStyle: 'italic' }}>📝 {supplier.notes}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(supplier)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#3A5F40', color: 'white', cursor: 'pointer' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#C62828', color: 'white', cursor: 'pointer' }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h2 style={{ color: '#D95A1A', marginBottom: '20px' }}>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }} required />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Contato (telefone/email) *</label>
                <input type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }} required />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Endereço</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Observações (produtos fornecidos, etc)</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', resize: 'vertical' }} placeholder="Ex: Fornece óleo 2 tempos, velas, filtros..." />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#3A5F40', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Salvar</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #9CA3AF', color: '#9CA3AF', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Suppliers
