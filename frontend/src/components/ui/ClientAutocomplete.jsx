import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function ClientAutocomplete({ value, onChange, placeholder = "Digite o nome do cliente..." }) {
  const [sugestoes, setSugestoes] = useState([])
  const [mostrar, setMostrar] = useState(false)
  const [clientes, setClientes] = useState([])
  const wrapperRef = useRef(null)

  useEffect(() => {
    carregarClientes()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setMostrar(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function carregarClientes() {
    const { data } = await supabase
      .from('pessoas')
      .select('id, nome, telefone')
      .eq('tipo', 'cliente')
      .order('nome')
    setClientes(data || [])
  }

  useEffect(() => {
    if (value && value.length > 1) {
      const term = value.toLowerCase()
      const filtradas = clientes.filter(c => c.nome.toLowerCase().includes(term)).slice(0, 5)
      setSugestoes(filtradas)
      setMostrar(filtradas.length > 0)
    } else {
      setSugestoes([])
      setMostrar(false)
    }
  }, [value, clientes])

  const selecionarCliente = (cliente) => {
    onChange(cliente.nome)
    setMostrar(false)
    // Opcional: armazenar o ID do cliente em um state separado
    if (window.__clienteSelecionadoId) window.__clienteSelecionadoId = cliente.id
  }

  return (
    <div ref={wrapperRef} className="client-autocomplete">
      <input
        type="text"
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => value.length > 1 && setMostrar(true)}
      />
      {mostrar && sugestoes.length > 0 && (
        <div className="sugestoes-dropdown">
          {sugestoes.map(cliente => (
            <div
              key={cliente.id}
              className="sugestao-item"
              onClick={() => selecionarCliente(cliente)}
            >
              <strong>{cliente.nome}</strong>
              {cliente.telefone && <small> - {cliente.telefone}</small>}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .client-autocomplete {
          position: relative;
        }
        .sugestoes-dropdown {
          position: absolute;
          z-index: 100;
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 4px;
        }
        .sugestao-item {
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sugestao-item:hover {
          background: rgba(58, 95, 64, 0.2);
        }
        .sugestao-item small {
          color: #9CA3AF;
          margin-left: 8px;
        }
      `}</style>
    </div>
  )
}