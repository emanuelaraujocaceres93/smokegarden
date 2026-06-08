import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function PublicMenu() {
  const [items, setItems] = useState([])
  const [reviews, setReviews] = useState([])
  const [settings, setSettings] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [reviewForm, setReviewForm] = useState({ nome_cliente: '', nota: 5, comentario: '' })

  useEffect(() => {
    loadPublicData()
  }, [])

  useEffect(() => {
    if (items.length <= 1) return undefined
    const timer = setInterval(() => setActiveIndex((current) => (current + 1) % items.length), 4500)
    return () => clearInterval(timer)
  }, [items.length])

  async function loadPublicData() {
    const [{ data: estoque }, { data: avaliacoes }, { data: configuracoes }] = await Promise.all([
      supabase.from('estoque').select('*').eq('ativo', true).order('nome'),
      supabase.from('avaliacoes').select('*').eq('aprovado', true).order('created_at', { ascending: false }).limit(6),
      supabase.from('configuracoes').select('*').limit(1).maybeSingle()
    ])
    setItems(estoque || [])
    setReviews(avaliacoes || [])
    setSettings(configuracoes || null)
  }

  async function submitReview(event) {
    event.preventDefault()
    if (!reviewForm.nome_cliente.trim() || !reviewForm.comentario.trim()) {
      toast.error('Informe nome e comentário')
      return
    }

    const { error } = await supabase.from('avaliacoes').insert([{
      nome_cliente: reviewForm.nome_cliente.trim(),
      nota: Number(reviewForm.nota),
      comentario: reviewForm.comentario.trim(),
      aprovado: true
    }])

    if (error) return toast.error(error.message)
    toast.success('Avaliação enviada!')
    setReviewForm({ nome_cliente: '', nota: 5, comentario: '' })
    loadPublicData()
  }

  const hero = useMemo(() => items[activeIndex] || items[0], [items, activeIndex])
  const whatsapp = settings?.whatsapp_admin || ''
  const whatsappLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Olá! Quero pedir um orçamento pelo cardápio da Smoke Garden.')}`

  return (
    <main className="public-page">
      <section className="public-hero" style={{ backgroundImage: hero?.imagens?.[0] ? `url(${hero.imagens[0]})` : undefined }}>
        <div className="public-hero-content">
          {settings?.logo_url && <img src={settings.logo_url} alt="Smoke Garden" className="public-logo" />}
          <h1>Smoke Garden</h1>
          <p>{settings?.endereco_loja || 'Mecânica 2 Tempos'}</p>
          <a href={whatsappLink} className="btn btn-primary btn-lg">Pedir orçamento</a>
        </div>
      </section>

      <section className="public-section">
        <h2>Cardápio</h2>
        <div className="public-grid">
          {items.map((item) => (
            <article key={item.id} className="public-card">
              {item.imagens?.[0] && <img loading="lazy" src={item.imagens[0]} alt={item.nome} />}
              <div>
                <span className="badge badge-muted">{item.tipo === 'produto' ? 'Produto' : 'Serviço'}</span>
                <h3>{item.nome}</h3>
                {item.descricao && <p>{item.descricao}</p>}
                <strong>{formatCurrency(item.valor)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-reviews">
        <h2>Avaliações</h2>
        <div className="public-grid">
          {reviews.map((review) => (
            <article key={review.id} className="public-card compact">
              <strong>{'★'.repeat(review.nota)}</strong>
              <p>{review.comentario}</p>
              <span>{review.nome_cliente}</span>
            </article>
          ))}
        </div>
        <form className="public-review-form" onSubmit={submitReview}>
          <input value={reviewForm.nome_cliente} onChange={(e) => setReviewForm({ ...reviewForm, nome_cliente: e.target.value })} placeholder="Seu nome" />
          <select value={reviewForm.nota} onChange={(e) => setReviewForm({ ...reviewForm, nota: e.target.value })}>
            {[5, 4, 3, 2, 1].map((nota) => <option key={nota} value={nota}>{nota} estrelas</option>)}
          </select>
          <textarea value={reviewForm.comentario} onChange={(e) => setReviewForm({ ...reviewForm, comentario: e.target.value })} placeholder="Sua avaliação" />
          <button className="btn btn-primary btn-md" type="submit">Enviar avaliação</button>
        </form>
      </section>
    </main>
  )
}
