import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const Sales = () => {
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [installments, setInstallments] = useState(1)
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('name')
    
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .order('name')
    
    setProducts(productsData || [])
    setServices(servicesData || [])
    setLoading(false)
  }

  const addToCart = (item, type) => {
    const price = type === 'product' ? item.sale_price : item.price
    const existingItem = cart.find(i => i.id === item.id && i.type === type)
    
    if (existingItem) {
      setCart(cart.map(i => 
        i.id === item.id && i.type === type 
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * price }
          : i
      ))
    } else {
      setCart([...cart, {
        id: item.id,
        type: type,
        name: item.name,
        price: price,
        quantity: 1,
        subtotal: price
      }])
    }
    toast.success(`${item.name} adicionado!`)
    if (window.innerWidth < 768) {
      setShowCart(true)
    }
  }

  const removeFromCart = (id, type) => {
    setCart(cart.filter(i => !(i.id === id && i.type === type)))
    toast.success('Item removido')
  }

  const updateQuantity = (id, type, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id, type)
      return
    }
    
    setCart(cart.map(i => 
      i.id === id && i.type === type 
        ? { ...i, quantity: newQuantity, subtotal: newQuantity * i.price }
        : i
    ))
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const getInstallmentValue = () => {
    const total = getTotal()
    return installments > 1 ? total / installments : total
  }

  const finalizeSale = async () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho!')
      return
    }

    const total = getTotal()
    const isInstallment = paymentMethod === 'installment' && installments > 1
    
    const saleData = {
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      total_amount: total,
      paid_amount: isInstallment ? getInstallmentValue() : total,
      payment_method: paymentMethod,
      installment_count: isInstallment ? installments : 1,
      status: isInstallment ? 'pending' : 'completed',
      notes: notes || null,
      created_at: new Date().toISOString()
    }

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
    
    if (saleError) {
      toast.error('Erro: ' + saleError.message)
      return
    }

    const saleId = sale[0].id

    for (const item of cart) {
      const itemData = {
        sale_id: saleId,
        item_type: item.type,
        item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal
      }
      
      await supabase.from('sale_items').insert([itemData])
      
      if (item.type === 'product') {
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.id)
          .single()
        
        const newQuantity = (product?.quantity || 0) - item.quantity
        await supabase
          .from('products')
          .update({ quantity: newQuantity, last_sold_at: new Date().toISOString() })
          .eq('id', item.id)
      }
    }

    if (isInstallment) {
      const installmentValue = getInstallmentValue()
      for (let i = 1; i <= installments; i++) {
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + i)
        
        await supabase.from('installments').insert([{
          sale_id: saleId,
          installment_number: i,
          due_date: dueDate.toISOString().split('T')[0],
          amount: installmentValue,
          paid_amount: i === 1 ? installmentValue : 0,
          status: i === 1 ? 'paid' : 'pending'
        }])
      }
    }

    toast.success('Venda finalizada!')
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
    setPaymentMethod('cash')
    setInstallments(1)
    setShowCart(false)
    fetchData()
  }

  const formatCurrency = (value) => {
    return 'R$ ' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }

  const getCurrentItems = () => {
    const items = activeTab === 'products' ? products : services
    if (!searchTerm) return items
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando...</div>
  }

  const currentItems = getCurrentItems()
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div style={{ padding: '16px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Vendas</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Selecione produtos ou serviços</p>
      </div>

      {/* Botão do carrinho mobile */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'products' ? '#3A5F40' : 'transparent',
              color: activeTab === 'products' ? 'white' : '#E0E0E0',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📦 Produtos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'services' ? '#3A5F40' : 'transparent',
              color: activeTab === 'services' ? 'white' : '#E0E0E0',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔧 Serviços ({services.length})
          </button>
        </div>
        
        <button
          onClick={() => setShowCart(!showCart)}
          style={{
            position: 'relative',
            padding: '10px',
            borderRadius: '30px',
            border: 'none',
            backgroundColor: '#D95A1A',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          🛒
          {cartItemsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#C62828',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px'
            }}>
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar por nome..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid #3A5F40',
          backgroundColor: '#1A1A1A',
          color: '#E0E0E0',
          marginBottom: '16px',
          fontSize: '16px'
        }}
      />

      {/* Lista de itens (sempre visível) */}
      <div style={{ marginBottom: '16px' }}>
        {currentItems.length === 0 ? (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#9CA3AF' }}>
              {searchTerm ? 'Nenhum resultado encontrado.' : `Nenhum ${activeTab === 'products' ? 'produto' : 'serviço'} cadastrado.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px 0' }}>{item.name}</p>
                  <p style={{ color: '#D95A1A', fontSize: '18px', fontWeight: 'bold', margin: '0' }}>
                    {formatCurrency(activeTab === 'products' ? item.sale_price : item.price)}
                  </p>
                  {activeTab === 'products' && (
                    <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '4px 0 0 0' }}>
                      Estoque: {item.quantity || 0}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => addToCart(item, activeTab === 'products' ? 'product' : 'service')}
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
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carrinho (modal/slide-up no mobile, sidebar no desktop) */}
      {(showCart || window.innerWidth >= 768) && cart.length > 0 && (
        <div style={{
          position: window.innerWidth < 768 ? 'fixed' : 'relative',
          bottom: window.innerWidth < 768 ? 0 : 'auto',
          left: window.innerWidth < 768 ? 0 : 'auto',
          right: window.innerWidth < 768 ? 0 : 'auto',
          backgroundColor: '#1A1A1A',
          borderRadius: '16px',
          padding: '20px',
          marginTop: window.innerWidth < 768 ? 0 : '16px',
          maxHeight: window.innerWidth < 768 ? '70vh' : 'auto',
          overflowY: 'auto',
          zIndex: 1000,
          borderTop: window.innerWidth < 768 ? '2px solid #D95A1A' : 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#D95A1A', margin: 0 }}>🛒 Carrinho ({cart.length} itens)</h3>
            {window.innerWidth < 768 && (
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            )}
          </div>

          {cart.map(item => (
            <div key={`${item.id}-${item.type}`} style={{ backgroundColor: '#2C2C2C', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 'bold', margin: 0 }}>{item.name}</p>
                  <p style={{ color: '#D95A1A', fontSize: '12px', margin: '4px 0 0 0' }}>{formatCurrency(item.price)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#C62828', color: 'white', cursor: 'pointer' }}>-</button>
                  <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#3A5F40', color: 'white', cursor: 'pointer' }}>+</button>
                  <button onClick={() => removeFromCart(item.id, item.type)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#C62828', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              <p style={{ textAlign: 'right', margin: '8px 0 0 0', color: '#3A5F40' }}>Subtotal: {formatCurrency(item.subtotal)}</p>
            </div>
          ))}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px' }}>Total:</span>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#D95A1A' }}>{formatCurrency(getTotal())}</span>
            </div>

            <input type="text" placeholder="Nome do cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', marginBottom: '10px', fontSize: '16px' }} />
            <input type="text" placeholder="Telefone do cliente" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', marginBottom: '10px', fontSize: '16px' }} />

            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', marginBottom: '10px' }}>
              <option value="cash">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="card_debit">Cartão Débito</option>
              <option value="card_credit">Cartão Crédito</option>
              <option value="installment">Parcelado</option>
            </select>

            {paymentMethod === 'installment' && (
              <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', marginBottom: '10px' }}>
                {[2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x de {formatCurrency(getInstallmentValue())}</option>)}
              </select>
            )}

            <textarea placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', marginBottom: '16px', resize: 'vertical' }} />

            <button onClick={finalizeSale} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#3A5F40', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Finalizar Venda</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales
