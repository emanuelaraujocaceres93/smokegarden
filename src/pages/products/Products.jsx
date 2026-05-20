import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Table from '../../components/ui/Table'
import Loading from '../../components/ui/Loading'

const emptyForm = {
  name: '',
  description: '',
  purchase_price: '',
  sale_price: '',
  quantity: '',
  min_stock: '5',
  has_expiry: false,
  expiry_date: '',
  photo_url: ''
}

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
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

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setForm({
        name: product.name || '',
        description: product.description || '',
        purchase_price: product.purchase_price ?? '',
        sale_price: product.sale_price ?? '',
        quantity: product.quantity ?? '',
        min_stock: product.min_stock ?? '5',
        has_expiry: product.has_expiry ?? false,
        expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : '',
        photo_url: product.photo_url || ''
      })
    } else {
      setEditingProduct(null)
      setForm(emptyForm)
    }
    setModalOpen(true)
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      purchase_price: Number(form.purchase_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      quantity: Number(form.quantity) || 0,
      min_stock: Number(form.min_stock) || 5,
      has_expiry: Boolean(form.has_expiry),
      expiry_date: form.has_expiry && form.expiry_date ? form.expiry_date : null,
      photo_url: form.photo_url.trim() || null
    }

    if (!payload.name || payload.sale_price <= 0) {
      toast.error('Preencha o nome e o preço de venda corretamente.')
      return
    }

    const request = editingProduct
      ? supabase.from('products').update(payload).eq('id', editingProduct.id)
      : supabase.from('products').insert([payload])

    const { error } = await request
    if (error) {
      toast.error('Erro ao salvar produto: ' + error.message)
      return
    }

    toast.success('Produto salvo com sucesso')
    setModalOpen(false)
    setEditingProduct(null)
    setForm(emptyForm)
    await fetchProducts()
  }

  const deleteProduct = async (product) => {
    if (!window.confirm(`Excluir ${product.name}?`)) {
      return
    }

    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      toast.error('Erro ao excluir produto: ' + error.message)
      return
    }

    toast.success('Produto excluído com sucesso')
    await fetchProducts()
  }

  if (loading) {
    return <Loading message="Carregando produtos..." />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-description">Gestão completa de produtos com alertas de estoque e validade.</p>
        </div>
        <Button variant="secondary" size="md" onClick={() => openModal()}>
          + Novo Produto
        </Button>
      </div>

      <Card>
        <Table headers={['Produto', 'Preço Compra', 'Preço Venda', 'Estoque', 'Validade', 'Ações']}>
          {products.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: 18, color: 'rgba(224,224,224,.72)' }}>
                Nenhum produto cadastrado.
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const currentQuantity = Number(product.quantity || 0)
              const minStock = Number(product.min_stock || 5)
              const expired = product.expiry_date ? new Date(product.expiry_date) < new Date() : false
              const expiringSoon = product.expiry_date
                ? new Date(product.expiry_date) <= new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
                : false

              return (
                <tr key={product.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{product.name}</div>
                    <div style={{ color: 'rgba(224,224,224,.72)', fontSize: 13 }}>{product.description || '—'}</div>
                  </td>
                  <td>R$ {Number(product.purchase_price || 0).toFixed(2)}</td>
                  <td>R$ {Number(product.sale_price || 0).toFixed(2)}</td>
                  <td>
                    <span style={{ color: currentQuantity <= minStock ? '#F9A825' : '#2E7D32', fontWeight: 700 }}>
                      {currentQuantity}
                    </span>
                    {currentQuantity <= minStock && <span style={{ marginLeft: 8, fontSize: 12, color: '#F9A825' }}>(min {minStock})</span>}
                  </td>
                  <td>
                    {product.has_expiry && product.expiry_date ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: expired ? 'rgba(198,40,40,.16)' : expiringSoon ? 'rgba(249,168,37,.14)' : 'rgba(46,125,50,.14)', color: expired ? '#F44336' : expiringSoon ? '#F9A825' : '#2E7D32' }}>
                        {new Date(product.expiry_date).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(224,224,224,.72)' }}>Sem validade</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Button variant="secondary" size="sm" onClick={() => openModal(product)}>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => deleteProduct(product)}>
                      Excluir
                    </Button>
                  </td>
                </tr>
              )
            })
          )}
        </Table>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={saveProduct}>
          <Input
            id="product-name"
            label="Nome"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Input
            id="product-description"
            label="Descrição"
            textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="panel-row panel-row-2">
            <Input
              id="purchase-price"
              label="Preço compra"
              type="number"
              step="0.01"
              value={form.purchase_price}
              onChange={(event) => setForm({ ...form, purchase_price: event.target.value })}
            />
            <Input
              id="sale-price"
              label="Preço venda"
              type="number"
              step="0.01"
              value={form.sale_price}
              onChange={(event) => setForm({ ...form, sale_price: event.target.value })}
              required
            />
          </div>
          <div className="panel-row panel-row-2">
            <Input
              id="quantity"
              label="Quantidade"
              type="number"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
            <Input
              id="min-stock"
              label="Estoque mínimo"
              type="number"
              value={form.min_stock}
              onChange={(event) => setForm({ ...form, min_stock: event.target.value })}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="form-label" htmlFor="has-expiry">
              <input
                id="has-expiry"
                type="checkbox"
                checked={form.has_expiry}
                onChange={(event) => setForm({ ...form, has_expiry: event.target.checked })}
              />
              <span style={{ marginLeft: 8 }}>Tem validade</span>
            </label>
          </div>
          {form.has_expiry && (
            <Input
              id="expiry-date"
              label="Data de validade"
              type="date"
              value={form.expiry_date}
              onChange={(event) => setForm({ ...form, expiry_date: event.target.value })}
            />
          )}
          <Input
            id="photo-url"
            label="URL da imagem"
            type="url"
            value={form.photo_url}
            onChange={(event) => setForm({ ...form, photo_url: event.target.value })}
          />
          <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" size="md" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingProduct ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Products
import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purchase_price: '',
    sale_price: '',
    quantity: '',
    min_stock: '5',
    has_expiry: false,
    expiry_date: '',
    photo_url: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Erro ao buscar produtos:', error)
      toast.error('Erro ao carregar produtos')
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const productData = {
      name: formData.name,
      description: formData.description,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      sale_price: parseFloat(formData.sale_price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      min_stock: parseInt(formData.min_stock) || 5,
      has_expiry: formData.has_expiry,
      expiry_date: formData.has_expiry ? formData.expiry_date : null,
      photo_url: formData.photo_url || null
    }

    let error
    if (editingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
      error = updateError
      toast.success('Produto atualizado com sucesso!')
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert([productData])
      error = insertError
      toast.success('Produto cadastrado com sucesso!')
    }

    if (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar produto')
    }

    setShowModal(false)
    setEditingProduct(null)
    resetForm()
    fetchProducts()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      purchase_price: '',
      sale_price: '',
      quantity: '',
      min_stock: '5',
      has_expiry: false,
      expiry_date: '',
      photo_url: ''
    })
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      quantity: product.quantity,
      min_stock: product.min_stock || '5',
      has_expiry: product.has_expiry,
      expiry_date: product.expiry_date?.split('T')[0] || '',
      photo_url: product.photo_url || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) {
        toast.error('Erro ao excluir produto')
      } else {
        toast.success('Produto excluído com sucesso!')
        fetchProducts()
      }
    }
  }

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysDiff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return daysDiff <= 30 && daysDiff > 0
  }

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-grayLight">Carregando produtos...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-burnt">Produtos</h1>
        <button
          onClick={() => {
            setEditingProduct(null)
            resetForm()
            setShowModal(true)
          }}
          className="bg-garden text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full md:w-auto"
        >
          + Novo Produto
        </button>
      </div>

      {/* Tabela com scroll horizontal para mobile */}
      <div className="bg-carbon rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[600px] md:min-w-full">
            <table className="w-full text-sm">
              <thead className="bg-smoke text-grayLight border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Produto</th>
                  <th className="py-3 px-4 text-left">Preço Compra</th>
                  <th className="py-3 px-4 text-left">Preço Venda</th>
                  <th className="py-3 px-4 text-left">Estoque</th>
                  <th className="py-3 px-4 text-left">Validade</th>
                  <th className="py-3 px-4 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-grayLight">
                      Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-800 hover:bg-smoke/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-grayLight">{product.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">R$ {product.purchase_price.toFixed(2)}</td>
                      <td className="py-3 px-4">R$ {product.sale_price.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={product.quantity <= (product.min_stock || 5) ? 'text-alertYellow' : 'text-green-400'}>
                          {product.quantity}
                        </span>
                        {product.quantity <= (product.min_stock || 5) && (
                          <span className="ml-2 text-xs text-alertYellow">(min: {product.min_stock || 5})</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {product.has_expiry && product.expiry_date ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            isExpired(product.expiry_date) ? 'bg-red-900 text-red-300' :
                            isExpiringSoon(product.expiry_date) ? 'bg-yellow-900 text-yellow-300' :
                            'bg-green-900 text-green-300'
                          }`}>
                            {new Date(product.expiry_date).toLocaleDateString('pt-BR')}
                            {isExpired(product.expiry_date) && ' (Vencido)'}
                            {isExpiringSoon(product.expiry_date) && !isExpired(product.expiry_date) && ' (Vence em breve)'}
                          </span>
                        ) : (
                          <span className="text-grayLight text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-garden hover:text-green-400 mr-3 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-alertRed hover:text-red-400 transition"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-burnt mb-4">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-grayLight text-sm mb-1">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden outline-none"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-grayLight text-sm mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden outline-none"
                    rows="2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-grayLight text-sm mb-1">Preço Compra</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-grayLight text-sm mb-1">Preço Venda</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-grayLight text-sm mb-1">Quantidade</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-grayLight text-sm mb-1">Estoque Mínimo</label>
                    <input
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden outline-none"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_expiry}
                      onChange={(e) => setFormData({ ...formData, has_expiry: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-grayLight text-sm">Produto tem validade</span>
                  </label>
                </div>
                {formData.has_expiry && (
                  <div className="mb-4">
                    <label className="block text-grayLight text-sm mb-1">Data de Validade</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden outline-none"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-garden text-white py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    {editingProduct ? 'Atualizar' : 'Cadastrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products