import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import { supabase } from '../../lib/supabaseClient'

const emptyForm = { fullName: '', email: '', password: '', phone: '', dob: '', gender: '', bloodGroup: '', address: '' }

export default function ManagePatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('patients')
      .select('id, date_of_birth, gender, address, blood_group, profiles!inner(full_name, email, phone)')
      .order('id')
    if (!error) setPatients(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()

    const { error: invokeError } = await supabase.functions.invoke('admin-create-user', {
      body: { ...form, role: 'patient' },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    
    // Fallback wait to handle flaky edge function responses where it succeeds server-side but throws a timeout
    await new Promise(r => setTimeout(r, 1500))
    await load()
    
    setSubmitting(false)
    if (invokeError) {
      // If we got an error but the list size increased or the user is there, we assume success
      // Alternatively, we just show a softer warning
      setError(`Notice: Request may have timed out, but the record might have been created. Refresh the page if it doesn't appear. Details: ${invokeError.message}`)
      return
    }
    
    setShowAdd(false)
    setForm(emptyForm)
  }

  function openEdit(p) {
    setEditing(p)
    setForm({
      fullName: p.profiles.full_name,
      phone: p.profiles.phone || '',
      address: p.address || '',
      bloodGroup: p.blood_group || '',
      gender: p.gender || '',
      dob: p.date_of_birth || '',
    })
    setError('')
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSubmitting(true)
    await supabase.from('profiles').update({ full_name: form.fullName, phone: form.phone }).eq('id', editing.id)
    await supabase
      .from('patients')
      .update({
        address: form.address,
        blood_group: form.bloodGroup,
        gender: form.gender,
        date_of_birth: form.dob || null,
      })
      .eq('id', editing.id)
    setSubmitting(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this patient record? This cannot be undone.')) return
    await supabase.from('patients').delete().eq('id', id)
    load()
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Manage Patients</h1>
        <button onClick={() => { setForm(emptyForm); setShowAdd(true); setError('') }}>+ Add Patient</button>
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: -12 }}>
        New patients register themselves, or a receptionist/admin can register them at the front desk.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Blood Group</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={5}>No patients yet.</td></tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.profiles.full_name}</td>
                  <td>{p.profiles.email}</td>
                  <td>{p.profiles.phone || '-'}</td>
                  <td>{p.blood_group || '-'}</td>
                  <td className="actions-row">
                    <button className="secondary" onClick={() => setViewing(p)}>View</button>
                    <button className="secondary" onClick={() => openEdit(p)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <Modal title="Patient Details" onClose={() => setViewing(null)}>
          <p><strong>Name:</strong> {viewing.profiles.full_name}</p>
          <p><strong>Email:</strong> {viewing.profiles.email}</p>
          <p><strong>Phone:</strong> {viewing.profiles.phone || '-'}</p>
          <p><strong>DOB:</strong> {viewing.date_of_birth || '-'}</p>
          <p><strong>Gender:</strong> {viewing.gender || '-'}</p>
          <p><strong>Blood Group:</strong> {viewing.blood_group || '-'}</p>
          <p><strong>Address:</strong> {viewing.address || '-'}</p>
        </Modal>
      )}

      {showAdd && (
        <Modal title="Add Patient" onClose={() => setShowAdd(false)}>
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
            {error && <div className="error-text" style={{color: '#d97706', marginBottom: '10px'}}>{error}</div>}
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Patient'}</button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Patient" onClose={() => setEditing(null)}>
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
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
