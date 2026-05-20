import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', estimated_hours: '' })

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    setLoading(true)
    const { data } = await supabase.from('services').select('*').order('name')
    setServices(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { name: form.name, description: form.description, price: parseFloat(form.price) || 0, estimated_hours: parseInt(form.estimated_hours) || null }
    
    if (editing) {
      await supabase.from('services').update(payload).eq('id', editing.id)
      toast.success('Serviço atualizado!')
    } else {
      await supabase.from('services').insert([payload])
      toast.success('Serviço cadastrado!')
    }
    setShowModal(false)
    setEditing(null)
    setForm({ name: '', description: '', price: '', estimated_hours: '' })
    fetchServices()
  }

  const handleDelete = async (id) => {
    if (confirm('Excluir este serviço?')) {
      await supabase.from('services').delete().eq('id', id)
      toast.success('Serviço excluído!')
      fetchServices()
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64 text-grayLight">Carregando...</div>

  return (
    <div className="p-4 md:p-6">
      <PageHeader 
        title="Serviços" 
        description="Gerencie os serviços oferecidos"
        actions={
          <button onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', estimated_hours: '' }); setShowModal(true) }}
            className="bg-garden text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full md:w-auto">
            + Novo Serviço
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <Card key={s.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white">{s.name}</h3>
                {s.description && <p className="text-grayLight text-sm mt-1">{s.description}</p>}
                <p className="text-burnt font-bold mt-2">R$ {s.price?.toFixed(2) || '0.00'}</p>
                {s.estimated_hours && <p className="text-grayLight text-xs mt-1">{s.estimated_hours}h estimados</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(s); setForm({ name: s.name, description: s.description || '', price: s.price, estimated_hours: s.estimated_hours || '' }); setShowModal(true) }} 
                  className="text-garden hover:text-green-400">Editar</button>
                <button onClick={() => handleDelete(s.id)} className="text-alertRed hover:text-red-400">Excluir</button>
              </div>
            </div>
          </Card>
        ))}
        {services.length === 0 && <div className="col-span-full text-center text-grayLight py-8">Nenhum serviço cadastrado.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-burnt mb-4">{editing ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Nome *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full p-2 rounded bg-smoke border border-gray-700 mb-3" required />
              <textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} 
                className="w-full p-2 rounded bg-smoke border border-gray-700 mb-3" rows="2" />
              <input type="number" step="0.01" placeholder="Preço *" value={form.price} onChange={e => setForm({...form, price: e.target.value})} 
                className="w-full p-2 rounded bg-smoke border border-gray-700 mb-3" required />
              <input type="number" placeholder="Horas estimadas" value={form.estimated_hours} onChange={e => setForm({...form, estimated_hours: e.target.value})} 
                className="w-full p-2 rounded bg-smoke border border-gray-700 mb-4" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-garden text-white py-2 rounded-lg">{editing ? 'Atualizar' : 'Cadastrar'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Services
