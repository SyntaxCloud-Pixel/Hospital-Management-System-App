import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import { supabase } from '../../lib/supabaseClient'

const emptyForm = {
  patient_id: '',
  doctor_id: '',
  appointment_date: '',
  appointment_time: '',
  reason: '',
  status: 'pending'
}

export default function AllAppointments() {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
    loadOptions()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select(
        'id, appointment_date, appointment_time, status, reason, patient:patients(id, profiles!inner(full_name)), doctor:doctors(id, profiles!inner(full_name))'
      )
      .order('appointment_date', { ascending: false })
    if (!error) setAppointments(data || [])
    setLoading(false)
  }

  async function loadOptions() {
    const [pRes, dRes] = await Promise.all([
      supabase.from('patients').select('id, profiles!inner(full_name)'),
      supabase.from('doctors').select('id, profiles!inner(full_name)')
    ])
    if (pRes.data) setPatients(pRes.data)
    if (dRes.data) setDoctors(dRes.data)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    
    if (!form.appointment_date || !form.appointment_time) {
      setError('Please provide a valid date and time.')
      return
    }
    
    setSubmitting(true)
    const { error } = await supabase.from('appointments').insert({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      reason: form.reason || null,
      status: form.status
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setShowAdd(false)
    setForm(emptyForm)
    load()
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setError('')
    
    if (!form.appointment_date || !form.appointment_time) {
      setError('Please provide a valid date and time.')
      return
    }
    
    setSubmitting(true)
    const { error } = await supabase.from('appointments').update({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      reason: form.reason || null,
      status: form.status
    }).eq('id', editing.id)
    
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) return
    await supabase.from('appointments').delete().eq('id', id)
    load()
  }

  function openEdit(a) {
    setEditing(a)
    setForm({
      patient_id: a.patient?.id || '',
      doctor_id: a.doctor?.id || '',
      appointment_date: a.appointment_date,
      appointment_time: a.appointment_time,
      reason: a.reason || '',
      status: a.status || 'pending'
    })
  }

  const filtered = appointments.filter((a) => statusFilter === 'all' || a.status === statusFilter)

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>All Appointments</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => { setForm(emptyForm); setShowAdd(true) }}>+ Add Appointment</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>No appointments found.</td></tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.appointment_date}</td>
                  <td>{a.appointment_time}</td>
                  <td>{a.patient?.profiles?.full_name}</td>
                  <td>{a.doctor?.profiles?.full_name}</td>
                  <td>{a.reason || '-'}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  <td className="actions-row">
                    <button className="secondary" onClick={() => openEdit(a)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(a.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add Appointment" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Patient</label>
              <select required value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})}>
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.profiles?.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Doctor</label>
              <select required value={form.doctor_id} onChange={e => setForm({...form, doctor_id: e.target.value})}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.profiles?.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" required min="2020-01-01" value={form.appointment_date} onChange={e => setForm({...form, appointment_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" required value={form.appointment_time} onChange={e => setForm({...form, appointment_time: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea rows={2} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Appointment'}</button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Appointment" onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Patient</label>
              <select required value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})}>
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.profiles?.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Doctor</label>
              <select required value={form.doctor_id} onChange={e => setForm({...form, doctor_id: e.target.value})}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.profiles?.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" required min="2020-01-01" value={form.appointment_date} onChange={e => setForm({...form, appointment_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" step="1" required value={form.appointment_time} onChange={e => setForm({...form, appointment_time: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea rows={2} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
