import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'

export default function Avaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todas')

  useEffect(() => {
    carregarAvaliacoes()
  }, [])

  async function carregarAvaliacoes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) toast.error('Erro ao carregar avaliações')
    else setAvaliacoes(data || [])
    setLoading(false)
  }

  async function excluirAvaliacao(id) {
    if (!window.confirm('Excluir esta avaliação?')) return
    const { error } = await supabase.from('avaliacoes').delete().eq('id', id)
    if (error) toast.error('Erro ao excluir')
    else {
      toast.success('Avaliação excluída!')
      carregarAvaliacoes()
    }
  }

  async function alternarAprovacao(avaliacao) {
    const { error } = await supabase
      .from('avaliacoes')
      .update({ aprovado: !avaliacao.aprovado })
      .eq('id', avaliacao.id)
    
    if (error) toast.error('Erro ao atualizar')
    else {
      toast.success(avaliacao.aprovado ? 'Avaliação ocultada' : 'Avaliação publicada')
      carregarAvaliacoes()
    }
  }

  const avaliacoesFiltradas = avaliacoes.filter(a => {
    if (filter === 'aprovadas') return a.aprovado === true
    if (filter === 'pendentes') return a.aprovado === false
    return true
  })

  if (loading) return <div className="page-empty">Carregando avaliações...</div>

  return (
    <div className="p-4 md:p-6">
      <PageHeader 
        title="Avaliações dos Clientes" 
        description="Gerencie as avaliações feitas na página pública"
      />

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="actions-row">
          <button 
            className={`btn ${filter === 'todas' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('todas')}
          >
            Todas ({avaliacoes.length})
          </button>
          <button 
            className={`btn ${filter === 'aprovadas' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('aprovadas')}
          >
            Publicadas ({avaliacoes.filter(a => a.aprovado).length})
          </button>
          <button 
            className={`btn ${filter === 'pendentes' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('pendentes')}
          >
            Pendentes ({avaliacoes.filter(a => !a.aprovado).length})
          </button>
        </div>
      </div>

      <div className="panel">
        {avaliacoesFiltradas.length === 0 ? (
          <div className="page-empty">Nenhuma avaliação encontrada</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {avaliacoesFiltradas.map((avaliacao) => (
              <div key={avaliacao.id} style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 16, 
                padding: 16,
                borderLeft: `4px solid ${avaliacao.aprovado ? '#2E7D32' : '#F9A825'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <strong style={{ color: '#D95A1A' }}>{avaliacao.nome_cliente}</strong>
                    <span style={{ marginLeft: 12 }}>{'★'.repeat(avaliacao.nota)}</span>
                    <p style={{ marginTop: 8 }}>{avaliacao.comentario}</p>
                    <small style={{ color: '#9CA3AF' }}>
                      {new Date(avaliacao.created_at).toLocaleString('pt-BR')}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`btn ${avaliacao.aprovado ? 'btn-warning' : 'btn-secondary'} btn-sm`}
                      onClick={() => alternarAprovacao(avaliacao)}
                    >
                      {avaliacao.aprovado ? 'Ocultar' : 'Publicar'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => excluirAvaliacao(avaliacao.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}