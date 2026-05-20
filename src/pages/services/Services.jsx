import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Loading from '../../components/ui/Loading'

const initialForm = {
  name: '',
  description: '',
  price: '',
  hours_estimated: '',
  photo_url: ''
}

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true })
    if (error) {
      toast.error('Erro ao carregar serviços: ' + error.message)
      setServices([])
    } else {
      setServices(data || [])
    }
    setLoading(false)
  }

  const openModal = (service = null) => {
    if (service) {
      setEditingService(service)
      setForm({
        name: service.name || '',
        description: service.description || '',
        price: service.price ?? '',
        hours_estimated: service.hours_estimated ?? '',
        photo_url: service.photo_url || ''
      })
    } else {
      setEditingService(null)
      setForm(initialForm)
    }
    setModalOpen(true)
  }

  const saveService = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.price) {
      toast.error('Nome e preço são obrigatórios.')
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      hours_estimated: form.hours_estimated ? Number(form.hours_estimated) : null,
      photo_url: form.photo_url.trim() || null
    }

    const request = editingService
      ? supabase.from('services').update(payload).eq('id', editingService.id)
      : supabase.from('services').insert([payload])

    const { error } = await request
    if (error) {
      toast.error('Erro ao salvar serviço: ' + error.message)
      return
    }

    toast.success('Serviço salvo com sucesso')
    setModalOpen(false)
    setEditingService(null)
    setForm(initialForm)
    await fetchServices()
  }

  const deleteService = async (service) => {
    if (!window.confirm(`Excluir ${service.name}?`)) {
      return
    }

    const { error } = await supabase.from('services').delete().eq('id', service.id)
    if (error) {
      toast.error('Erro ao excluir serviço: ' + error.message)
      return
    }

    toast.success('Serviço excluído')
    await fetchServices()
  }

  if (loading) {
    return <Loading message="Carregando serviços..." />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Serviços</h1>
          <p className="page-description">Cadastre serviços com preço, horas estimadas e imagem representativa.</p>
        </div>
        <Button variant="secondary" size="md" onClick={() => openModal()}>
          + Novo Serviço
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <p style={{ color: 'rgba(224,224,224,.72)' }}>Nenhum serviço cadastrado. Crie um serviço para começar.</p>
        </Card>
      ) : (
        <div className="panel-row panel-row-2" style={{ gap: 20 }}>
          {services.map((service) => (
            <Card key={service.id}>
              <div className="flex-space">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{service.name}</h3>
                  <p style={{ margin: '10px 0 0', color: 'rgba(224,224,224,.72)' }}>{service.description || 'Sem descrição'}</p>
                </div>
                <span style={{ background: 'rgba(217,90,26,.16)', color: '#D95A1A', borderRadius: 999, padding: '8px 14px', fontWeight: 700 }}>
                  R$ {Number(service.price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex-row" style={{ marginTop: 18, justifyContent: 'space-between' }}>
                <div style={{ color: 'rgba(224,224,224,.72)' }}>
                  Horas estimadas: <strong>{service.hours_estimated ?? '—'}h</strong>
                </div>
                <div className="flex-row" style={{ gap: 12 }}>
                  <Button variant="secondary" size="sm" onClick={() => openModal(service)}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => deleteService(service)}>
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingService ? 'Editar Serviço' : 'Novo Serviço'}>
        <form onSubmit={saveService}>
          <Input
            id="service-name"
            label="Nome"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Input
            id="service-description"
            label="Descrição"
            textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="panel-row panel-row-2">
            <Input
              id="service-price"
              label="Preço"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              required
            />
            <Input
              id="service-hours"
              label="Horas estimadas"
              type="number"
              value={form.hours_estimated}
              onChange={(event) => setForm({ ...form, hours_estimated: event.target.value })}
            />
          </div>
          <Input
            id="service-photo"
            label="URL da imagem"
            type="url"
            value={form.photo_url}
            onChange={(event) => setForm({ ...form, photo_url: event.target.value })}
          />
          <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="secondary" size="md" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingService ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Services
