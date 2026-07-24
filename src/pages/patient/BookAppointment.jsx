import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function BookAppointment() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', reason: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDoctors()
  }, [])

  async function loadDoctors() {
    const { data } = await supabase.from('doctors').select('id, specialization, department, profiles!inner(full_name)')
    setDoctors(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    const { error } = await supabase.from('appointments').insert({
      patient_id: user.id,
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
    setSuccess('Appointment requested! You will be notified once a receptionist confirms it.')
    setForm({ doctorId: '', date: '', time: '', reason: '' })
  }

  return (
    <DashboardLayout>
      <div className="page-header"><h1>Book Appointment</h1></div>
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Doctor</label>
            <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.profiles?.full_name} {d.specialization ? `- ${d.specialization}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Preferred Date</label>
            <input type="date" required min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Preferred Time</label>
            <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Reason for Visit</label>
            <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe your symptoms or reason for the visit" />
          </div>
          {error && <div className="error-text">{error}</div>}
          {success && <div className="success-text">{success}</div>}
          <button type="submit" disabled={submitting}>{submitting ? 'Booking...' : 'Request Appointment'}</button>
        </form>
      </div>
    </DashboardLayout>
  )
}
