import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function DoctorPrescriptions() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [completedAppointments, setCompletedAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ appointmentId: '', medicines: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const [presRes, apptRes] = await Promise.all([
      supabase
        .from('prescriptions')
        .select('id, medicines, notes, created_at, appointment:appointments(appointment_date), patient:patients(id, profiles!inner(full_name))')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('appointments')
        .select('id, appointment_date, patient:patients(id, profiles!inner(full_name))')
        .eq('doctor_id', user.id)
        .in('status', ['confirmed', 'completed']),
    ])
    if (!presRes.error) setPrescriptions(presRes.data || [])
    if (!apptRes.error) setCompletedAppointments(apptRes.data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setSubmitting(true)
    const appt = completedAppointments.find((a) => a.id === form.appointmentId)
    await supabase.from('prescriptions').insert({
      appointment_id: form.appointmentId,
      doctor_id: user.id,
      patient_id: appt?.patient?.id,
      medicines: form.medicines,
      notes: form.notes,
    })
    setSubmitting(false)
    setShowAdd(false)
    setForm({ appointmentId: '', medicines: '', notes: '' })
    load()
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSubmitting(true)
    await supabase
      .from('prescriptions')
      .update({ medicines: form.medicines, notes: form.notes })
      .eq('id', editing.id)
    setSubmitting(false)
    setEditing(null)
    load()
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Prescriptions</h1>
        <button onClick={() => setShowAdd(true)}>+ New Prescription</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Patient</th><th>Medicines</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading...</td></tr>
            ) : prescriptions.length === 0 ? (
              <tr><td colSpan={5}>No prescriptions yet.</td></tr>
            ) : (
              prescriptions.map((p) => (
                <tr key={p.id}>
                  <td>{p.appointment?.appointment_date || '-'}</td>
                  <td>{p.patient?.profiles?.full_name}</td>
                  <td>{p.medicines}</td>
                  <td>{p.notes || '-'}</td>
                  <td>
                    <button className="secondary" onClick={() => { setEditing(p); setForm({ medicines: p.medicines, notes: p.notes || '', appointmentId: '' }) }}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="New Prescription" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Appointment</label>
              <select required value={form.appointmentId} onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}>
                <option value="">Select appointment</option>
                {completedAppointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.appointment_date} - {a.patient?.profiles?.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Medicines</label>
              <textarea required rows={3} value={form.medicines} onChange={(e) => setForm({ ...form, medicines: e.target.value })} placeholder="e.g. Paracetamol 500mg - 1 tab twice daily" />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Prescription'}</button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Prescription" onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Medicines</label>
              <textarea required rows={3} value={form.medicines} onChange={(e) => setForm({ ...form, medicines: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update Prescription'}</button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
