/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'smoke-garden-cart'

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addItem = useCallback((item, type = 'product') => {
    setCartItems((prevItems) => {
      const uid = `${type}-${item.id}`
      const existing = prevItems.find((current) => current.uid === uid)
      const stock = type === 'product' ? Number(item.quantity ?? 0) : Infinity

      if (existing) {
        const nextQuantity = existing.quantity + 1
        if (nextQuantity > stock) {
          return prevItems
        }
        return prevItems.map((current) =>
          current.uid === uid
            ? { ...current, quantity: nextQuantity }
            : current
        )
      }

      return [
        ...prevItems,
        {
          uid,
          id: item.id,
          type,
          name: item.name,
          price: Number(item.sale_price ?? item.price ?? 0),
          quantity: 1,
          stock: stock === Infinity ? null : stock,
          photo_url: item.photo_url || item.image_url || null
        }
      ]
    })
  }, [])

  const removeItem = useCallback((uid) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.uid !== uid))
  }, [])

  const updateQuantity = useCallback((uid, quantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.uid !== uid) {
          return item
        }

        const value = Number(quantity)
        const safeQuantity = Number.isNaN(value) ? item.quantity : Math.max(1, value)
        if (item.stock != null && safeQuantity > item.stock) {
          return { ...item, quantity: item.stock }
        }
        return { ...item, quantity: safeQuantity }
      })
    )
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  )

  const getTotal = useCallback(() => totalAmount, [totalAmount])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        getTotal
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider')
  }
  return context
}
