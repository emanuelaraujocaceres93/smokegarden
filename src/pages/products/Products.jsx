import React from 'react';
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'

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

  async function fetchProducts() {
    setLoading(true)
    const { Data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Erro ao buscar Produtos:', error)
      toast.error('Erro ao carregar Produtos')
    } else {
      setProducts(Data || [])
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
        toast.error('Erro ao atualizar Produto')
      } else {
        toast.success('Produto atualizado com sucesso!')
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData])
      if (error) {
        toast.error('Erro ao cadastrar Produto')
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
    if (window.confirm('Tem certeza que deseja excluir este Produto?')) {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) {
        toast.error('Erro ao excluir Produto')
      } else {
        toast.success('Produto excluçdo com sucesso!')
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
        <div className="text-grayLight">Carregando Produtos...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Produtos"
        description="Gerencie o catçlogo de Produtos, preços, estoque e Validade."
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null)
              resetForm()
              setShowModal(true)
            }}
            className="btn btn-primary btn-md"
          >
            + Novo Produto
          </button>
        }
      />

      <div className="panel table-desktop-only">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-smoke border-b-2 border-gray-600">
                <th className="py-3 px-4 text-left text-grayLight font-semibold border-r border-gray-600">Produto</th>
                <th className="py-3 px-4 text-left text-grayLight font-semibold border-r border-gray-600">Preço Compra</th>
                <th className="py-3 px-4 text-left text-grayLight font-semibold border-r border-gray-600">Preço Venda</th>
                <th className="py-3 px-4 text-left text-grayLight font-semibold border-r border-gray-600">Estoque</th>
                <th className="py-3 px-4 text-left text-grayLight font-semibold border-r border-gray-600">Estoque Mínimo</th>
                <th className="py-3 px-4 text-left text-grayLight font-semibold border-r border-gray-600">Validade</th>
                <th className="py-3 px-4 text-left text-grayLight font-semibold">Aççes</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-grayLight">
                    Nenhum Produto cadastrado.
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr 
                    key={product.id} 
                    className={`border-b border-gray-700 hover:bg-smoke/30 transition-colors ${
                      index % 2 === 0 ? 'bg-carbon' : 'bg-smoke/10'
                    }`}
                  >
                    <td className="py-3 px-4 border-r border-gray-700">
                      <div className="font-medium text-white">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-gray-400 mt-1">{product.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-grayLight border-r border-gray-700">
                      R$ {product.purchase_price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-4 text-grayLight border-r border-gray-700">
                      R$ {product.sale_price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-4 border-r border-gray-700">
                      <span className={`font-semibold ${
                        product.quantity <= (product.min_stock || 5) 
                          ? 'text-yellow-400' 
                          : 'text-green-400'
                      }`}>
                        {product.quantity || 0}
                      </span>
                      {product.quantity <= (product.min_stock || 5) && (
                        <span className="ml-2 text-xs text-yellow-500">(baixo)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-grayLight border-r border-gray-700">
                      {product.min_stock || 5}
                    </td>
                    <td className="py-3 px-4 border-r border-gray-700">
                      {product.has_expiry && product.expiry_date ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isExpired(product.expiry_date) 
                            ? 'bg-red-900 text-red-300' 
                            : isExpiringSoon(product.expiry_date) 
                              ? 'bg-yellow-900 text-yellow-300' 
                              : 'bg-green-900 text-green-300'
                        }`}>
                          {new Date(product.expiry_date).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">ç</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-garden hover:text-green-400 mr-3 transition font-medium"
                      >
                        editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-400 transition font-medium"
                      >
                        excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Versço Mobile: Cards */}
      <div className="cards-mobile-only">
        {products.length === 0 ? (
          <div className="text-center text-grayLight py-8">Nenhum Produto cadastrado.</div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card-mobile">
              <div className="product-card-header">
                <span className="product-card-name">{product.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  product.quantity <= (product.min_stock || 5) ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'
                }`}>
                  Estoque: {product.quantity}
                </span>
              </div>
              {product.description && (
                <div className="text-xs text-gray-400 mb-2">{product.description}</div>
              )}
              <div className="product-card-row">
                <span className="product-card-label">Preço Compra</span>
                <span className="product-card-value">R$ {product.purchase_price?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="product-card-row">
                <span className="product-card-label">Preço Venda</span>
                <span className="product-card-value">R$ {product.sale_price?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="product-card-row">
                <span className="product-card-label">Estoque Mínimo</span>
                <span className="product-card-value">{product.min_stock || 5}</span>
              </div>
              {product.has_expiry && product.expiry_date && (
                <div className="product-card-row">
                  <span className="product-card-label">Validade</span>
                  <span className={`product-card-value ${
                    isExpired(product.expiry_date) ? 'text-red-400' : isExpiringSoon(product.expiry_date) ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {new Date(product.expiry_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              <div className="product-card-actions">
                <button onClick={() => handleEdit(product)} className="text-garden hover:text-green-400">editar</button>
                <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-400">excluir</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro/Ediçço */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-burnt mb-4">
                {editingProduct ? 'editar Produto' : 'Novo Produto'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-grayLight text-sm mb-1">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden focus:outline-none transition"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-grayLight text-sm mb-1">Descriçço</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden focus:outline-none transition"
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
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-grayLight text-sm mb-1">Preço Venda *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden focus:outline-none transition"
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
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-grayLight text-sm mb-1">Estoque Mínimo</label>
                    <input
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden focus:outline-none transition"
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
                    <span className="text-grayLight text-sm">Produto tem Validade</span>
                  </label>
                </div>
                
                {formData.has_expiry && (
                  <div className="mb-4">
                    <label className="block text-grayLight text-sm mb-1">Data de Validade</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden focus:outline-none transition"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-grayLight text-sm mb-1">URL da Foto (opcional)</label>
                  <input
                    type="text"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full p-2 rounded bg-smoke text-white border border-gray-700 focus:border-garden focus:outline-none transition"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-garden text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    {editingProduct ? 'Atualizar' : 'Cadastrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                  >
                    cancelar
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