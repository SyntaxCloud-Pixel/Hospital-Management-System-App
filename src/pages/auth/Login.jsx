import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Auth.module.css'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(form)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    const dest = location.state?.from || '/redirect'
    navigate(dest, { replace: true })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.title}>Welcome back</div>
        <div className={styles.subtitle}>Sign in to MediCare HMS</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className={styles.switchText}>
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  )
}
