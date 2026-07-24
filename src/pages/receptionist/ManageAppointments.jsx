import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import { supabase } from '../../lib/supabaseClient'

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled']

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBook, setShowBook] = useState(false)
  const [form, setForm] = useState({ patientId: '', doctorId: '', date: '', time: '', reason: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [apptRes, patRes, docRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, reason, patient:patients(id, profiles!inner(full_name)), doctor:doctors(id, profiles!inner(full_name))')
        .order('appointment_date', { ascending: false }),
      supabase.from('patients').select('id, profiles!inner(full_name)'),
      supabase.from('doctors').select('id, specialization, profiles!inner(full_name)'),
    ])
    if (!apptRes.error) setAppointments(apptRes.data || [])
    if (!patRes.error) setPatients(patRes.data || [])
    if (!docRes.error) setDoctors(docRes.data || [])
    setLoading(false)
  }

  async function handleBook(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.from('appointments').insert({
      patient_id: form.patientId,
      doctor_id: form.doctorId,
      appointment_date: form.date,
      appointment_time: form.time,
      reason: form.reason,
      status: 'pending',
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setShowBook(false)
    setForm({ patientId: '', doctorId: '', date: '', time: '', reason: '' })
    load()
  }

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    load()
  }

  async function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    load()
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Manage Appointments</h1>
        <button onClick={() => setShowBook(true)}>+ Book Appointment</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={6}>No appointments yet.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.appointment_date}</td>
                  <td>{a.appointment_time}</td>
                  <td>{a.patient?.profiles?.full_name}</td>
                  <td>{a.doctor?.profiles?.full_name}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  <td className="actions-row">
                    <select style={{ width: 130 }} value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="danger" onClick={() => cancelAppointment(a.id)}>Cancel</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 32, fontSize: '1.1rem' }}>Doctor Schedules</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Doctor</th><th>Specialization</th><th>Appointments Today</th></tr></thead>
          <tbody>
            {doctors.map((d) => {
              const todayStr = new Date().toISOString().slice(0, 10)
              const count = appointments.filter(
                (a) => a.doctor?.id === d.id && a.appointment_date === todayStr
              ).length
              return (
                <tr key={d.id}>
                  <td>{d.profiles?.full_name}</td>
                  <td>{d.specialization || '-'}</td>
                  <td>{count}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showBook && (
        <Modal title="Book Appointment" onClose={() => setShowBook(false)}>
          <form onSubmit={handleBook}>
            <div className="form-group">
              <label>Patient</label>
              <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.profiles?.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Doctor</label>
              <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                <option value="">Select doctor</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.profiles?.full_name} {d.specialization ? `(${d.specialization})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button type="submit" disabled={submitting}>{submitting ? 'Booking...' : 'Book Appointment'}</button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
