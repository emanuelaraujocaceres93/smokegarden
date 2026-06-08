import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'

const emptyConfig = {
  whatsapp_admin: '',
  endereco_loja: '',
  logo_url: '',
  chave_pix: '',
  banco_nome: '',
  banco_codigo: '',
  conta_agencia: '',
  conta_numero: ''
}

export default function Settings() {
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [configId, setConfigId] = useState(null)
  const [form, setForm] = useState(emptyConfig)

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    setLoading(true)
    const { data, error } = await supabase.from('configuracoes').select('*').limit(1).maybeSingle()
    if (error) toast.error('Erro ao carregar configurações')
    if (data) {
      setConfigId(data.id)
      setForm({ ...emptyConfig, ...data })
    }
    setLoading(false)
  }

  async function uploadLogo(file) {
    if (!file?.type?.startsWith('image/')) return toast.error('Selecione uma imagem')
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName)
      setForm((current) => ({ ...current, logo_url: data.publicUrl }))
      toast.success('Logo enviada!')
    } catch (error) {
      toast.error(error.message || 'Erro ao enviar logo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)

    const payload = {
      whatsapp_admin: form.whatsapp_admin.trim(),
      endereco_loja: form.endereco_loja.trim(),
      logo_url: form.logo_url.trim(),
      chave_pix: form.chave_pix.replace(/\D/g, '') || form.chave_pix.trim(),
      banco_nome: form.banco_nome.trim() || null,
      banco_codigo: form.banco_codigo.trim() || null,
      conta_agencia: form.conta_agencia.trim() || null,
      conta_numero: form.conta_numero.trim() || null
    }

    const request = configId
      ? supabase.from('configuracoes').update(payload).eq('id', configId).select().single()
      : supabase.from('configuracoes').insert([payload]).select().single()

    const { data, error } = await request
    setSaving(false)

    if (error) return toast.error(error.message)
    if (data?.id) setConfigId(data.id)
    toast.success('Configurações salvas!')
  }

  if (loading) return <div className="page-empty">Carregando configurações...</div>

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Configurações da Loja" description="WhatsApp, endereço, logo, PIX e banco." />

      <form className="panel" onSubmit={handleSubmit} style={{ maxWidth: 820 }}>
        <div className="form-group">
          <label>WhatsApp Admin (com DDD)</label>
          <input className="form-input" type="tel" value={form.whatsapp_admin} onChange={(e) => setForm({ ...form, whatsapp_admin: e.target.value })} placeholder="5511999999999" required />
        </div>

        <div className="form-group">
          <label>Endereço da Loja</label>
          <textarea className="form-textarea" rows="3" value={form.endereco_loja} onChange={(e) => setForm({ ...form, endereco_loja: e.target.value })} required />
        </div>

        <div className="form-group">
          <label>Logo da Empresa</label>
          <button
            type="button"
            className="logo-dropzone"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              uploadLogo(e.dataTransfer.files?.[0])
            }}
          >
            {form.logo_url ? <img src={form.logo_url} alt="Logo" /> : <span>{uploading ? 'Enviando...' : 'Arraste ou clique para adicionar logo'}</span>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadLogo(e.target.files?.[0])} />
        </div>

        <div className="card" style={{ marginTop: 0 }}>
          <h2 className="panel-title">Dados Bancários (QR Code PIX)</h2>

          <div className="form-group">
            <label>Chave PIX (CPF)</label>
            <input className="form-input" value={form.chave_pix} onChange={(e) => setForm({ ...form, chave_pix: e.target.value })} placeholder="12345678909" required />
          </div>

          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="form-group">
              <label>Nome do Banco</label>
              <input className="form-input" value={form.banco_nome || ''} onChange={(e) => setForm({ ...form, banco_nome: e.target.value })} placeholder="BV S.S." />
            </div>
            <div className="form-group">
              <label>Código do Banco</label>
              <input className="form-input" value={form.banco_codigo || ''} onChange={(e) => setForm({ ...form, banco_codigo: e.target.value })} placeholder="0413" />
            </div>
            <div className="form-group">
              <label>Agência</label>
              <input className="form-input" value={form.conta_agencia || ''} onChange={(e) => setForm({ ...form, conta_agencia: e.target.value })} placeholder="2020" />
            </div>
            <div className="form-group">
              <label>Conta Corrente</label>
              <input className="form-input" value={form.conta_numero || ''} onChange={(e) => setForm({ ...form, conta_numero: e.target.value })} placeholder="50203879656-0" />
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" type="submit" disabled={saving || uploading} style={{ width: '100%', marginTop: 24 }}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  )
}
