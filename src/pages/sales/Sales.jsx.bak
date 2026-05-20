import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../hooks/useCart'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'debit', label: 'Cartão Débito' },
  { value: 'credit', label: 'Cartão Crédito' },
  { value: 'installment', label: 'Parcelado' }
]

const Sales = () => {
  const { cartItems, addItem, removeItem, updateQuantity, clearCart, totalAmount } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [installmentsCount, setInstallmentsCount] = useState(2)
  const [saleFinished, setSaleFinished] = useState(false)

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
      if (error) {
        toast.error('Erro ao carregar produtos: ' + error.message)
        setProducts([])
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    loadProducts()
  }, [])

  const availableProducts = useMemo(() => {
    const filtered = products.filter((product) => Number(product.quantity || 0) > 0)
    if (!search.trim()) return filtered
    return filtered.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const installmentValue = useMemo(() => {
    if (paymentMethod !== 'installment') return 0
    return Number((totalAmount / installmentsCount).toFixed(2))
  }, [paymentMethod, installmentsCount, totalAmount])

  const handleAddProduct = (product) => {
    if (Number(product.quantity || 0) <= 0) {
      toast.error('Produto sem estoque disponível')
      return
    }
    addItem(product, 'product')
    toast.success(`${product.name} adicionado ao carrinho`)
  }

  const handleFinalize = async () => {
    if (!cartItems.length) {
      toast.error('Adicione itens ao carrinho antes de finalizar')
      return
    }

    setSaving(true)
    const salePayload = {
      client_name: customerName.trim() || null,
      client_phone: customerPhone.trim() || null,
      notes: notes.trim() || null,
      payment_method: paymentMethod,
      installment_count: paymentMethod === 'installment' ? installmentsCount : null,
      total_amount: Number(totalAmount.toFixed(2))
    }

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([salePayload])
      .select('id')
      .single()

    if (saleError || !saleData?.id) {
      toast.error('Erro ao registrar venda: ' + (saleError?.message || 'erro desconhecido'))
      setSaving(false)
      return
    }

    const saleItemsPayload = cartItems.map((item) => ({
      sale_id: saleData.id,
      item_id: item.id,
      item_type: item.type,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: Number((item.price * item.quantity).toFixed(2))
    }))

    const { error: saleItemsError } = await supabase.from('sale_items').insert(saleItemsPayload)
    if (saleItemsError) {
      toast.error('Erro ao registrar itens: ' + saleItemsError.message)
      setSaving(false)
      return
    }

    if (paymentMethod === 'installment') {
      const installmentsPayload = Array.from({ length: installmentsCount }, (_, index) => {
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + index + 1)
        return {
          sale_id: saleData.id,
          installment_number: index + 1,
          amount: installmentValue,
          due_date: dueDate.toISOString(),
          status: 'pending'
        }
      })
      const { error: installmentError } = await supabase.from('installments').insert(installmentsPayload)
      if (installmentError) {
        toast.error('Erro ao registrar parcelas: ' + installmentError.message)
        setSaving(false)
        return
      }
    }

    await Promise.all(
      cartItems
        .filter((item) => item.type === 'product')
        .map((item) => {
          const product = products.find((productItem) => productItem.id === item.id)
          const newQuantity = Math.max(Number(product?.quantity || 0) - item.quantity, 0)
          return supabase.from('products').update({ quantity: newQuantity, last_sold_at: new Date().toISOString() }).eq('id', item.id)
        })
    )

    toast.success('Venda concluída com sucesso')
    clearCart()
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
    setPaymentMethod('cash')
    setInstallmentsCount(2)
    setSaleFinished(true)
    setSaving(false)
  }

  if (loading) {
    return <Loading message="Carregando vendas..." />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendas</h1>
          <p className="page-description">Venda produtos com controle de estoque, pagamento e parcelamento.</p>
        </div>
      </div>

      <div className="panel-row panel-row-2" style={{ gap: 20 }}>
        <div>
          <Card>
            <div className="form-group">
              <label className="form-label">Buscar produto</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome..."
                className="form-input"
              />
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {availableProducts.length === 0 ? (
                <div style={{ color: 'rgba(224,224,224,.72)' }}>Nenhum produto disponível.</div>
              ) : (
                availableProducts.map((product) => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 16, borderRadius: 14, background: '#232323' }}>
                    <div>
                      <strong>{product.name}</strong>
                      <div style={{ color: 'rgba(224,224,224,.72)', fontSize: 13 }}>R$ {Number(product.sale_price || 0).toFixed(2)} • Estoque {product.quantity}</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleAddProduct(product)}>
                      Adicionar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 className="card-title">Carrinho</h2>
            </div>
            {cartItems.length === 0 ? (
              <div style={{ color: 'rgba(224,224,224,.72)' }}>Adicione produtos ao carrinho para iniciar a venda.</div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {cartItems.map((item) => (
                  <div key={item.uid} style={{ background: '#262626', borderRadius: 16, padding: 14, display: 'grid', gap: 12 }}>
                    <div className="flex-space">
                      <div>
                        <strong>{item.name}</strong>
                        <div style={{ color: 'rgba(224,224,224,.72)', fontSize: 13 }}>{item.type === 'product' ? 'Produto' : 'Serviço'}</div>
                      </div>
                      <div style={{ color: 'rgba(224,224,224,.72)' }}>R$ {item.price.toFixed(2)}</div>
                    </div>
                    <div className="flex-space">
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Button variant="warning" size="sm" type="button" onClick={() => updateQuantity(item.uid, item.quantity - 1)}>
                          -
                        </Button>
                        <span>{item.quantity}</span>
                        <Button variant="warning" size="sm" type="button" onClick={() => updateQuantity(item.uid, item.quantity + 1)}>
                          +
                        </Button>
                      </div>
                      <Button variant="danger" size="sm" type="button" onClick={() => removeItem(item.uid)}>
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <div className="form-group">
            <label className="form-label">Nome do cliente</label>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="form-input"
              placeholder="Opcional"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              className="form-input"
              placeholder="Opcional"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="form-textarea"
              placeholder="Detalhes sobre a venda"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Forma de pagamento</label>
            <div style={{ display: 'grid', gap: 10 }}>
              {paymentMethods.map((method) => (
                <label key={method.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,.08)' }}>
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          </div>
          {paymentMethod === 'installment' && (
            <div className="form-group">
              <label className="form-label">Parcelas</label>
              <select
                value={installmentsCount}
                onChange={(event) => setInstallmentsCount(Number(event.target.value))}
                className="form-select"
              >
                {Array.from({ length: 11 }, (_, index) => 2 + index).map((value) => (
                  <option key={value} value={value}>{value}x</option>
                ))}
              </select>
              <div style={{ marginTop: 10, color: 'rgba(224,224,224,.72)' }}>
                Valor da parcela: <strong>R$ {installmentValue.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span>Total</span>
              <strong>R$ {totalAmount.toFixed(2)}</strong>
            </div>
            <Button variant="primary" size="lg" type="button" onClick={handleFinalize} disabled={saving || !cartItems.length} style={{ width: '100%' }}>
              {saving ? 'Finalizando venda...' : 'Finalizar Venda'}
            </Button>
          </div>

          {saleFinished && (
            <div className="alert alert-success" style={{ marginTop: 18 }}>
              Venda registrada com sucesso.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Sales
