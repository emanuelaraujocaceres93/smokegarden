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

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
      if (error) {
        toast.error('Erro ao atualizar produto')
      } else {
        toast.success('Produto atualizado com sucesso!')
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData])
      if (error) {
        toast.error('Erro ao cadastrar produto')
      } else {
        toast.success('Produto cadastrado com sucesso!')
      }
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
                      Nenhum produto cadastrado.
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
                        <span className={product.quantity <= (product.min_stock || 5) ? 'text-yellow-400' : 'text-green-400'}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {product.has_expiry && product.expiry_date ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            isExpired(product.expiry_date) ? 'bg-red-900 text-red-300' :
                            isExpiringSoon(product.expiry_date) ? 'bg-yellow-900 text-yellow-300' :
                            'bg-green-900 text-green-300'
                          }`}>
                            {new Date(product.expiry_date).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-grayLight text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleEdit(product)} className="text-green-500 hover:text-green-400 mr-3">Editar</button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-400">Excluir</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-orange-500 mb-4">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-1">Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" required />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Preço Venda</label>
                  <input type="number" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" required />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Quantidade</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-600">
                  {editingProduct ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products