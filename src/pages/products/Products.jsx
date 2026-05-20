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
