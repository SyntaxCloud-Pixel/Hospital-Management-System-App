import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { supabase } from '../../lib/supabaseClient'

const emptyForm = {
  fullName: '', email: '', password: '', phone: '',
  dob: '', gender: '', bloodGroup: '', address: '',
}

export default function RegisterPatient() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const { error } = await supabase.functions.invoke('admin-create-user', {
      body: { ...form, role: 'patient' },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    setSubmitting(false)
    if (error) {
      setError(error.message || 'Failed to register patient.')
      return
    }
    setSuccess('Patient registered successfully.')
    setForm(emptyForm)
  }

  return (
    <DashboardLayout>
      <div className="page-header"><h1>Register New Patient</h1></div>
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
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
            <label>Date of Birth</label>
            <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Blood Group</label>
            <input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          {error && <div className="error-text">{error}</div>}
          {success && <div className="success-text">{success}</div>}
          <button type="submit" disabled={submitting}>{submitting ? 'Registering...' : 'Register Patient'}</button>
        </form>
      </div>
    </DashboardLayout>
  )
}
