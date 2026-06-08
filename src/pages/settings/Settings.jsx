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
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle()
      
      if (error) {
        console.error('Erro ao carregar:', error)
        toast.error('Erro ao carregar configurações')
      }
      
      if (data) {
        setConfigId(data.id)
        setForm({ ...emptyConfig, ...data })
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  async function uploadLogo(file) {
    if (!file) return
    if (!file?.type?.startsWith('image/')) {
      toast.error('Selecione uma imagem válida (JPG, PNG, GIF)')
      return
    }
    
    setUploading(true)
    try {
      // Verificar se o bucket existe, se não, criar
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === 'logos')
      
      if (!bucketExists) {
        await supabase.storage.createBucket('logos', {
          public: true
        })
      }
      
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true })
      
      if (uploadError) throw uploadError
      
      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)
      
      setForm((current) => ({ 
        ...current, 
        logo_url: publicUrlData.publicUrl 
      }))
      
      toast.success('Logo enviada com sucesso!')
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error(error.message || 'Erro ao enviar logo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    
    // Validações
    if (!form.whatsapp_admin.trim()) {
      toast.error('WhatsApp Admin é obrigatório')
      return
    }
    if (!form.endereco_loja.trim()) {
      toast.error('Endereço da loja é obrigatório')
      return
    }
    if (!form.chave_pix.trim()) {
      toast.error('Chave PIX é obrigatória')
      return
    }
    
    setSaving(true)

    const payload = {
      whatsapp_admin: form.whatsapp_admin.trim(),
      endereco_loja: form.endereco_loja.trim(),
      logo_url: form.logo_url?.trim() || null,
      chave_pix: form.chave_pix.trim(),
      banco_nome: form.banco_nome?.trim() || null,
      banco_codigo: form.banco_codigo?.trim() || null,
      conta_agencia: form.conta_agencia?.trim() || null,
      conta_numero: form.conta_numero?.trim() || null,
      updated_at: new Date().toISOString()
    }

    try {
      let result
      
      if (configId) {
        // Atualizar existente
        result = await supabase
          .from('configuracoes')
          .update(payload)
          .eq('id', configId)
          .select()
          .single()
      } else {
        // Inserir novo
        payload.created_at = new Date().toISOString()
        result = await supabase
          .from('configuracoes')
          .insert([payload])
          .select()
          .single()
      }

      if (result.error) throw result.error
      
      if (result.data?.id) {
        setConfigId(result.data.id)
      }
      
      toast.success('Configurações salvas com sucesso!')
      
      // Recarregar para garantir dados atualizados
      await fetchConfig()
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error(error.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader 
        title="Configurações da Loja" 
        description="Configure WhatsApp, endereço, logo, PIX e dados bancários." 
      />

      <form className="panel" onSubmit={handleSubmit} style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* WhatsApp Admin */}
        <div className="form-group">
          <label>WhatsApp Admin (com DDD) *</label>
          <input 
            className="form-input" 
            type="tel" 
            value={form.whatsapp_admin} 
            onChange={(e) => handleChange('whatsapp_admin', e.target.value)} 
            placeholder="5511999999999" 
            required 
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Número que receberá os pedidos via WhatsApp
          </small>
        </div>

        {/* Endereço da Loja */}
        <div className="form-group">
          <label>Endereço da Loja *</label>
          <textarea 
            className="form-textarea" 
            rows="3" 
            value={form.endereco_loja} 
            onChange={(e) => handleChange('endereco_loja', e.target.value)} 
            placeholder="R. Luís Nunes, 116A - Bairro Jacaré, Cabreúva - SP, 13315-023"
            required 
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Endereço que aparecerá no site e nos pedidos
          </small>
        </div>

        {/* Logo */}
        <div className="form-group">
          <label>Logo da Empresa</label>
          <div
            className="logo-dropzone"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const file = e.dataTransfer.files?.[0]
              if (file) uploadLogo(file)
            }}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#f9f9f9',
              minHeight: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {uploading ? (
              <span>Enviando logo...</span>
            ) : form.logo_url ? (
              <img 
                src={form.logo_url} 
                alt="Logo" 
                style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }} 
              />
            ) : (
              <span style={{ color: '#999' }}>
                📸 Arraste ou clique para adicionar logo
              </span>
            )}
          </div>
          <input 
            ref={fileRef} 
            type="file" 
            accept="image/*" 
            hidden 
            onChange={(e) => uploadLogo(e.target.files?.[0])} 
          />
        </div>

        {/* Dados Bancários */}
        <div className="card" style={{ marginTop: '20px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h2 className="panel-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
            💰 Dados Bancários (QR Code PIX)
          </h2>

          <div className="form-group">
            <label>Chave PIX (CPF/CNPJ) *</label>
            <input 
              className="form-input" 
              value={form.chave_pix} 
              onChange={(e) => handleChange('chave_pix', e.target.value)} 
              placeholder="12345678909" 
              required 
            />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div className="form-group">
              <label>Nome do Banco</label>
              <input 
                className="form-input" 
                value={form.banco_nome || ''} 
                onChange={(e) => handleChange('banco_nome', e.target.value)} 
                placeholder="Banco do Brasil" 
              />
            </div>
            <div className="form-group">
              <label>Código do Banco</label>
              <input 
                className="form-input" 
                value={form.banco_codigo || ''} 
                onChange={(e) => handleChange('banco_codigo', e.target.value)} 
                placeholder="001" 
              />
            </div>
            <div className="form-group">
              <label>Agência</label>
              <input 
                className="form-input" 
                value={form.conta_agencia || ''} 
                onChange={(e) => handleChange('conta_agencia', e.target.value)} 
                placeholder="1234-5" 
              />
            </div>
            <div className="form-group">
              <label>Conta Corrente</label>
              <input 
                className="form-input" 
                value={form.conta_numero || ''} 
                onChange={(e) => handleChange('conta_numero', e.target.value)} 
                placeholder="123456-7" 
              />
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-lg" 
          type="submit" 
          disabled={saving || uploading} 
          style={{ 
            width: '100%', 
            marginTop: '24px',
            backgroundColor: '#D95A1A',
            padding: '12px',
            fontSize: '16px'
          }}
        >
          {saving ? '💾 Salvando...' : '💾 Salvar Configurações'}
        </button>
      </form>
    </div>
  )
}