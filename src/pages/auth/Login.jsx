import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    const success = await login(email, password)
    setLoading(false)

    if (success) {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="layout-shell" style={{ alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <div className="card-header">
          <h2 className="card-title">Smoke Garden</h2>
          <p className="page-description">Acesse o painel da mecânica com sua conta Supabase.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            id="login-email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            required
          />
          <Input
            id="login-password"
            label="Senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            required
          />
          <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%' }}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
