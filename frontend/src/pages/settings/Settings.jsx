import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'

const emptyConfig = {
  nome_empresa: '',
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
  const [empresas, setEmpresas] = useState([])
  const [novaEmpresa, setNovaEmpresa] = useState('Smoke Garden - Matriz')

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('id, nome_empresa, logo_url, whatsapp_admin, endereco_loja, chave_pix, banco_nome, banco_codigo, conta_agencia, conta_numero')
        .order('nome_empresa', { ascending: true })

      if (error) {
        console.error('Erro ao carregar:', error)
        toast.error('Erro ao carregar configuraÃ§Ãµes')
      }

      setEmpresas(data || [])

      // Se nÃ£o existe nenhuma empresa, criar a padrÃ£o
      if (!data || data.length === 0) {
        const { data: novaEmpresa, error: erroCriar } = await supabase
          .from('configuracoes')
          .insert([{
            nome_empresa: 'Smoke Garden - Matriz',
            whatsapp_admin: '5511999999999',
            endereco_loja: 'R. LuÃ­s Nunes, 116A - Bairro JacarÃ©, CabreÃºva - SP, 13315-023',
            logo_url: null,
            chave_pix: '',
            banco_nome: null,
            banco_codigo: null,
            conta_agencia: null,
            conta_numero: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select('id, nome_empresa')
          .single()
        
        if (!erroCriar && novaEmpresa) {
          await carregarEmpresa(novaEmpresa.id)
        } else {
          setForm(emptyConfig)
          setConfigId(null)
        }
        return
      }

      if (data && data.length > 0) {
        const primeira = data[0]
        await carregarEmpresa(primeira.id)
      } else {
        setForm(emptyConfig)
        setConfigId(null)
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar configuraÃ§Ãµes')
    } finally {
      setLoading(false)
    }
  }

  async function carregarEmpresa(id) {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Erro ao carregar empresa:', error)
    }

    if (data) {
      setConfigId(data.id)
      setForm({ ...emptyConfig, ...data })
    }
  }

  async function uploadLogo(file) {
    if (!file) return
    if (!file?.type?.startsWith('image/')) {
      toast.error('Selecione uma imagem vÃ¡lida (JPG, PNG, GIF)')
      return
    }

    setUploading(true)
    try {
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
      if (error.message?.includes('bucket not found')) {
        toast.error('Bucket de storage nÃ£o configurado. Contate o administrador.')
      } else {
        toast.error(error.message || 'Erro ao enviar logo')
      }
    } finally {
      setUploading(false)
    }
  }

  function handleNovaEmpresa() {
    setConfigId(null)
    setForm(emptyConfig)
    setNovaEmpresa('')
    toast.success('Preencha os dados da nova empresa e clique em Salvar')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.nome_empresa?.trim()) {
      toast.error('Nome da empresa Ã© obrigatÃ³rio')
      return
    }
    if (!form.whatsapp_admin.trim()) {
      toast.error('WhatsApp Admin Ã© obrigatÃ³rio')
      return
    }
    if (!form.endereco_loja.trim()) {
      toast.error('EndereÃ§o da loja Ã© obrigatÃ³rio')
      return
    }
    if (!form.chave_pix.trim()) {
      toast.error('Chave PIX Ã© obrigatÃ³ria')
      return
    }

    setSaving(true)

    const payload = {
      nome_empresa: form.nome_empresa.trim(),
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
        result = await supabase
          .from('configuracoes')
          .update(payload)
          .eq('id', configId)
          .select()
          .single()
      } else {
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

      toast.success('ConfiguraÃ§Ãµes salvas com sucesso!')
      await fetchConfigs()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error(error.message || 'Erro ao salvar configuraÃ§Ãµes')
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
          <p>Carregando configuraÃ§Ãµes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="ConfiguraÃ§Ãµes da Loja"
        description="Configure WhatsApp, endereÃ§o, logo, PIX e dados bancÃ¡rios. Cada empresa tem seus prÃ³prios dados."
      />

      {/* Lista e criaÃ§Ã£o de empresas */}
      <div style={{ maxWidth: 820, margin: '0 auto', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#2a2a2a', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ color: '#fff', margin: '0 0 12px', fontSize: '16px' }}>Empresas Cadastradas</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {empresas.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => carregarEmpresa(emp.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  backgroundColor: configId === emp.id ? '#D95A1A' : '#333',
                  color: configId === emp.id ? '#fff' : '#ccc',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {emp.nome_empresa || 'Sem nome'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleNovaEmpresa}
              disabled={saving}
              style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Nova Empresa
            </button>
          </div>
        </div>
      </div>

      <form className="panel" onSubmit={handleSubmit} style={{ maxWidth: 820, margin: '0 auto' }}>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>Nome da Empresa *</label>
          <input
            className="form-input"
            value={form.nome_empresa || ''}
            onChange={(e) => handleChange('nome_empresa', e.target.value)}
            placeholder="Ex: Smoke Garden - CabreÃºva"
            required
          />
        </div>

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
            NÃºmero que receberÃ¡ os pedidos via WhatsApp
          </small>
        </div>

        <div className="form-group">
          <label>EndereÃ§o da Loja *</label>
          <textarea
            className="form-textarea"
            rows="3"
            value={form.endereco_loja}
            onChange={(e) => handleChange('endereco_loja', e.target.value)}
            placeholder="R. LuÃ­s Nunes, 116A - Bairro JacarÃ©, CabreÃºva - SP, 13315-023"
            required
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            EndereÃ§o que aparecerÃ¡ no site e nos pedidos
          </small>
        </div>

        <div className="form-group">
          <label>Logo da Empresa</label>
          <div
            className="logo-dropzone"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
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
                ðŸ“¸ Arraste ou clique para adicionar logo
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

        <div className="card" style={{ marginTop: '20px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h2 className="panel-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
            ðŸ’° Dados BancÃ¡rios (QR Code PIX)
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
              <label>CÃ³digo do Banco</label>
              <input
                className="form-input"
                value={form.banco_codigo || ''}
                onChange={(e) => handleChange('banco_codigo', e.target.value)}
                placeholder="001"
              />
            </div>
            <div className="form-group">
              <label>AgÃªncia</label>
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
          {saving ? 'ðŸ’¾ Salvando...' : 'ðŸ’¾ Salvar ConfiguraÃ§Ãµes'}
        </button>
      </form>
    </div>
  )
}
