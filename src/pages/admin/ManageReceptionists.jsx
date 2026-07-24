import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import { supabase } from '../../lib/supabaseClient'

const emptyForm = { fullName: '', email: '', password: '', phone: '' }

export default function ManageReceptionists() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('role', 'receptionist')
      .order('full_name')
    if (!error) setList(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const { error } = await supabase.functions.invoke('admin-create-user', {
      body: { ...form, role: 'receptionist' },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    setSubmitting(false)
    if (error) {
      setError(error.message || 'Failed to create receptionist.')
      return
    }
    setShowAdd(false)
    setForm(emptyForm)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Remove this receptionist?')) return
    await supabase.from('profiles').delete().eq('id', id)
    load()
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Manage Receptionists</h1>
        <button onClick={() => { setForm(emptyForm); setShowAdd(true) }}>+ Add Receptionist</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>Loading...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={4}>No receptionists yet.</td></tr>
            ) : (
              list.map((r) => (
                <tr key={r.id}>
                  <td>{r.full_name}</td>
                  <td>{r.email}</td>
                  <td>{r.phone || '-'}</td>
                  <td><button className="danger" onClick={() => handleDelete(r.id)}>Delete</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add Receptionist" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Full Name</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Temporary Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Receptionist'}</button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
