/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
      setLoading(false)
    }

    loadSession()

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      if (!authListener) return
      if (typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe()
      } else if (authListener.data?.subscription?.unsubscribe) {
        authListener.data.subscription.unsubscribe()
      }
    }
  }, [])

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email ou senha incorretos')
      return false
    }

    toast.success('Login realizado com sucesso')
    return true
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Falha ao sair: ' + error.message)
      return
    }
    setUser(null)
    toast.success('Logout realizado com sucesso')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
