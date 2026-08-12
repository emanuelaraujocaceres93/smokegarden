import React from 'react';
import { useEffect, useMemo, useState } from 'react'

const ProductSearch = ({ items = [], onSelect, label = 'Produto' }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = query.trim().toLowerCase()
      if (!trimmed) {
        setResults([])
        return
      }

      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(trimmed)
      )

      setResults(filtered.slice(0, 8))
    }, 250)

    return () => clearTimeout(timeout)
  }, [items, query])

  const emptyResults = useMemo(
    () => query.trim().length > 0 && results.length === 0,
    [query, results]
  )

  const handleSelect = (item) => {
    onSelect(item)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="relative mb-6">
      <label className="block text-grayLight text-sm mb-2">Buscar {label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        placeholder={`Digite o nome do ${label.toLowerCase()}...`}
        className="w-full rounded-lg border border-gray-700 bg-smoke px-4 py-3 text-grayLight outline-none focus:border-garden focus:ring-2 focus:ring-garden/30"
      />

      {isOpen && query.trim().length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-700 bg-carbon shadow-lg text-grayLight">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-3 text-left hover:bg-gray-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-grayLight">R$ {Number(item.sale_price ?? item.price ?? 0).toFixed(2)}</div>
                </div>
                <span className="text-xs text-grayLight">{item.quantity != null ? `Estoque: ${item.quantity}` : 'Serviço'}</span>
              </div>
            </button>
          ))}

          {emptyResults && (
            <div className="px-4 py-3 text-sm text-grayLight">Nenhum {label.toLowerCase()} encontrado.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductSearch
