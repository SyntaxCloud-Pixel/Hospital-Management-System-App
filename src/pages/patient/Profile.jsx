import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ fullName: '', phone: '', dob: '', gender: '', bloodGroup: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) load()
  }, [user, profile])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('patients').select('*').eq('id', user.id).single()
    setForm({
      fullName: profile?.full_name || '',
      phone: profile?.phone || '',
      dob: data?.date_of_birth || '',
      gender: data?.gender || '',
      bloodGroup: data?.blood_group || '',
      address: data?.address || '',
    })
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    await supabase.from('profiles').update({ full_name: form.fullName, phone: form.phone }).eq('id', user.id)
    await supabase.from('patients').upsert({
      id: user.id,
      date_of_birth: form.dob || null,
      gender: form.gender,
      blood_group: form.bloodGroup,
      address: form.address,
    })
    setSaving(false)
    setSuccess('Profile updated.')
    refreshProfile()
  }

  if (loading) return <DashboardLayout><p>Loading...</p></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="page-header"><h1>My Profile</h1></div>
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user?.email || ''} disabled />
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
          {success && <div className="success-text">{success}</div>}
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </div>
    </DashboardLayout>
  )
}
