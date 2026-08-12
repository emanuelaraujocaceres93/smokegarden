import React from 'react';
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const Clients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: ''
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    const { Data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    
    if (error) {
      toast.error('Erro ao carregar Clientes')
    } else {
      setClients(Data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome ç obrigatçrio')
      return
    }
    if (!formData.contact.trim()) {
      toast.error('Contato ç obrigatçrio')
      return
    }
    
    const clientData = {
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      address: formData.address.trim() || null
    }

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', editingClient.id)
      if (error) {
        toast.error('Erro ao atualizar Cliente')
      } else {
        toast.success('Cliente atualizado!')
      }
    } else {
      const { error } = await supabase
        .from('clients')
        .insert([clientData])
      if (error) {
        toast.error('Erro ao cadastrar Cliente')
      } else {
        toast.success('Cliente cadastrado!')
      }
    }

    setShowModal(false)
    setEditingClient(null)
    resetForm()
    fetchClients()
  }

  const resetForm = () => {
    setFormData({ name: '', contact: '', address: '' })
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      contact: client.contact,
      address: client.address || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('excluir este Cliente?')) {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) {
        toast.error('Erro ao excluir Cliente')
      } else {
        toast.success('Cliente excluçdo!')
        fetchClients()
      }
    }
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando...</div>
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Clientes</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Gerencie seus Clientes</p>
      </div>

      {/* Barra de aççes */}
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
            setEditingClient(null)
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
          + Novo Cliente
        </button>
      </div>

      {/* Lista de Clientes */}
      {filteredClients.length === 0 ? (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF' }}>{searchTerm ? 'Nenhum Cliente encontrado' : 'Nenhum Cliente cadastrado'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredClients.map(client => (
            <div
              key={client.id}
              style={{
                backgroundColor: '#1A1A1A',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{client.name}</p>
                <p style={{ color: '#D95A1A', margin: '0 0 4px 0', fontSize: '14px' }}>?? {client.contact}</p>
                {client.address && <p style={{ color: '#9CA3AF', margin: 0, fontSize: '12px' }}>?? {client.address}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(client)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#3A5F40',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  editar
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#C62828',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h2 style={{ color: '#D95A1A', marginBottom: '20px' }}>{editingClient ? 'editar Cliente' : 'Novo Cliente'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Contato (telefone/email) *</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Endereço</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="2"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#3A5F40', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>salvar</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #9CA3AF', color: '#9CA3AF', borderRadius: '8px', cursor: 'pointer' }}>cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clients
