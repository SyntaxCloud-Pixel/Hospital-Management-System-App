import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import { supabase } from '../../lib/supabaseClient'

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  specialization: '',
  department: '',
}

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDoctors()
  }, [])

  async function loadDoctors() {
    setLoading(true)
    const { data, error } = await supabase
      .from('doctors')
      .select('id, specialization, department, profiles!inner(full_name, email, phone)')
      .order('id')
    if (!error) setDoctors(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { error: invokeError } = await supabase.functions.invoke('admin-create-user', {
      body: { ...form, role: 'doctor' },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    
    // Wait briefly and load again in case it succeeded but threw timeout
    await new Promise(r => setTimeout(r, 1500))
    await loadDoctors()
    
    setSubmitting(false)
    if (invokeError) {
      setError(`Notice: Request may have timed out, but the record might have been created. Refresh the page if it doesn't appear. Details: ${invokeError.message}`)
      return
    }
    
    setShowAdd(false)
    setForm(emptyForm)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSubmitting(true)
    await supabase
      .from('profiles')
      .update({ full_name: form.fullName, phone: form.phone })
      .eq('id', editing.id)
    await supabase
      .from('doctors')
      .update({ specialization: form.specialization, department: form.department })
      .eq('id', editing.id)
    setSubmitting(false)
    setEditing(null)
    loadDoctors()
  }

  async function handleDelete(id) {
    if (!confirm('Remove this doctor? This cannot be undone.')) return
    await supabase.from('doctors').delete().eq('id', id)
    loadDoctors()
  }

  function openEdit(doc) {
    setEditing(doc)
    setForm({
      fullName: doc.profiles.full_name,
      email: doc.profiles.email,
      phone: doc.profiles.phone || '',
      specialization: doc.specialization || '',
      department: doc.department || '',
      password: '',
    })
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Manage Doctors</h1>
        <button onClick={() => { setForm(emptyForm); setShowAdd(true) }}>+ Add Doctor</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Specialization</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading...</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={6}>No doctors yet.</td></tr>
            ) : (
              doctors.map((d) => (
                <tr key={d.id}>
                  <td>{d.profiles.full_name}</td>
                  <td>{d.profiles.email}</td>
                  <td>{d.profiles.phone || '-'}</td>
                  <td>{d.specialization || '-'}</td>
                  <td>{d.department || '-'}</td>
                  <td className="actions-row">
                    <button className="secondary" onClick={() => openEdit(d)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(d.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add Doctor" onClose={() => setShowAdd(false)}>
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
            <div className="form-group">
              <label>Specialization</label>
              <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            {error && <div className="error-text" style={{color: '#d97706', marginBottom: '10px'}}>{error}</div>}
            <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Doctor'}</button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Doctor" onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Full Name</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
